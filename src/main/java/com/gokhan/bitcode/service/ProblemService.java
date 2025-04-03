package com.gokhan.bitcode.service;

import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.entity.ProblemEntity;
import com.gokhan.bitcode.repository.ProblemRepository;
import org.springframework.stereotype.Service;

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

    public ApiResponse<ProblemEntity> createProblem(ProblemEntity problemEntity) {
        try {
            ProblemEntity saved = problemRepository.save(problemEntity);
            return ApiResponse.success(saved);
        } catch (Exception e) {
            return ApiResponse.badRequest("BIT-2001", "Problem oluşturulurken hata oluştu.");
        }
    }

    public ApiResponse<ProblemEntity> updateProblem(Long id, ProblemEntity updatedProblem) {
        ProblemEntity existing = problemRepository.findById(id).orElse(null);

        if (existing == null) {
            return ApiResponse.problemNotFound();
        }

        try {
            existing.setTitle(updatedProblem.getTitle());
            existing.setDescription(updatedProblem.getDescription());
            existing.setDifficulty(updatedProblem.getDifficulty());
            existing.setExampleInput(updatedProblem.getExampleInput());
            existing.setExampleOutput(updatedProblem.getExampleOutput());

            ProblemEntity saved = problemRepository.save(existing);
            return ApiResponse.success(saved);
        } catch (Exception e) {
            return ApiResponse.badRequest("BIT-2002", "Problem güncellenirken bir hata oluştu.");
        }
    }

    public ApiResponse<Void> deleteProblem(Long id) {
        if (!problemRepository.existsById(id)) {
            return ApiResponse.problemNotFound();
        }
        try {
            problemRepository.deleteById(id);
            return ApiResponse.success(null);
        } catch (Exception e) {
            return ApiResponse.badRequest("BIT-2003", "Problem silinirken hata oluştu.");
        }
    }
}
