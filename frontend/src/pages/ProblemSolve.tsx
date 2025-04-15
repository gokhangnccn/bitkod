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
  const [code, setCode] = useState('// Write your Java solution here\n');
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
          console.log('WebSocket bağlantısı başarılı!');
          websocketService.subscribe(`/user/${userId}/topic/feedback`, (message) => {
            const feedback = typeof message === 'string' ? message : message?.feedback || message.body;
            console.log('Feedback received:', feedback);
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

  const handleSubmit = async () => {
    if (!problem) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.post('/submissions', {
        problemId: problem.id,
        code,
        language: 'JAVA',
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
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">{problem.title}</h1>
                <div className="prose max-w-none">
                  <h2 className="text-lg font-semibold text-gray-900">Problem Description</h2>
                  <p className="text-gray-600 whitespace-pre-wrap">{problem.description}</p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Examples</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Input:</h3>
                    <pre className="mt-1 bg-gray-50 rounded p-3 text-sm text-gray-800">{problem.exampleInput}</pre>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Output:</h3>
                    <pre className="mt-1 bg-gray-50 rounded p-3 text-sm text-gray-800">{problem.exampleOutput}</pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Solution</h2>
                  <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Running...' : 'Run Code'}
                  </button>
                </div>
                <div className="h-[400px] border rounded-lg overflow-hidden">
                  <Editor
                      height="100%"
                      defaultLanguage="java"
                      theme="vs-dark"
                      value={code}
                      onChange={(value) => setCode(value || '')}
                      options={{ minimap: { enabled: false }, fontSize: 14, lineNumbers: 'on', automaticLayout: true }}
                  />
                </div>
              </div>

              {result && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center mb-4">
                      {result.passed ? (
                          <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                      ) : (
                          <XCircle className="h-6 w-6 text-red-500 mr-2" />
                      )}
                      <h2 className="text-lg font-semibold text-gray-900">
                        {result.passed ? 'Success!' : 'Test Cases Failed'}
                      </h2>
                    </div>

                    {result.output && (
                        <div className="mb-4">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Output:</h3>
                          <pre className="bg-gray-50 rounded p-3 text-sm text-gray-800 whitespace-pre-wrap">{result.output}</pre>
                        </div>
                    )}

                    {result.errorMessage && (
                        <div className="mb-4">
                          <h3 className="text-sm font-medium text-red-700 mb-2">Error:</h3>
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
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-2">AI Feedback:</h3>
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
