package com.gokhan.bitcode.repository;

import com.gokhan.bitcode.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmail(String email);
    Optional<UserEntity> findByUsername(String username);

    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query(value = "SELECT u.id as userId, u.username, COUNT(s.id) as submissionCount " +
            "FROM users u " +
            "JOIN submission s ON u.id = s.user_id " +
            "GROUP BY u.id, u.username " +
            "ORDER BY submissionCount DESC LIMIT 10", nativeQuery = true)
    List<Object[]> findMostActiveUsers();

    @Query(value = "SELECT u.id as userId, u.username, " +
            "CAST(SUM(CASE WHEN s.passed = true THEN 1 ELSE 0 END) AS FLOAT) / NULLIF(COUNT(*), 0) as successRate " +
            "FROM users u " +
            "JOIN submission s ON u.id = s.user_id " +
            "GROUP BY u.id, u.username " +
            "HAVING COUNT(*) >= 5 " +
            "ORDER BY successRate DESC LIMIT 10", nativeQuery = true)
    List<Object[]> findMostSuccessfulUsers();

    @Query("SELECT u.role as role, COUNT(u) as cnt FROM UserEntity u GROUP BY u.role")
    List<Object[]> countByRole();
}

