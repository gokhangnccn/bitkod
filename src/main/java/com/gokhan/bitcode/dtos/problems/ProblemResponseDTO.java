package com.gokhan.bitcode.dtos.problems;

import com.gokhan.bitcode.enums.Difficulty;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ProblemResponseDTO {
    private Long id;
    private String uid;
    private String title;
    private String description;
    private Difficulty difficulty;
    private String exampleInput;
    private String exampleOutput;
    private List<TestCaseDTO> testCases;

    @Data
    @Builder
    public static class TestCaseDTO {
        private Long id;
        private String input;
        private String expectedOutput;
    }
} 