package com.gokhan.bitcode.controller;

import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.dtos.problems.ProblemRequestDTO;
import com.gokhan.bitcode.dtos.problems.ProblemResponseDTO;
import com.gokhan.bitcode.service.AdminProblemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/admin/problems")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminProblemController {

    private final AdminProblemService adminProblemService;

    @PostMapping
    public ResponseEntity<ApiResponse<ProblemResponseDTO>> createProblem(@Valid @RequestBody ProblemRequestDTO request,
                                                                         Principal principal) {
        ProblemResponseDTO dto = adminProblemService.create(request, principal.getName());
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProblemResponseDTO>> updateProblem(@PathVariable Long id,
                                                                         @Valid @RequestBody ProblemRequestDTO request) {
        ProblemResponseDTO dto = adminProblemService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProblem(@PathVariable Long id) {
        adminProblemService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/bulk-delete")
    public ResponseEntity<ApiResponse<Void>> bulkDelete(@RequestBody List<Long> ids) {
        adminProblemService.bulkDelete(ids);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProblemResponseDTO>>> listProblems(@RequestParam(defaultValue = "0") int page,
                                                                              @RequestParam(defaultValue = "20") int size,
                                                                              @RequestParam(required = false) String search) {
        Page<ProblemResponseDTO> result = adminProblemService.list(page, size, search);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProblemResponseDTO>> getProblem(@PathVariable Long id) {
        ProblemResponseDTO dto = adminProblemService.get(id);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }
} 