package com.gokhan.bitcode.dtos;

import com.gokhan.bitcode.enums.FeedbackType;
import java.io.Serializable;

public record FeedbackTask(
        Long submissionId,
        String problemDescription,
        String code,
        String errorMessage,
        FeedbackType type
) implements Serializable {}