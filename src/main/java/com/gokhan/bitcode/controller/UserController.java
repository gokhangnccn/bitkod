package com.gokhan.bitcode.controller;

import com.gokhan.bitcode.ApiResponse;
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
    public ResponseEntity<ApiResponse<UserEntity>> getUserById(@PathVariable Long id,
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
}
