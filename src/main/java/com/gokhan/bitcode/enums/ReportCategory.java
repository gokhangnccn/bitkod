package com.gokhan.bitcode.enums;

public enum ReportCategory {
    INCORRECT_TEST_CASES("Hatalı Test Durumları"),
    UNCLEAR_DESCRIPTION("Belirsiz Açıklama"),
    WRONG_SOLUTION("Hatalı Çözüm"),
    TECHNICAL_ISSUE("Teknik Sorun"),
    OTHER("Diğer");

    private final String displayName;

    ReportCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
} 