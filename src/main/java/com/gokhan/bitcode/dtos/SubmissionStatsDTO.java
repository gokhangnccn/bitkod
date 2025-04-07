package com.gokhan.bitcode.dtos;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class SubmissionStatsDTO {
    private long totalSubmissions;
    private long successfulSubmissions;
    private long solvedProblemsCount;
    private double successRate; // yüzdelik oran
}
