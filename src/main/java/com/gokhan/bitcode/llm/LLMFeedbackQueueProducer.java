package com.gokhan.bitcode.llm;

import com.gokhan.bitcode.dtos.FeedbackTask;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LLMFeedbackQueueProducer {

    private final RedisTemplate<String, Object> redisTemplate;

    public void enqueueFeedbackTask(FeedbackTask task) {
        redisTemplate.opsForList().rightPush("llm-feedback-queue", task);
    }
}
