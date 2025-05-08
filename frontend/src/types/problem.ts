export enum ReportCategory {
    INCORRECT_TEST_CASES = "INCORRECT_TEST_CASES",
    UNCLEAR_DESCRIPTION = "UNCLEAR_DESCRIPTION",
    WRONG_SOLUTION = "WRONG_SOLUTION",
    TECHNICAL_ISSUE = "TECHNICAL_ISSUE",
    OTHER = "OTHER"
}

export enum ReportStatus {
    PENDING = "PENDING",
    UNDER_REVIEW = "UNDER_REVIEW",
    RESOLVED = "RESOLVED",
    REJECTED = "REJECTED"
}

export interface ReportProblemRequest {
    problemUid: string;
    feedback: string;
    category: ReportCategory;
}

export interface ProblemReport {
    id: number;
    problemUid: string;
    reportedBy: number;
    feedback: string;
    category: ReportCategory;
    status: ReportStatus;
    adminResponse?: string;
    resolvedBy?: string;
    reportedAt: string;
    resolvedAt?: string;
}

export const ReportCategoryLabels: Record<ReportCategory, string> = {
    [ReportCategory.INCORRECT_TEST_CASES]: "Hatalı Test Durumları",
    [ReportCategory.UNCLEAR_DESCRIPTION]: "Belirsiz Açıklama",
    [ReportCategory.WRONG_SOLUTION]: "Hatalı Çözüm",
    [ReportCategory.TECHNICAL_ISSUE]: "Teknik Sorun",
    [ReportCategory.OTHER]: "Diğer"
};

export const ReportStatusLabels: Record<ReportStatus, string> = {
    [ReportStatus.PENDING]: "Beklemede",
    [ReportStatus.UNDER_REVIEW]: "İnceleniyor",
    [ReportStatus.RESOLVED]: "Çözüldü",
    [ReportStatus.REJECTED]: "Reddedildi"
}; 