import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../api/axios';
import AdvancedModal from '../components/AdvancedModal';

interface Problem {
  id: number;
  uid: string;
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  createdAt: string;
}

export function Problems() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [solvedProblems, setSolvedProblems] = useState<Record<number, { submittedAt: string, codeQualityScore: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [modalMessage, setModalMessage] = useState('');const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'ALL' | 'EASY' | 'MEDIUM' | 'HARD'>('ALL');
  const [showSolved, setShowSolved] = useState(false);



  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [problemsRes, userRes] = await Promise.all([
          api.get('/problems'),
          api.get('/auth/me'),
        ]);

        if (!problemsRes.data.IsSucceeded || !userRes.data.IsSucceeded) {
          setError('Veriler alınırken hata oluştu');
          return;
        }

        const userId = userRes.data.Data.userId;
        setProblems(problemsRes.data.Data);

        const solvedRes = await api.get(`/submissions/user/${userId}`);
        if (solvedRes.data.IsSucceeded) {
          const solvedMap: Record<number, { submittedAt: string, codeQualityScore: number }> = {};
          solvedRes.data.Data.forEach((s: any) => {
            if (s.passed && !solvedMap[s.problemId]) {
              solvedMap[s.problemId] = {
                submittedAt: s.submittedAt,
                codeQualityScore: s.codeQualityScore ?? 0,
              };
            }
          });
          setSolvedProblems(solvedMap);

        }
      } catch (err: any) {
        setError(err.response?.data?.Message || 'Veriler alınırken hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300';
      case 'HARD':
        return 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getCodeQualityColor = (score: number) => {
    if (score >= 70) return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-800/20 dark:text-green-300';
    if (score >= 50) return 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-800/20 dark:text-yellow-300';
    return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-800/20 dark:text-red-300';
  };

  const handleProblemClick = (e: React.MouseEvent, problemId: number) => {
    if (solvedProblems[problemId]) {
      e.preventDefault();
      const solvedDate = new Date(solvedProblems[problemId].submittedAt).toLocaleDateString('tr-TR');
      setModalMessage(`Bu problemi ${solvedDate} tarihinde başarıyla çözdünüz. Yeniden açamazsınız.`);
      setShowModal(true);
    }
  };

  const filteredProblems = problems.filter((problem) => {
    const matchesQuery =
        problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        problem.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDifficulty =
        selectedDifficulty === 'ALL' || problem.difficulty === selectedDifficulty;

    const isSolved = !!solvedProblems[problem.id];
    const matchesSolvedStatus = showSolved ? !isSolved : true;

    return matchesQuery && matchesDifficulty && matchesSolvedStatus;
  });

  if (isLoading) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md p-4 flex items-center text-red-700 dark:text-red-300">
              <AlertCircle className="h-5 w-5 mr-3" />
              <span>{error}</span>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 space-y-4 sm:space-y-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <BookOpen className="h-8 w-8 mr-3 text-indigo-600"/>
              Problemler
              <span className="ml-4 text-sm text-gray-500 dark:text-gray-400 font-normal">
            ({Object.keys(solvedProblems).length}/{problems.length} çözüldü)
          </span>
            </h1>
          </div>

          <div
              className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-6 mb-8 shadow">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Filtrele</h2>

            <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
              {/* Arama Alanı */}
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Problem Ara
                </label>
                <input
                    id="search"
                    type="text"
                    placeholder="Başlık veya açıklama..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-700 dark:text-white"
                />
              </div>

              {/* Zorluk Seçici */}
              <div className="w-full lg:w-48">
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Zorluk
                </label>
                <select
                    id="difficulty"
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg shadow-sm dark:bg-zinc-700 dark:text-white"
                >
                  <option value="ALL">Tümü</option>
                  <option value="EASY">Kolay</option>
                  <option value="MEDIUM">Orta</option>
                  <option value="HARD">Zor</option>
                </select>
              </div>

              {/* Çözülmüşler Checkbox */}
              <div className="flex flex-col items-center gap-2">
                <label htmlFor="showSolved"
                       className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                  Yalnızca çözülmemişler
                </label>
                <button
                    onClick={() => setShowSolved(!showSolved)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                        showSolved ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-600'
                    }`}
                >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showSolved ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
                </button>
              </div>
            </div>
          </div>

          <div
              className="bg-white dark:bg-zinc-800 shadow-sm rounded-lg overflow-hidden border border-gray-100 dark:border-zinc-700">
            <ul className="divide-y divide-gray-200 dark:divide-zinc-700">
              {filteredProblems.map((problem) => (
                  <li
                      key={problem.id}
                      className={`rounded-md transition-all duration-150 ${
                          solvedProblems[problem.id]
                              ? 'opacity-70 bg-green-50 dark:bg-green-900/10'
                              : 'hover:bg-gray-50 dark:hover:bg-zinc-700'
                      }`}
                  >
                    <Link
                        to={`/problems/${problem.uid}`}
                        className="block p-6 rounded-md hover:shadow-md transition-shadow"
                        onClick={(e) => handleProblemClick(e, problem.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                            {problem.title}
                            {solvedProblems[problem.id] && (
                                <CheckCircle className="h-5 w-5 text-green-500 ml-2"/>
                            )}
                            {solvedProblems[problem.id] && (
                                <span
                                    className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300">
                          Çözüldü
                        </span>
                            )}
                          </h2>
                          <p className="text-gray-600 dark:text-gray-300 line-clamp-2">
                            {problem.description}
                          </p>
                        </div>
                        <div className="ml-6">
                    <span
                        className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${getDifficultyColor(
                            problem.difficulty
                        )}`}
                    >
                      {problem.difficulty}
                    </span>
                        </div>
                      </div>
                      <div
                          className="mt-4 flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 dark:text-gray-400 gap-1 sm:gap-6">
                        <span>Oluşturulma: {new Date(problem.createdAt).toLocaleDateString()}</span>
                        {solvedProblems[problem.id] && (
                            <span
                                className={`flex items-center gap-2 ${getCodeQualityColor(
                                    solvedProblems[problem.id].codeQualityScore
                                )}`}
                            >
                            Çözüm: {new Date(solvedProblems[problem.id].submittedAt).toLocaleDateString()}
                              <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getCodeQualityColor(
                                      solvedProblems[problem.id].codeQualityScore
                                  )}`}
                                  title={`Kod kalitesi: ${solvedProblems[problem.id].codeQualityScore}/100`}
                              >
                        Kod Kalitesi: {solvedProblems[problem.id].codeQualityScore}
                      </span>
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
                <BookOpen className="mx-auto mb-4 h-10 w-10 text-gray-400 dark:text-gray-600"/>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Hiç problem bulunamadı</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Yeni sorular için tekrar uğrayın.</p>
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
