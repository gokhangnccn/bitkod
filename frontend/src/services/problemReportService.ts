import { api } from '../api/axios';
import { ProblemReport, ReportProblemRequest, ReportStatus } from '../types/problem';

export const problemReportService = {
    reportProblem: async (request: ReportProblemRequest): Promise<ProblemReport> => {
        const response = await api.post('/problems/report', request);
        if (!response.data.IsSucceeded) {
            throw new Error(response.data.Message || 'Problem raporu oluşturulamadı');
        }
        return response.data.Data;
    },

    getProblemReports: async (): Promise<ProblemReport[]> => {
        try {
            const response = await api.get('/problems/reports/user');
            if (!response.data.IsSucceeded) {
                throw new Error(response.data.Message || 'Raporlar alınamadı');
            }
            return response.data.Data || [];
        } catch (error: any) {
            console.error('Raporlar alınırken hata:', error.response?.data || error);
            throw new Error(error.response?.data?.Message || 'Raporlar alınırken bir hata oluştu');
        }
    },

    updateReportStatus: async (
        reportId: number,
        status: ReportStatus,
        adminResponse?: string
    ): Promise<ProblemReport> => {
        const response = await api.put(`/problems/reports/${reportId}/status`, {}, {
            params: { status, adminResponse }
        });
        if (!response.data.IsSucceeded) {
            throw new Error(response.data.Message || 'Rapor durumu güncellenemedi');
        }
        return response.data.Data;
    }
}; 