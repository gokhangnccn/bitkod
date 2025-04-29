package com.gokhan.bitcode.llm;

import com.gokhan.bitcode.dtos.FeedbackTask;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LLMFeedbackQueueProducer {
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String QUEUE_NAME = "llm-feedback-queue";

    public void enqueue(FeedbackTask task) {
        redisTemplate.opsForList().rightPush(QUEUE_NAME, task);
    }
}

