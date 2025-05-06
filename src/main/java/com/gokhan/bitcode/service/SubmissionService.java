package com.gokhan.bitcode.service;

import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.dtos.FeedbackTask;
import com.gokhan.bitcode.dtos.SubmissionStatsDTO;
import com.gokhan.bitcode.entity.ProblemEntity;
import com.gokhan.bitcode.entity.SubmissionEntity;
import com.gokhan.bitcode.enums.FeedbackType;
import com.gokhan.bitcode.llm.LLMFeedbackQueueProducer;
import com.gokhan.bitcode.llm.LLMFeedbackService;
import com.gokhan.bitcode.repository.ProblemRepository;
import com.gokhan.bitcode.repository.SubmissionRepository;
import com.gokhan.bitcode.utils.UserClaims;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;

    private final CodeExecutionService codeExecutionService;

    private final ProblemRepository problemRepository;

    private final LLMFeedbackQueueProducer llmFeedbackQueueProducer;

    @Transactional
    public ApiResponse<SubmissionEntity> createSubmission(SubmissionEntity submission, UserClaims userClaims) {
        boolean alreadySolved = submissionRepository.existsByUserIdAndProblemIdAndPassedTrue(
                Long.valueOf(userClaims.getUserId()), submission.getProblemId()
        );

        if (alreadySolved) {
            return ApiResponse.badRequest("BIT-3004", "Bu soruyu zaten başarıyla çözdünüz. Tekrar çözemezsiniz.");
        }

        try {
            submission.setUserId(Long.valueOf(userClaims.getUserId()));
            submission.setSubmittedAt(LocalDateTime.now());

            ProblemEntity problem = problemRepository.findById(submission.getProblemId()).orElse(null);
            if (problem == null) {
                return ApiResponse.problemNotFound();
            }

            CompletableFuture<Boolean> future = codeExecutionService.executeAndEvaluateCode(submission, problem);
            Boolean passed = future.get();
            submission.setPassed(passed);
            SubmissionEntity saved = submissionRepository.save(submission);

            if (passed) {
                FeedbackTask task = new FeedbackTask(
                        saved.getId(),
                        problem.getDescription(),
                        saved.getCode(),
                        null,
                        FeedbackType.CODE_QUALITY_SCORE
                );
                // LLM kuyruğuna gönder
                llmFeedbackQueueProducer.enqueue(task);
            }

            return ApiResponse.success(saved);
        } catch (Exception e) {
            return ApiResponse.badRequest("BIT-3001", "Submission kaydedilirken bir hata oluştu: " + e.getMessage());
        }
    }

    public ApiResponse<List<SubmissionEntity>> getSubmissionsByUserId(Long userId, UserClaims userClaims) {
        if (!userClaims.getUserId().equals(String.valueOf(userId)) &&
                !"ADMIN".equalsIgnoreCase(userClaims.getRole())) {
            return ApiResponse.forbidden("Sadece kendi gönderimlerinizi görüntüleyebilirsiniz.");
        }
        return ApiResponse.success(submissionRepository.findByUserId(userId));
    }

    public ApiResponse<List<SubmissionEntity>> getSubmissionsByUserIdAndProblemId(Long userId, Long problemId, UserClaims userClaims) {
        if (!userClaims.getUserId().equals(String.valueOf(userId)) &&
                !"ADMIN".equalsIgnoreCase(userClaims.getRole())) {
            return ApiResponse.forbidden("Sadece kendi gönderimlerinizi görüntüleyebilirsiniz.");
        }
        return ApiResponse.success(submissionRepository.findByUserIdAndProblemId(userId, problemId));
    }

    public ApiResponse<SubmissionStatsDTO> getUserSubmissionStats(Long userId, UserClaims userClaims) {
        if (!userClaims.getUserId().equals(String.valueOf(userId)) &&
                !"ADMIN".equalsIgnoreCase(userClaims.getRole())) {
            return ApiResponse.forbidden("Sadece kendi istatistiklerinizi görüntüleyebilirsiniz.");
        }

        try {
            long total = submissionRepository.countByUserId(userId);
            long successful = submissionRepository.countByUserIdAndPassedTrue(userId);
            long solvedProblems = submissionRepository.countDistinctByUserIdAndPassedTrue(userId);
            double successRate = (total == 0) ? 0.0 : (successful * 100.0 / total);
            double codeQualityScore = submissionRepository.findAverageCodeQualityScoreByUserId(userId);

            SubmissionStatsDTO stats = SubmissionStatsDTO.builder()
                    .totalSubmissions(total)
                    .successfulSubmissions(successful)
                    .solvedProblemsCount(solvedProblems)
                    .successRate(successRate)
                    .averageCodeQualityScore(codeQualityScore)
                    .build();

            return ApiResponse.success(stats);
        } catch (Exception e) {
            return ApiResponse.badRequest("BIT-3002", "İstatistikler alınırken bir hata oluştu.");
        }
    }

    public ApiResponse<List<SubmissionEntity>> getSuccessfulSubmissionsByProblemId(Long problemId) {
        try {
            List<SubmissionEntity> submissions = submissionRepository.findByProblemIdAndPassedTrue(problemId);
            return ApiResponse.success(submissions);
        } catch (Exception e) {
            return ApiResponse.badRequest("BIT-3003", "Başarılı gönderimler alınırken bir hata oluştu.");
        }
    }

    public ApiResponse<List<Long>> getSolvedProblemsByUser(Long userId, UserClaims userClaims) {
        if (!userClaims.getUserId().equals(String.valueOf(userId)) && !"ADMIN".equalsIgnoreCase(userClaims.getRole())) {
            return ApiResponse.forbidden("Sadece kendi çözdüğünüz soruları görebilirsiniz.");
        }
        List<Long> solvedIds = submissionRepository.findSolvedProblemIdsByUserId(userId);
        return ApiResponse.success(solvedIds);
    }

}
