package com.gokhan.bitcode.service;

import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.dtos.UserProfileDTO;
import com.gokhan.bitcode.entity.UserEntity;
import com.gokhan.bitcode.repository.UserRepository;
import com.gokhan.bitcode.utils.UserClaims;
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
}

