package com.gokhan.bitcode.controller;

import com.gokhan.bitcode.dtos.WebSocketMessageDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class FeedbackWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    public void sendFeedback(Long userId, WebSocketMessageDTO message) {
        messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/topic/feedback",
                message
        );
    }
}
