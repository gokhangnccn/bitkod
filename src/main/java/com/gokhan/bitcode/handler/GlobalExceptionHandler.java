package com.gokhan.bitcode.handler;

import com.gokhan.bitcode.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(ApiResponse.badRequest("BIT-400", ex.getMessage()));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Object>> handleConstraintViolation(ConstraintViolationException ex) {
        return ResponseEntity.badRequest().body(ApiResponse.badRequest("BIT-400", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidation(MethodArgumentNotValidException ex) {
        String errorMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(fieldError -> fieldError.getField() + ": " + fieldError.getDefaultMessage())
                .findFirst()
                .orElse("Geçersiz giriş verisi");
        return ResponseEntity.badRequest().body(ApiResponse.badRequest("BIT-400", errorMessage));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleAllOther(HttpServletRequest request, Exception ex) {
        // /actuator/health isteği geldiyse bu handler'ı atla
        if ("/actuator/health".equals(request.getRequestURI())) {
            return null; // Spring default actuator yanıtını versin (200 OK)
        }
        ex.printStackTrace();
        return ResponseEntity.internalServerError()
                .body(ApiResponse.serverError("BIT-500", "Bilinmeyen bir hata oluştu."));
    }
}
