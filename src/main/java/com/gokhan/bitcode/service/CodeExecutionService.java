package com.gokhan.bitcode.service;

import com.gokhan.bitcode.entity.ProblemEntity;
import com.gokhan.bitcode.entity.SubmissionEntity;
import com.gokhan.bitcode.entity.TestCaseEntity;
import com.gokhan.bitcode.repository.TestCaseRepository;
import io.fabric8.kubernetes.api.model.Pod;
import io.fabric8.kubernetes.api.model.PodList;
import io.fabric8.kubernetes.api.model.Quantity;
import io.fabric8.kubernetes.api.model.batch.v1.Job;
import io.fabric8.kubernetes.api.model.batch.v1.JobBuilder;
import io.fabric8.kubernetes.client.KubernetesClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CodeExecutionService {

    private final TestCaseRepository testCaseRepository;
    private final String javaDockerImage = "gokhangnccn/java-runner:latest";
    private final String pythonDockerImage = "gokhangnccn/python-runner:latest";
    private final KubernetesClient kubernetesClient;

    @Async("codeRunnerExecutor")
    public CompletableFuture<Boolean> executeAndEvaluateCode(SubmissionEntity submission, ProblemEntity problem) {
        List<TestCaseEntity> testCases = testCaseRepository.findByProblemId(problem.getId());

        String language = submission.getLanguage();
        if (language == null) {
            submission.setPassed(false);
            submission.setErrorMessage("Programlama dili belirtilmemiş.");
            return CompletableFuture.completedFuture(false);
        }
        language = language.toLowerCase();

        String uniqueId = UUID.randomUUID().toString();
        Path folderPath = Path.of("/opt/runner", uniqueId);
        String fileName;
        String codeToExecute;

        try {
            Files.createDirectories(folderPath);

            switch (language) {
                case "java" -> {
                    fileName = "UserSolution.java";
                    codeToExecute = wrapJavaCode(submission.getCode(), "UserSolution");
                }
                case "python" -> {
                    fileName = "UserSolution.py";
                    codeToExecute = submission.getCode();
                }
                default -> {
                    submission.setPassed(false);
                    submission.setErrorMessage("Desteklenmeyen dil: " + language);
                    cleanup(folderPath);
                    return CompletableFuture.completedFuture(false);
                }
            }

            // Kod dosyasını yaz
            Files.writeString(folderPath.resolve(fileName), codeToExecute, StandardCharsets.UTF_8);

            // Dosya yazma işleminin tamamlanmasını bekle
            Thread.sleep(1000);

            // Dosyanın gerçekten yazıldığını kontrol et
            if (!Files.exists(folderPath.resolve(fileName))) {
                log.error("File was not created: {}", folderPath.resolve(fileName));
                throw new RuntimeException("Kod dosyası oluşturulamadı");
            }
            
            log.info("Code file created successfully: {}", folderPath.resolve(fileName));

            List<String> outputs;
            try {
                outputs = runCodeInKubernetes(language, folderPath, fileName, testCases);
            } catch (Exception e) {
                log.error("Code execution failed for submission {}: {}", submission.getId(), e.getMessage());
                submission.setPassed(false);
                submission.setErrorMessage("Çalıştırma hatası: " + e.getMessage());
                cleanup(folderPath);
                return CompletableFuture.completedFuture(false);
            }

            if (outputs.size() != testCases.size()) {
                submission.setPassed(false);
                submission.setErrorMessage("Test çıktısı sayısı beklenenden farklı. Beklenen: " + testCases.size() + ", Alınan: " + outputs.size());
                cleanup(folderPath);
                return CompletableFuture.completedFuture(false);
            }

            for (int i = 0; i < testCases.size(); i++) {
                String expectedOutput = testCases.get(i).getExpectedOutput();
                String output = outputs.get(i);
                if (!normalize(output).equals(normalize(expectedOutput))) {
                    submission.setPassed(false);
                    submission.setOutput(output);
                    submission.setErrorMessage("Beklenen çıktı ile eşleşmedi. Aldığınız: " + normalize(output) + ", Beklenen: " + normalize(expectedOutput));
                    cleanup(folderPath);
                    return CompletableFuture.completedFuture(false);
                }
            }

            submission.setPassed(true);
            submission.setOutput("Tüm testler başarıyla geçti.");
            return CompletableFuture.completedFuture(true);

        } catch (Exception e) {
            log.error("Execution failed: ", e);
            submission.setPassed(false);
            submission.setErrorMessage("Sistem hatası: " + e.getMessage());
            return CompletableFuture.completedFuture(false);
        } finally {
            cleanup(folderPath);
        }
    }

    private String wrapJavaCode(String code, String className) {
        return String.format("""
                import java.util.*;
                import java.io.*;

                public class %s {
                    %s
                }
                """, className, code);
    }

    private List<String> runCodeInKubernetes(String language, Path folderPath, String fileName, List<TestCaseEntity> testCases) throws Exception {
        // Tüm test girdilerini ayrı dosyalara yaz
        for (int i = 0; i < testCases.size(); i++) {
            Files.writeString(folderPath.resolve("input_" + i + ".txt"), testCases.get(i).getInput(), StandardCharsets.UTF_8);
        }

        // Dosyaların hazır olmasını bekle
        log.info("Waiting for files to be available in volume: {}", folderPath);
        int retryCount = 0;
        while ((!Files.exists(folderPath.resolve("input_0.txt")) || !Files.exists(folderPath.resolve(fileName))) && retryCount < 20) {
            Thread.sleep(500);
            retryCount++;
        }

        if (retryCount >= 20) {
            throw new RuntimeException("Dosyalar oluşturulamadı");
        }

        // Volume senkronizasyonu için küçük bekleme
        Thread.sleep(1000);

        String jobName = language + "-runner-job-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8);
        String imageName = language.equals("java") ? javaDockerImage : pythonDockerImage;
        String uuidFolder = folderPath.getFileName().toString();

        final String delimiter = "---END---";

        String runCommand = language.equals("java")
                ? String.format(
                "cd /opt/runner/%s && " +
                        "javac %s && " +
                        "for f in input_*.txt; do java UserSolution < \"$f\"; echo '%s'; done",
                uuidFolder, fileName, delimiter)
                : String.format(
                "cd /opt/runner/%s && " +
                        "for f in input_*.txt; do python3 %s < \"$f\"; echo '%s'; done",
                uuidFolder, fileName, delimiter);

        Job job = new JobBuilder()
                .withNewMetadata()
                .withName(jobName)
                .addToLabels("app", "code-runner")
                .addToLabels("session-id", uuidFolder)
                .endMetadata()
                .withNewSpec()
                .withBackoffLimit(0) // Yeniden deneme yapma
                .withTtlSecondsAfterFinished(300) // 5 dakika sonra otomatik temizle
                .withNewTemplate()
                .withNewMetadata()
                .addToLabels("app", "code-runner")
                .addToLabels("session-id", uuidFolder)
                .endMetadata()
                .withNewSpec()
                .withNodeName("gke-bitkod-cluster-ssd-pool-d34b4444-99m4")
                .addNewInitContainer()
                .withName("fix-permissions")
                .withImage("busybox:1.35")
                .withCommand("sh", "-c", "mkdir -p /opt/runner/" + uuidFolder + " && chown -R 1000:1000 /opt/runner/" + uuidFolder)
                .addNewVolumeMount()
                .withName("code-volume")
                .withMountPath("/opt/runner")
                .endVolumeMount()
                .withNewSecurityContext()
                .withRunAsUser(0L) // Root olarak çalıştır permission fix için
                .endSecurityContext()
                .endInitContainer()
                .addNewContainer()
                .withName(language + "-runner")
                .withImage(imageName)
                .withCommand("bash", "-c", runCommand)
                .addNewVolumeMount()
                .withName("code-volume")
                .withMountPath("/opt/runner")
                .endVolumeMount()
                .withNewResources()
                .addToLimits("memory", Quantity.parse("256Mi"))
                .addToLimits("cpu", Quantity.parse("500m"))
                .addToRequests("memory", Quantity.parse("128Mi"))
                .addToRequests("cpu", Quantity.parse("100m"))
                .endResources()
                .withNewSecurityContext()
                .withRunAsUser(1000L)
                .withRunAsGroup(1000L)
                .endSecurityContext()
                .endContainer()
                .withRestartPolicy("Never")
                .addNewVolume()
                .withName("code-volume")
                .withNewPersistentVolumeClaim()
                .withClaimName("runner-pvc")
                .endPersistentVolumeClaim()
                .endVolume()
                .endSpec()
                .endTemplate()
                .endSpec()
                .build();

        try {
            kubernetesClient.batch().v1().jobs().inNamespace("default").create(job);
            log.info("Job created: {}", jobName);

            // Job tamamlanmasını bekle
            int maxTries = 30; // 30 saniye
            boolean jobCompleted = false;
            String failureReason = "";

            for (int i = 0; i < maxTries; i++) {
                Job currentJob = kubernetesClient.batch().v1().jobs().inNamespace("default").withName(jobName).get();
                if (currentJob != null && currentJob.getStatus() != null) {
                    Integer succeeded = currentJob.getStatus().getSucceeded();
                    Integer failed = currentJob.getStatus().getFailed();

                    if (succeeded != null && succeeded > 0) {
                        jobCompleted = true;
                        break;
                    }

                    if (failed != null && failed > 0) {
                        // Pod loglarını ve durumunu detaylı olarak al
                        PodList pods = kubernetesClient.pods()
                                .inNamespace("default")
                                .withLabel("job-name", jobName)
                                .list();

                        StringBuilder errorDetails = new StringBuilder("Job failed. Details:");
                        
                        if (!pods.getItems().isEmpty()) {
                            Pod pod = pods.getItems().get(0);
                            String podName = pod.getMetadata().getName();
                            
                            // Pod durumu
                            if (pod.getStatus() != null) {
                                errorDetails.append("\nPod Status: ").append(pod.getStatus().getPhase());
                                
                                if (pod.getStatus().getContainerStatuses() != null && !pod.getStatus().getContainerStatuses().isEmpty()) {
                                    var containerStatus = pod.getStatus().getContainerStatuses().get(0);
                                    if (containerStatus.getState() != null && containerStatus.getState().getTerminated() != null) {
                                        errorDetails.append("\nExit Code: ").append(containerStatus.getState().getTerminated().getExitCode());
                                        errorDetails.append("\nReason: ").append(containerStatus.getState().getTerminated().getReason());
                                        errorDetails.append("\nMessage: ").append(containerStatus.getState().getTerminated().getMessage());
                                    }
                                    if (containerStatus.getState() != null && containerStatus.getState().getWaiting() != null) {
                                        errorDetails.append("\nWaiting Reason: ").append(containerStatus.getState().getWaiting().getReason());
                                        errorDetails.append("\nWaiting Message: ").append(containerStatus.getState().getWaiting().getMessage());
                                    }
                                }
                            }
                            
                            // Pod logları
                            try {
                                String logs = kubernetesClient.pods()
                                        .inNamespace("default")
                                        .withName(podName)
                                        .getLog();
                                if (logs != null && !logs.trim().isEmpty()) {
                                    errorDetails.append("\nPod Logs: ").append(logs.trim());
                                }
                            } catch (Exception e) {
                                errorDetails.append("\nCould not retrieve pod logs: ").append(e.getMessage());
                            }
                        } else {
                            errorDetails.append("\nNo pods found for failed job");
                        }
                        
                        log.error("Job execution failed: {}", errorDetails.toString());
                        throw new RuntimeException(errorDetails.toString());
                    }
                }
                Thread.sleep(1000);
            }

            if (!jobCompleted) {
                // Timeout durumunda da detaylı bilgi al
                PodList pods = kubernetesClient.pods()
                        .inNamespace("default")
                        .withLabel("job-name", jobName)
                        .list();
                
                StringBuilder timeoutDetails = new StringBuilder("Job execution timeout. Details:");
                
                if (!pods.getItems().isEmpty()) {
                    Pod pod = pods.getItems().get(0);
                    if (pod.getStatus() != null) {
                        timeoutDetails.append("\nPod Status: ").append(pod.getStatus().getPhase());
                        try {
                            String logs = kubernetesClient.pods()
                                    .inNamespace("default")
                                    .withName(pod.getMetadata().getName())
                                    .getLog();
                            if (logs != null && !logs.trim().isEmpty()) {
                                timeoutDetails.append("\nPod Logs: ").append(logs.trim());
                            }
                        } catch (Exception e) {
                            timeoutDetails.append("\nCould not retrieve pod logs: ").append(e.getMessage());
                        }
                    }
                }
                
                log.error("Job timeout: {}", timeoutDetails.toString());
                throw new RuntimeException(timeoutDetails.toString());
            }

            // Pod loglarını al
            PodList pods = kubernetesClient.pods()
                    .inNamespace("default")
                    .withLabel("job-name", jobName)
                    .list();

            if (pods.getItems().isEmpty()) {
                throw new RuntimeException("No pods found for job: " + jobName);
            }

            Pod pod = pods.getItems().get(0);
            String logs = kubernetesClient.pods()
                    .inNamespace("default")
                    .withName(pod.getMetadata().getName())
                    .getLog();

            // Log'u ayrıştır
            String rawLogs = logs != null ? logs.trim() : "";
            List<String> outputs = Arrays.stream(rawLogs.split(delimiter))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());

            return outputs;

        } finally {
            // Job temizliği
            try {
                Thread.sleep(2000); // Logları almak için biraz bekle
                kubernetesClient.batch().v1().jobs().inNamespace("default").withName(jobName).delete();
                log.info("Job deleted: {}", jobName);
            } catch (Exception e) {
                log.warn("Failed to delete job {}: {}", jobName, e.getMessage());
            }
        }
    }

    private void cleanup(Path folderPath) {
        try {
            if (Files.exists(folderPath)) {
                Files.walk(folderPath)
                        .sorted(Comparator.reverseOrder())
                        .forEach(path -> {
                            try {
                                Files.deleteIfExists(path);
                            } catch (IOException e) {
                                log.warn("Failed to delete file: {}", path, e);
                            }
                        });
            }
        } catch (IOException e) {
            log.warn("Failed to cleanup folder: {}", folderPath, e);
        }
    }

    private String normalize(String str) {
        if (str == null) return "";
        return str.trim().replace("\r\n", "\n").replace("\r", "\n");
    }
}