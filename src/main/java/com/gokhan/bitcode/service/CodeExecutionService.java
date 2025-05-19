package com.gokhan.bitcode.service;

import com.gokhan.bitcode.entity.ProblemEntity;
import com.gokhan.bitcode.entity.SubmissionEntity;
import com.gokhan.bitcode.entity.TestCaseEntity;
import com.gokhan.bitcode.repository.TestCaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class CodeExecutionService {

    private final TestCaseRepository testCaseRepository;
    private final String javaDockerImage = "java-runner";
    private final String pythonDockerImage = "python-runner";

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
        Path folderPath = Path.of(System.getProperty("java.io.tmpdir"), "runner", uniqueId);
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

            Files.writeString(folderPath.resolve(fileName), codeToExecute, StandardCharsets.UTF_8);

            for (TestCaseEntity testCase : testCases) {
                String input = testCase.getInput();
                String expectedOutput = testCase.getExpectedOutput();
                String output;

                try {
                    output = switch (language) {
                        case "java" -> runJavaInDocker(folderPath.toString(), input);
                        case "python" -> runPythonInDocker(folderPath.toString(), input, fileName);
                        default -> throw new IllegalStateException("Beklenmedik dil: " + language);
                    };
                } catch (Exception e) {
                    submission.setPassed(false);
                    submission.setErrorMessage("Çalıştırma hatası: " + e.getMessage());
                    cleanup(folderPath);
                    return CompletableFuture.completedFuture(false);
                }

                if (!normalize(output).equals(normalize(expectedOutput))) {
                    submission.setPassed(false);
                    submission.setOutput(output);
                    submission.setErrorMessage("Beklenen çıktı ile eşleşmedi.");
                    cleanup(folderPath);
                    return CompletableFuture.completedFuture(false);
                }
            }

            submission.setPassed(true);
            submission.setOutput("Tüm testler başarıyla geçti.");
            return CompletableFuture.completedFuture(true);

        } catch (IOException e) {
            submission.setPassed(false);
            submission.setErrorMessage("Dosya sistemi hatası: " + e.getMessage());
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

    private String runJavaInDocker(String hostFolderPath, String input) throws IOException, InterruptedException {
        String command = "cd /app && javac UserSolution.java && java UserSolution";
        ProcessBuilder pb = new ProcessBuilder(
                "docker", "run", "-i", "--rm",
                "--memory=256m", "--cpus=0.5", "--network=none",
                "-v", hostFolderPath + ":/app",
                javaDockerImage,
                "bash", "-c", command
        );
        return executeInDocker(pb, input);
    }

    private String runPythonInDocker(String hostFolderPath, String input, String scriptName) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(
                "docker", "run", "-i", "--rm",
                "--memory=256m", "--cpus=0.5", "--network=none",
                "-v", hostFolderPath + ":/app",
                pythonDockerImage,
                "python3", "/app/" + scriptName
        );
        return executeInDocker(pb, input);
    }

    private String executeInDocker(ProcessBuilder pb, String stdInput) throws IOException, InterruptedException {
        pb.redirectErrorStream(true);
        Process process = pb.start();

        if (stdInput != null) {
            try (OutputStream os = process.getOutputStream()) {
                os.write(stdInput.getBytes(StandardCharsets.UTF_8));
                if (!stdInput.endsWith("\n")) {
                    os.write("\n".getBytes(StandardCharsets.UTF_8));
                }
            }
        }

        long timeoutSeconds = 10;
        boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);

        if (!finished) {
            process.destroyForcibly();
            process.waitFor();
            throw new RuntimeException("Kod çalıştırma zaman aşımına uğradı.");
        }

        String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
        if (process.exitValue() != 0) {
            throw new RuntimeException("Çıkış kodu: " + process.exitValue() + "\nHata çıktısı:\n" + output);
        }

        return output;
    }

    private void cleanup(Path folderPath) {
        try {
            if (Files.exists(folderPath)) {
                Files.walk(folderPath)
                        .sorted(Comparator.reverseOrder())
                        .forEach(path -> {
                            try {
                                Files.deleteIfExists(path);
                            } catch (IOException ignored) {
                            }
                        });
            }
        } catch (IOException ignored) {
        }
    }

    private String normalize(String str) {
        if (str == null) return "";
        return str.trim().replace("\r\n", "\n").replace("\r", "\n");
    }
}
