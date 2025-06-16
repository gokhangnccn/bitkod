package com.gokhan.bitcode.controller;

import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.enums.ReportStatus;
import com.gokhan.bitcode.repository.ProblemReportRepository;
import com.gokhan.bitcode.repository.ProblemRepository;
import com.gokhan.bitcode.repository.SubmissionRepository;
import com.gokhan.bitcode.repository.UserRepository;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/stats")
@PreAuthorize("hasRole('ADMIN')")
public class AdminStatsController {

    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;
    private final ProblemReportRepository reportRepository;
    private final ProblemRepository problemRepository;
    private final CacheManager cacheManager;

    public AdminStatsController(UserRepository userRepository,
                                SubmissionRepository submissionRepository,
                                ProblemReportRepository reportRepository,
                                ProblemRepository problemRepository,
                                CacheManager cacheManager) {
        this.userRepository = userRepository;
        this.submissionRepository = submissionRepository;
        this.reportRepository = reportRepository;
        this.problemRepository = problemRepository;
        this.cacheManager = cacheManager;
    }

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<Map<String, Long>>> overview() {
        long usersTotal = userRepository.count();
        long submissionsTotal = submissionRepository.count();
        long openReports = reportRepository.countByStatus(ReportStatus.PENDING)
                          + reportRepository.countByStatus(ReportStatus.UNDER_REVIEW);

        Map<String, Long> data = Map.of(
                "usersTotal", usersTotal,
                "submissionsTotal", submissionsTotal,
                "reportsOpen", openReports
        );

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/detailed")
    public ApiResponse<Map<String, Object>> detailed(@RequestParam(defaultValue = "30d") String range) {
        Map<String, Object> data = buildDetailedStats(range);
        return ApiResponse.success(data);
    }

    @Cacheable(value = "adminDetailedStats", key = "'detailed:' + #range")
    public Map<String, Object> buildDetailedStats(String range) {
        // Zaman aralığını hesapla
        LocalDateTime startDate;
        switch (range) {
            case "7d":
                startDate = LocalDateTime.now().minusDays(7);
                break;
            case "90d":
                startDate = LocalDateTime.now().minusDays(90);
                break;
            default: // 30d
                startDate = LocalDateTime.now().minusDays(30);
        }

        // Genel istatistikler
        long usersTotal = userRepository.count();
        long submissionsTotal = submissionRepository.count();
        long openReports = reportRepository.countByStatus(ReportStatus.PENDING) 
                          + reportRepository.countByStatus(ReportStatus.UNDER_REVIEW);
        long closedReports = reportRepository.countByStatus(ReportStatus.RESOLVED) 
                           + reportRepository.countByStatus(ReportStatus.REJECTED);
        
        double averageSubmissionPerUser = usersTotal > 0 ? (double) submissionsTotal / usersTotal : 0;
        
        // Ortalama rapor çözüm süresi (saat cinsinden)
        List<String> statuses = Arrays.asList("RESOLVED", "REJECTED");
        double averageReportResolutionTime = reportRepository.calculateAverageResolutionTime(statuses);


        Map<String, Object> overview = new HashMap<>();
        overview.put("usersTotal", usersTotal);
        overview.put("submissionsTotal", submissionsTotal);
        overview.put("reportsOpen", openReports);
        overview.put("reportsClosed", closedReports);
        overview.put("averageSubmissionPerUser", averageSubmissionPerUser);
        overview.put("averageReportResolutionTime", averageReportResolutionTime);

        // Günlük istatistikler
        List<Map<String, Object>> dailyStats = new ArrayList<>();
        LocalDate currentDate = startDate.toLocalDate();
        while (!currentDate.isAfter(LocalDate.now())) {
            LocalDateTime dayStart = currentDate.atStartOfDay();
            LocalDateTime dayEnd = currentDate.plusDays(1).atStartOfDay();

            long newUsers = userRepository.countByCreatedAtBetween(dayStart, dayEnd);
            long newSubmissions = submissionRepository.countBySubmittedAtBetween(dayStart, dayEnd);
            long newReports = reportRepository.countByReportedAtBetween(dayStart, dayEnd);

            Map<String, Object> dayStats = new HashMap<>();
            dayStats.put("date", currentDate.toString());
            dayStats.put("newUsers", newUsers);
            dayStats.put("newSubmissions", newSubmissions);
            dayStats.put("newReports", newReports);
            dailyStats.add(dayStats);

            currentDate = currentDate.plusDays(1);
        }

        // Kullanıcı rolleri dağılımı (DB'de gruplanmış)
        List<Object[]> roleRows = userRepository.countByRole();
        List<Map<String, Object>> userRoles = roleRows.stream()
            .map(row -> {
                Map<String, Object> m = new HashMap<>();
                m.put("role", row[0]);
                m.put("count", row[1]);
                return m;
            }).collect(Collectors.toList());

        // Gönderim durumları (DB'de gruplanmış)
        List<Object[]> statusRows = submissionRepository.countBySubmissionStatus();
        List<Map<String, Object>> submissionStatus = statusRows.stream().map(row -> {
            Map<String, Object> m = new HashMap<>();
            m.put("status", row[0]);
            m.put("count", row[1]);
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> data = new HashMap<>();
        data.put("overview", overview);
        data.put("dailyStats", dailyStats);
        data.put("userRoles", userRoles);
        data.put("submissionStatus", submissionStatus);

        return data;
    }

    @GetMapping("/llm-usage")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getLLMUsageStats() {
        List<Object[]> results = submissionRepository.countByLLMToolUsage();
        List<Map<String, Object>> data = results.stream().map(row -> {
            Map<String, Object> map = new HashMap<>();
            map.put("tool", row[0]);
            map.put("count", row[1]);
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/problem-stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProblemStats() {
        // En çok çözülen problemler
        List<Object[]> mostSolvedProblemsRaw = problemRepository.findMostSolvedProblems();
        List<Map<String, Object>> mostSolvedProblems = mostSolvedProblemsRaw.stream()
            .map(row -> {
                Map<String, Object> map = new HashMap<>();
                map.put("problemId", row[0]);
                map.put("title", row[1]);
                map.put("solveCount", row[2]);
                return map;
            })
            .collect(Collectors.toList());
        
        // En zor problemler
        List<Object[]> hardestProblemsRaw = problemRepository.findHardestProblems();
        List<Map<String, Object>> hardestProblems = hardestProblemsRaw.stream()
            .map(row -> {
                Map<String, Object> map = new HashMap<>();
                map.put("problemId", row[0]);
                map.put("title", row[1]);
                map.put("successRate", row[2]);
                return map;
            })
            .collect(Collectors.toList());

        Map<String, Object> data = new HashMap<>();
        data.put("mostSolvedProblems", mostSolvedProblems);
        data.put("hardestProblems", hardestProblems);

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/user-performance")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserPerformance() {
        // En aktif kullanıcılar
        List<Object[]> mostActiveUsersRaw = userRepository.findMostActiveUsers();
        List<Map<String, Object>> mostActiveUsers = mostActiveUsersRaw.stream()
            .map(row -> {
                Map<String, Object> map = new HashMap<>();
                map.put("userId", row[0]);
                map.put("username", row[1]);
                map.put("submissionCount", row[2]);
                return map;
            })
            .collect(Collectors.toList());
        
        // En yüksek başarı oranına sahip kullanıcılar
        List<Object[]> mostSuccessfulUsersRaw = userRepository.findMostSuccessfulUsers();
        List<Map<String, Object>> mostSuccessfulUsers = mostSuccessfulUsersRaw.stream()
            .map(row -> {
                Map<String, Object> map = new HashMap<>();
                map.put("userId", row[0]);
                map.put("username", row[1]);
                map.put("successRate", row[2]);
                return map;
            })
            .collect(Collectors.toList());
        
        // Ortalama kod kalitesi puanı
        Double averageCodeQuality = submissionRepository.calculateAverageCodeQuality();

        Map<String, Object> data = new HashMap<>();
        data.put("mostActiveUsers", mostActiveUsers);
        data.put("mostSuccessfulUsers", mostSuccessfulUsers);
        data.put("averageCodeQuality", averageCodeQuality);

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/time-analysis")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTimeAnalysis() {
        // Saatlik aktivite dağılımı
        List<Object[]> hourlyActivityRaw = submissionRepository.getHourlyActivityDistribution();
        List<Map<String, Object>> hourlyActivity = hourlyActivityRaw.stream()
            .map(row -> {
                Map<String, Object> map = new HashMap<>();
                map.put("hour", row[0]);
                map.put("count", row[1]);
                return map;
            })
            .collect(Collectors.toList());
        
        // Haftalık aktivite trendi
        List<Object[]> weeklyTrendRaw = submissionRepository.getWeeklyActivityTrend();
        List<Map<String, Object>> weeklyTrend = weeklyTrendRaw.stream()
            .map(row -> {
                Map<String, Object> map = new HashMap<>();
                map.put("week", row[0]);
                map.put("count", row[1]);
                return map;
            })
            .collect(Collectors.toList());
        
        // Mevsimsel kullanım analizi
        List<Object[]> seasonalAnalysisRaw = submissionRepository.getSeasonalActivityAnalysis();
        List<Map<String, Object>> seasonalAnalysis = seasonalAnalysisRaw.stream()
            .map(row -> {
                Map<String, Object> map = new HashMap<>();
                map.put("season", row[0]);
                map.put("count", row[1]);
                return map;
            })
            .collect(Collectors.toList());

        Map<String, Object> data = new HashMap<>();
        data.put("hourlyActivity", hourlyActivity);
        data.put("weeklyTrend", weeklyTrend);
        data.put("seasonalAnalysis", seasonalAnalysis);

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/llm-detailed")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDetailedLLMStats() {
        // LLM kullanımının zaman içindeki değişimi
        List<Object[]> llmUsageOverTimeRaw = submissionRepository.getLLMUsageOverTime();
        List<Map<String, Object>> llmUsageOverTime = llmUsageOverTimeRaw.stream()
            .map(row -> {
                Map<String, Object> map = new HashMap<>();
                map.put("date", row[0]);
                map.put("count", row[1]);
                return map;
            })
            .collect(Collectors.toList());
        
        // LLM özelliklerinin kullanım oranları
        List<Object[]> llmFeatureUsageRaw = submissionRepository.countByLLMToolUsage();
        List<Map<String, Object>> llmFeatureUsage = llmFeatureUsageRaw.stream()
            .map(row -> {
                Map<String, Object> map = new HashMap<>();
                map.put("feature", row[0]);
                map.put("count", row[1]);
                return map;
            })
            .collect(Collectors.toList());

        Map<String, Object> data = new HashMap<>();
        data.put("llmUsageOverTime", llmUsageOverTime);
        data.put("llmFeatureUsage", llmFeatureUsage);

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/language-stats")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getLanguageStats() {
        List<Object[]> raw = submissionRepository.countByLanguage();
        List<Map<String, Object>> data = raw.stream().map(row -> {
            Map<String, Object> map = new HashMap<>();
            map.put("language", row[0]);
            map.put("count", row[1]);
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/difficulty-stats")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDifficultyStats() {
        List<Object[]> raw = submissionRepository.countByProblemDifficulty();
        List<Map<String, Object>> data = raw.stream().map(row -> {
            Map<String, Object> map = new HashMap<>();
            map.put("difficulty", row[0]);
            map.put("count", row[1]);
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/success-rate-trend")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSuccessRateTrend() {
        List<Object[]> raw = submissionRepository.getDailySuccessRateTrend();
        List<Map<String, Object>> data = raw.stream().map(row -> {
            Map<String, Object> m = new HashMap<>();
            m.put("date", row[0]);
            m.put("successRate", row[1]);
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/clear-cache")
    public ResponseEntity<ApiResponse<String>> clearCache() {
        try {
            // Tüm cache'leri temizle
            cacheManager.getCacheNames().forEach(cacheName -> {
                var cache = cacheManager.getCache(cacheName);
                if (cache != null) {
                    cache.clear();
                }
            });
            return ResponseEntity.ok(ApiResponse.success("Tüm cache'ler temizlendi"));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.serverError());
        }
    }
} 