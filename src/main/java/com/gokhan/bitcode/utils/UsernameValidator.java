package com.gokhan.bitcode.utils;

public class UsernameValidator {
    private static final String REGEX = "^[a-z0-9_]{3,20}$"; // lowercase letters, digits, underscore, length 3-20

    public static boolean isValid(String username) {
        if (username == null) {
            return false;
        }
        return username.matches(REGEX);
    }
} 