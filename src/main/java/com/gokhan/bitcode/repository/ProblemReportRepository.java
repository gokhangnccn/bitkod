package com.gokhan.bitcode.repository;

import com.gokhan.bitcode.entity.ProblemReportEntity;
import com.gokhan.bitcode.enums.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ProblemReportRepository extends JpaRepository<ProblemReportEntity, Long> {
    List<ProblemReportEntity> findByReportedBy(String reportedBy);

    long countByStatus(ReportStatus status);

    @Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (r.resolved_at - r.reported_at)) / 3600) " +
            "FROM problem_reports r " +
            "WHERE r.status IN (:statuses)", nativeQuery = true)
    double calculateAverageResolutionTime(@Param("statuses") List<String> statuses);

    long countByReportedAtBetween(LocalDateTime start, LocalDateTime end);

}

