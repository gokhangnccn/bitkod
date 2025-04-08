package com.gokhan.bitcode.repository;


import com.gokhan.bitcode.entity.SubmissionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<SubmissionEntity, Long> {

    // Belirli bir kullanıcıya ait tüm gönderimler
    List<SubmissionEntity> findByUserId(Long userId);

    // Belirli bir kullanıcı ve probleme ait gönderimler
    List<SubmissionEntity> findByUserIdAndProblemId(Long userId, Long problemId);

    // Başarılı çözümleri getir
    List<SubmissionEntity> findByUserIdAndPassedTrue(Long userId);

    // Belirli bir problemi başarıyla çözen kullanıcıların listesi
    List<SubmissionEntity> findByProblemIdAndPassedTrue(Long problemId);

    // Kullanıcının çözmüş olduğu farklı soru sayısı
    long countDistinctByUserIdAndPassedTrue(Long userId);

    // Kullanıcının toplam gönderi sayısı
    long countByUserId(Long userId);

    // Kullanıcının başarılı gönderi sayısı
    long countByUserIdAndPassedTrue(Long userId);
}
