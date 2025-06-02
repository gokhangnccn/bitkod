package com.gokhan.bitcode.dtos.problems;

import com.gokhan.bitcode.enums.Difficulty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ProblemRequestDTO {
    @NotBlank
    private String title;

    @NotBlank
    private String description;

    @NotNull
    private Difficulty difficulty;

    private String exampleInput;
    private String exampleOutput;

    private List<TestCaseDTO> testCases;

    @Data
    public static class TestCaseDTO {
        @NotBlank
        private String input;
        @NotBlank
        private String expectedOutput;
    }
} 