package com.gokhan.bitcode.service;

import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.dtos.AuthResponse;
import com.gokhan.bitcode.dtos.LoginRequest;
import com.gokhan.bitcode.dtos.RegisterRequest;
import com.gokhan.bitcode.entity.PasswordResetToken;
import com.gokhan.bitcode.entity.UserEntity;
import com.gokhan.bitcode.entity.VerificationToken;
import com.gokhan.bitcode.enums.Role;
import com.gokhan.bitcode.repository.PasswordResetTokenRepository;
import com.gokhan.bitcode.repository.UserRepository;
import com.gokhan.bitcode.repository.VerificationTokenRepository;
import com.gokhan.bitcode.utils.JwtService;
import com.gokhan.bitcode.utils.UserClaims;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final VerificationTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    private final String frontendUrl = "https://www.bitkod.org";

    @CacheEvict(value = "users", key = "'all'", beforeInvocation = true)
    public ApiResponse<AuthResponse> register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username()) ||
                userRepository.existsByEmail(request.email())) {
            return ApiResponse.badRequest("BIT-1006", "Böyle bir kullanıcı zaten mevcut.");
        }

        UserEntity user = new UserEntity();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setProvider("LOCAL");
        user.setCreatedAt(LocalDateTime.now());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.USER);
        user.setEnabled(false);
        userRepository.save(user);

        String token = UUID.randomUUID().toString();
        VerificationToken verificationToken = VerificationToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusHours(24))
                .build();
        tokenRepository.save(verificationToken);

        String verifyUrl = frontendUrl + "/verify-email?token=" + token;

        String subject = "Bitcode Hesabınızı Doğrulayın";
        Map<String, Object> variables = new HashMap<>();
        variables.put("username", user.getUsername());
        variables.put("verifyUrl", verifyUrl);

        emailService.sendHtmlTemplateMail(user.getEmail(), subject, "verify-email", variables);

        return ApiResponse.success(new AuthResponse(null, "Lütfen e-posta adresinizi doğrulayın."));
    }

    public ApiResponse<AuthResponse> login(LoginRequest request) {
        UserEntity user = userRepository.findByUsername(request.username())
                .orElse(null);

        if (user == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            return ApiResponse.badRequest("BIT-1007", "Invalid username or password");
        }

        if (!user.isEnabled()) {
            return ApiResponse.badRequest("BIT-1010", "E-posta doğrulaması yapılmamış.");
        }

        String token = generateTokenFromUser(user);
        return ApiResponse.success(new AuthResponse(token, null));
    }

    private String generateTokenFromUser(UserEntity user) {
        UserClaims claims = new UserClaims(
                user.getId().toString(),
                user.getEmail(),
                user.getRole().name()
        );
        return jwtService.generateToken(claims);
    }

    @Transactional
    public void sendResetPasswordEmail(String email) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("E-posta adresi sistemde bulunamadı."));

        // Geçerli token varsa tekrar gönderme
        passwordResetTokenRepository.findFirstByUserOrderByExpiryDateDesc(user)
                .filter(t -> !t.isExpired())
                .ifPresent(token -> {
                    throw new IllegalArgumentException("Zaten geçerli bir şifre sıfırlama bağlantısı gönderildi. Lütfen e-postanızı kontrol edin.");
                });

        // Eski tokenları sil
        passwordResetTokenRepository.deleteAllByUser(user);

        // Yeni token oluştur
        String token = UUID.randomUUID().toString();
        LocalDateTime expiryDate = LocalDateTime.now().plusMinutes(30);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(expiryDate)
                .build();

        passwordResetTokenRepository.save(resetToken);

        // E-posta gönder
        String resetUrl = frontendUrl + "/reset-password?token=" + token;
        Map<String, Object> variables = Map.of("resetLink", resetUrl);
        emailService.sendHtmlTemplateMail(user.getEmail(), "Şifre Sıfırlama", "forgot-password", variables);
    }


    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Geçersiz veya süresi dolmuş bağlantı."));

        if (resetToken.isExpired()) {
            throw new IllegalArgumentException("Şifre sıfırlama bağlantısının süresi dolmuş.");
        }

        UserEntity user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        passwordResetTokenRepository.delete(resetToken);
    }

    public boolean isResetTokenValid(String token) {
        return passwordResetTokenRepository.findByToken(token)
                .filter(t -> !t.isExpired())
                .isPresent();
    }


}
