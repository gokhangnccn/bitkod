import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Editor } from '@monaco-editor/react';
import { Play, AlertCircle, CheckCircle, XCircle, Bot } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/axios';
import { websocketService } from '../api/websocket.ts';

interface Problem {
  id: number;
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  exampleInput: string;
  exampleOutput: string;
}

interface SubmissionResponse {
  passed: boolean;
  output: string;
  errorMessage?: string;
  llmFeedback?: string;
  id?: number;
}

export function ProblemSolve() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<'JAVA' | 'PYTHON'>('JAVA');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingFeedback, setIsRequestingFeedback] = useState(false);
  const [result, setResult] = useState<SubmissionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchProblem = async () => {
      try {
        const response = await api.get(`/problems/${id}`);
        if (response.data.IsSucceeded) {
          setProblem(response.data.Data);
        } else {
          setError('Soru bilgisi alınamadı');
        }
      } catch (err: any) {
        setError(err.response?.data?.Message || 'Soru bilgisi alınırken hata oluştu');
      }
    };

    const connectWebSocket = async () => {
      try {
        const res = await api.get('/auth/me');
        const userId = res.data?.Data?.userId || res.data?.Data?.id;
        if (!userId) return;

        websocketService.connect(() => {
          websocketService.subscribe(`/user/${userId}/topic/feedback`, (message) => {
            const feedback = typeof message === 'string' ? message : message?.feedback || message.body;
            setIsRequestingFeedback(false);
            setResult((prev) => ({
              ...(prev || { passed: false, output: '', errorMessage: '', llmFeedback: '' }),
              llmFeedback: feedback,
            }));
          });
        });
      } catch (e) {
        console.error('WebSocket bağlantı hatası:', e);
      }
    };

    fetchProblem();
    connectWebSocket();

    return () => {
      websocketService.disconnect();
    };
  }, [id, isAuthenticated, navigate]);

  useEffect(() => {
    setCode(
        language === 'JAVA'
            ? `\npublic static void main(String[] args) throws Exception {
  // Kodunuzu buraya yazın
 
}`
            : '# Write your Python solution here\n'
    );
  }, [language]);

  const handleSubmit = async () => {
    if (!problem) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.post('/submissions', {
        problemId: problem.id,
        code,
        language,
      });

      if (response.data.IsSucceeded) {
        setResult(response.data.Data);
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
      setResult((prev) => prev && ({ ...prev, llmFeedback: 'LLM geri bildirimi hazırlanıyor...' }));
    } catch (e) {
      setIsRequestingFeedback(false);
      console.error(e);
    }
  };

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
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Problem Info */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl shadow-md p-6">
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">{problem.title}</h1>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Problem Açıklaması</h2>
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{problem.description}</p>
            </div>

            <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Örnek</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Örnek Giriş:</h3>
                  <pre className="mt-1 bg-gray-50 dark:bg-zinc-900 rounded p-3 text-sm text-gray-800 dark:text-gray-200">{problem.exampleInput}</pre>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Örnek Çıktı:</h3>
                  <pre className="mt-1 bg-gray-50 dark:bg-zinc-900 rounded p-3 text-sm text-gray-800 dark:text-gray-200">{problem.exampleOutput}</pre>
                </div>
              </div>
            </div>
          </div>

          {/* Solution Panel */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Çözümünüz</h2>
                <div className="flex items-center gap-3">
                  <select
                      className="border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm rounded-md px-3 py-1.5 text-gray-800 dark:text-white"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as 'JAVA' | 'PYTHON')}
                  >
                    <option value="JAVA">Java</option>
                    <option value="PYTHON">Python</option>
                  </select>

                  <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Çalıştırılıyor...' : 'Kodu Çalıştır'}
                  </button>
                </div>
              </div>

              <Editor
                  height="400px"
                  language={language === 'JAVA' ? 'java' : 'python'}
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    automaticLayout: true,
                  }}
              />
            </div>

            {/* Results */}
            {result && (
                <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl shadow-md p-6">
                  <div className="flex items-center mb-4">
                    {result.passed ? (
                        <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                    ) : (
                        <XCircle className="h-6 w-6 text-red-500 mr-2" />
                    )}
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {result.passed ? 'Tüm testler başarıyla geçti!' : 'Bazı testler başarısız oldu'}
                    </h2>
                  </div>

                  {result.output && (
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Çıktı:</h3>
                        <pre className="bg-gray-50 dark:bg-zinc-900 rounded p-3 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{result.output}</pre>
                      </div>
                  )}

                  {result.errorMessage && (
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-red-700 mb-2">Hata:</h3>
                        <pre className="bg-red-50 dark:bg-red-900/10 rounded p-3 text-sm text-red-800 dark:text-red-300 whitespace-pre-wrap">{result.errorMessage}</pre>
                      </div>
                  )}

                  {!result.passed && !result.llmFeedback && (
                      <button
                          onClick={requestLLMFeedback}
                          disabled={isRequestingFeedback}
                          className="mt-4 flex items-center gap-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded shadow"
                      >
                        <Bot className="w-4 h-4" />
                        {isRequestingFeedback ? 'Gönderiliyor...' : 'LLM Feedback Al'}
                      </button>
                  )}

                  {result.llmFeedback && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Yapay Zeka Geri Bildirimi:</h3>
                        <div className="bg-blue-50 dark:bg-blue-900/10 rounded p-3 text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                          {result.llmFeedback === 'LLM geri bildirimi hazırlanıyor...' && (
                              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800 dark:border-blue-300" />
                          )}
                          <span>{result.llmFeedback}</span>
                        </div>
                      </div>
                  )}
                </div>
            )}
          </div>
        </div>
      </div>
  );
}
