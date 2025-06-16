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
    
    // Docker image'ları - kendi hazırlanan runtime ortamları
    private final String javaDockerImage = "gokhangnccn/java-runner:latest";
    private final String pythonDockerImage = "gokhangnccn/python-runner:latest";
    private final KubernetesClient kubernetesClient;

    /*
      Ana metod: Kullanıcı kodunu alır, test eder ve sonucu döner
      Async sayesinde non-blocking olarak çalışır
     */
    @Async("codeRunnerExecutor")
    public CompletableFuture<Boolean> executeAndEvaluateCode(SubmissionEntity submission, ProblemEntity problem) {
        // Problem için tanımlanmış test case'leri getir
        List<TestCaseEntity> testCases = testCaseRepository.findByProblemId(problem.getId());

        // Programlama dili kontrolü
        String language = submission.getLanguage();
        if (language == null) {
            submission.setPassed(false);
            submission.setErrorMessage("Programlama dili belirtilmemiş.");
            return CompletableFuture.completedFuture(false);
        }
        language = language.toLowerCase();

        // Her submission için benzersiz bir çalışma klasörü oluştur
        String uniqueId = UUID.randomUUID().toString();
        Path folderPath = Path.of("/opt/runner", uniqueId);
        String fileName;
        String codeToExecute;

        try {
            // Çalışma klasörünü oluştur
            Files.createDirectories(folderPath);

            // Dile göre kod formatını hazırla
            switch (language) {
                case "java" -> {
                    fileName = "UserSolution.java";
                    // Java kodu için class wrapper ekle
                    codeToExecute = wrapJavaCode(submission.getCode(), "UserSolution");
                }
                case "python" -> {
                    fileName = "UserSolution.py";
                    // Python kodu direkt kullanılabilir
                    codeToExecute = submission.getCode();
                }
                default -> {
                    submission.setPassed(false);
                    submission.setErrorMessage("Desteklenmeyen dil: " + language);
                    cleanup(folderPath);
                    return CompletableFuture.completedFuture(false);
                }
            }

            // Kod dosyasını persistent volume'a yaz
            Files.writeString(folderPath.resolve(fileName), codeToExecute, StandardCharsets.UTF_8);

            // Dosya sisteminin senkronize olmasını bekle
            Thread.sleep(1000);

            // Dosyanın gerçekten oluştuğunu doğrula
            if (!Files.exists(folderPath.resolve(fileName))) {
                log.error("File was not created: {}", folderPath.resolve(fileName));
                throw new RuntimeException("Kod dosyası oluşturulamadı");
            }
            
            log.info("Code file created successfully: {}", folderPath.resolve(fileName));

            // Kubernetes'te kodu çalıştır ve sonuçları al
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

            // Çıktı sayısı kontrolü - her test case için bir çıktı olmalı
            if (outputs.size() != testCases.size()) {
                submission.setPassed(false);
                submission.setErrorMessage("Test çıktısı sayısı beklenenden farklı. Beklenen: " + testCases.size() + ", Alınan: " + outputs.size());
                cleanup(folderPath);
                return CompletableFuture.completedFuture(false);
            }

            // Her test case için beklenen çıktı ile karşılaştır
            for (int i = 0; i < testCases.size(); i++) {
                String expectedOutput = testCases.get(i).getExpectedOutput();
                String output = outputs.get(i);
                
                // Çıktıları normalize et ve karşılaştır (whitespace temizleme)
                if (!normalize(output).equals(normalize(expectedOutput))) {
                    submission.setPassed(false);
                    submission.setOutput(output);
                    submission.setErrorMessage("Beklenen çıktı ile eşleşmedi. Aldığınız: " + normalize(output) + ", Beklenen: " + normalize(expectedOutput));
                    cleanup(folderPath);
                    return CompletableFuture.completedFuture(false);
                }
            }

            // Tüm testler başarılı!
            submission.setPassed(true);
            submission.setOutput("Tüm testler başarıyla geçti.");
            return CompletableFuture.completedFuture(true);

        } catch (Exception e) {
            log.error("Execution failed: ", e);
            submission.setPassed(false);
            submission.setErrorMessage("Sistem hatası: " + e.getMessage());
            return CompletableFuture.completedFuture(false);
        } finally {
            // Çalışma klasörünü temizle
            cleanup(folderPath);
        }
    }

    /**
     * Java kodu için class wrapper ekler
     * Kullanıcı sadece method yazdığı için, bunu executable class haline getirir
     */
    private String wrapJavaCode(String code, String className) {
        return String.format("""
                import java.util.*;
                import java.io.*;

                public class %s {
                    %s
                }
                """, className, code);
    }

    /**
     * Kubernetes Job oluşturup kodu çalıştıran ana metod
     * Her test case için ayrı input vererek sonuçları toplar
     */
    private List<String> runCodeInKubernetes(String language, Path folderPath, String fileName, List<TestCaseEntity> testCases) throws Exception {
        // Tüm test case inputlarını ayrı dosyalara yaz
        for (int i = 0; i < testCases.size(); i++) {
            Files.writeString(folderPath.resolve("input_" + i + ".txt"), testCases.get(i).getInput(), StandardCharsets.UTF_8);
        }

        // Persistent volume senkronizasyonunu bekle
        log.info("Waiting for files to be available in volume: {}", folderPath);
        int retryCount = 0;
        while ((!Files.exists(folderPath.resolve("input_0.txt")) || !Files.exists(folderPath.resolve(fileName))) && retryCount < 20) {
            Thread.sleep(500);
            retryCount++;
        }

        if (retryCount >= 20) {
            throw new RuntimeException("Dosyalar oluşturulamadı");
        }

        // Ek senkronizasyon bekleme süresi
        Thread.sleep(1000);

        // Benzersiz job ismi oluştur
        String jobName = language + "-runner-job-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8);
        String imageName = language.equals("java") ? javaDockerImage : pythonDockerImage;
        String uuidFolder = folderPath.getFileName().toString();

        // Çıktıları ayırmak için delimiter
        final String delimiter = "---END---";

        // Dile göre çalıştırma komutu hazırla
        String runCommand = language.equals("java")
                ? String.format(
                "cd /opt/runner/%s && " +
                        "javac %s && " + // Java dosyasını derle
                        "for f in input_*.txt; do java UserSolution < \"$f\"; echo '%s'; done", // Her input için çalıştır
                uuidFolder, fileName, delimiter)
                : String.format(
                "cd /opt/runner/%s && " +
                        "for f in input_*.txt; do python3 %s < \"$f\"; echo '%s'; done", // Python için direkt çalıştır
                uuidFolder, fileName, delimiter);

        // Kubernetes Job tanımını oluştur
        Job job = new JobBuilder()
                .withNewMetadata()
                .withName(jobName)
                .addToLabels("app", "code-runner")
                .addToLabels("session-id", uuidFolder)
                .endMetadata()
                .withNewSpec()
                .withBackoffLimit(0) // Hata durumunda yeniden deneme yapma
                .withTtlSecondsAfterFinished(300) // 5 dakika sonra otomatik temizle
                .withNewTemplate()
                .withNewMetadata()
                .addToLabels("app", "code-runner")
                .addToLabels("session-id", uuidFolder)
                .endMetadata()
                .withNewSpec()
                .withNodeName("gke-bitkod-cluster-ssd-pool-d34b4444-nugb") // Belirli node'da çalıştır
                
                // İlk olarak dosya izinlerini düzelt
                .addNewInitContainer()
                .withName("fix-permissions")
                .withImage("busybox:1.35")
                .withCommand("sh", "-c", "mkdir -p /opt/runner/" + uuidFolder + " && chown -R 1000:1000 /opt/runner/" + uuidFolder)
                .addNewVolumeMount()
                .withName("code-volume")
                .withMountPath("/opt/runner")
                .endVolumeMount()
                .withNewSecurityContext()
                .withRunAsUser(0L) // Root yetkisiyle permission fix
                .endSecurityContext()
                .endInitContainer()
                
                // Ana container - kullanıcı kodunu çalıştır
                .addNewContainer()
                .withName(language + "-runner")
                .withImage(imageName)
                .withCommand("bash", "-c", runCommand)
                .addNewVolumeMount()
                .withName("code-volume")
                .withMountPath("/opt/runner")
                .endVolumeMount()
                
                // Kaynak limitleri - güvenlik için önemli
                .withNewResources()
                .addToLimits("memory", Quantity.parse("256Mi")) // Max 256MB RAM
                .addToLimits("cpu", Quantity.parse("500m"))     // Max %50 CPU
                .addToRequests("memory", Quantity.parse("128Mi")) // Min 128MB RAM
                .addToRequests("cpu", Quantity.parse("100m"))     // Min %10 CPU
                .endResources()
                
                // Güvenlik ayarları - non-root user
                .withNewSecurityContext()
                .withRunAsUser(1000L)
                .withRunAsGroup(1000L)
                .endSecurityContext()
                .endContainer()
                .withRestartPolicy("Never") // Hata durumunda yeniden başlatma
                
                // Persistent Volume bağlantısı
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
            // Job'ı Kubernetes cluster'ına gönder
            kubernetesClient.batch().v1().jobs().inNamespace("default").create(job);
            log.info("Job created: {}", jobName);

            // Job'ın tamamlanmasını bekle (max 30 saniye)
            int maxTries = 30;
            boolean jobCompleted = false;

            for (int i = 0; i < maxTries; i++) {
                Job currentJob = kubernetesClient.batch().v1().jobs().inNamespace("default").withName(jobName).get();
                if (currentJob != null && currentJob.getStatus() != null) {
                    Integer succeeded = currentJob.getStatus().getSucceeded();
                    Integer failed = currentJob.getStatus().getFailed();

                    if (succeeded != null && succeeded > 0) {
                        // Job başarıyla tamamlandı
                        jobCompleted = true;
                        break;
                    }

                    if (failed != null && failed > 0) {
                        // Job başarısız oldu - detaylı hata bilgisi al
                        PodList pods = kubernetesClient.pods()
                                .inNamespace("default")
                                .withLabel("job-name", jobName)
                                .list();

                        StringBuilder errorDetails = new StringBuilder("Job failed. Details:");
                        
                        if (!pods.getItems().isEmpty()) {
                            Pod pod = pods.getItems().get(0);
                            String podName = pod.getMetadata().getName();
                            
                            // Pod durumu bilgilerini topla
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
                            
                            // Pod loglarını al
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
                Thread.sleep(1000); // 1 saniye bekle
            }

            if (!jobCompleted) {
                // Timeout durumu - detaylı bilgi al
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

            // Başarılı job'ın loglarını al
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

            // Logları ayrıştır - her test case için ayrı çıktı
            String rawLogs = logs != null ? logs.trim() : "";
            List<String> outputs = Arrays.stream(rawLogs.split(delimiter))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());

            return outputs;

        } finally {
            // Job'ı temizle - kaynak tasarrufu için
            try {
                Thread.sleep(2000); // Logları almak için biraz bekle
                kubernetesClient.batch().v1().jobs().inNamespace("default").withName(jobName).delete();
                log.info("Job deleted: {}", jobName);
            } catch (Exception e) {
                log.warn("Failed to delete job {}: {}", jobName, e.getMessage());
            }
        }
    }

    /**
     * Geçici dosyaları ve klasörleri temizler
     * Disk alanı tasarrufu için önemli
     */
    private void cleanup(Path folderPath) {
        try {
            if (Files.exists(folderPath)) {
                Files.walk(folderPath)
                        .sorted(Comparator.reverseOrder()) // Önce dosyalar, sonra klasörler
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

    /**
     * String çıktıları normalize eder
     * Farklı işletim sistemlerindeki line ending farklılıklarını giderir
     */
    private String normalize(String str) {
        if (str == null) return "";
        return str.trim().replace("\r\n", "\n").replace("\r", "\n");
    }
}