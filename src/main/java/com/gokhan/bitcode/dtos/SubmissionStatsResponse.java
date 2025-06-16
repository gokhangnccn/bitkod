package com.gokhan.bitcode.dtos;

import java.util.List;

public record SubmissionStatsResponse(
        long totalSubmissions,
        long successfulSubmissions,
        long solvedProblemsCount,
        double successRate,
        double averageCodeQualityScore,
        List<DayCount> submissionsByDay,
        List<LanguageCount> submissionsByLanguage,
        List<DifficultyCount> submissionsByDifficulty,
        List<HourCount> hourlyActivity,
        List<WeekCount> weeklyTrend,
        List<SuccessRateTrend> successRateOverTime,
        StreakInfo currentStreak,
        long firstTrySuccessCount,
        double averageAttemptsPerProblem,
        long thisMonthSolved,
        long thisWeekSolved,
        List<LanguagePerformance> languagePerformance,
        Long leaderboardRank
) {

    public record DayCount(String date, long count) {
        public static DayCount of(String date, long count) {
            return new DayCount(date, count);
        }
    }

    public record LanguageCount(String language, long count) {
        public static LanguageCount of(String language, long count) {
            return new LanguageCount(language, count);
        }
    }

    public record DifficultyCount(String difficulty, long count) {
        public static DifficultyCount of(String difficulty, long count) {
            return new DifficultyCount(difficulty, count);
        }
    }

    public record HourCount(int hour, long count) {
        public static HourCount of(int hour, long count) {
            return new HourCount(hour, count);
        }
    }

    public record WeekCount(String week, long count) {
        public static WeekCount of(String week, long count) {
            return new WeekCount(week, count);
        }
    }

    public record SuccessRateTrend(String date, double successRate) {
        public static SuccessRateTrend of(String date, double successRate) {
            return new SuccessRateTrend(date, successRate);
        }
    }

    public record StreakInfo(long currentStreak, long longestStreak) {
        public static StreakInfo of(long currentStreak, long longestStreak) {
            return new StreakInfo(currentStreak, longestStreak);
        }
    }

    public record LanguagePerformance(String language, long solved, double successRate) {
        public static LanguagePerformance of(String language, long solved, double successRate) {
            return new LanguagePerformance(language, solved, successRate);
        }
    }
} 