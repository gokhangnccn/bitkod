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

@RestController
@RequestMapping("/api/test-cases")
public class TestCaseController {

    private final TestCaseService testCaseService;

    public TestCaseController(TestCaseService testCaseService) {
        this.testCaseService = testCaseService;
    }

    @GetMapping("/problem/{problemId}")
    public ResponseEntity<ApiResponse<List<TestCaseDTO>>> getByProblemId(@PathVariable Long problemId) {
        return ResponseEntity.ok(testCaseService.getTestCasesByProblemId(problemId));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TestCaseDTO>> createTestCase(@RequestBody TestCaseDTO dto,
                                                                   Authentication authentication) {
        UserClaims userClaims = (UserClaims) authentication.getPrincipal();
        return ResponseEntity.ok(testCaseService.createTestCase(dto, userClaims));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTestCase(@PathVariable Long id,
                                                            Authentication authentication) {
        UserClaims userClaims = (UserClaims) authentication.getPrincipal();
        return ResponseEntity.ok(testCaseService.deleteTestCase(id, userClaims));
    }
}

