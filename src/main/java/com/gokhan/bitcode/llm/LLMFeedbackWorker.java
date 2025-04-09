package com.gokhan.bitcode.llm;

import com.gokhan.bitcode.dtos.FeedbackTask;
import com.gokhan.bitcode.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LLMFeedbackWorker {

    private static final Logger log = LoggerFactory.getLogger(LLMFeedbackWorker.class);
    private static final String QUEUE_NAME = "llm-feedback-queue";

    private final LLMFeedbackService llmFeedbackService;
    private final SubmissionRepository submissionRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;

    @Scheduled(fixedDelay = 2000)
    public void consume() {
        Long size = redisTemplate.opsForList().size(QUEUE_NAME);
        log.info("Kuyrukta bekleyen görev sayısı: {}", size);

        Object obj = redisTemplate.opsForList().leftPop(QUEUE_NAME);
        if (obj instanceof FeedbackTask task) {
            log.info("Görev alındı. SubmissionId: {}", task.submissionId());

            llmFeedbackService.getFeedback(task.problemDescription(), task.code(), task.errorMessage())
                    .subscribe(feedback -> {
                        submissionRepository.findById(task.submissionId()).ifPresentOrElse(submission -> {
                            submission.setLlmFeedback(feedback);
                            submissionRepository.save(submission);
                            log.info("Feedback kaydedildi. SubmissionId: {}", submission.getId());

                            // WebSocket mesajı gönder
                            messagingTemplate.convertAndSend(
                                    "/topic/feedback/" + submission.getUserId(), feedback
                            );
                        }, () -> {
                            log.warn("Submission bulunamadı. ID: {}", task.submissionId());
                        });
                    }, error -> {
                        log.error("Feedback alınamadı: {}", error.getMessage());
                    });
        }
    }
}