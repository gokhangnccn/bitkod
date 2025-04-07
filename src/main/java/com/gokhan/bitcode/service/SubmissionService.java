package com.gokhan.bitcode.service;

import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.dtos.SubmissionStatsDTO;
import com.gokhan.bitcode.entity.SubmissionEntity;
import com.gokhan.bitcode.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;

    public ApiResponse<SubmissionEntity> createSubmission(SubmissionEntity submission) {
        try {
            submission.setSubmittedAt(LocalDateTime.now());
            SubmissionEntity saved = submissionRepository.save(submission);
            return ApiResponse.success(saved);
        } catch (Exception e) {
            return ApiResponse.badRequest("BIT-3001", "Submission kaydedilirken bir hata oluştu.");
        }
    }

    public ApiResponse<List<SubmissionEntity>> getSubmissionsByUserId(Long userId) {
        List<SubmissionEntity> submissions = submissionRepository.findByUserId(userId);
        return ApiResponse.success(submissions);
    }

    public ApiResponse<List<SubmissionEntity>> getSubmissionsByUserIdAndProblemId(Long userId, Long problemId) {
        List<SubmissionEntity> submissions = submissionRepository.findByUserIdAndProblemId(userId, problemId);
        return ApiResponse.success(submissions);
    }

    public ApiResponse<SubmissionStatsDTO> getUserSubmissionStats(Long userId) {
        try {
            long total = submissionRepository.countByUserId(userId);
            long successful = submissionRepository.countByUserIdAndPassedTrue(userId);
            long solvedProblems = submissionRepository.countDistinctByUserIdAndPassedTrue(userId);
            double successRate = (total == 0) ? 0.0 : (successful * 100.0 / total);

            SubmissionStatsDTO stats = SubmissionStatsDTO.builder()
                    .totalSubmissions(total)
                    .successfulSubmissions(successful)
                    .solvedProblemsCount(solvedProblems)
                    .successRate(successRate)
                    .build();

            return ApiResponse.success(stats);
        } catch (Exception e) {
            return ApiResponse.badRequest("BIT-3002", "İstatistikler alınırken bir hata oluştu.");
        }
    }

    public ApiResponse<List<SubmissionEntity>> getSuccessfulSubmissionsByProblemId(Long problemId) {
        List<SubmissionEntity> submissions = submissionRepository.findByProblemIdAndPassedTrue(problemId);
        return ApiResponse.success(submissions);
    }
}
