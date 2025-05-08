package com.gokhan.bitcode.dtos;

import com.gokhan.bitcode.enums.ReportCategory;
import com.gokhan.bitcode.enums.ReportStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ProblemReportResponse {
    private Long id;
    private String problemUid;
    private String reportedBy;
    private String feedback;
    private ReportCategory category;
    private ReportStatus status;
    private String adminResponse;
    private String resolvedBy;
    private LocalDateTime reportedAt;
    private LocalDateTime resolvedAt;
} 