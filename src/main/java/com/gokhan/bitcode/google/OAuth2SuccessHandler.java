package com.gokhan.bitcode.google;

import com.gokhan.bitcode.entity.UserEntity;
import com.gokhan.bitcode.enums.Role;
import com.gokhan.bitcode.repository.UserRepository;
import com.gokhan.bitcode.utils.JwtService;
import com.gokhan.bitcode.utils.UserClaims;
import com.gokhan.bitcode.utils.UsernameValidator;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        org.springframework.security.core.Authentication authentication) throws IOException, ServletException {

        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        Map<String, Object> attributes = oauthToken.getPrincipal().getAttributes();

        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");

        String baseUsername = generateBaseUsername(name, email);
        String candidateUsername = generateUniqueUsername(baseUsername);
        if (!UsernameValidator.isValid(candidateUsername)) {
            candidateUsername = generateFallbackUsername();
        }
        final String uniqueUsername = candidateUsername;

        UserEntity user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    UserEntity newUser = new UserEntity();
                    newUser.setEmail(email);
                    newUser.setUsername(uniqueUsername);
                    newUser.setRole(Role.USER);
                    newUser.setCreatedAt(LocalDateTime.now());
                    newUser.setPasswordHash(null); // Google ile giriş yapıldığı için
                    newUser.setProvider("GOOGLE");
                    newUser.setEnabled(true);
                    return userRepository.save(newUser);
                });

        // Eğer mevcut kullanıcının kullanıcı adı kurallara uymuyorsa güncelle
        if (!UsernameValidator.isValid(user.getUsername())) {
            String fixedUsername = generateUniqueUsername(generateBaseUsername(name, email));
            if (!UsernameValidator.isValid(fixedUsername)) {
                fixedUsername = generateFallbackUsername();
            }
            user.setUsername(fixedUsername);
            userRepository.save(user);
        }

        UserClaims claims = new UserClaims(
                user.getId().toString(),
                user.getEmail(),
                user.getRole().name()
        );
        String jwt = jwtService.generateToken(claims);

        System.out.println("OAuth2 Success - Redirecting to: https://www.bitkod.org/oauth2-success?token=" + jwt);

        getRedirectStrategy().sendRedirect(request, response, "https://www.bitkod.org/oauth2-success?token=" + jwt);
    }

    private String generateUniqueUsername(String baseUsername) {
        String sanitized = trimToMaxLength(baseUsername);
        String username = sanitized;
        int counter = 1;

        while (userRepository.existsByUsername(username) || !UsernameValidator.isValid(username)) {
            String suffix = String.valueOf(counter);
            int maxBaseLength = 20 - suffix.length();
            String prefix = sanitized.substring(0, Math.min(sanitized.length(), maxBaseLength));
            username = prefix + suffix;
            counter++;
        }

        return username;
    }

    private String trimToMaxLength(String input) {
        if (input.length() > 20) {
            return input.substring(0, 20);
        }
        return input;
    }

    private String generateFallbackUsername() {
        String fallback;
        do {
            fallback = "user_" + UUID.randomUUID().toString().substring(0, 6);
        } while (userRepository.existsByUsername(fallback) || !UsernameValidator.isValid(fallback));
        return fallback;
    }

    private String generateBaseUsername(String name, String email) {
        String base = name != null ? name : email.split("@")[0];
        String cleaned = base
                .toLowerCase()
                .replaceAll("[çÇ]", "c")
                .replaceAll("[ğĞ]", "g")
                .replaceAll("[ıİ]", "i")
                .replaceAll("[öÖ]", "o")
                .replaceAll("[şŞ]", "s")
                .replaceAll("[üÜ]", "u")
                .replaceAll("\\s+", "_")
                .replaceAll("[^a-z0-9_]", "");

        // Min 3 karakter
        if (cleaned.length() < 3) {
            cleaned = "user_" + UUID.randomUUID().toString().substring(0, 6);
        }

        cleaned = trimToMaxLength(cleaned);
        return cleaned;
    }

}
