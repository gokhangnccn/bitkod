package com.gokhan.bitcode.dtos;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestCaseDTO {
    private Long id;
    private Long problemId;
    private String input;
    private String expectedOutput;
    private boolean isHidden;
}

