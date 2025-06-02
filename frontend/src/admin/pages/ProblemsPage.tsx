import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';
import Loader from '../../components/Loader';
import { useDebounce } from '../../hooks/useDebounce';
import { Trash2, Search as SearchIcon } from 'lucide-react';

interface Problem {
  id: number;
  title: string;
  difficulty: string;
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [sort, setSort] = useState<{ key: keyof Problem; dir: 'asc' | 'desc' }>({ key: 'id', dir: 'asc' });
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const navigate = useNavigate();

  const prefix = window.location.hostname.startsWith('admin.') ? '' : '/admin';

  useEffect(() => {
    let isMounted = true;
    async function fetchProblems() {
      try {
        setError(null);
        setLoading(true);
        const res = await api.get('/admin/problems');

        if (!isMounted) return;

        if (res.data.IsSucceeded) {
          const data = res.data.Data;
          setProblems(data?.content || data || []);
        } else {
          setError(res.data.Message || 'Veriler alınamadı');
        }
      } catch (e: any) {
        if (isMounted) setError(e.response?.data?.Message || 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchProblems();

    return () => { isMounted = false; };
  }, []);

  const filtered = problems.filter((p) => {
    const q = debouncedSearch.trim().toLowerCase();
    const matchesSearch = !q || p.title.toLowerCase().includes(q) || String(p.id).includes(q);
    const matchesDifficulty = !difficultyFilter || p.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  const sorted = [...filtered].sort((a, b) => {
    const { key, dir } = sort;
    const mult = dir === 'asc' ? 1 : -1;
    if ((a[key] || '') < (b[key] || '')) return -1 * mult;
    if ((a[key] || '') > (b[key] || '')) return 1 * mult;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const paginated = sorted.slice(start, start + pageSize);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Soru silinsin mi?')) return;
    try {
      const res = await api.delete(`/admin/problems/${id}`);
      if (res.status === 200) {
        setProblems(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      alert('Silme işlemi başarısız');
      console.error(err);
    }
  };

  if (loading) return <Loader fullHeight />;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Sorular</h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              className="w-64 border rounded pl-8 pr-3 py-1.5 text-sm dark:bg-zinc-700 dark:border-zinc-600 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ara... (ID/Başlık)"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1);} }
            />
            <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          <select
            className="border rounded px-2 py-1 text-sm dark:bg-zinc-700 dark:border-zinc-600"
            value={difficultyFilter}
            onChange={(e) => { setDifficultyFilter(e.target.value); setPage(1);} }
          >
            <option value="">Tüm Zorluklar</option>
            <option value="EASY">EASY</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HARD">HARD</option>
          </select>
          <button
            onClick={() => navigate(`${prefix}/problems/create`)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            + Yeni Soru
          </button>
        </div>
      </div>
      {paginated.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Henüz soru eklenmemiş.</div>
      ) : (
        <table className="min-w-full border divide-y divide-gray-200 dark:divide-zinc-700">
          <thead className="bg-gray-100 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium cursor-pointer" onClick={() => setSort(prev => ({ key: 'id', dir: prev.key === 'id' && prev.dir === 'asc' ? 'desc' : 'asc' }))}>ID</th>
              <th className="px-4 py-2 text-left text-xs font-medium cursor-pointer" onClick={() => setSort(prev => ({ key: 'title', dir: prev.key === 'title' && prev.dir === 'asc' ? 'desc' : 'asc' }))}>Başlık</th>
              <th className="px-4 py-2 text-left text-xs font-medium cursor-pointer" onClick={() => setSort(prev => ({ key: 'difficulty', dir: prev.key === 'difficulty' && prev.dir === 'asc' ? 'desc' : 'asc' }))}>Zorluk</th>
              <th className="px-4 py-2 text-left text-xs font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-700">
            {paginated.map((p) => (
              <tr 
                key={p.id} 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800" 
                onClick={() => navigate(`${prefix}/problems/${p.id}/edit`)}
              >
                <td className="px-4 py-2 text-sm">{p.id}</td>
                <td className="px-4 py-2 text-sm">{p.title}</td>
                <td className="px-4 py-2 text-sm">
                  <span
                    className={
                      {
                        EASY: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
                        MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
                        HARD: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200',
                      }[p.difficulty as 'EASY' | 'MEDIUM' | 'HARD']
                        + ' px-2 py-0.5 rounded-full text-xs font-semibold'
                    }
                  >
                    {p.difficulty}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm">
                  <button onClick={(e) => handleDelete(p.id, e)} className="text-red-600 hover:text-red-800">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {totalPages > 1 && (
        <div className="flex justify-end mt-3 gap-2 text-sm">
          <button disabled={currentPage === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-2 py-1 border rounded disabled:opacity-50">Önceki</button>
          <span>{currentPage}/{totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-2 py-1 border rounded disabled:opacity-50">Sonraki</button>
        </div>
      )}
    </div>
  );
} 