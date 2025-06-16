package com.gokhan.bitcode.controller;

import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.dtos.SubmissionStatsResponse;
import com.gokhan.bitcode.entity.SubmissionEntity;
import com.gokhan.bitcode.service.SubmissionService;
import com.gokhan.bitcode.utils.UserClaims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;

    @PostMapping
    public ResponseEntity<ApiResponse<SubmissionEntity>> createSubmission(@RequestBody SubmissionEntity submission,
                                                                          Authentication authentication) {
        long start = System.currentTimeMillis();
        UserClaims userClaims = (UserClaims) authentication.getPrincipal();
        try {
            ApiResponse<SubmissionEntity> response = submissionService.createSubmission(submission, userClaims);
            long duration = System.currentTimeMillis() - start;
            log.info("[POST /api/submissions] userId: {}, problemId: {}, passed: {}, duration: {} ms",
                    userClaims.getUserId(), submission.getProblemId(), response.getData() != null ? response.getData().getPassed() : null, duration);
            return ResponseEntity.status(response.getResultCode()).body(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("[POST /api/submissions] Hata userId: {}, duration: {} ms, hata: {}", userClaims.getUserId(), duration, e.getMessage(), e);
            return ResponseEntity.status(500).body(ApiResponse.serverError());
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<SubmissionEntity>>> getSubmissionsByUserId(@PathVariable Long userId,
                                                                                      Authentication authentication) {
        long start = System.currentTimeMillis();
        UserClaims userClaims = (UserClaims) authentication.getPrincipal();
        try {
            ApiResponse<List<SubmissionEntity>> response = submissionService.getSubmissionsByUserId(userId, userClaims);
            long duration = System.currentTimeMillis() - start;
            log.info("[GET /api/submissions/user/{}] requester: {}, duration: {} ms", userId, userClaims.getUserId(), duration);
            return ResponseEntity.status(response.getResultCode()).body(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("[GET /api/submissions/user/{}] Hata requester: {}, duration: {} ms, hata: {}", userId, userClaims.getUserId(), duration, e.getMessage(), e);
            return ResponseEntity.status(500).body(ApiResponse.serverError());
        }
    }

    @GetMapping("/user/{userId}/problem/{problemId}")
    public ResponseEntity<ApiResponse<List<SubmissionEntity>>> getByUserAndProblem(
            @PathVariable Long userId,
            @PathVariable Long problemId,
            Authentication authentication) {

        long start = System.currentTimeMillis();
        UserClaims userClaims = (UserClaims) authentication.getPrincipal();
        try {
            ApiResponse<List<SubmissionEntity>> response = submissionService.getSubmissionsByUserIdAndProblemId(userId, problemId, userClaims);
            long duration = System.currentTimeMillis() - start;
            log.info("[GET /api/submissions/user/{}/problem/{}] requester: {}, duration: {} ms", userId, problemId, userClaims.getUserId(), duration);
            return ResponseEntity.status(response.getResultCode()).body(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("[GET /api/submissions/user/{}/problem/{}] Hata requester: {}, duration: {} ms, hata: {}", userId, problemId, userClaims.getUserId(), duration, e.getMessage(), e);
            return ResponseEntity.status(500).body(ApiResponse.serverError());
        }
    }

    @GetMapping("/user/{userId}/stats")
    public ResponseEntity<ApiResponse<SubmissionStatsResponse>> getUserStats(@PathVariable Long userId,
                                                                        Authentication authentication) {
        long start = System.currentTimeMillis();
        UserClaims userClaims = (UserClaims) authentication.getPrincipal();
        try {
            ApiResponse<SubmissionStatsResponse> response = submissionService.getUserSubmissionStats(userId);
            long duration = System.currentTimeMillis() - start;
            log.info("[GET /api/submissions/user/{}/stats] requester: {}, duration: {} ms", userId, userClaims.getUserId(), duration);
            return ResponseEntity.status(response.getResultCode()).body(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("[GET /api/submissions/user/{}/stats] Hata requester: {}, duration: {} ms, hata: {}", userId, userClaims.getUserId(), duration, e.getMessage(), e);
            return ResponseEntity.status(500).body(ApiResponse.serverError());
        }
    }

    @GetMapping("/problem/{problemId}/successful")
    public ResponseEntity<ApiResponse<List<SubmissionEntity>>> getSuccessfulSubmissions(@PathVariable Long problemId) {
        long start = System.currentTimeMillis();
        try {
            ApiResponse<List<SubmissionEntity>> response = submissionService.getSuccessfulSubmissionsByProblemId(problemId);
            long duration = System.currentTimeMillis() - start;
            log.info("[GET /api/submissions/problem/{}/successful] duration: {} ms", problemId, duration);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("[GET /api/submissions/problem/{}/successful] Hata duration: {} ms, hata: {}", problemId, duration, e.getMessage(), e);
            return ResponseEntity.status(500).body(ApiResponse.serverError());
        }
    }

    @GetMapping("/user/{userId}/solved")
    public ResponseEntity<ApiResponse<List<Long>>> getSolvedProblems(
            @PathVariable Long userId,
            Authentication authentication) {

        long start = System.currentTimeMillis();
        UserClaims userClaims = (UserClaims) authentication.getPrincipal();
        try {
            ApiResponse<List<Long>> response = submissionService.getSolvedProblemsByUser(userId, userClaims);
            long duration = System.currentTimeMillis() - start;
            log.info("[GET /api/submissions/user/{}/solved] requester: {}, duration: {} ms", userId, userClaims.getUserId(), duration);
            return ResponseEntity.status(response.getResultCode()).body(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("[GET /api/submissions/user/{}/solved] Hata requester: {}, duration: {} ms, hata: {}", userId, userClaims.getUserId(), duration, e.getMessage(), e);
            return ResponseEntity.status(500).body(ApiResponse.serverError());
        }
    }
}

