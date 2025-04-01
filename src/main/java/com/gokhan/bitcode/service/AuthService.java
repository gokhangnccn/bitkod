package com.gokhan.bitcode.service;

import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.dtos.AuthResponse;
import com.gokhan.bitcode.dtos.LoginRequest;
import com.gokhan.bitcode.dtos.RegisterRequest;
import com.gokhan.bitcode.entity.UserEntity;
import com.gokhan.bitcode.enums.Role;
import com.gokhan.bitcode.repository.UserRepository;
import com.gokhan.bitcode.utils.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
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

        String token = jwtService.generateToken(user.getUsername());
        return ApiResponse.success(new AuthResponse(token));
    }

    public ApiResponse<AuthResponse> login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password())
            );
        } catch (BadCredentialsException e) {
            return ApiResponse.badRequest("BIT-1007", "Invalid username or password");
        } catch (Exception e) {
            return ApiResponse.serverError();
        }

        String token = jwtService.generateToken(request.username());
        return ApiResponse.success(new AuthResponse(token));
    }

}

