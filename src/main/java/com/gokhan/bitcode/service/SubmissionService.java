package com.gokhan.bitcode.service;

import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.dtos.FeedbackTask;
import com.gokhan.bitcode.dtos.SubmissionStatsDTO;
import com.gokhan.bitcode.dtos.SubmissionStatsResponse;
import com.gokhan.bitcode.entity.ProblemEntity;
import com.gokhan.bitcode.entity.SubmissionEntity;
import com.gokhan.bitcode.entity.UserEntity;
import com.gokhan.bitcode.enums.FeedbackType;
import com.gokhan.bitcode.llm.LLMFeedbackQueueProducer;
import com.gokhan.bitcode.repository.ProblemRepository;
import com.gokhan.bitcode.repository.SubmissionRepository;
import com.gokhan.bitcode.repository.UserRepository;
import com.gokhan.bitcode.utils.UserClaims;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.HashMap;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;

@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;

    private final CodeExecutionService codeExecutionService;

    private final ProblemRepository problemRepository;

    private final LLMFeedbackQueueProducer llmFeedbackQueueProducer;
    
    private final UserRepository userRepository;

    @Caching(evict = {
            @CacheEvict(value = "leaderboard", allEntries = true),
            @CacheEvict(value = "userSubmissions", key = "#userClaims.userId"),
            @CacheEvict(value = "userProblemSubs", key = "#userClaims.userId + ':' + #submission.problemId"),
            @CacheEvict(value = "userSubStats", key = "#userClaims.userId"),
            @CacheEvict(value = "userSolved", key = "#userClaims.userId", condition = "#result != null && #result.succeeded && #result.data != null && #result.data.passed"),
            @CacheEvict(value = "problemSuccessSubs", key = "#submission.problemId", condition = "#result != null && #result.succeeded && #result.data != null && #result.data.passed")
    })
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

            Boolean passed = codeExecutionService.executeAndEvaluateCode(submission, problem).get();
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

    @Cacheable(value = "userSubmissions", key = "#userId")
    public ApiResponse<List<SubmissionEntity>> getSubmissionsByUserId(Long userId, UserClaims userClaims) {
        if (!userClaims.getUserId().equals(String.valueOf(userId)) &&
                !"ADMIN".equalsIgnoreCase(userClaims.getRole())) {
            return ApiResponse.forbidden("Sadece kendi gönderimlerinizi görüntüleyebilirsiniz.");
        }
        return ApiResponse.success(submissionRepository.findByUserId(userId));
    }

    @Cacheable(value = "userProblemSubs", key = "#userId + ':' + #problemId")
    public ApiResponse<List<SubmissionEntity>> getSubmissionsByUserIdAndProblemId(Long userId, Long problemId, UserClaims userClaims) {
        if (!userClaims.getUserId().equals(String.valueOf(userId)) &&
                !"ADMIN".equalsIgnoreCase(userClaims.getRole())) {
            return ApiResponse.forbidden("Sadece kendi gönderimlerinizi görüntüleyebilirsiniz.");
        }
        return ApiResponse.success(submissionRepository.findByUserIdAndProblemId(userId, problemId));
    }

