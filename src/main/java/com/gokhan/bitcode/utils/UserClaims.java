package com.gokhan.bitcode.utils;


import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserClaims {
    private String userId;
    private String email;
    private String role;
}
