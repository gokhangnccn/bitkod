package com.gokhan.bitcode.dtos;

import java.time.LocalDateTime;

public record UserProfileDTO(
        Long userId,
        String username,
        String email,
        LocalDateTime createdAt
) implements java.io.Serializable {
    private static final long serialVersionUID = 1L;
}
