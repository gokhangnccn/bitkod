package com.gokhan.bitcode.service;

import com.gokhan.bitcode.dtos.LeaderboardEntryDTO;
import com.gokhan.bitcode.entity.UserEntity;
import com.gokhan.bitcode.repository.SubmissionRepository;
import com.gokhan.bitcode.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;

    public List<LeaderboardEntryDTO> getLeaderboard() {
        List<UserEntity> users = userRepository.findAll();

        return users.stream()
                .map(user -> {
                    Long userId = user.getId();
                    long total = submissionRepository.countByUserId(userId);
                    long successful = submissionRepository.countByUserIdAndPassedTrue(userId);
                    long solved = submissionRepository.countDistinctByUserIdAndPassedTrue(userId);
                    double successRate = total == 0 ? 0.0 : (successful * 100.0 / total);
                    double score = solved * 10 + successRate; // ağırlıklı skor

                    return new LeaderboardEntryDTO(userId, user.getUsername(), (int) solved, successRate, (int) total, score);
                })
                .sorted(Comparator.comparingDouble(LeaderboardEntryDTO::getScore).reversed())
                .collect(Collectors.toList());
    }
}
