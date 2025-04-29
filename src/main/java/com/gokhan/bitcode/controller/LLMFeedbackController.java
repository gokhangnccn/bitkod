package com.gokhan.bitcode.controller;

import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.dtos.FeedbackTask;
import com.gokhan.bitcode.entity.ProblemEntity;
import com.gokhan.bitcode.enums.FeedbackType;
import com.gokhan.bitcode.llm.LLMFeedbackQueueProducer;
import com.gokhan.bitcode.repository.ProblemRepository;
import com.gokhan.bitcode.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/llm-feedback")
@RequiredArgsConstructor
public class LLMFeedbackController {

    private final SubmissionRepository submissionRepository;
    private final LLMFeedbackQueueProducer llmFeedbackQueueProducer;
    private final ProblemRepository problemRepository;

    @PostMapping("/{submissionId}")
    public ResponseEntity<?> generateFeedback(@PathVariable Long submissionId) {
        return submissionRepository.findById(submissionId)
                .map(submission -> {
                    ProblemEntity problem = problemRepository.findById(submission.getProblemId()).orElse(null);
                    if (problem == null) {
                        return ResponseEntity.badRequest().body("Problem bulunamadı.");
                    }

                    FeedbackTask task = new FeedbackTask(
                            submission.getId(),
                            problem.getDescription(),
                            submission.getCode(),
                            submission.getErrorMessage(),
                            FeedbackType.ERROR_ANALYSIS
                    );
                    llmFeedbackQueueProducer.enqueue(task);
                    return ResponseEntity.ok("LLM feedback kuyruğa eklendi.");
                })
                .orElse(ResponseEntity.notFound().build());
    }
    @PostMapping("/{submissionId}/reason")
    public ResponseEntity<?> triggerLLMFeedback(
            @PathVariable Long submissionId
    ) {
        return submissionRepository.findById(submissionId)
                .map(submission -> {
                    ProblemEntity problem = problemRepository.findById(submission.getProblemId()).orElse(null);
                    if (problem == null) {
                        return ResponseEntity.badRequest().body("Problem bulunamadı.");
                    }

                    FeedbackTask task = new FeedbackTask(
                            submission.getId(),
                            problem.getDescription(),
                            submission.getCode(),
                            submission.getErrorMessage(),
                            FeedbackType.CODE_QUALITY_REASON
                    );
                    llmFeedbackQueueProducer.enqueue(task);
                    return ResponseEntity.ok("LLM geri bildirim kuyruğa eklendi.");
                })
                .orElse(ResponseEntity.notFound().build());
    }
}