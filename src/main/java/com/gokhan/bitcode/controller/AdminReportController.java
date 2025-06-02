package com.gokhan.bitcode.controller;

import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.entity.ProblemReportEntity;
import com.gokhan.bitcode.enums.ReportStatus;
import com.gokhan.bitcode.repository.ProblemReportRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {

    private final ProblemReportRepository reportRepository;

    public AdminReportController(ProblemReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProblemReportEntity>>> listReports() {
        List<ProblemReportEntity> reports = reportRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success(reports));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProblemReportEntity>> getReport(@PathVariable Long id) {
        return reportRepository.findById(id)
                .map(r -> ResponseEntity.ok(ApiResponse.success(r)))
                .orElse(ResponseEntity.status(404).body(ApiResponse.notFound("BIT-404", "Rapor bulunamadı")));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<String>> updateStatus(@PathVariable Long id,
                                                            @RequestBody UpdateStatusDTO dto,
                                                            Authentication authentication) {
        var userClaims = authentication != null ? (com.gokhan.bitcode.utils.UserClaims) authentication.getPrincipal() : null;
        String adminId = userClaims != null ? userClaims.getUserId() : null;
        return reportRepository.findById(id).map(r -> {
            r.setStatus(dto.status());
            r.setAdminResponse(dto.adminResponse());
            if (dto.status() == ReportStatus.RESOLVED || dto.status() == ReportStatus.REJECTED) {
                r.setResolvedAt(LocalDateTime.now());
                r.setResolvedBy(adminId);
            }
            reportRepository.save(r);
            return ResponseEntity.ok(ApiResponse.success("Güncellendi"));
        }).orElse(ResponseEntity.status(404).body(ApiResponse.notFound("BIT-404", "Rapor bulunamadı")));
    }

    public record UpdateStatusDTO(ReportStatus status, String adminResponse) {}
} 