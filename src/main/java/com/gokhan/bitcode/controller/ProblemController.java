package com.gokhan.bitcode.controller;

import com.gokhan.bitcode.dtos.ProblemReportResponse;
import com.gokhan.bitcode.dtos.ReportProblemRequest;
import com.gokhan.bitcode.entity.ProblemEntity;
import com.gokhan.bitcode.enums.ReportStatus;
import com.gokhan.bitcode.service.ProblemService;
import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.utils.UserClaims;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/problems")
@RequiredArgsConstructor
public class ProblemController {

    private final ProblemService problemService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProblemEntity>>> getAllProblems() {
        return ResponseEntity.ok(problemService.getAllProblems());
    }

    @GetMapping("{uid}")
    public ResponseEntity<ApiResponse<ProblemEntity>> getProblemByUid(@PathVariable String uid) {
        return ResponseEntity.ok(problemService.getProblemByUid(uid));
    }

    @PostMapping("/createproblem")
    public ResponseEntity<ApiResponse<ProblemEntity>> createProblem(@RequestBody ProblemEntity problemEntity,
                                                                    Authentication authentication) {
        var userClaims = (UserClaims) authentication.getPrincipal();
        return ResponseEntity.ok(problemService.createProblem(problemEntity, userClaims));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProblemEntity>> updateProblem(@PathVariable Long id,
                                                                    @RequestBody ProblemEntity updatedProblem,
                                                                    Authentication authentication) {
        var userClaims = (UserClaims) authentication.getPrincipal();
        return ResponseEntity.ok(problemService.updateProblem(id, updatedProblem, userClaims));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProblem(@PathVariable Long id,
                                                           Authentication authentication) {
        var userClaims = (UserClaims) authentication.getPrincipal();
        return ResponseEntity.ok(problemService.deleteProblem(id, userClaims));
    }

    @PostMapping("/report")
    public ResponseEntity<ApiResponse<ProblemReportResponse>> reportProblem(
            @Valid @RequestBody ReportProblemRequest request,
            Authentication authentication) {
        var userClaims = (UserClaims) authentication.getPrincipal();
        return ResponseEntity.ok(problemService.reportProblem(request, userClaims));
    }

    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<List<ProblemReportResponse>>> getProblemReports(
            Authentication authentication) {
        var userClaims = (UserClaims) authentication.getPrincipal();
        return ResponseEntity.ok(problemService.getProblemReports(userClaims));
    }

    @GetMapping("/reports/user")
    public ResponseEntity<ApiResponse<List<ProblemReportResponse>>> getUserProblemReports(
            Authentication authentication) {
        var userClaims = (UserClaims) authentication.getPrincipal();
        return ResponseEntity.ok(problemService.getUserProblemReports(userClaims));
    }

    @PutMapping("/reports/{reportId}/status")
    public ResponseEntity<ApiResponse<ProblemReportResponse>> updateReportStatus(
            @PathVariable Long reportId,
            @RequestParam ReportStatus status,
            @RequestParam(required = false) String adminResponse,
            Authentication authentication) {
        var userClaims = (UserClaims) authentication.getPrincipal();
        return ResponseEntity.ok(problemService.updateReportStatus(reportId, status, adminResponse, userClaims));
    }
}