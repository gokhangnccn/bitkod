package com.gokhan.bitcode.service;

import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.dtos.ProblemReportResponse;
import com.gokhan.bitcode.dtos.ReportProblemRequest;
import com.gokhan.bitcode.entity.ProblemEntity;
import com.gokhan.bitcode.entity.ProblemReportEntity;
import com.gokhan.bitcode.enums.ReportStatus;
import com.gokhan.bitcode.repository.ProblemReportRepository;
import com.gokhan.bitcode.repository.ProblemRepository;
import com.gokhan.bitcode.utils.UserClaims;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class ProblemService {

    private final ProblemRepository problemRepository;
    private final ProblemReportRepository problemReportRepository;

    private final Map<String, Integer> reportCounts = new ConcurrentHashMap<>();
    private static final int MAX_REPORTS_PER_HOUR = 5;
    private static final int RATE_LIMIT_WINDOW_HOURS = 1;

    public ApiResponse<List<ProblemEntity>> getAllProblems() {
        return ApiResponse.success(problemRepository.findAll());
    }

    public ApiResponse<ProblemEntity> getProblemByUid(String uid) {
        return problemRepository.findByUid(uid)
                .map(ApiResponse::success)
                .orElse(ApiResponse.problemNotFound());
    }

    public ApiResponse<ProblemEntity> createProblem(ProblemEntity problemEntity, UserClaims userClaims) {
        problemEntity.setCreatedBy(userClaims.getUserId());
        problemEntity.setCreatedAt(LocalDateTime.now());

        ProblemEntity saved = problemRepository.save(problemEntity);
        return ApiResponse.success(saved);
    }

    public ApiResponse<ProblemEntity> updateProblem(Long id, ProblemEntity updatedProblem, UserClaims userClaims) {
        return problemRepository.findById(id)
                .map(existing -> {
                    existing.setTitle(updatedProblem.getTitle());
                    existing.setDescription(updatedProblem.getDescription());
                    existing.setDifficulty(updatedProblem.getDifficulty());
                    existing.setExampleInput(updatedProblem.getExampleInput());
                    existing.setExampleOutput(updatedProblem.getExampleOutput());

                    ProblemEntity saved = problemRepository.save(existing);
                    return ApiResponse.success(saved);
                })
                .orElse(ApiResponse.problemNotFound());
    }

    public ApiResponse<Void> deleteProblem(Long id, UserClaims userClaims) {
        if (!problemRepository.existsById(id)) {
            return ApiResponse.problemNotFound();
        }

        if (!"ADMIN".equalsIgnoreCase(userClaims.getRole())) {
            return ApiResponse.forbidden("Sadece admin kullanıcılar problem silebilir.");
        }

        problemRepository.deleteById(id);
        return ApiResponse.success(null);
    }

    public ApiResponse<ProblemReportResponse> reportProblem(ReportProblemRequest request, UserClaims userClaims) {
        // Rate limiting check
        String userKey = userClaims.getUserId() + "_" + LocalDateTime.now().getHour();
        int currentCount = reportCounts.getOrDefault(userKey, 0);
        if (currentCount >= MAX_REPORTS_PER_HOUR) {
            return ApiResponse.badRequest("BIT-5001", "Saatlik raporlama limitine ulaştınız. Lütfen daha sonra tekrar deneyin.");
        }

        boolean exists = problemRepository.findByUid(request.getProblemUid()).isPresent();
        if (!exists) {
            return ApiResponse.problemNotFound();
        }

        ProblemReportEntity report = ProblemReportEntity.builder()
                .problemUid(request.getProblemUid())
                .reportedBy(userClaims.getUserId())
                .feedback(request.getFeedback())
                .category(request.getCategory())
                .status(ReportStatus.PENDING)
                .build();

        ProblemReportEntity saved = problemReportRepository.save(report);
        reportCounts.put(userKey, currentCount + 1);

        scheduleRateLimitCleanup(userKey);

        return ApiResponse.success(mapToResponse(saved));
    }

    private void scheduleRateLimitCleanup(String userKey) {
        CompletableFuture.delayedExecutor(RATE_LIMIT_WINDOW_HOURS, TimeUnit.HOURS)
                .execute(() -> reportCounts.remove(userKey));
    }

    private ProblemReportResponse mapToResponse(ProblemReportEntity entity) {
        return ProblemReportResponse.builder()
                .id(entity.getId())
                .problemUid(entity.getProblemUid())
                .reportedBy(entity.getReportedBy())
                .feedback(entity.getFeedback())
                .category(entity.getCategory())
                .status(entity.getStatus())
                .adminResponse(entity.getAdminResponse())
                .resolvedBy(entity.getResolvedBy())
                .reportedAt(entity.getReportedAt())
                .resolvedAt(entity.getResolvedAt())
                .build();
    }

    public ApiResponse<List<ProblemReportResponse>> getProblemReports(UserClaims userClaims) {
        if (!"ADMIN".equalsIgnoreCase(userClaims.getRole())) {
            return ApiResponse.forbidden("Sadece admin kullanıcılar raporları görüntüleyebilir.");
        }

        List<ProblemReportEntity> reports = problemReportRepository.findAll();
        List<ProblemReportResponse> response = reports.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return ApiResponse.success(response);
    }

    public ApiResponse<List<ProblemReportResponse>> getUserProblemReports(UserClaims userClaims) {
        List<ProblemReportEntity> reports = problemReportRepository.findByReportedBy(userClaims.getUserId());
        List<ProblemReportResponse> response = reports.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return ApiResponse.success(response);
    }

    public ApiResponse<ProblemReportResponse> updateReportStatus(Long reportId, ReportStatus newStatus, 
            String adminResponse, UserClaims userClaims) {
        if (!"ADMIN".equalsIgnoreCase(userClaims.getRole())) {
            return ApiResponse.forbidden("Sadece admin kullanıcılar rapor durumunu güncelleyebilir.");
        }

        return problemReportRepository.findById(reportId)
                .map(report -> {
                    report.setStatus(newStatus);
                    report.setAdminResponse(adminResponse);
                    report.setResolvedBy(userClaims.getUserId());
                    report.setResolvedAt(LocalDateTime.now());
                    
                    ProblemReportEntity saved = problemReportRepository.save(report);
                    return ApiResponse.success(mapToResponse(saved));
                })
                .orElse(ApiResponse.badRequest("BIT-5002", "Rapor bulunamadı."));
    }
}