package com.gokhan.bitcode.service;

import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.entity.ProblemEntity;
import com.gokhan.bitcode.repository.ProblemRepository;
import com.gokhan.bitcode.utils.UserClaims;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ProblemService {

    private final ProblemRepository problemRepository;

    public ProblemService(ProblemRepository problemRepository) {
        this.problemRepository = problemRepository;
    }

    public ApiResponse<List<ProblemEntity>> getAllProblems() {
        return ApiResponse.success(problemRepository.findAll());
    }

    public ApiResponse<ProblemEntity> getProblemById(Long id) {
        return problemRepository.findById(id)
                .map(ApiResponse::success)
                .orElse(ApiResponse.problemNotFound());
    }

    public ApiResponse<ProblemEntity> createProblem(ProblemEntity problemEntity, UserClaims userClaims) {
        problemEntity.setCreatedBy(userClaims.getUserId());
        problemEntity.setCreatedAt(LocalDateTime.now());

        ProblemEntity saved = problemRepository.save(problemEntity);
        return ApiResponse.success(saved);
    }

    public ApiResponse<ProblemEntity> updateProblem(Long id, ProblemEntity updatedProblem, UserClaims userClaims) {
        return problemRepository.findById(id)
                .map(existing -> {
                    existing.setTitle(updatedProblem.getTitle());
                    existing.setDescription(updatedProblem.getDescription());
                    existing.setDifficulty(updatedProblem.getDifficulty());
                    existing.setExampleInput(updatedProblem.getExampleInput());
                    existing.setExampleOutput(updatedProblem.getExampleOutput());

                    ProblemEntity saved = problemRepository.save(existing);
                    return ApiResponse.success(saved);
                })
                .orElse(ApiResponse.problemNotFound());
    }

    public ApiResponse<Void> deleteProblem(Long id, UserClaims userClaims) {
        if (!problemRepository.existsById(id)) {
            return ApiResponse.problemNotFound();
        }

        if (!"ADMIN".equalsIgnoreCase(userClaims.getRole())) {
            return ApiResponse.forbidden("Sadece admin kullanıcılar problem silebilir.");
        }

        problemRepository.deleteById(id);
        return ApiResponse.success(null);
    }
}

