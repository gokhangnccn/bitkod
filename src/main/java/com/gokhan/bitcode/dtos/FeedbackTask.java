package com.gokhan.bitcode.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.gokhan.bitcode.enums.FeedbackType;
import java.io.Serializable;

public record FeedbackTask(
        @JsonProperty("submissionId") Long submissionId,
        @JsonProperty("problemDescription") String problemDescription,
        @JsonProperty("code") String code,
        @JsonProperty("errorMessage") String errorMessage,
        @JsonProperty("type") FeedbackType type
) implements Serializable {}