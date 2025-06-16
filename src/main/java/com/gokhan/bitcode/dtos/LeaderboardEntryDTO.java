package com.gokhan.bitcode.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.io.Serializable;

@Data
@AllArgsConstructor
public class LeaderboardEntryDTO implements Serializable {
    private Long userId;
    private String username;
    private int solvedProblemsCount;
    private double successRate;
    private int totalSubmissions;
    private double score;
}
