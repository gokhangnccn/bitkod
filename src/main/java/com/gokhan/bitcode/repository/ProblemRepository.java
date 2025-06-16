package com.gokhan.bitcode.repository;

import com.gokhan.bitcode.entity.ProblemEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface ProblemRepository extends JpaRepository<ProblemEntity, Long> {
    Optional<ProblemEntity> findByUid(String uid);

    @Query(value = "SELECT p.id as problemId, p.title, COUNT(s.id) as solveCount " +
            "FROM problems p " +
            "JOIN submission s ON p.id = s.problem_id " +
            "WHERE s.passed = true " +
            "GROUP BY p.id, p.title " +
            "ORDER BY solveCount DESC LIMIT 5", nativeQuery = true)
    List<Object[]> findMostSolvedProblems();

    @Query(value = "SELECT p.id as problemId, p.title, " +
            "CAST(SUM(CASE WHEN s.passed = true THEN 1 ELSE 0 END) AS FLOAT) / NULLIF(COUNT(*), 0) as successRate " +
            "FROM problems p " +
            "JOIN submission s ON p.id = s.problem_id " +
            "GROUP BY p.id, p.title " +
            "HAVING COUNT(*) >= 5 " +
            "ORDER BY successRate ASC LIMIT 5", nativeQuery = true)
    List<Object[]> findHardestProblems();

    Page<ProblemEntity> findByTitleContainingIgnoreCase(String title, Pageable pageable);
}
