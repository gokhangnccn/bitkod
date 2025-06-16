package com.gokhan.bitcode.controller;

import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.dtos.problems.ProblemRequestDTO;
import com.gokhan.bitcode.dtos.problems.ProblemResponseDTO;
import com.gokhan.bitcode.service.AdminProblemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/admin/problems")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminProblemController {

    private final AdminProblemService adminProblemService;

    @PostMapping
    public ResponseEntity<ApiResponse<ProblemResponseDTO>> createProblem(@Valid @RequestBody ProblemRequestDTO request,
                                                                         Principal principal) {
        long start = System.currentTimeMillis();
        try {
            ProblemResponseDTO dto = adminProblemService.create(request, principal.getName());
            long duration = System.currentTimeMillis() - start;
            log.info("[POST /api/admin/problems] Problem Oluşturuldu id: {}, admin: {}, duration: {} ms", dto.getId(), principal.getName(), duration);
            return ResponseEntity.ok(ApiResponse.success(dto));
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("[POST /api/admin/problems] Hata admin: {}, duration: {} ms, hata: {}", principal.getName(), duration, e.getMessage(), e);
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.serverError());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProblemResponseDTO>> updateProblem(@PathVariable Long id,
                                                                         @Valid @RequestBody ProblemRequestDTO request) {
        long start = System.currentTimeMillis();
        try {
            ProblemResponseDTO dto = adminProblemService.update(id, request);
            long duration = System.currentTimeMillis() - start;
            log.info("[PUT /api/admin/problems/{}] Güncelleme Başarılı, duration: {} ms", id, duration);
            return ResponseEntity.ok(ApiResponse.success(dto));
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("[PUT /api/admin/problems/{}] Hata, duration: {} ms, hata: {}", id, duration, e.getMessage(), e);
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.serverError());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProblem(@PathVariable Long id) {
        long start = System.currentTimeMillis();
        try {
            adminProblemService.delete(id);
            long duration = System.currentTimeMillis() - start;
            log.info("[DELETE /api/admin/problems/{}] Problem silindi, duration: {} ms", id, duration);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("[DELETE /api/admin/problems/{}] Hata, duration: {} ms, hata: {}", id, duration, e.getMessage(), e);
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.serverError());
        }
    }

    @PostMapping("/bulk-delete")
    public ResponseEntity<ApiResponse<Void>> bulkDelete(@RequestBody List<Long> ids) {
        long start = System.currentTimeMillis();
        try {
            adminProblemService.bulkDelete(ids);
            long duration = System.currentTimeMillis() - start;
            log.info("[POST /api/admin/problems/bulk-delete] Problemler silindi {}, duration: {} ms", ids.size(), duration);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("[POST /api/admin/problems/bulk-delete] Hata, duration: {} ms, hata: {}", duration, e.getMessage(), e);
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.serverError());
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProblemResponseDTO>>> listProblems(@RequestParam(defaultValue = "0") int page,
                                                                              @RequestParam(defaultValue = "20") int size,
                                                                              @RequestParam(required = false) String search) {
        long start = System.currentTimeMillis();
        try {
            Page<ProblemResponseDTO> result = adminProblemService.list(page, size, search);
            long duration = System.currentTimeMillis() - start;
            log.info("[GET /api/admin/problems] Problemler getirildi page {} size {} (search='{}'), duration: {} ms", page, size, search, duration);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("[GET /api/admin/problems] Hata, duration: {} ms, hata: {}", duration, e.getMessage(), e);
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.serverError());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProblemResponseDTO>> getProblem(@PathVariable Long id) {
        long start = System.currentTimeMillis();
        try {
            ProblemResponseDTO dto = adminProblemService.get(id);
            long duration = System.currentTimeMillis() - start;
            if (dto == null) {
                log.warn("[GET /api/admin/problems/{}] Bulunamadı, duration: {} ms", id, duration);
                return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND).body(ApiResponse.problemNotFound());
            }
            log.info("[GET /api/admin/problems/{}] Problem getirildi, duration: {} ms", id, duration);
            return ResponseEntity.ok(ApiResponse.success(dto));
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("[GET /api/admin/problems/{}] Hata, duration: {} ms, hata: {}", id, duration, e.getMessage(), e);
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.serverError());
        }
    }
} 