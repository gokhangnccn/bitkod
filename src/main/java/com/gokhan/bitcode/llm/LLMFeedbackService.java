package com.gokhan.bitcode.llm;

import com.gokhan.bitcode.controller.FeedbackWebSocketController;
import com.gokhan.bitcode.dtos.LLMResponse;
import com.gokhan.bitcode.dtos.WebSocketMessageDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

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
                    feedbackWebSocketController.sendFeedback(userId, new WebSocketMessageDTO("LLM_FEEDBACK", feedback, null));
                    return feedback;
                });
    }

    public Mono<Integer> evaluateCodeQuality(String problemDescription, String code, Long userId) {
        String prompt = """
            Aşağıdaki Java kodunu temiz kod prensiplerine göre değerlendir.
            Kriterler:
            - Anlaşılabilirlik (isimlendirme, okunabilirlik)
            - Gereksiz kodlardan arındırılmış olması
            - Fonksiyonların tek sorumluluğu olması
            - Kod tekrarı olmaması

            Problem Tanımı:
            %s
            Kod:
            %s

            [100 üzerinden puan ver, sadece sayısal puan(integer) döndür.]
            """.formatted(problemDescription, code);

        return webClientBuilder.build()
                .post()
                .uri(apiUrl)
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .bodyValue(Map.of(
                        "model", "deepseek-coder",
                        "max_tokens", 50,
                        "temperature", 0,
                        "messages", new Object[]{
                                Map.of("role", "system", "content", "Sen deneyimli bir Java code reviewer’sın. Sadece puanla."),
                                Map.of("role", "user", "content", prompt)
                        }
                ))
                .retrieve()
                .bodyToMono(LLMResponse.class)
                .map(response -> {
                    String content = response.getChoices().get(0).getMessage().getContent();
                    int score;
                    try {
                        score = Integer.parseInt(content.replaceAll("\\D", ""));
                    } catch (NumberFormatException e) {
                        score = 0;
                    }
                    feedbackWebSocketController.sendFeedback(userId, new WebSocketMessageDTO("CODE_QUALITY_SCORE", null, score));
                    return score;
                });

    }
    public Mono<String> explainCodeQuality(String problemDescription, String code, Long userId) {
        String prompt = """
        Kullanıcıya puan vermeden,
        Aşağıdaki Java kodunda temiz kod prensiplerine uygun olup olmadıgını kontrol et.
        Temiz kod prensiplerine göre hangi alanlar geliştirilebilir, kısa ve yapıcı şekilde belirtin.
        public class UserSolution{
        public static void main(String[] args) throws Exception {
        Yukarıdaki gibi sınıf yapısı zaten tanımlı, bunu değerlendirmeye katma. Bunu veren benim.
        Maddeler yazarken * gibi ifadeler kullanma.

        Problem Tanımı:
        %s
        Kod:
        %s
        """.formatted(problemDescription, code);

        return webClientBuilder.build()
                .post()
                .uri(apiUrl)
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .bodyValue(Map.of(
                        "model", "deepseek-coder",
                        "max_tokens", 750,
                        "temperature", 0.2,
                        "messages", new Object[]{
                                Map.of("role", "system", "content", "Sen deneyimli bir Java code reviewer’sın. Açıklayıcı ancak kısa yaz."),
                                Map.of("role", "user", "content", prompt)
                        }
                ))
                .retrieve()
                .bodyToMono(LLMResponse.class)
                .map(response -> {
                    String feedback = "Açıklama alınamadı.";
                    if (response.getChoices() != null && !response.getChoices().isEmpty()) {
                        feedback = response.getChoices().get(0).getMessage().getContent();
                    }
                    feedbackWebSocketController.sendFeedback(userId, new WebSocketMessageDTO("CODE_QUALITY_REASON", feedback, null));
                    return feedback;
                });
    }
}
