import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import AdvancedModal from '../components/AdvancedModal';

interface Problem {
  id: number;
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  createdAt: string;
}

export function Problems() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [solvedProblems, setSolvedProblems] = useState<{ [problemId: number]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');


  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await api.get('/problems');
        if (response.data.IsSucceeded) {
          setProblems(response.data.Data);
        } else {
          setError('Failed to fetch problems');
        }
      } catch (err: any) {
        setError(err.response?.data?.Message || 'An error occurred while fetching problems');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchSolvedDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = getUserIdFromToken(token);
        const response = await api.get(`/submissions/user/${userId}`);
        if (response.data.IsSucceeded) {
          const solvedMap: { [problemId: number]: string } = {};
          response.data.Data.forEach((s: any) => {
            if (s.passed && !solvedMap[s.problemId]) {
              solvedMap[s.problemId] = s.submittedAt;
            }
          });
          setSolvedProblems(solvedMap);
        }
      } catch (e) {
        console.error('Solved problems fetch failed', e);
      }
    };

    const getUserIdFromToken = (token: string | null) => {
      if (!token) return null;
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload).userId || JSON.parse(jsonPayload).sub;
      } catch (e) {
        return null;
      }
    };

    fetchProblems();
    fetchSolvedDetails();
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HARD':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleProblemClick = (e: React.MouseEvent, problemId: number) => {
    if (solvedProblems[problemId]) {
      e.preventDefault();
      setModalMessage(`Bu problemi ${new Date(solvedProblems[problemId]).toLocaleDateString()} tarihinde başarıyla çözdünüz. Yeniden açamazsınız.`);
      setShowModal(true);
    }
  };


  if (isLoading) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );
  }

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


  return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BookOpen className="h-8 w-8 mr-3 text-indigo-600"/>
              Problemler
              <span className="ml-4 text-sm text-gray-500 font-normal">
              ({Object.keys(solvedProblems).length}/{problems.length} solved)
              </span>
            </h1>
          </div>

          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {problems.map((problem) => (
                  <li
                      key={problem.id}
                      className={`transition-colors duration-150 ${solvedProblems[problem.id] ? 'opacity-70 bg-emerald-100' : 'hover:bg-gray-50'}`}
                  >
                    <Link
                        to={`/problems/${problem.id}`}
                        className="block p-6"
                        onClick={(e) => handleProblemClick(e, problem.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            {problem.title}{' '}
                            {solvedProblems[problem.id] && (
                                <CheckCircle className="inline-block h-5 w-5 text-green-500 ml-2"/>
                            )}
                          </h2>
                          <p className="text-gray-600 line-clamp-2">{problem.description}</p>
                        </div>
                        <div className="ml-6">
                      <span
                          className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${getDifficultyColor(problem.difficulty)}`}>
                        {problem.difficulty}
                      </span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-sm text-gray-500">
                        <span>Created: {new Date(problem.createdAt).toLocaleDateString()}</span>
                        {solvedProblems[problem.id] && (
                            <span className="ml-6 text-green-600">
                        Solved on: {new Date(solvedProblems[problem.id]).toLocaleDateString()}
                      </span>
                        )}
                      </div>
                    </Link>
                  </li>
              ))}
            </ul>
          </div>

          {problems.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">No problems found</h3>
                <p className="mt-2 text-gray-500">Check back later for new challenges.</p>
              </div>
          )}
        </div>
        <AdvancedModal
          show={showModal}
            onClose={() => setShowModal(false)}
            message={modalMessage}
        />
      </div>

  );
}
