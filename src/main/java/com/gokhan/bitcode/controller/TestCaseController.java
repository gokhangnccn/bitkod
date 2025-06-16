package com.gokhan.bitcode.controller;

import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.dtos.TestCaseDTO;
import com.gokhan.bitcode.service.TestCaseService;
import com.gokhan.bitcode.utils.UserClaims;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import org.springframework.security.core.Authentication;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/test-cases")
public class TestCaseController {

    private final TestCaseService testCaseService;

    public TestCaseController(TestCaseService testCaseService) {
        this.testCaseService = testCaseService;
    }

    @GetMapping("/problem/{problemId}")
    public ResponseEntity<ApiResponse<List<TestCaseDTO>>> getByProblemId(@PathVariable Long problemId) {
        long start = System.currentTimeMillis();
        try {
            ApiResponse<List<TestCaseDTO>> response = testCaseService.getTestCasesByProblemId(problemId);
            long duration = System.currentTimeMillis() - start;
            log.info("[GET /api/test-cases/problem/{}] duration: {} ms", problemId, duration);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("[GET /api/test-cases/problem/{}] Hata duration: {} ms, hata: {}", problemId, duration, e.getMessage(), e);
            return ResponseEntity.status(500).body(ApiResponse.serverError());
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TestCaseDTO>> createTestCase(@RequestBody TestCaseDTO dto,
                                                                   Authentication authentication) {
        long start = System.currentTimeMillis();
        UserClaims userClaims = (UserClaims) authentication.getPrincipal();
        try {
            ApiResponse<TestCaseDTO> response = testCaseService.createTestCase(dto, userClaims);
            long duration = System.currentTimeMillis() - start;
            log.info("[POST /api/test-cases] userId: {}, problemId: {}, duration: {} ms", userClaims.getUserId(), dto.getProblemId(), duration);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("[POST /api/test-cases] Hata userId: {}, duration: {} ms, hata: {}", userClaims.getUserId(), duration, e.getMessage(), e);
            return ResponseEntity.status(500).body(ApiResponse.serverError());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTestCase(@PathVariable Long id,
                                                            Authentication authentication) {
        long start = System.currentTimeMillis();
        UserClaims userClaims = (UserClaims) authentication.getPrincipal();
        try {
            ApiResponse<Void> response = testCaseService.deleteTestCase(id, userClaims);
            long duration = System.currentTimeMillis() - start;
            log.info("[DELETE /api/test-cases/{}] userId: {}, duration: {} ms", id, userClaims.getUserId(), duration);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("[DELETE /api/test-cases/{}] Hata userId: {}, duration: {} ms, hata: {}", id, userClaims.getUserId(), duration, e.getMessage(), e);
            return ResponseEntity.status(500).body(ApiResponse.serverError());
        }
    }
}

