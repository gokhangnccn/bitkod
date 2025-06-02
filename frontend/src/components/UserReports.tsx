import React, { useEffect, useState } from 'react';
import { api } from '../api/axios';
import { AlertCircle, CheckCircle2, Clock, XCircle, X } from 'lucide-react';

interface ProblemReport {
    id: number;
    problemUid: string;
    problemTitle?: string;
    category: string;
    feedback: string;
    status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
    reportedAt: string;
    resolvedAt: string | null;
    reportedBy: string;
    resolvedBy: string | null;
    adminResponse: string | null;
}

const statusIcons = {
    PENDING: <Clock className="h-5 w-5 text-yellow-500" />,
    UNDER_REVIEW: <AlertCircle className="h-5 w-5 text-blue-500" />,
    RESOLVED: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    REJECTED: <XCircle className="h-5 w-5 text-red-500" />
};

const statusText = {
    PENDING: 'Beklemede',
    UNDER_REVIEW: 'İnceleniyor',
    RESOLVED: 'Çözüldü',
    REJECTED: 'Reddedildi'
};

const categoryText = {
    WRONG_SOLUTION: 'Yanlış Çözüm',
    INCORRECT_TEST_CASES: 'Test Durumu Hatası',
    UNCLEAR_DESCRIPTION: 'Açıklama Hatası',
    TECHNICAL_ISSUE: 'Teknik Sorun',
    OTHER: 'Diğer'
};

export const UserReports: React.FC = () => {
    const [reports, setReports] = useState<ProblemReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedReport, setSelectedReport] = useState<ProblemReport | null>(null);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const response = await api.get('/problems/reports/user');

                if (response.data.IsSucceeded) {
                    const reportsData = response.data.Data;
                    
                    // Her rapor için problem başlığını al
                    const reportsWithTitles = await Promise.all(
                        reportsData.map(async (report: any) => {
                            try {
                                const problemResponse = await api.get(`/problems/${report.problemUid}`);
                                return {
                                    ...report,
                                    problemTitle: problemResponse.data.IsSucceeded 
                                        ? problemResponse.data.Data.title 
                                        : `Problem #${report.problemUid.slice(0, 8)}`
                                };
                            } catch (err) {
                                console.error('Error fetching problem title:', err);
                                return {
                                    ...report,
                                    problemTitle: `Problem #${report.problemUid.slice(0, 8)}`
                                };
                            }
                        })
                    );

                    setReports(reportsWithTitles);
                } else {
                    throw new Error(response.data.Message || 'Raporlar alınamadı');
                }
            } catch (err: any) {
                console.error('Error fetching reports:', err);
                setError(err.response?.data?.Message || 'Raporlar yüklenirken bir hata oluştu');
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    const ReportModal = ({ report, onClose }: { report: ProblemReport; onClose: () => void }) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {report.problemTitle}
                            </h3>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {categoryText[report.category as keyof typeof categoryText] || report.category}
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Rapor Detayı</h4>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {report.feedback}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {statusIcons[report.status]}
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {statusText[report.status]}
                            </span>
                        </div>

                        {report.adminResponse && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700">
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Admin Yanıtı</h4>
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {report.adminResponse}
                                </p>
                            </div>
                        )}

                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Rapor Tarihi: {new Date(report.reportedAt).toLocaleDateString('tr-TR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
                {error}
            </div>
        );
    }

    if (reports.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Henüz hiç problem raporu oluşturmamışsınız.
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {reports.map((report) => (
                    <div
                        key={report.id}
                        onClick={() => setSelectedReport(report)}
                        className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors duration-200"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {report.problemTitle}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                    {report.feedback}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {statusIcons[report.status]}
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {statusText[report.status]}
                                </span>
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {new Date(report.reportedAt).toLocaleDateString('tr-TR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {selectedReport && (
                <ReportModal
                    report={selectedReport}
                    onClose={() => setSelectedReport(null)}
                />
            )}
        </>
    );
}; 