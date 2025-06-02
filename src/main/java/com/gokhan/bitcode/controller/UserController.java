package com.gokhan.bitcode.controller;

import com.gokhan.bitcode.ApiResponse;
import com.gokhan.bitcode.dtos.UserProfileDTO;
import com.gokhan.bitcode.dtos.UsernameUpdateDTO;
import com.gokhan.bitcode.entity.UserEntity;
import com.gokhan.bitcode.service.UserService;
import com.gokhan.bitcode.utils.UserClaims;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserEntity>>> getAllUsers(Authentication authentication) {
        UserClaims userClaims = (UserClaims) authentication.getPrincipal();
        return ResponseEntity.ok(userService.getAllUsers(userClaims));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserProfileDTO>> getUserById(@PathVariable Long id,
                                                                   Authentication authentication) {
        UserClaims userClaims = (UserClaims) authentication.getPrincipal();
        return ResponseEntity.ok(userService.getUserById(id, userClaims));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id,
                                                        Authentication authentication) {
        UserClaims userClaims = (UserClaims) authentication.getPrincipal();
        return ResponseEntity.ok(userService.deleteUserById(id, userClaims));
    }

    @PutMapping("/{id}/username")
    public ResponseEntity<ApiResponse<UserProfileDTO>> updateUsername(@PathVariable Long id,
                                                                      @RequestBody UsernameUpdateDTO usernameUpdateDTO,
                                                                      Authentication authentication) {
        UserClaims userClaims = (UserClaims) authentication.getPrincipal();
        return ResponseEntity.ok(userService.updateUsername(id, usernameUpdateDTO.username(), userClaims));
    }

    @GetMapping("/check-username")
    public ResponseEntity<ApiResponse<Boolean>> checkUsernameAvailability(@RequestParam String username) {
        return ResponseEntity.ok(userService.isUsernameAvailable(username));
    }
}
