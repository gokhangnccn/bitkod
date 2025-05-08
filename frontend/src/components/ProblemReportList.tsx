import React, { useEffect, useState } from 'react';
import { ProblemReport, ReportCategoryLabels, ReportStatus, ReportStatusLabels } from '../types/problem';
import { problemReportService } from '../services/problemReportService';
import { AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';

export function ProblemReportList() {
    const [reports, setReports] = useState<ProblemReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedReport, setSelectedReport] = useState<ProblemReport | null>(null);
    const [adminResponse, setAdminResponse] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        try {
            const data = await problemReportService.getProblemReports();
            setReports(data);
        } catch (err: any) {
            setError(err.response?.data?.Message || 'Raporlar yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (status: ReportStatus) => {
        if (!selectedReport) return;

        setIsUpdating(true);
        try {
            const updated = await problemReportService.updateReportStatus(
                selectedReport.id,
                status,
                adminResponse
            );
            setReports(reports.map(r => r.id === updated.id ? updated : r));
            setSelectedReport(null);
            setAdminResponse('');
        } catch (err: any) {
            setError(err.response?.data?.Message || 'Durum güncellenirken bir hata oluştu');
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusIcon = (status: ReportStatus) => {
        switch (status) {
            case ReportStatus.RESOLVED:
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case ReportStatus.REJECTED:
                return <XCircle className="h-5 w-5 text-red-500" />;
            case ReportStatus.UNDER_REVIEW:
                return <Clock className="h-5 w-5 text-yellow-500" />;
            default:
                return <Clock className="h-5 w-5 text-gray-500" />;
        }
    };

    if (loading) {
        return <div className="text-center py-4">Yükleniyor...</div>;
    }

    if (error) {
        return (
            <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-md flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Problem Raporları</h2>

            <div className="grid gap-4">
                {reports.map(report => (
                    <div
                        key={report.id}
                        className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                {getStatusIcon(report.status)}
                                <span className="font-medium">
                                    {ReportStatusLabels[report.status]}
                                </span>
                            </div>
                            <span className="text-sm text-gray-500">
                                {new Date(report.reportedAt).toLocaleDateString('tr-TR')}
                            </span>
                        </div>

                        <div className="mb-2">
                            <span className="text-sm font-medium">Kategori: </span>
                            <span>{ReportCategoryLabels[report.category]}</span>
                        </div>

                        <p className="text-gray-700 dark:text-gray-300 mb-2">
                            {report.feedback}
                        </p>

                        {report.adminResponse && (
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-zinc-700 rounded">
                                <p className="text-sm font-medium">Admin Yanıtı:</p>
                                <p className="text-sm">{report.adminResponse}</p>
                            </div>
                        )}

                        {report.status === ReportStatus.PENDING && (
                            <div className="mt-4 space-y-2">
                                <textarea
                                    value={adminResponse}
                                    onChange={(e) => setAdminResponse(e.target.value)}
                                    className="w-full p-2 border rounded-md dark:bg-zinc-700 dark:border-zinc-600"
                                    rows={3}
                                    placeholder="Admin yanıtı..."
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleStatusUpdate(ReportStatus.RESOLVED)}
                                        disabled={isUpdating}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                                    >
                                        Çözüldü
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(ReportStatus.REJECTED)}
                                        disabled={isUpdating}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                                    >
                                        Reddet
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}