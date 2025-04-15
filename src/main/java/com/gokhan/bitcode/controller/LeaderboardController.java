package com.gokhan.bitcode.controller;

import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.dtos.LeaderboardEntryDTO;
import com.gokhan.bitcode.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<LeaderboardEntryDTO>>> getLeaderboard() {
        List<LeaderboardEntryDTO> leaderboard = leaderboardService.getLeaderboard();
        return ResponseEntity.ok(ApiResponse.success(leaderboard));
    }
}
