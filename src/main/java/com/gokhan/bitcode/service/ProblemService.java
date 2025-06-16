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
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class ProblemService {

    private final ProblemRepository problemRepository;
    private final ProblemReportRepository problemReportRepository;
    private final CacheManager cacheManager;

    private final Map<String, Integer> reportCounts = new ConcurrentHashMap<>();
    private static final int MAX_REPORTS_PER_HOUR = 5;
    private static final int RATE_LIMIT_WINDOW_HOURS = 1;

    @Cacheable(value = "problems", key = "'all'")
    public List<ProblemEntity> getAllProblems() {
        log.debug(">> [Cache] getAllProblems çağrıldı");
        List<ProblemEntity> problems = problemRepository.findAll();
        log.info(">> [Cache] getAllProblems tamamlandı - {} problem bulundu", problems.size());
        return problems;
    }

    @Cacheable(value = "problems", key = "#uid")
    public ProblemEntity getProblemByUid(String uid) {
        log.debug(">> [Cache] getProblemByUid çağrıldı - uid: {}", uid);
        ProblemEntity problem = problemRepository.findByUid(uid).orElse(null);
        log.info(">> [Cache] getProblemByUid tamamlandı - uid: {}, bulundu: {}", uid, problem != null);
        return problem;
    }

    @Caching(evict = {
            @CacheEvict(value = "problems", key = "'all'"),
            @CacheEvict(value = "problems", key = "#uid")
    })
    public ApiResponse<ProblemEntity> updateProblemWithEvict(Long id, ProblemEntity updatedProblem, UserClaims userClaims) {
        log.debug(">> [Update] Güncelleme başlıyor - id: {}", id);
        
        String uid = problemRepository.findById(id)
                .map(ProblemEntity::getUid)
                .orElse(null);

        if (uid == null) {
            log.warn(">> [Update] Problem bulunamadı - id: {}", id);
            return ApiResponse.problemNotFound();
        }

        log.info(">> [Cache Evict] Başlıyor - problem:all ve problem:{}", uid);
        
        try {
            // Cache'i manuel olarak temizle
            Cache cache = Objects.requireNonNull(cacheManager.getCache("problems"), "Cache 'problems' is not configured");
            cache.evict("all");
            cache.evict(uid);
            
            // Redis'teki tüm problem cache'lerini temizle
            RedisTemplate<String, Object> redisTemplate = (RedisTemplate<String, Object>) cacheManager.getCache("problems").getNativeCache();
            if (redisTemplate != null) {
                redisTemplate.delete("bitcode:problems:*");
            }
            
            log.info(">> [Cache Evict] Cache temizlendi - problem:all ve problem:{}", uid);
        } catch (Exception e) {
            log.error(">> [Cache Evict] Hata oluştu", e);
        }

        return problemRepository.findById(id)
                .map(existing -> {
                    log.debug(">> [Update] Mevcut problem bulundu - id: {}, uid: {}", id, uid);
                    
                    existing.setTitle(updatedProblem.getTitle());
                    existing.setDescription(updatedProblem.getDescription());
                    existing.setDifficulty(updatedProblem.getDifficulty());
                    existing.setExampleInput(updatedProblem.getExampleInput());
                    existing.setExampleOutput(updatedProblem.getExampleOutput());

                    ProblemEntity saved = problemRepository.save(existing);
                    log.info(">> [Update] Problem güncellendi - id: {}, uid: {}", id, uid);
                    return ApiResponse.success(saved);
                })
                .orElseGet(() -> {
                    log.warn(">> [Update] Problem güncellenemedi - id: {}", id);
                    return ApiResponse.problemNotFound();
                });
    }

    @Caching(evict = {
            @CacheEvict(value = "problems", key = "'all'")
    })
    public ApiResponse<ProblemEntity> createProblem(ProblemEntity problemEntity, UserClaims userClaims) {
        problemEntity.setCreatedBy(userClaims.getUserId());
        problemEntity.setCreatedAt(LocalDateTime.now());

        ProblemEntity saved = problemRepository.save(problemEntity);
        return ApiResponse.success(saved);
    }

    public ApiResponse<Void> deleteProblem(Long id, UserClaims userClaims) {
        ProblemEntity problem = problemRepository.findById(id).orElse(null);
        if (problem == null) return ApiResponse.problemNotFound();

        String uid = problem.getUid();

        if (!"ADMIN".equalsIgnoreCase(userClaims.getRole())) {
            return ApiResponse.forbidden("Sadece admin kullanıcılar problem silebilir.");
        }

        problemRepository.deleteById(id);

        Cache cache = Objects.requireNonNull(
                cacheManager.getCache("problems"),
                "Cache 'problems' is not configured in CacheManager"
        );
        cache.evict("all");
        cache.evict(uid);

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

    @Cacheable(value = "problemReports", key = "'admin:all'", unless = "#result == null or !#result.succeeded")
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

    @CacheEvict(value = "problemReports", key = "'admin:all'")
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