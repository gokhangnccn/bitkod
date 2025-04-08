package com.gokhan.bitcode.service;

import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.dtos.AuthResponse;
import com.gokhan.bitcode.dtos.LoginRequest;
import com.gokhan.bitcode.dtos.RegisterRequest;
import com.gokhan.bitcode.entity.UserEntity;
import com.gokhan.bitcode.enums.Role;
import com.gokhan.bitcode.repository.UserRepository;
import com.gokhan.bitcode.utils.JwtService;
import com.gokhan.bitcode.utils.UserClaims;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public ApiResponse<AuthResponse> register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username()) ||
                userRepository.existsByEmail(request.email())) {
            return ApiResponse.badRequest("BIT-1006", "This user already exists");
        }

        UserEntity user = new UserEntity();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setCreatedAt(LocalDateTime.now());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.USER);
        userRepository.save(user);

        UserClaims claims = new UserClaims(
                user.getId().toString(),
                user.getEmail(),
                user.getRole().name()
        );

        String token = jwtService.generateToken(claims);
        return ApiResponse.success(new AuthResponse(token));
    }

    public ApiResponse<AuthResponse> login(LoginRequest request) {
        UserEntity user = userRepository.findByUsername(request.username())
                .orElse(null);

        if (user == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            return ApiResponse.badRequest("BIT-1007", "Invalid username or password");
        }

        UserClaims claims = new UserClaims(
                user.getId().toString(),
                user.getEmail(),
                user.getRole().name()
        );

        String token = jwtService.generateToken(claims);
        return ApiResponse.success(new AuthResponse(token));
    }
}
