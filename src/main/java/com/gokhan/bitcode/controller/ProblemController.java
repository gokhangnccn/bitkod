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
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/problems")
@RequiredArgsConstructor
public class ProblemController {

    private final ProblemService problemService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProblemEntity>>> getAllProblems(
            @AuthenticationPrincipal UserClaims userClaims) {

        long start = System.currentTimeMillis();
        try {
            List<ProblemEntity> problems = problemService.getAllProblems();
            long duration = System.currentTimeMillis() - start;

            if (problems == null || problems.isEmpty()) {
                log.warn("[GET /api/problems] Problem listesi boş - userId: {}, duration: {} ms",
                        userClaims.getUserId(), duration);
                return ResponseEntity.ok(ApiResponse.success(List.of()));
            }

            log.info("[GET /api/problems] {} problem başarıyla alındı - userId: {}, duration: {} ms",
                    problems.size(), userClaims.getUserId(), duration);
            return ResponseEntity.ok(ApiResponse.success(problems));

        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("[GET /api/problems] Beklenmeyen hata - userId: {}, duration: {} ms, hata: {}",
                    userClaims.getUserId(), duration, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.serverError());
        }
    }

    @GetMapping("{uid}")
    public ResponseEntity<ApiResponse<ProblemEntity>> getProblemByUid(
            @PathVariable String uid,
            @AuthenticationPrincipal UserClaims userClaims) {

        long start = System.currentTimeMillis();
        try {
            ProblemEntity problem = problemService.getProblemByUid(uid);
            long duration = System.currentTimeMillis() - start;

            if (problem == null) {
                log.warn("[GET /api/problems/{}] Problem bulunamadı - userId: {}, duration: {} ms",
                        uid, userClaims.getUserId(), duration);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.problemNotFound());
            }

            log.info("[GET /api/problems/{}] Başarıyla alındı - userId: {}, duration: {} ms",
                    uid, userClaims.getUserId(), duration);
            return ResponseEntity.ok(ApiResponse.success(problem));

        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("[GET /api/problems/{}] Beklenmeyen hata - userId: {}, duration: {} ms, hata: {}",
                    uid, userClaims.getUserId(), duration, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.serverError());
        }
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
        return ResponseEntity.ok(problemService.updateProblemWithEvict(id, updatedProblem, userClaims));

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