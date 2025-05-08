package com.gokhan.bitcode.entity;

import com.gokhan.bitcode.enums.ReportCategory;
import com.gokhan.bitcode.enums.ReportStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "problem_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProblemReportEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 36)
    private String problemUid;

    @Column(nullable = false)
    private String reportedBy;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String feedback;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status;

    @Column(columnDefinition = "TEXT")
    private String adminResponse;

    private String resolvedBy;

    private LocalDateTime reportedAt;

    private LocalDateTime resolvedAt;

    @PrePersist
    public void prePersist() {
        if (reportedAt == null) {
            reportedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = ReportStatus.PENDING;
        }
    }
}

