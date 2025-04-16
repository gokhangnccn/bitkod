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
          setError('Failed to fetch problem details');
        }
      } catch (err: any) {
        setError(err.response?.data?.Message || 'An error occurred while fetching the problem');
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
        console.error('WebSocket bağlantısı sırasında kullanıcı bilgisi alınamadı:', e);
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
      setError(err.response?.data?.Message || 'An error occurred during submission');
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
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center text-red-700">
              <AlertCircle className="h-5 w-5 mr-3" />
              <span>{error}</span>
            </div>
          </div>
        </div>
    );
  }

  if (!problem) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Problem Info */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-6">{problem.title}</h1>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Problem Açıklaması</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{problem.description}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Örnek</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Örnek Giriş:</h3>
                    <pre className="mt-1 bg-gray-50 rounded p-3 text-sm text-gray-800">{problem.exampleInput}</pre>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Örnek Çıktı:</h3>
                    <pre className="mt-1 bg-gray-50 rounded p-3 text-sm text-gray-800">{problem.exampleOutput}</pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Solution Panel */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Çözümünüz</h2>
                  <div className="flex items-center gap-3">
                    <select
                        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as 'JAVA' | 'PYTHON')}
                    >
                      <option value="JAVA">Java</option>
                      <option value="PYTHON">Python</option>
                    </select>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
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
                      lineNumbers: 'on',
                      automaticLayout: true,
                    }}
                />
              </div>

              {/* Results */}
              {result && (
                  <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                    <div className="flex items-center mb-4">
                      {result.passed ? (
                          <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                      ) : (
                          <XCircle className="h-6 w-6 text-red-500 mr-2" />
                      )}
                      <h2 className="text-lg font-semibold text-gray-900">
                        {result.passed ? 'Tüm testler başarıyla geçti!' : 'Bazı testler başarısız oldu'}
                      </h2>
                    </div>

                    {result.output && (
                        <div className="mb-4">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Çıktı:</h3>
                          <pre className="bg-gray-50 rounded p-3 text-sm text-gray-800 whitespace-pre-wrap">{result.output}</pre>
                        </div>
                    )}

                    {result.errorMessage && (
                        <div className="mb-4">
                          <h3 className="text-sm font-medium text-red-700 mb-2">Hata:</h3>
                          <pre className="bg-red-50 rounded p-3 text-sm text-red-800 whitespace-pre-wrap">{result.errorMessage}</pre>
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
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Yapay Zeka Geri Bildirimi:</h3>
                          <div className="bg-blue-50 rounded p-3 text-sm text-blue-800 flex items-center gap-2">
                            {result.llmFeedback === 'LLM geri bildirimi hazırlanıyor...' && (
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800" />
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
      </div>
  );
}
