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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class LLMFeedbackService {

    @Value("${llm.api.key}")
    private String apiKey;

    @Value("${llm.api.url}")
    private String apiUrl;

    private final WebClient.Builder webClientBuilder;

    private final FeedbackWebSocketController feedbackWebSocketController;

    public Mono<String> getFeedback(String problemDescription, String code, String language, String errorMessage, Long userId) {
        language = language != null ? language.toLowerCase() : "java";

        String systemMessage = switch (language) {
            case "python" -> "Sen deneyimli bir Python code reviewer’sın. Sadece puanla.";
            default -> "Sen deneyimli bir Java code reviewer’sın. Sadece puanla.";
        };

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
                                Map.of("role", "system", "content", systemMessage),
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

    public Mono<Integer> evaluateCodeQuality(String problemDescription, String code, String language, Long userId) {
        language = language != null ? language.toLowerCase() : "java";

        String systemMessage = switch (language) {
            case "python" -> "Sen deneyimli bir Python code reviewer’sın. Sadece puanla.";
            default -> "Sen deneyimli bir Java code reviewer’sın. Sadece puanla.";
        };

        String langPrompt = switch (language) {
            case "python" -> """
            Aşağıdaki Python kodunu temiz kod prensiplerine göre değerlendir.
            Kriterler:
            - Anlaşılabilirlik (isimlendirme, okunabilirlik)
            - Gereksiz kodlardan arındırılmış olması
            - Fonksiyonların tek sorumluluğu olması
            - Kod tekrarı olmaması

            Problem Tanımı:
            %s
            Kod:
            %s

            [Lütfen bu kod kalitesine 0 ile 100 arasında (sınırlar dahil) bir tam sayı puan verin. Başka herhangi bir metin veya açıklama eklemeyin.]
            """;
            default -> """
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

            [Lütfen bu kod kalitesine 0 ile 100 arasında (sınırlar dahil) bir tam sayı puan verin. Başka herhangi bir metin veya açıklama eklemeyin.]
            """;
        };

        String prompt = langPrompt.formatted(problemDescription, code);

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
                                Map.of("role", "system", "content", systemMessage),
                                Map.of("role", "user", "content", prompt)
                        }
                ))
                .retrieve()
                .bodyToMono(LLMResponse.class)
                .map(response -> {
                    String content = response.getChoices().get(0).getMessage().getContent();
                    int score;
                    try {
                        Pattern pattern = Pattern.compile("\\d+");
                        Matcher matcher = pattern.matcher(content);
                        if (matcher.find()) {
                            score = Integer.parseInt(matcher.group(0));
                            score = Math.min(score, 100); // 100'den büyükse sınırla
                        } else {
                            score = 0;
                        }
                    } catch (NumberFormatException e) {
                        score = 0;
                    }

                    feedbackWebSocketController.sendFeedback(
                            userId,
                            new WebSocketMessageDTO("CODE_QUALITY_SCORE", null, score)
                    );

                    return score;
                });
    }

    public Mono<String> explainCodeQuality(String problemDescription, String code, String language, Long userId) {
        language = language != null ? language.toLowerCase() : "java";

        String systemMessage = switch (language) {
            case "python" -> "Sen deneyimli bir Python code reviewer’sın. Açıklayıcı ancak kısa yaz.";
            default -> "Sen deneyimli bir Java code reviewer’sın. Açıklayıcı ancak kısa yaz.";
        };

        String langPrompt = switch (language) {
            case "python" -> """
            Kullanıcıya puan vermeden,
            Aşağıdaki Python kodunu temiz kod prensiplerine göre değerlendir.
            Hangi alanlar geliştirilebilir, kısa ve yapıcı bir şekilde açıkla.
            Lütfen maddelendirme yaparken * veya - kullanma.

            Problem Tanımı:
            %s
            Kod:
            %s
            """;

            default -> """
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
            """;
        };

        String prompt = langPrompt.formatted(problemDescription, code);

        return webClientBuilder.build()
                .post()
                .uri(apiUrl)
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .bodyValue(Map.of(
                        "model", "deepseek-coder",
                        "max_tokens", 750,
                        "temperature", 0.2,
                        "messages", new Object[] {
                                Map.of("role", "system", "content", systemMessage),
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
