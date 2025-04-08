package com.gokhan.bitcode.service;

import com.gokhan.bitcode.entity.ProblemEntity;
import com.gokhan.bitcode.entity.SubmissionEntity;
import com.gokhan.bitcode.entity.TestCaseEntity;
import com.gokhan.bitcode.repository.TestCaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class CodeExecutionService {

    private final TestCaseRepository testCaseRepository;

    public boolean executeAndEvaluateCode(SubmissionEntity submission, ProblemEntity problem) {
        List<TestCaseEntity> testCases = testCaseRepository.findByProblemId(problem.getId());

        try {
            // Kod dosyasını oluştur
            String className = "UserSolution";
            String javaCode = wrapCodeInClass(submission.getCode(), className);

            // Temp dizini
            Path folderPath = Path.of(System.getProperty("java.io.tmpdir"), "runner");
            Files.createDirectories(folderPath);

            Path javaFile = folderPath.resolve(className + ".java");
            Files.writeString(javaFile, javaCode);

            for (TestCaseEntity testCase : testCases) {
                String input = testCase.getInput();
                String expectedOutput = testCase.getExpectedOutput();

                String output = runJavaInDocker(folderPath.toAbsolutePath().toString(), input);

                if (!normalize(output).equals(normalize(expectedOutput)))
                {
                    submission.setPassed(false);
                    submission.setOutput(output);
                    submission.setErrorMessage("Beklenen çıktı ile eşleşmedi.");
                    return false;
                }
            }

            submission.setPassed(true);
            submission.setOutput("Tüm testler geçti.");
            return true;

        } catch (IOException | InterruptedException e) {
            submission.setPassed(false);
            submission.setErrorMessage("Çalıştırma hatası: " + e.getMessage());
            return false;
        }
    }

    private String normalize(String str) {
        return str.trim().replace("\r", "");
    }

    private String wrapCodeInClass(String code, String className) {
        return """
                import java.util.*;

                public class %s {
                    public static void main(String[] args) throws Exception {
                        %s
                    }
                }
                """.formatted(className, code);
    }

    private String runJavaInDocker(String hostFolderPath, String input) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(
                "docker", "run", "--rm",
                "-v", hostFolderPath + ":/app",
                "java-runner",
                "bash", "-c",
                "cd /app && javac UserSolution.java && java UserSolution <<EOF\n" + input + "\nEOF"
        );

        pb.redirectErrorStream(true);
        Process process = pb.start();
        String output = new String(process.getInputStream().readAllBytes());
        process.waitFor(10, TimeUnit.SECONDS);
        return output;
    }

}


