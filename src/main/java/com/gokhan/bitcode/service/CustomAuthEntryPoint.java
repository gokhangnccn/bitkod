package com.gokhan.bitcode.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gokhan.bitcode.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class CustomAuthEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");

        ApiResponse<Object> responseBody = ApiResponse.unauthorized("Kimlik doğrulama başarısız. Giriş yapmanız gerekmektedir.");

        new ObjectMapper().writeValue(response.getOutputStream(), responseBody);
    }
}
