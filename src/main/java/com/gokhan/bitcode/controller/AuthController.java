package com.gokhan.bitcode.controller;

import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.dtos.AuthResponse;
import com.gokhan.bitcode.dtos.LoginRequest;
import com.gokhan.bitcode.dtos.RegisterRequest;
import com.gokhan.bitcode.entity.UserEntity;
import com.gokhan.bitcode.entity.VerificationToken;
import com.gokhan.bitcode.repository.UserRepository;
import com.gokhan.bitcode.repository.VerificationTokenRepository;
import com.gokhan.bitcode.service.AuthService;
import com.gokhan.bitcode.service.EmailService;
import com.gokhan.bitcode.utils.UserClaims;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final VerificationTokenRepository tokenRepository;


    public AuthController(AuthService authService, UserRepository userRepository, VerificationTokenRepository tokenRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body(ApiResponse.unauthorized("Kullanıcı oturum açmamış."));
        }

        UserClaims userClaims = (UserClaims) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(userClaims));
    }

    @GetMapping("/confirm")
    public ResponseEntity<ApiResponse<String>> confirmEmail(@RequestParam String token) {
        Optional<VerificationToken> optionalToken = tokenRepository.findByToken(token);

        if (optionalToken.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.badRequest("BIT-EMAIL-01", "Geçersiz veya hatalı doğrulama bağlantısı."));
        }

        VerificationToken verificationToken = optionalToken.get();

        if (verificationToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(ApiResponse.badRequest("BIT-EMAIL-02", "Doğrulama bağlantısının süresi dolmuş."));
        }

        UserEntity user = verificationToken.getUser();
        if (user.isEnabled()) {
            return ResponseEntity.ok(ApiResponse.success("Hesabınız zaten doğrulanmış."));
        }

        user.setEnabled(true);
        userRepository.save(user);
        tokenRepository.delete(verificationToken);

        return ResponseEntity.ok(ApiResponse.success("Hesabınız başarıyla doğrulandı."));
    }


    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body("E-posta boş olamaz.");
        }

        try {
            authService.sendResetPasswordEmail(email);
            return ResponseEntity.ok("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Bir hata oluştu: " + e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");

        if (token == null || newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body("Token ve yeni şifre gereklidir.");
        }

        try {
            authService.resetPassword(token, newPassword);
            return ResponseEntity.ok("Şifreniz başarıyla sıfırlandı.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Bir hata oluştu: " + e.getMessage());
        }
    }

    @GetMapping("/reset-password/validate")
    public ResponseEntity<?> validateResetToken(@RequestParam String token) {
        boolean isValid = authService.isResetTokenValid(token);
        return ResponseEntity.ok(Map.of("valid", isValid));
    }
}
