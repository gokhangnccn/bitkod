package com.gokhan.bitcode.service;

import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.dtos.UserProfileDTO;
import com.gokhan.bitcode.entity.UserEntity;
import com.gokhan.bitcode.repository.UserRepository;
import com.gokhan.bitcode.utils.UserClaims;
import com.gokhan.bitcode.utils.UsernameValidator;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public ApiResponse<List<UserEntity>> getAllUsers(UserClaims userClaims) {
        if (!userClaims.getRole().equalsIgnoreCase("ADMIN")) {
            return ApiResponse.forbidden("Tüm kullanıcıları listelemek için admin yetkisi gereklidir.");
        }
        return ApiResponse.success(userRepository.findAll());
    }

    public ApiResponse<UserProfileDTO> getUserById(Long id, UserClaims userClaims) {
        boolean isAdmin = "ADMIN".equalsIgnoreCase(userClaims.getRole());
        boolean isOwner = userClaims.getUserId().equals(String.valueOf(id));

        if (!isAdmin && !isOwner) {
            return ApiResponse.forbidden("Sadece kendi bilgilerinizi görüntüleyebilirsiniz.");
        }

        return userRepository.findById(id)
                .map(user -> ApiResponse.success(
                        new UserProfileDTO(
                                user.getId(),
                                user.getUsername(),
                                user.getEmail(),
                                user.getCreatedAt()
                        )
                ))
                .orElse(ApiResponse.userNotFound());
    }

    public ApiResponse<UserProfileDTO> updateUsername(Long id, String newUsername, UserClaims userClaims) {
        boolean isAdmin = "ADMIN".equalsIgnoreCase(userClaims.getRole());
        boolean isOwner = userClaims.getUserId().equals(String.valueOf(id));

        if (!isAdmin && !isOwner) {
            return ApiResponse.forbidden("Sadece kendi kullanıcı adınızı güncelleyebilirsiniz.");
        }

        // Validate format
        if (!UsernameValidator.isValid(newUsername)) {
            return ApiResponse.badRequest("BIT-1007", "Geçersiz kullanıcı adı. Kullanıcı adı 3-20 karakter, küçük harf, rakam veya alt çizgi içermelidir.");
        }

        return userRepository.findById(id)
                .map(user -> {
                    if (user.getUsername().equalsIgnoreCase(newUsername)) {
                        return ApiResponse.success(
                                new UserProfileDTO(
                                        user.getId(),
                                        user.getUsername(),
                                        user.getEmail(),
                                        user.getCreatedAt()
                                )
                        );
                    }

                    if (userRepository.existsByUsername(newUsername)) {
                        return ApiResponse.<UserProfileDTO>badRequest("BIT-1006", "Kullanıcı adı zaten kullanılmakta.");
                    }

                    user.setUsername(newUsername);
                    userRepository.save(user);
                    return ApiResponse.success(
                            new UserProfileDTO(
                                    user.getId(),
                                    user.getUsername(),
                                    user.getEmail(),
                                    user.getCreatedAt()
                            )
                    );
                })
                .orElse(ApiResponse.<UserProfileDTO>userNotFound());
    }

    public ApiResponse<Void> deleteUserById(Long id, UserClaims userClaims) {
        if (!userClaims.getRole().equalsIgnoreCase("ADMIN")) {
            return ApiResponse.forbidden("Kullanıcı silme işlemi sadece admin yetkisiyle yapılabilir.");
        }

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

    public ApiResponse<Boolean> isUsernameAvailable(String username) {
        if (!UsernameValidator.isValid(username)) {
            return ApiResponse.badRequest("BIT-1007", "Geçersiz kullanıcı adı formatı.");
        }
        boolean exists = userRepository.existsByUsername(username);
        if (exists) {
            return ApiResponse.badRequest("BIT-1006", "Kullanıcı adı zaten kullanılmakta.");
        }
        return ApiResponse.success(true);
    }
}

