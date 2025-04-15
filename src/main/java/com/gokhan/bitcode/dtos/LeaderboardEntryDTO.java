package com.gokhan.bitcode.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LeaderboardEntryDTO {
    private Long userId;
    private String username;
    private int solvedProblemsCount;
    private double successRate;
    private int totalSubmissions;
}
