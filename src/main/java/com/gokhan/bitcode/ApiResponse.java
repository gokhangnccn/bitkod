package com.gokhan.bitcode;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

@Getter
public class ApiResponse<T> {

    @JsonProperty("IsSucceeded")
    private final boolean isSucceeded;

    @JsonProperty("ResultCode")
    private final int resultCode;

    @JsonProperty("Label")
    private final String label;

    @JsonProperty("Message")
    private final String message;

    @JsonProperty("Data")
    private final T data;

    private ApiResponse(boolean isSucceeded, int resultCode, String label, String message, T data) {
        this.isSucceeded = isSucceeded;
        this.resultCode = resultCode;
        this.label = label;
        this.message = message;
        this.data = data;
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, 200, "BIT-0000", "Successful", data);
    }

    public static <T> ApiResponse<T> serverError() {
        return new ApiResponse<>(false, 500, "BIT-500", "Internal Server Error", null);
    }

    public static <T> ApiResponse<T> serverError(String label, String message) {
        return new ApiResponse<>(false, 500, label, message, null);
    }

    public static <T> ApiResponse<T> unauthorized() {
        return new ApiResponse<>(false, 401, "BIT-401", "Unauthorized", null);
    }

    public static <T> ApiResponse<T> unauthorized(String message) {
        return new ApiResponse<>(false, 401, "BIT-401", message, null);
    }

    public static <T> ApiResponse<T> forbidden(String message) {
        return new ApiResponse<>(false, 403, "BIT-403", message, null);
    }

    public static <T> ApiResponse<T> badRequest(String label, String message) {
        return new ApiResponse<>(false, 400, label, message, null);
    }

    public static <T> ApiResponse<T> notFound(String label, String message) {
        return new ApiResponse<>(false, 404, label, message, null);
    }

    public static <T> ApiResponse<T> userNotFound() {
        return notFound("BIT-1001", "User not found");
    }

    public static <T> ApiResponse<T> problemNotFound() {
        return notFound("BIT-1002", "Problem not found");
    }

    public static <T> ApiResponse<T> testCaseMismatch() {
        return badRequest("BIT-1003", "Test case output mismatch");
    }

    public static <T> ApiResponse<T> codeExecutionError() {
        return serverError("BIT-1004", "Code execution failed");
    }

    public static <T> ApiResponse<T> llmFeedbackUnavailable() {
        return serverError("BIT-1005", "LLM feedback service unavailable");
    }

    public static <T> ApiResponse<T> fail(String label, String message) {
        return new ApiResponse<>(false, 400, label, message, null);
    }

    public static <T> ApiResponse<T> fail(String message) {
        return new ApiResponse<>(false, 400, "BIT-9999", message, null);
    }

    @JsonIgnore
    public boolean getSucceeded() {
        return isSucceeded;
    }
}
