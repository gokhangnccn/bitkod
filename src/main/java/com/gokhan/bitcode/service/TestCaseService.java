package com.gokhan.bitcode.service;

import com.gokhan.bitcode.repository.ProblemRepository;
import com.gokhan.bitcode.repository.TestCaseRepository;
import org.springframework.stereotype.Service;

import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.dtos.TestCaseDTO;
import com.gokhan.bitcode.entity.ProblemEntity;
import com.gokhan.bitcode.entity.TestCaseEntity;

import com.gokhan.bitcode.utils.UserClaims;
import lombok.RequiredArgsConstructor;

import java.util.Optional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TestCaseService {

    private final TestCaseRepository testCaseRepository;
    private final ProblemRepository problemRepository;

    public ApiResponse<List<TestCaseDTO>> getTestCasesByProblemId(Long problemId) {
        try {
            List<TestCaseEntity> testCases = testCaseRepository.findByProblemId(problemId);
            List<TestCaseDTO> dtos = testCases.stream().map(tc -> TestCaseDTO.builder()
                    .id(tc.getId())
                    .problemId(tc.getProblem().getId())
                    .input(tc.getInput())
                    .expectedOutput(tc.getExpectedOutput())
                    .isHidden(tc.isHidden())
                    .build()).toList();
            return ApiResponse.success(dtos);
        } catch (Exception e) {
            return ApiResponse.badRequest("BIT-4001", "Test case'ler alınırken bir hata oluştu.");
        }
    }

    public ApiResponse<TestCaseDTO> createTestCase(TestCaseDTO dto, UserClaims userClaims) {
        try {
            Optional<ProblemEntity> problemOpt = problemRepository.findById(dto.getProblemId());
            if (problemOpt.isEmpty()) {
                return ApiResponse.badRequest("BIT-4002", "İlgili problem bulunamadı.");
            }

            TestCaseEntity newTestCase = TestCaseEntity.builder()
                    .problem(problemOpt.get())
                    .input(dto.getInput())
                    .expectedOutput(dto.getExpectedOutput())
                    .isHidden(dto.isHidden())
                    .build();

            TestCaseEntity saved = testCaseRepository.save(newTestCase);

            TestCaseDTO savedDto = TestCaseDTO.builder()
                    .id(saved.getId())
                    .problemId(saved.getProblem().getId())
                    .input(saved.getInput())
                    .expectedOutput(saved.getExpectedOutput())
                    .isHidden(saved.isHidden())
                    .build();

            return ApiResponse.success(savedDto);
        } catch (Exception e) {
            return ApiResponse.badRequest("BIT-4003", "Test case oluşturulurken bir hata oluştu.");
        }
    }

    public ApiResponse<Void> deleteTestCase(Long id, UserClaims userClaims) {
        try {
            Optional<TestCaseEntity> testCaseOpt = testCaseRepository.findById(id);
            if (testCaseOpt.isEmpty()) {
                return ApiResponse.badRequest("BIT-4004", "Silinecek test case bulunamadı.");
            }
            testCaseRepository.deleteById(id);
            return ApiResponse.success(null);
        } catch (Exception e) {
            return ApiResponse.badRequest("BIT-4005", "Test case silinirken bir hata oluştu.");
        }
    }
}

