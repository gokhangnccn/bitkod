package com.gokhan.bitcode.controller;

import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.dtos.FeedbackTask;
import com.gokhan.bitcode.entity.ProblemEntity;
import com.gokhan.bitcode.entity.SubmissionEntity;
import com.gokhan.bitcode.repository.ProblemRepository;
import com.gokhan.bitcode.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/llm-feedback")
@RequiredArgsConstructor
public class LLMFeedbackController {

    private final SubmissionRepository submissionRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private final ProblemRepository problemRepository;

    @PostMapping("/{submissionId}")
    public ResponseEntity<?> generateFeedback(@PathVariable Long submissionId) {

        return submissionRepository.findById(submissionId)
                .map(submission -> {
                    if (submission.getPassed()) {
                        return ResponseEntity.badRequest().body("Passed submission için feedback gerekmez.");
                    }

                    ProblemEntity problem = problemRepository.findById(submission.getProblemId()).orElse(null);
                    if (problem == null) {
                        return ResponseEntity.badRequest().body("Problem bulunamadı.");
                    }

                    FeedbackTask task = new FeedbackTask(
                            submission.getId(),
                            problem.getDescription(),
                            submission.getCode(),
                            submission.getErrorMessage()
                    );


                    redisTemplate.opsForList().rightPush("llm-feedback-queue", task);
                    return ResponseEntity.ok("LLM feedback kuyruğa eklendi.");
                })
                .orElse(ResponseEntity.notFound().build());
    }
}

