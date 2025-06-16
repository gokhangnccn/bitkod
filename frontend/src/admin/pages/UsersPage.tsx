import React, { useEffect, useState } from 'react';
import { api } from '../../api/axios';
import { useDebounce } from '../../hooks/useDebounce';
import { Trash2, Search as SearchIcon, Shield } from 'lucide-react';
import Loader from "../../components/Loader.tsx";

interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
  createdAt?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // UI states
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [roleFilter, setRoleFilter] = useState('');
  const [sort, setSort] = useState<{ key: keyof User; dir: 'asc' | 'desc' }>({ key: 'id', dir: 'asc' });
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await api.get('/users');
        if (res.data.IsSucceeded) {
          setUsers(res.data.Data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  if (loading) return <Loader fullHeight />;

  // filtreleme
  const filtered = users.filter((u) => {
    const q = debouncedSearch.trim().toLowerCase();
    const matchesSearch = !q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchesRole = !roleFilter || (u.role || 'USER') === roleFilter;
    return matchesSearch && matchesRole;
  });

  // sıralama
  const sorted = [...filtered].sort((a, b) => {
    const { key, dir } = sort;
    const mult = dir === 'asc' ? 1 : -1;
    if ((a[key] || '') < (b[key] || '')) return -1 * mult;
    if ((a[key] || '') > (b[key] || '')) return 1 * mult;
    return 0;
  });

  // sayfalama
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const paginated = sorted.slice(start, start + pageSize);

  const handleDelete = async (id: number) => {
    if (!confirm('Kullanıcı silinsin mi?')) return;
    try {
      const res = await api.delete(`/users/${id}`);
      if (res.status === 200) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      }
    } catch (e) {
      alert('Silme işlemi başarısız');
      console.error(e);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Kullanıcılar</h2>

      <div className="mb-4 flex flex-wrap items-center gap-3 bg-white dark:bg-zinc-800 shadow rounded-lg px-4 py-3">
        <div className="relative">
          <input
            className="w-64 border rounded pl-8 pr-3 py-1.5 text-sm dark:bg-zinc-700 dark:border-zinc-600 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Ara... (username/email)"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1);} }
          />
          <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <select
          className="border rounded px-2 py-1 text-sm dark:bg-zinc-700 dark:border-zinc-600"
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1);} }
        >
          <option value="">Tüm Roller</option>
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>

      <table className="min-w-full border divide-y divide-gray-200 dark:divide-zinc-700">
        <thead className="bg-gray-100 dark:bg-zinc-800 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium cursor-pointer" onClick={() => setSort(prev => ({ key: 'id', dir: prev.key === 'id' && prev.dir === 'asc' ? 'desc' : 'asc' }))}>ID</th>
            <th className="px-4 py-2 text-left text-xs font-medium cursor-pointer" onClick={() => setSort(prev => ({ key: 'username', dir: prev.key === 'username' && prev.dir === 'asc' ? 'desc' : 'asc' }))}>Username</th>
            <th className="px-4 py-2 text-left text-xs font-medium cursor-pointer" onClick={() => setSort(prev => ({ key: 'email', dir: prev.key === 'email' && prev.dir === 'asc' ? 'desc' : 'asc' }))}>Email</th>
            <th className="px-4 py-2 text-left text-xs font-medium">Rol</th>
            <th className="px-4 py-2 text-left text-xs font-medium">İşlem</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-700">
          {paginated.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800">
              <td className="px-4 py-2 text-sm">{u.id}</td>
              <td className="px-4 py-2 text-sm">{u.username}</td>
              <td className="px-4 py-2 text-sm">{u.email}</td>
              <td className="px-4 py-2 text-sm flex items-center gap-1">
                {u.role === 'ADMIN' && <Shield className="w-4 h-4 text-indigo-500" />} {u.role || 'USER'}
              </td>
              <td className="px-4 py-2 text-sm">
                <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:text-red-800">
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination yöntemi */}
      {totalPages > 1 && (
        <div className="flex justify-end mt-3 gap-2 text-sm">
          <button disabled={currentPage === 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 border rounded disabled:opacity-50">Önceki</button>
          <span>{currentPage}/{totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setPage(p => p + 1)} className="px-2 py-1 border rounded disabled:opacity-50">Sonraki</button>
        </div>
      )}
    </div>
  );
} 