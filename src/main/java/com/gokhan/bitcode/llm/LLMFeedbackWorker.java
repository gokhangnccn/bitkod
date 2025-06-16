package com.gokhan.bitcode.llm;

import com.gokhan.bitcode.dtos.FeedbackTask;
import com.gokhan.bitcode.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
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

    @Scheduled(fixedDelay = 3000)
    public void consume() {
        Long size = redisTemplate.opsForList().size(QUEUE_NAME);
        log.info("Kuyruktaki Gorevler: {}", size);

        Object obj = redisTemplate.opsForList().leftPop(QUEUE_NAME);
        
        if (obj == null) {
            log.debug("Kuyruktan alınan obje null");
            return;
        }
        
        log.info("Kuyruktan alınan objection türü: {}", obj.getClass().getName());
        log.info("Obje içeriği: {}", obj.toString());
        
        if (obj instanceof FeedbackTask task) {
            log.info("Gorev alındı. SubmissionId: {}, Tur: {}", task.submissionId(), task.type());

            submissionRepository.findById(task.submissionId()).ifPresentOrElse(submission -> {
                switch (task.type()) {
                    case ERROR_ANALYSIS -> {
                        llmFeedbackService.getFeedback(
                                task.problemDescription(),
                                task.code(),
                                submission.getLanguage(),
                                task.errorMessage(),
                                submission.getUserId()
                        ).subscribe(feedback -> {
                            submission.setLlmFeedback(feedback);
                            submissionRepository.save(submission);
                        }, error -> log.error("Hata aciklamasi alinamadi: {}", error.getMessage()));
                    }

                    case CODE_QUALITY_SCORE -> {
                        llmFeedbackService.evaluateCodeQuality(
                                task.problemDescription(),
                                task.code(),
                                submission.getLanguage(),
                                submission.getUserId()
                        ).subscribe(score -> {
                            submission.setCodeQualityScore(score);
                            submissionRepository.save(submission);
                            log.info("CODE quality için kullanılacak kod: {}", submission.getCode());
                            log.info("Alternatif: task.code() = {}", task.code());

                        }, error -> log.error("Kod kalitesi puani alinamadi: {}", error.getMessage()));
                    }

                    case CODE_QUALITY_REASON -> {
                        llmFeedbackService.explainCodeQuality(
                                task.problemDescription(),
                                submission.getCode(),
                                submission.getLanguage(),
                                submission.getUserId()
                        ).subscribe(feedback -> {
                            submission.setCodeQualityReason(feedback);
                            submissionRepository.save(submission);
                        }, error -> log.error("Kod kalitesi aciklamasi alinamadi: {}", error.getMessage()));
                    }

                    case CODE_REFACTOR -> {
                        llmFeedbackService.refactorCode(
                                task.problemDescription(),
                                submission.getCode(),
                                submission.getLanguage(),
                                submission.getUserId()
                        ).subscribe(refactoredCode -> {
                            submission.setRefactoredCode(refactoredCode);
                            submissionRepository.save(submission);
                        }, error -> log.error("Refactor edilmiş kod alinamadi: {}", error.getMessage()));
                    }

                }
            }, () -> log.warn("Submission bulunamadi. ID: {}", task.submissionId()));
        } else {
            log.error("Kuyruktan alınan obje FeedbackTask değil! Tip: {}", obj.getClass().getName());
        }
    }
}
