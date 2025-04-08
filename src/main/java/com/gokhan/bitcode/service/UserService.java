package com.gokhan.bitcode.service;

import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.entity.UserEntity;
import com.gokhan.bitcode.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public ApiResponse<List<UserEntity>> getAllUsers() {
        return ApiResponse.success(userRepository.findAll());
    }

    public ApiResponse<UserEntity> getUserById(Long id) {
        return userRepository.findById(id)
                .map(ApiResponse::success)
                .orElse(ApiResponse.userNotFound());
    }

    public ApiResponse<Void> deleteUserById(Long id) {
        if (!userRepository.existsById(id)) {
            return ApiResponse.userNotFound();
        }
        try {
            userRepository.deleteById(id);
            return ApiResponse.success(null);
        } catch (Exception e) {
            return ApiResponse.badRequest("BIT-1003", "Kullanıcı silinirken bir hata oluştu.");
        }
    }
}