//    public ApiResponse<SubmissionStatsDTO> getUserSubmissionStats(Long userId, UserClaims userClaims) {
//        if (!userClaims.getUserId().equals(String.valueOf(userId)) &&
//                !"ADMIN".equalsIgnoreCase(userClaims.getRole())) {
//            return ApiResponse.forbidden("Sadece kendi istatistiklerinizi görüntüleyebilirsiniz.");
//        }
//
//        try {
//            long total = submissionRepository.countByUserId(userId);
//            long successful = submissionRepository.countByUserIdAndPassedTrue(userId);
//            long solvedProblems = submissionRepository.countDistinctByUserIdAndPassedTrue(userId);
//            double successRate = (total == 0) ? 0.0 : (successful * 100.0 / total);
//            double codeQualityScore = submissionRepository.findAverageCodeQualityScoreByUserId(userId);
//
//            SubmissionStatsDTO stats = SubmissionStatsDTO.builder()
//                    .totalSubmissions(total)
//                    .successfulSubmissions(successful)
//                    .solvedProblemsCount(solvedProblems)
//                    .successRate(successRate)
//                    .averageCodeQualityScore(codeQualityScore)
//                    .build();
//
//            return ApiResponse.success(stats);
//        } catch (Exception e) {
//            return ApiResponse.badRequest("BIT-3002", "İstatistikler alınırken bir hata oluştu.");
//        }
//    }

    @Cacheable(value = "problemSuccessSubs", key = "#problemId")
    public ApiResponse<List<SubmissionEntity>> getSuccessfulSubmissionsByProblemId(Long problemId) {
        try {
            List<SubmissionEntity> submissions = submissionRepository.findByProblemIdAndPassedTrue(problemId);
            return ApiResponse.success(submissions);
        } catch (Exception e) {
            return ApiResponse.badRequest("BIT-3003", "Başarılı gönderimler alınırken bir hata oluştu.");
        }
    }

    @Cacheable(value = "userSolved", key = "#userId")
    public ApiResponse<List<Long>> getSolvedProblemsByUser(Long userId, UserClaims userClaims) {
        if (!userClaims.getUserId().equals(String.valueOf(userId)) && !"ADMIN".equalsIgnoreCase(userClaims.getRole())) {
            return ApiResponse.forbidden("Sadece kendi çözdüğünüz soruları görebilirsiniz.");
        }
        List<Long> solvedIds = submissionRepository.findSolvedProblemIdsByUserId(userId);
        return ApiResponse.success(solvedIds);
    }

    @Cacheable(value = "userSubStats", key = "#userId")
    public ApiResponse<SubmissionStatsResponse> getUserSubmissionStats(Long userId) {
        List<SubmissionEntity> submissions = submissionRepository.findByUserId(userId);

        // Son 7 günün gönderim sayıları - format düzeltildi
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        Map<String, Long> dailySubmissionMap = submissions.stream()
                .filter(sub -> sub.getSubmittedAt().isAfter(sevenDaysAgo))
                .collect(Collectors.groupingBy(
                        sub -> sub.getSubmittedAt().format(DateTimeFormatter.ISO_DATE),
                        Collectors.counting()
                ));

        // Son 7 günün tüm tarihlerini oluştur (eksik günler için 0 değeri)
        List<SubmissionStatsResponse.DayCount> submissionsByDay = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            String dateStr = date.format(DateTimeFormatter.ISO_DATE);
            long count = dailySubmissionMap.getOrDefault(dateStr, 0L);
            submissionsByDay.add(SubmissionStatsResponse.DayCount.of(dateStr, count));
        }

        // Programlama dillerine göre gönderim sayıları
        Map<String, Long> submissionsByLanguage = submissions.stream()
                .collect(Collectors.groupingBy(
                        SubmissionEntity::getLanguage,
                        Collectors.counting()
                ));

        // Zorluk seviyelerine göre problem sayıları - format düzeltildi
        Map<String, Long> difficultyMap = new HashMap<>();
        for (SubmissionEntity submission : submissions) {
            if (submission.getPassed()) {  // Sadece başarılı gönderimleri say
                ProblemEntity problem = problemRepository.findById(submission.getProblemId()).orElse(null);
                if (problem != null) {
                    String difficulty = problem.getDifficulty().toString();
                    difficultyMap.merge(difficulty, 1L, Long::sum);
                }
            }
        }

        // Zorluk seviyesi verisini liste formatına çevir
        List<SubmissionStatsResponse.DifficultyCount> submissionsByDifficulty = difficultyMap.entrySet().stream()
                .map(entry -> SubmissionStatsResponse.DifficultyCount.of(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());

        // Toplam ve başarılı gönderim sayıları
        long totalSubmissions = submissions.size();
        long successfulSubmissions = submissions.stream()
                .filter(SubmissionEntity::getPassed)
                .count();

        // Çözülen problem sayısı (tekrar eden problemler sayılmaz)
        long solvedProblemsCount = submissions.stream()
                .filter(SubmissionEntity::getPassed)
                .map(SubmissionEntity::getProblemId)
                .distinct()
                .count();

        // Başarı oranı
        double successRate = totalSubmissions > 0 
                ? (double) successfulSubmissions / totalSubmissions * 100 
                : 0;

        // Ortalama kod kalite skoru
        double averageCodeQualityScore = submissions.stream()
                .filter(sub -> sub.getCodeQualityScore() != null)
                .mapToInt(SubmissionEntity::getCodeQualityScore)
                .average()
                .orElse(0.0);

        // YENİ GELİŞMİŞ İSTATİSTİKLER
        
        // Saatlik aktivite dağılımı
        List<Object[]> hourlyData = submissionRepository.getHourlyActivityByUserId(userId);
        List<SubmissionStatsResponse.HourCount> hourlyActivity = hourlyData.stream()
                .map(row -> SubmissionStatsResponse.HourCount.of(
                        ((Number) row[0]).intValue(),
                        ((Number) row[1]).longValue()
                ))
                .collect(Collectors.toList());

        // Haftalık aktivite trendi
        List<Object[]> weeklyData = submissionRepository.getWeeklyTrendByUserId(userId);
        List<SubmissionStatsResponse.WeekCount> weeklyTrend = weeklyData.stream()
                .map(row -> SubmissionStatsResponse.WeekCount.of(
                        row[0].toString(),
                        ((Number) row[1]).longValue()
                ))
                .collect(Collectors.toList());

        // Başarı oranı trendi
        List<Object[]> successTrendData = submissionRepository.getSuccessRateTrendByUserId(userId);
        List<SubmissionStatsResponse.SuccessRateTrend> successRateOverTime = successTrendData.stream()
                .map(row -> SubmissionStatsResponse.SuccessRateTrend.of(
                        row[0].toString(),
                        row[1] != null ? ((Number) row[1]).doubleValue() : 0.0
                ))
                .collect(Collectors.toList());

        // Streak hesaplama
        SubmissionStatsResponse.StreakInfo currentStreak = calculateStreak(userId);

        // İlk denemede başarılı olan problemler
        long firstTrySuccessCount = submissionRepository.countFirstTrySuccessByUserId(userId);

        // Ortalama deneme sayısı
        Double avgAttempts = submissionRepository.getAverageAttemptsPerProblemByUserId(userId);
        double averageAttemptsPerProblem = avgAttempts != null ? avgAttempts : 0.0;

        // Bu ay ve bu hafta çözülen problemler
        long thisMonthSolved = submissionRepository.countThisMonthSolvedByUserId(userId);
        long thisWeekSolved = submissionRepository.countThisWeekSolvedByUserId(userId);

        // Dil bazlı performans
        List<Object[]> langPerfData = submissionRepository.getLanguagePerformanceByUserId(userId);
        List<SubmissionStatsResponse.LanguagePerformance> languagePerformance = langPerfData.stream()
                .map(row -> SubmissionStatsResponse.LanguagePerformance.of(
                        row[0].toString(),
                        ((Number) row[1]).longValue(),
                        row[2] != null ? ((Number) row[2]).doubleValue() : 0.0
                ))
                .collect(Collectors.toList());

        // Leaderboard sıralaması - düzeltildi
        Long leaderboardRank = calculateUserRank(userId, solvedProblemsCount, successRate);

        SubmissionStatsResponse stats = new SubmissionStatsResponse(
                totalSubmissions,
                successfulSubmissions,
                solvedProblemsCount,
                successRate,
                averageCodeQualityScore,
                submissionsByDay,
                submissionsByLanguage.entrySet().stream()
                        .map(entry -> SubmissionStatsResponse.LanguageCount.of(entry.getKey(), entry.getValue()))
                        .collect(Collectors.toList()),
                submissionsByDifficulty,
                hourlyActivity,
                weeklyTrend,
                successRateOverTime,
                currentStreak,
                firstTrySuccessCount,
                averageAttemptsPerProblem,
                thisMonthSolved,
                thisWeekSolved,
                languagePerformance,
                leaderboardRank
        );

        return ApiResponse.success(stats);
    }

    private SubmissionStatsResponse.StreakInfo calculateStreak(Long userId) {
        List<Object[]> dailyActivity = submissionRepository.getDailyActivityForStreakByUserId(userId);
        
        if (dailyActivity.isEmpty()) {
            return SubmissionStatsResponse.StreakInfo.of(0, 0);
        }

        // Günleri LocalDate'e çevir ve sırala
        List<LocalDate> activeDays = dailyActivity.stream()
                .map(row -> {
                    if (row[0] instanceof java.sql.Date) {
                        return ((java.sql.Date) row[0]).toLocalDate();
                    } else {
                        return LocalDate.parse(row[0].toString());
                    }
                })
                .sorted()
                .collect(Collectors.toList());

        long currentStreak = 0;
        long longestStreak = 0;
        long tempStreak = 0;

        LocalDate today = LocalDate.now();
        LocalDate checkDate = today;

        // Mevcut streak'i hesapla
        for (int i = activeDays.size() - 1; i >= 0; i--) {
            LocalDate activeDate = activeDays.get(i);
            if (activeDate.equals(checkDate) || activeDate.equals(checkDate.minusDays(1))) {
                currentStreak++;
                checkDate = activeDate.minusDays(1);
            } else {
                break;
            }
        }

        // En uzun streak'i hesapla
        for (int i = 0; i < activeDays.size(); i++) {
            tempStreak = 1;
            for (int j = i + 1; j < activeDays.size(); j++) {
                if (activeDays.get(j).equals(activeDays.get(j-1).plusDays(1))) {
                    tempStreak++;
                } else {
                    break;
                }
            }
            longestStreak = Math.max(longestStreak, tempStreak);
        }

        return SubmissionStatsResponse.StreakInfo.of(currentStreak, longestStreak);
    }

    private Long calculateUserRank(Long userId, long solvedProblemsCount, double successRate) {
        // Gerçek sıralama hesaplama - LeaderboardService mantığını kullan
        double userScore = solvedProblemsCount * 10 + successRate;
        
        // Tüm kullanıcıların skorlarını hesapla ve bu kullanıcının sırasını bul
        List<UserEntity> allUsers = userRepository.findAll();
        
        List<Double> allScores = allUsers.stream()
                .map(user -> {
                    long userSolved = submissionRepository.countDistinctByUserIdAndPassedTrue(user.getId());
                    long userTotal = submissionRepository.countByUserId(user.getId());
                    double userSuccessRate = userTotal == 0 ? 0.0 : (submissionRepository.countByUserIdAndPassedTrue(user.getId()) * 100.0 / userTotal);
                    return userSolved * 10 + userSuccessRate;
                })
                .sorted(Collections.reverseOrder())
                .collect(Collectors.toList());
        
        // Bu kullanıcının skorunun sıralamasını bul
        long rank = 1;
        for (Double score : allScores) {
            if (score > userScore) {
                rank++;
            } else {
                break;
            }
        }
        
        return rank;
    }

}
