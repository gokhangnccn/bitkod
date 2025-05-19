package com.gokhan.bitcode.repository;

import com.gokhan.bitcode.entity.PasswordResetToken;
import com.gokhan.bitcode.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    Optional<PasswordResetToken> findFirstByUserOrderByExpiryDateDesc(UserEntity user);

    void deleteByToken(String token);

    void deleteAllByUser(UserEntity user);

}
