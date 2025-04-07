package com.gokhan.bitcode.controller;

import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.dtos.SubmissionStatsDTO;
import com.gokhan.bitcode.entity.SubmissionEntity;
import com.gokhan.bitcode.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;

    @PostMapping
    public ResponseEntity<ApiResponse<SubmissionEntity>> createSubmission(@RequestBody SubmissionEntity submission) {
        ApiResponse<SubmissionEntity> response = submissionService.createSubmission(submission);
        return ResponseEntity.status(response.getResultCode()).body(response);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<SubmissionEntity>>> getSubmissionsByUserId(@PathVariable Long userId) {
        ApiResponse<List<SubmissionEntity>> response = submissionService.getSubmissionsByUserId(userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}/problem/{problemId}")
    public ResponseEntity<ApiResponse<List<SubmissionEntity>>> getByUserAndProblem(
            @PathVariable Long userId,
            @PathVariable Long problemId) {
        ApiResponse<List<SubmissionEntity>> response = submissionService.getSubmissionsByUserIdAndProblemId(userId, problemId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}/stats")
    public ResponseEntity<ApiResponse<SubmissionStatsDTO>> getUserStats(@PathVariable Long userId) {
        ApiResponse<SubmissionStatsDTO> response = submissionService.getUserSubmissionStats(userId);
        return ResponseEntity.status(response.getResultCode()).body(response);
    }

    @GetMapping("/problem/{problemId}/successful")
    public ResponseEntity<ApiResponse<List<SubmissionEntity>>> getSuccessfulSubmissions(@PathVariable Long problemId) {
        ApiResponse<List<SubmissionEntity>> response = submissionService.getSuccessfulSubmissionsByProblemId(problemId);
        return ResponseEntity.ok(response);
    }
}

