package com.gokhan.bitcode.repository;

import com.gokhan.bitcode.entity.ProblemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProblemRepository extends JpaRepository<ProblemEntity, Long> {
    Optional<ProblemEntity> findByUid(String uid);
}
