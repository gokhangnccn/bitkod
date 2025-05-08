package com.gokhan.bitcode.enums;

public enum ReportStatus {
    PENDING("Beklemede"),
    UNDER_REVIEW("İnceleniyor"),
    RESOLVED("Çözüldü"),
    REJECTED("Reddedildi");

    private final String displayName;

    ReportStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
} 