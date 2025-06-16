package com.gokhan.bitcode.repository;

import com.gokhan.bitcode.entity.TestCaseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.cache.annotation.Cacheable;

import java.util.List;

@Repository
public interface TestCaseRepository extends JpaRepository<TestCaseEntity, Long> {
    void deleteByProblemId(Long problemId);

    @Cacheable(value = "testCases", key = "#problemId")
    List<TestCaseEntity> findByProblemId(Long problemId);
}

