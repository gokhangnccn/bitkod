package com.gokhan.bitcode.repository;

import com.gokhan.bitcode.entity.ProblemReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProblemReportRepository extends JpaRepository<ProblemReportEntity, Long> {
    List<ProblemReportEntity> findByReportedBy(String reportedBy);
}

