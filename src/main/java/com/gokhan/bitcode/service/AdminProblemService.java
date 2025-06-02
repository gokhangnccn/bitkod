package com.gokhan.bitcode.service;

import com.gokhan.bitcode.dtos.problems.ProblemRequestDTO;
import com.gokhan.bitcode.dtos.problems.ProblemResponseDTO;
import com.gokhan.bitcode.entity.ProblemEntity;
import com.gokhan.bitcode.entity.TestCaseEntity;
import com.gokhan.bitcode.repository.ProblemRepository;
import com.gokhan.bitcode.repository.TestCaseRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminProblemService {

    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;

    @Transactional
    public ProblemResponseDTO create(ProblemRequestDTO dto, String adminId) {
        ProblemEntity entity = ProblemEntity.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .difficulty(dto.getDifficulty())
                .exampleInput(dto.getExampleInput())
                .exampleOutput(dto.getExampleOutput())
                .createdBy(adminId)
                .build();
        entity = problemRepository.save(entity);
        saveTestCases(entity, dto.getTestCases());
        return toDto(entity);
    }

    @Transactional
    public ProblemResponseDTO update(Long id, ProblemRequestDTO dto) {
        ProblemEntity entity = problemRepository.findById(id).orElseThrow(() -> new RuntimeException("Problem not found"));
        entity.setTitle(dto.getTitle());
        entity.setDescription(dto.getDescription());
        entity.setDifficulty(dto.getDifficulty());
        entity.setExampleInput(dto.getExampleInput());
        entity.setExampleOutput(dto.getExampleOutput());
        problemRepository.save(entity);

        // simple strategy
        testCaseRepository.deleteByProblemId(entity.getId());
        saveTestCases(entity, dto.getTestCases());
        return toDto(entity);
    }

    @Transactional
    public void delete(Long id) {
        testCaseRepository.deleteByProblemId(id);
        problemRepository.deleteById(id);
    }

    @Transactional
    public void bulkDelete(List<Long> ids) {
        ids.forEach(this::delete);
    }

    public Page<ProblemResponseDTO> list(int page, int size, String keyword) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ProblemEntity> problems = (keyword != null && !keyword.isBlank())
                ? problemRepository.findByTitleContainingIgnoreCase(keyword, pageable)
                : problemRepository.findAll(pageable);
        return problems.map(this::toDto);
    }

    private void saveTestCases(ProblemEntity problem, List<ProblemRequestDTO.TestCaseDTO> list) {
        if (list == null) return;
        for (ProblemRequestDTO.TestCaseDTO tc : list) {
            TestCaseEntity e = TestCaseEntity.builder()
                    .problem(problem)
                    .input(tc.getInput())
                    .expectedOutput(tc.getExpectedOutput())
                    .build();
            testCaseRepository.save(e);
        }
    }

    private ProblemResponseDTO toDto(ProblemEntity entity) {
        List<TestCaseEntity> tcs = testCaseRepository.findByProblemId(entity.getId());
        return ProblemResponseDTO.builder()
                .id(entity.getId())
                .uid(entity.getUid())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .difficulty(entity.getDifficulty())
                .exampleInput(entity.getExampleInput())
                .exampleOutput(entity.getExampleOutput())
                .testCases(tcs.stream().map(tc -> ProblemResponseDTO.TestCaseDTO.builder()
                        .id(tc.getId())
                        .input(tc.getInput())
                        .expectedOutput(tc.getExpectedOutput())
                        .build()).collect(Collectors.toList()))
                .build();
    }

    public ProblemResponseDTO get(Long id) {
        ProblemEntity entity = problemRepository.findById(id).orElseThrow(() -> new RuntimeException("Problem not found"));
        return toDto(entity);
    }
} 