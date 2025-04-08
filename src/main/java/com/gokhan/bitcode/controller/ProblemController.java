package com.gokhan.bitcode.controller;

import com.gokhan.bitcode.entity.ProblemEntity;
import com.gokhan.bitcode.service.ProblemService;
import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.utils.UserClaims;
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

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProblemEntity>> getProblemById(@PathVariable Long id) {
        return ResponseEntity.ok(problemService.getProblemById(id));
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
}

