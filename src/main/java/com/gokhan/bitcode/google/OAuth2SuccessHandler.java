package com.gokhan.bitcode.google;

import com.gokhan.bitcode.entity.UserEntity;
import com.gokhan.bitcode.enums.Role;
import com.gokhan.bitcode.repository.UserRepository;
import com.gokhan.bitcode.utils.JwtService;
import com.gokhan.bitcode.utils.UserClaims;
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
        String uniqueUsername = generateUniqueUsername(baseUsername);


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

        UserClaims claims = new UserClaims(
                user.getId().toString(),
                user.getEmail(),
                user.getRole().name()
        );
        String jwt = jwtService.generateToken(claims);

        getRedirectStrategy().sendRedirect(request, response, "http://localhost:3000/oauth2-success?token=" + jwt);
    }

    private String generateUniqueUsername(String baseUsername) {
        String username = baseUsername;
        int counter = 1;

        while (userRepository.existsByUsername(username)) {
            username = baseUsername + counter;
            counter++;
        }

        return username;
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

        // Minimum 3 karakter zorunluluğu
        if (cleaned.length() < 3) {
            cleaned = "user_" + UUID.randomUUID().toString().substring(0, 6);
        }

        return cleaned;
    }

}
