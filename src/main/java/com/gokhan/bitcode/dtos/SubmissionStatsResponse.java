package com.gokhan.bitcode.dtos;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SubmissionStatsResponse {
    private long totalSubmissions;
    private long successfulSubmissions;
    private long solvedProblemsCount;
    private double successRate;
    private double averageCodeQualityScore;
    private List<DayCount> submissionsByDay;
    private List<LanguageCount> submissionsByLanguage;
    private List<DifficultyCount> submissionsByDifficulty;

    @Data
    public static class DayCount {
        private final String date;
        private final long count;

        public static DayCount of(String date, long count) {
            return new DayCount(date, count);
        }
    }

    @Data
    public static class LanguageCount {
        private final String language;
        private final long count;

        public static LanguageCount of(String language, long count) {
            return new LanguageCount(language, count);
        }
    }

    @Data
    public static class DifficultyCount {
        private final String difficulty;
        private final long count;

        public static DifficultyCount of(String difficulty, long count) {
            return new DifficultyCount(difficulty, count);
        }
    }
} 