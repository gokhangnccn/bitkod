import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, AlertCircle, CheckCircle, XCircle, Bot, Clock, HardDrive, FileText, Code, Terminal, Award, Flag } from 'lucide-react';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/axios';
import { useWebSocket } from '../hooks/useWebSocket';
import { ReportProblemForm } from '../components/ReportProblemForm';
import CodeEditor from '../components/EnhancedCodeEditor';


interface Problem {
    id: number;
    uid: string;
    title: string;
    description: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    exampleInput: string;
    exampleOutput: string;
    timeLimit: number;
    memoryLimit: number;
}

interface SubmissionResponse {
    passed: boolean;
    output: string;
    errorMessage?: string;
    llmFeedback?: string;
    codeQualityScore?: number;
    id?: number;
}

export function ProblemSolve() {
    const { uid } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [userId, setUserId] = useState<number | null>(null);
    const [problem, setProblem] = useState<Problem | null>(null);

    const [javaCode, setJavaCode] = useState(`public static void main(String[] args) {\n    // Kodunuzu buraya yazın\n}`);
    const [pythonCode, setPythonCode] = useState(`# Çözümünüzü buraya yazın`);
    const [language, setLanguage] = useState<'JAVA' | 'PYTHON'>('JAVA');
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRequestingFeedback, setIsRequestingFeedback] = useState(false);
    const [isRequestingWhy, setIsRequestingWhy] = useState(false);

    const [result, setResult] = useState<SubmissionResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [codeScoreReceived, setCodeScoreReceived] = useState(false);
    const [codeQualityReason, setCodeQualityReason] = useState<string | null>(null);
    const [showPassedModal, setShowPassedModal] = useState(false);
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [reasonRequested, setReasonRequested] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    const code = language === 'JAVA' ? javaCode : pythonCode;
    const [isCodeChanged, setIsCodeChanged] = useState(false);

    const [loading, setLoading] = useState(false);
    const [refactorResult, setRefactorResult] = useState<string | null>(null);

    const isWhyRequestInProgress = useRef(false);
    const isRefactorRequestInProgress = useRef(false);

    const handleCodeChange = (updatedCode: string) => {
        if (language === 'JAVA') {
            setJavaCode(updatedCode);
        } else {
            setPythonCode(updatedCode);
        }
        setIsCodeChanged(true);
    };

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [notification]);


    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);


    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isCodeChanged) {
                e.preventDefault();
                e.returnValue = '';
                return 'Sayfadan çıkarsanız değişiklikleriniz kaybolacaktır, kabul ediyor musunuz?';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isCodeChanged]);


    useEffect(() => {
        const fetchUserId = async () => {
            try {
                const res = await api.get('/auth/me');
                const id = res.data?.Data?.userId || res.data?.Data?.id;
                if (id) setUserId(id);
            } catch (err) {
                console.error('Kullanıcı bilgisi alınamadı:', err);
            }
        };

        fetchUserId();
    }, []);

    useEffect(() => {
        const fetchProblem = async () => {
            try {
                const response = await api.get(`/problems/${uid}`);
                if (response.data.IsSucceeded) {
                    setProblem(response.data.Data);
                } else {
                    setError('Soru bilgisi alınamadı');
                }
            } catch (err: any) {
                setError(err.response?.data?.Message || 'Soru bilgisi alınırken hata oluştu');
            }
        };

        fetchProblem();
    }, [uid]);


    const handleWebSocketMessage = useCallback((data: any) => {
        if (data?.type === 'LLM_FEEDBACK') {
            setIsRequestingFeedback(false);
            setResult((prev) => prev ? { ...prev, llmFeedback: data.feedback } : null);
        }

        if (data?.type === 'CODE_QUALITY_SCORE') {
            setCodeScoreReceived(true);
            setResult((prev) => {
                if (!prev || !prev.passed) return prev;
                return { ...prev, codeQualityScore: data.score };
            });
        }

        if (data?.type === 'CODE_QUALITY_REASON') {
            setCodeQualityReason(data.feedback);
            setIsRequestingWhy(false);
        }

        if (data?.type === 'CODE_REFACTOR') {
            setRefactorResult(data.feedback);
        }
    }, []);

    useWebSocket(userId, handleWebSocketMessage);

    const handleSubmit = async () => {
        if (!problem) return;
        const currentCode = language === "JAVA" ? javaCode : pythonCode;
        setIsSubmitting(true);
        setError(null);
        setCodeScoreReceived(false);
        setIsCodeChanged(false);

        try {
            const response = await api.post('/submissions', {
                problemId: problem.id,
                code: currentCode,
                language,
            });
            if (response.data.IsSucceeded) {
                const submission = response.data.Data;
                setResult(submission);
                if (submission.passed) setShowPassedModal(true);
            } else {
                setError(response.data.Message);
            }
        } catch (err: any) {
            setError(err.response?.data?.Message || 'Gönderim sırasında bir hata oluştu');
        } finally {
            setIsSubmitting(false);
        }
    };

    const requestLLMFeedback = async () => {
        if (!result?.id) return;
        setIsRequestingFeedback(true);
        try {
            await api.post(`/llm-feedback/${result.id}`);
            setResult((prev) => prev && { ...prev, llmFeedback: 'LLM geri bildirimi hazırlanıyor...' });
        } catch (e) {
            setIsRequestingFeedback(false);
            console.error(e);
        }
    };

    const requestCodeQualityReason = async () => {
        if (!result?.id) return false;
        try {
            await api.post(`/llm-feedback/${result.id}/reason`);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        } finally {
            setIsRequestingWhy(false);
        }
    };

    // Prevent multiple rapid clicks on "Neden?" button
    const handleWhyClick = async () => {
        if (!result?.id || reasonRequested || isWhyRequestInProgress.current) return;

        isWhyRequestInProgress.current = true;
        setIsRequestingWhy(true);

        const success = await requestCodeQualityReason();

        if (success) {
            setReasonRequested(true);
            setShowReasonModal(true);
        }

        isWhyRequestInProgress.current = false;
    };

    const handleRefactorClick = async () => {
        if (!result?.id || loading || isRefactorRequestInProgress.current) return;

        isRefactorRequestInProgress.current = true;
        setLoading(true);

        try {
            const response = await api.post(`/llm-feedback/${result.id}/refactor`);
            if (response.status === 200) {
                alert("Kod iyileştirme görevi kuyruğa eklendi! Lütfen sonucu bekleyin.");
            }
        } catch (error) {
            console.error("Kod iyileştirme sırasında hata oluştu:", error);
            alert("Kod iyileştirme isteği başarısız oldu.");
        } finally {
            setLoading(false);
            isRefactorRequestInProgress.current = false;
        }
    };

    const InlineSpinner = (
        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
    );

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center px-4">
                <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 p-4 rounded-md flex items-center gap-3">
                    <AlertCircle className="h-5 w-5" />
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    if (!problem) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <>
        {isSubmitting && (
            <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center">
                <Loader message="Çalıştırılıyor..."/>
            </div>
        )}

            <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-8 transition-colors duration-300 relative">

                {/* Success Modal */}
            {showPassedModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg max-w-md w-full text-center transform transition-all">
                        <div className="mb-4">
                            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">Tebrikler!</h2>
                        {codeScoreReceived ? (
                            <>
                                <p className="text-gray-800 dark:text-gray-200 mb-6">
                                    Kod kalitesi puanınız: <span className="font-semibold text-xl">{result?.codeQualityScore} / 100</span>
                                </p>
                                <button
                                    onClick={() => setShowPassedModal(false)}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Devam Et
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-gray-800 dark:text-gray-200 mb-6">
                                    Problemi başarıyla çözdünüz. Kod kalitesi puanınız hazırlanıyor...
                                </p>
                                <div className="w-full flex justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent"></div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header with Actions */}
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                            {problem.title}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowReportModal(true)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                        >
                            <Flag className="w-4 h-4 mr-2" />
                            Problem Bildir
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Problem Info */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl shadow-md overflow-hidden">
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    Problem Açıklaması
                                </h2>
                                <div className="prose dark:prose-invert max-w-none">
                                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{problem.description}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl shadow-md overflow-hidden">
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                    <Code className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    Örnek
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Örnek Giriş:</h3>
                                        <pre className="mt-1 bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 text-sm text-gray-800 dark:text-gray-200 font-mono">{problem.exampleInput}</pre>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Örnek Çıktı:</h3>
                                        <pre className="mt-1 bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 text-sm text-gray-800 dark:text-gray-200 font-mono">{problem.exampleOutput}</pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Solution Panel */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl shadow-md overflow-hidden">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                        <Code className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                        Çözümünüz
                                    </h2>
                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-2 rounded-lg bg-gray-100 dark:bg-zinc-700 p-1 w-fit">
                                            {["JAVA", "PYTHON"].map((lang) => (
                                                <button
                                                    key={lang}
                                                    onClick={() => setLanguage(lang as "JAVA" | "PYTHON")}
                                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                                                        language === lang
                                                            ? "bg-indigo-600 text-white"
                                                            : "text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-zinc-600"
                                                    }`}
                                                >
                                                    {lang === "JAVA" ? "Java" : "Python"}
                                                    {language === lang && <CheckCircle className="w-4 h-4" />}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
                                                isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                                            }`}
                                        >
                                            <Play className="h-4 w-4 mr-2" />
                                            {isSubmitting ? 'Çalıştırılıyor...' : 'Kodu Çalıştır'}
                                        </button>
                                    </div>
                                </div>

                                <div className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                                    <CodeEditor
                                        value={code}
                                        onChange={handleCodeChange}
                                        language={language}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Results Panel */}
                        {result && (
                            <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl shadow-md overflow-hidden">
                                <div className="p-6">
                                    <div className="flex items-center mb-6">
                                        {result.passed ? (
                                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                                <CheckCircle className="h-6 w-6" />
                                                <h2 className="text-lg font-semibold">Tüm testler başarıyla geçti!</h2>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                                <XCircle className="h-6 w-6" />
                                                <h2 className="text-lg font-semibold">Bazı testler başarısız oldu</h2>
                                            </div>
                                        )}
                                    </div>

                                    {result.output && (
                                        <div className="mb-6">
                                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                <Terminal className="w-4 h-4" />
                                                Çıktı
                                            </h3>
                                            <pre className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 text-sm text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap">{result.output}</pre>
                                        </div>
                                    )}

                                    {result.errorMessage && (
                                        <div className="mb-6">
                                            <h3 className="text-sm font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4" />
                                                Hata
                                            </h3>
                                            <pre className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 text-sm text-red-800 dark:text-red-300 font-mono whitespace-pre-wrap">{result.errorMessage}</pre>
                                        </div>
                                    )}

                                    {!result.passed && !result.llmFeedback && (
                                        <button
                                            onClick={requestLLMFeedback}
                                            disabled={isRequestingFeedback}
                                            className="mt-4 flex items-center gap-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow transition-colors"
                                        >
                                            <Bot className="w-4 h-4" />
                                            {isRequestingFeedback ? 'Gönderiliyor...' : 'LLM Feedback Al'}
                                        </button>
                                    )}

                                    {result.llmFeedback && (
                                        <div className="mt-6">
                                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                Yapay Zeka Geri Bildirimi
                                            </h3>
                                            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                                                {result.llmFeedback === 'LLM geri bildirimi hazırlanıyor...' && (
                                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800 dark:border-blue-300" />
                                                )}
                                                <span>{result.llmFeedback}</span>
                                            </div>
                                        </div>
                                    )}

                                    {result.passed && result.codeQualityScore !== undefined && (
                                        <div className="mt-6">
                                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                <Award className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                Kod Kalitesi
                                            </h3>
                                            <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 text-sm text-green-800 dark:text-green-300 flex items-center gap-4">
                                                <CheckCircle className="w-4 h-4" />
                                                <span className="font-medium">{result.codeQualityScore} / 100</span>
                                                {result.codeQualityScore < 100 && (
                                                    <button
                                                        onClick={handleWhyClick}
                                                        disabled={isRequestingWhy || reasonRequested}
                                                        className="flex items-center gap-2 bg-indigo-100 dark:bg-zinc-700 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-lg shadow hover:bg-indigo-200 dark:hover:bg-zinc-600 disabled:opacity-50 text-sm font-medium transition-colors"
                                                    >
                                                        <Bot className="w-4 h-4"/>
                                                        {isRequestingWhy ? (
                                                            <>
                                                                {InlineSpinner} Gönderiliyor...
                                                            </>
                                                        ) : 'Neden?'}
                                                    </button>
                                                )}
                                            </div>

                                            {codeQualityReason && (
                                                <div className="mt-2 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-800 dark:text-yellow-300 text-sm p-4 rounded-lg">
                                                    {codeQualityReason}
                                                </div>
                                            )}
                                            <button
                                                onClick={handleRefactorClick}
                                                disabled={loading}
                                                className="mt-4 flex items-center gap-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg shadow transition-colors"
                                            >
                                                <Bot className="w-4 h-4" />
                                                {loading ? (
                                                    <>
                                                        {InlineSpinner} Gönderiliyor...
                                                    </>
                                                ) : 'Kodu İyileştir'}
                                            </button>

                                            {refactorResult && (
                                                <div className="mt-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg p-4">
                                                    <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-2">
                                                        <Bot className="w-4 h-4" />
                                                        İyileştirilmiş Kod
                                                    </h3>
                                                    <pre className="text-sm text-purple-800 dark:text-purple-300 font-mono whitespace-pre-wrap">
                                                {refactorResult}
                                                        </pre>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Report Problem Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg max-w-2xl w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                <Flag className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                                Problem Bildir
                            </h2>
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="mt-4">
                            <ReportProblemForm
                                problemUid={uid || ''}
                                onSuccess={() => {
                                    setShowReportModal(false);
                                    setNotification({
                                        message: 'Problem başarıyla raporlandı',
                                        type: 'success'
                                    });
                                }}
                                onCancel={() => setShowReportModal(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Notification */}
            {notification && (
                <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
                    notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                } text-white transition-opacity duration-300`}>
                    {notification.message}
                </div>
            )}

            {/* Code Quality Reason Modal */}
            {showReasonModal && codeQualityReason && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                                Kod Kalitesi Açıklaması
                            </h2>
                            <button
                                onClick={() => setShowReasonModal(false)}
                                className="text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                            {codeQualityReason}
                        </div>
                    </div>
                </div>
            )}
        </div>
        </>
    );
}
