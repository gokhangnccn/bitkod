package com.gokhan.bitcode.llm;

import com.gokhan.bitcode.controller.FeedbackWebSocketController;
import com.gokhan.bitcode.dtos.LLMResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LLMFeedbackService {

    @Value("${llm.api.key}")
    private String apiKey;

    @Value("${llm.api.url}")
    private String apiUrl;

    private final WebClient.Builder webClientBuilder;

    private final FeedbackWebSocketController feedbackWebSocketController;

    public Mono<String> getFeedback(String problemDescription, String code, String errorMessage, Long userId) {
        String prompt = """
                Problem Tanımı:
                %s

                Kullanıcı Kodu:
                %s

                Hata:
                %s

                Lütfen neden hatalı olduğunu açıklayın ve kısaca ipucu ver, çözüm kodunu verme.
                """.formatted(problemDescription, code, errorMessage);

        return webClientBuilder.build()
                .post()
                .uri(apiUrl)
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .bodyValue(Map.of(
                        "model", "deepseek-coder",
                        "max_tokens", 200,
                        "temperature", 0.3,
                        "messages", new Object[]{
                                Map.of("role", "system", "content", "Sen deneyimli bir Java eğitmenisin. Kullanıcıya kodun nasıl çözüldüğünü değil, nerede hata yaptığını kısaca ipucu olarak ver."),
                                Map.of("role", "user", "content", prompt)
                        }
                ))
                .retrieve()
                .bodyToMono(LLMResponse.class)
                .map(response -> {
                    String feedback = "Geri bildirim alınamadı.";
                    if (response.getChoices() != null && !response.getChoices().isEmpty()) {
                        feedback = response.getChoices().get(0).getMessage().getContent();
                    }
                    feedbackWebSocketController.sendFeedback(userId, feedback);
                    System.out.println("WebSocket mesajı gönderiliyor: " + feedback); //SİL SONRA
                    return feedback;
                });
    }
}
