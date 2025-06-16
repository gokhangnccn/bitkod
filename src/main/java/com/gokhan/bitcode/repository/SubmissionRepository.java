package com.gokhan.bitcode.repository;


import com.gokhan.bitcode.entity.SubmissionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<SubmissionEntity, Long> {

    // Belirli bir kullanıcıya ait tüm gönderimler
    List<SubmissionEntity> findByUserId(Long userId);

    // Belirli bir kullanıcı ve probleme ait gönderimler
    List<SubmissionEntity> findByUserIdAndProblemId(Long userId, Long problemId);

    // Belirli bir problemi başarıyla çözen kullanıcıların listesi
    List<SubmissionEntity> findByProblemIdAndPassedTrue(Long problemId);

    // Kullanıcının çözmüş olduğu farklı soru sayısı
    long countDistinctByUserIdAndPassedTrue(Long userId);

    // Kullanıcının toplam gönderi sayısı
    long countByUserId(Long userId);

    // Kullanıcının başarılı gönderi sayısı
    long countByUserIdAndPassedTrue(Long userId);

    @Query("SELECT DISTINCT s.problemId FROM SubmissionEntity s WHERE s.userId = :userId AND s.passed = true")
    List<Long> findSolvedProblemIdsByUserId(@Param("userId") Long userId);

    boolean existsByUserIdAndProblemIdAndPassedTrue(Long userId, Long problemId);

    long countBySubmittedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query(value = "SELECT 'CODE_QUALITY_REASON' AS tool, COUNT(*) FROM submission WHERE code_quality_reason IS NOT NULL " +
            "UNION ALL SELECT 'REFACTORED_CODE', COUNT(*) FROM submission WHERE refactored_code IS NOT NULL " +
            "UNION ALL SELECT 'CODE_QUALITY_SCORE', COUNT(*) FROM submission WHERE code_quality_score IS NOT NULL " +
            "UNION ALL SELECT 'LLM_FEEDBACK', COUNT(*) FROM submission WHERE llm_feedback IS NOT NULL", nativeQuery = true)
    List<Object[]> countByLLMToolUsage();

    @Query("SELECT AVG(s.codeQualityScore) FROM SubmissionEntity s WHERE s.codeQualityScore IS NOT NULL")
    Double calculateAverageCodeQuality();

    @Query(value = "SELECT EXTRACT(HOUR FROM submitted_at) as hour, COUNT(*) as count FROM submission GROUP BY EXTRACT(HOUR FROM submitted_at) ORDER BY hour", nativeQuery = true)
    List<Object[]> getHourlyActivityDistribution();

    @Query(value = "SELECT DATE_TRUNC('week', submitted_at) as week, COUNT(*) as count FROM submission GROUP BY DATE_TRUNC('week', submitted_at) ORDER BY week", nativeQuery = true)
    List<Object[]> getWeeklyActivityTrend();

    @Query(value = "SELECT CASE " +
            "WHEN EXTRACT(MONTH FROM submitted_at) BETWEEN 3 AND 5 THEN 'İlkbahar' " +
            "WHEN EXTRACT(MONTH FROM submitted_at) BETWEEN 6 AND 8 THEN 'Yaz' " +
            "WHEN EXTRACT(MONTH FROM submitted_at) BETWEEN 9 AND 11 THEN 'Sonbahar' " +
            "ELSE 'Kış' END as season, " +
            "COUNT(*) as count FROM submission GROUP BY season", nativeQuery = true)
    List<Object[]> getSeasonalActivityAnalysis();

    @Query(value = "SELECT DATE(submitted_at) as date, COUNT(*) as count FROM submission " +
            "WHERE code_quality_reason IS NOT NULL OR refactored_code IS NOT NULL OR llm_feedback IS NOT NULL " +
            "GROUP BY DATE(submitted_at) ORDER BY date", nativeQuery = true)
    List<Object[]> getLLMUsageOverTime();

    // Programlama dillerine göre gönderim sayıları
    @Query(value = "SELECT s.language as language, COUNT(*) as count FROM submission s GROUP BY s.language", nativeQuery = true)
    List<Object[]> countByLanguage();

    // Problem zorluk seviyesine göre gönderim sayıları
    @Query(value = "SELECT p.difficulty as difficulty, COUNT(*) as count FROM submission s JOIN problems p ON s.problem_id = p.id GROUP BY p.difficulty", nativeQuery = true)
    List<Object[]> countByProblemDifficulty();

    // Başarı oranı trendi (günlük). Başarı oranı = başarılı / toplam.
    @Query(value = "SELECT DATE(submitted_at) as date, (SUM(CASE WHEN passed = true THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 as success_rate FROM submission GROUP BY DATE(submitted_at) ORDER BY date", nativeQuery = true)
    List<Object[]> getDailySuccessRateTrend();

    @Query(value = "SELECT CASE WHEN passed = true THEN 'BAŞARILI' ELSE 'BAŞARISIZ' END as status, COUNT(*) as cnt FROM submission GROUP BY status", nativeQuery = true)
    List<Object[]> countBySubmissionStatus();

    // Kullanıcının saatlik aktivite dağılımı
    @Query(value = "SELECT EXTRACT(HOUR FROM submitted_at) as hour, COUNT(*) as count FROM submission WHERE user_id = :userId GROUP BY EXTRACT(HOUR FROM submitted_at) ORDER BY hour", nativeQuery = true)
    List<Object[]> getHourlyActivityByUserId(@Param("userId") Long userId);

    // Kullanıcının haftalık aktivite trendi
    @Query(value = "SELECT DATE_TRUNC('week', submitted_at) as week, COUNT(*) as count FROM submission WHERE user_id = :userId GROUP BY DATE_TRUNC('week', submitted_at) ORDER BY week DESC LIMIT 12", nativeQuery = true)
    List<Object[]> getWeeklyTrendByUserId(@Param("userId") Long userId);

    // Kullanıcının başarı oranı trendi (son 30 gün)
    @Query(value = "SELECT DATE(submitted_at) as date, " +
            "(SUM(CASE WHEN passed = true THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 as success_rate " +
            "FROM submission WHERE user_id = :userId AND submitted_at >= CURRENT_DATE - INTERVAL '30 days' " +
            "GROUP BY DATE(submitted_at) ORDER BY date", nativeQuery = true)
    List<Object[]> getSuccessRateTrendByUserId(@Param("userId") Long userId);

    // İlk denemede başarılı olan problemleri say
    @Query(value = "SELECT COUNT(DISTINCT problem_id) FROM submission s1 WHERE s1.user_id = :userId AND s1.passed = true " +
            "AND NOT EXISTS (SELECT 1 FROM submission s2 WHERE s2.user_id = :userId AND s2.problem_id = s1.problem_id " +
            "AND s2.submitted_at < s1.submitted_at)", nativeQuery = true)
    long countFirstTrySuccessByUserId(@Param("userId") Long userId);

    // Kullanıcının her probleme ortalama kaç deneme yaptığı
    @Query(value = "SELECT AVG(attempt_count) FROM (" +
            "SELECT problem_id, COUNT(*) as attempt_count FROM submission WHERE user_id = :userId " +
            "GROUP BY problem_id) sub", nativeQuery = true)
    Double getAverageAttemptsPerProblemByUserId(@Param("userId") Long userId);

    // Bu ay çözülen problem sayısı
    @Query(value = "SELECT COUNT(DISTINCT problem_id) FROM submission WHERE user_id = :userId AND passed = true " +
            "AND EXTRACT(YEAR FROM submitted_at) = EXTRACT(YEAR FROM CURRENT_DATE) " +
            "AND EXTRACT(MONTH FROM submitted_at) = EXTRACT(MONTH FROM CURRENT_DATE)", nativeQuery = true)
    long countThisMonthSolvedByUserId(@Param("userId") Long userId);

    // Bu hafta çözülen problem sayısı
    @Query(value = "SELECT COUNT(DISTINCT problem_id) FROM submission WHERE user_id = :userId AND passed = true " +
            "AND submitted_at >= DATE_TRUNC('week', CURRENT_DATE)", nativeQuery = true)
    long countThisWeekSolvedByUserId(@Param("userId") Long userId);

    // Dil bazlı performans istatistikleri
    @Query(value = "SELECT s.language, " +
            "COUNT(DISTINCT CASE WHEN s.passed = true THEN s.problem_id END) as solved, " +
            "(SUM(CASE WHEN s.passed = true THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 as success_rate " +
            "FROM submission s WHERE s.user_id = :userId GROUP BY s.language HAVING COUNT(*) >= 3", nativeQuery = true)
    List<Object[]> getLanguagePerformanceByUserId(@Param("userId") Long userId);

    // Kullanıcının günlük aktivitesini son 60 gün için al (streak hesaplama için)
    @Query(value = "SELECT DATE(submitted_at) as date FROM submission WHERE user_id = :userId " +
            "AND submitted_at >= CURRENT_DATE - INTERVAL '60 days' " +
            "GROUP BY DATE(submitted_at) ORDER BY date DESC", nativeQuery = true)
    List<Object[]> getDailyActivityForStreakByUserId(@Param("userId") Long userId);
}