package com.gokhan.bitcode.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class FeedbackWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    public void sendFeedback(Long userId, String feedback) {
        // kullanıcıya özel bir kanala yayın yap
        messagingTemplate.convertAndSend("/topic/feedback/" + userId, feedback);
    }
}
