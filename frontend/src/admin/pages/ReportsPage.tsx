import React, { useEffect, useState } from 'react';
import { api } from '../../api/axios';
import { Search as SearchIcon, Clock, Hourglass, CheckCircle2, XCircle } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { websocketService } from '../../api/websocket';
import Loader from "../../components/Loader.tsx";

interface Report {
  id: number;
  problemUid: string;
  reportedBy: string;
  feedback: string;
  category: string;
  status: string;
  adminResponse?: string;
  reportedAt: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Report | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [problemCache, setProblemCache] = useState<{ [uid: string]: string }>({});
  const [userCache, setUserCache] = useState<{ [id: string]: string }>({});
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'reportedAt', dir: 'desc' });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await api.get('/admin/reports');
        if (res.data.IsSucceeded) {
          setReports(res.data.Data);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchReports();

    // WebSocket subscription for real-time updates
    websocketService.connect(
      () => {
        setWsConnected(true);
        websocketService.subscribe('/topic/admin/reports', (message: any) => {
          // Assuming backend sends full report entity
          try {
            const data = JSON.parse(message.body);
            setReports((prev) => [data, ...prev]);
          } catch {}
        });
      },
      () => setWsConnected(false)
    );

    return () => {
      websocketService.disconnect();
    };
  }, []);

  useEffect(() => {
    async function fillCaches() {
      const missingProblems = reports.filter(r => !problemCache[r.problemUid]).map(r => r.problemUid);
      const missingUsers = reports.filter(r => !userCache[r.reportedBy]).map(r => r.reportedBy);

      // Unique arrays
      const uniqueProblems = Array.from(new Set(missingProblems));
      const uniqueUsers = Array.from(new Set(missingUsers));

      await Promise.all([
        ...uniqueProblems.map(async uid => {
          try {
            const res = await api.get(`/problems/${uid}`);
            if (res.data.IsSucceeded) {
              setProblemCache(prev => ({ ...prev, [uid]: res.data.Data.title }));
            }
          } catch {}
        }),
        ...uniqueUsers.map(async id => {
          try {
            const res = await api.get(`/users/${id}`);
            if (res.data.IsSucceeded) {
              setUserCache(prev => ({ ...prev, [id]: res.data.Data.username }));
            }
          } catch {}
        })
      ]);
    }

    if (reports.length) {
      fillCaches();
    }
  }, [reports]);

  const updateStatus = async (status: string) => {
    if (!selected) return;
    setStatusUpdating(true);
    try {
      await api.put(`/admin/reports/${selected.id}/status`, { status, adminResponse });
      setReports((prev) =>
        prev.map((r) =>
          r.id === selected.id ? { ...r, status, adminResponse } : r
        )
      );
      setSelected(null);
      setAdminResponse('');
    } finally {
      setStatusUpdating(false);
    }
  };

  // Detaylı filtreleme
  const filteredReports = React.useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return reports.filter(r => {
      const title = problemCache[r.problemUid] || r.problemUid;
      const reporter = userCache[r.reportedBy] || r.reportedBy;
      // Arama eşleşmesi
      const matchesSearch = !q ||
        r.problemUid.toLowerCase().includes(q) ||
        title.toLowerCase().includes(q) ||
        reporter.toString().toLowerCase().includes(q) ||
        r.feedback.toLowerCase().includes(q);

      const matchesStatus = !statusFilter || r.status === statusFilter;
      const matchesCategory = !categoryFilter || r.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [debouncedSearch, statusFilter, categoryFilter, reports, problemCache, userCache]);

  // Sorting
  const sortedReports = React.useMemo(() => {
    const copy = [...filteredReports];
    copy.sort((a, b) => {
      const { key, dir } = sort;
      const mult = dir === 'asc' ? 1 : -1;
      if ((a as any)[key] < (b as any)[key]) return -1 * mult;
      if ((a as any)[key] > (b as any)[key]) return 1 * mult;
      return 0;
    });
    return copy;
  }, [filteredReports, sort]);

  // Pagination
  const paginatedReports = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedReports.slice(start, start + pageSize);
  }, [sortedReports, page]);

  // Grup raporları statüye göre
  const grouped = React.useMemo(() => {
    const map: { [key: string]: Report[] } = {};
    paginatedReports.forEach((r) => {
      if (!map[r.status]) map[r.status] = [];
      map[r.status].push(r);
    });
    return map;
  }, [paginatedReports]);

  const statusOrder: string[] = ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'];

  if (loading) return <Loader fullHeight />;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Problem Raporları</h2>

      <div className="mb-6 flex justify-center">
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-zinc-800 shadow rounded-lg px-4 py-3">
          <input
            type="text"
            placeholder="Ara... (problem, raporlayan, uid, geri bildirim)"
            className="w-72 border rounded pl-9 pr-3 py-1.5 text-sm dark:bg-zinc-700 dark:border-zinc-600 focus:ring-2 focus:ring-blue-500 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <SearchIcon className="absolute ml-2 text-gray-400 w-4 h-4 pointer-events-none" />
          {search && (
            <button className="text-xs text-gray-500" onClick={() => setSearch('')}>Temizle</button>
          )}

          {/* Status Filter */}
          <select
            className="border rounded px-2 py-1 text-sm dark:bg-zinc-700 dark:border-zinc-600"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tüm Durumlar</option>
            <option value="PENDING">Bekleyen</option>
            <option value="UNDER_REVIEW">İnceleme</option>
            <option value="RESOLVED">Çözüldü</option>
            <option value="REJECTED">Reddedildi</option>
          </select>

          {/* Category Filter */}
          <select
            className="border rounded px-2 py-1 text-sm dark:bg-zinc-700 dark:border-zinc-600"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Tüm Kategoriler</option>
            {Array.from(new Set(reports.map(r => r.category))).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {statusOrder.map((status) => {
        const list = grouped[status] || [];
        if (list.length === 0) return null;
        return (
          <div key={status} className="mb-8">
            <h3 className="text-xl font-semibold mb-2">
              {status === 'PENDING'
                ? 'Bekleyen Raporlar'
                : status === 'UNDER_REVIEW'
                ? 'İncelenen Raporlar'
                : status === 'RESOLVED'
                ? 'Çözülen Raporlar'
                : 'Reddedilen Raporlar'}{' '}
              ({list.length})
            </h3>

            <table className="min-w-full border divide-y divide-gray-200 dark:divide-zinc-700">
              <thead className="bg-gray-100 dark:bg-zinc-800 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2"><input type="checkbox" onChange={(e)=> {
                    if(e.target.checked) {
                      const ids = list.map(l=>l.id);
                      setSelectedIds(new Set(ids));
                    } else {
                      setSelectedIds(new Set());
                    }
                  }} checked={list.every(r=>selectedIds.has(r.id)) && list.length>0} /></th>
                  <th className="px-4 py-2 text-left text-xs font-medium cursor-pointer" onClick={()=>setSort(prev=>({key:'id',dir: prev.key==='id'&&prev.dir==='asc'?'desc':'asc'}))}>ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium">Problem</th>
                  <th className="px-4 py-2 text-left text-xs font-medium">Raporlayan</th>
                  <th className="px-4 py-2 text-left text-xs font-medium">Kategori</th>
                  <th className="px-4 py-2 text-left text-xs font-medium cursor-pointer" onClick={()=>setSort(prev=>({key:'status',dir: prev.key==='status'&&prev.dir==='asc'?'desc':'asc'}))}>Durum</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-700">
                {paginatedReports.filter(x=>x.status===status).map((r) => (
                  <tr
                    key={r.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800"
                    onClick={() => {
                      setSelected(r);
                      setAdminResponse(r.adminResponse || '');
                    }}
                  >
                    <td className="px-2 py-2"><input type="checkbox" checked={selectedIds.has(r.id)} onChange={(e)=> {
                      setSelectedIds(prev=>{
                        const copy=new Set(prev);
                        if(e.target.checked){copy.add(r.id);} else {copy.delete(r.id);} return copy;});
                    }}/></td>
                    <td className="px-4 py-2 text-sm">{r.id}</td>
                    <td className="px-4 py-2 text-sm">
                      <div className="font-medium">{problemCache[r.problemUid] || '...'}</div>
                      <div className="text-xs text-gray-500">{r.problemUid}</div>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <div className="font-medium">{userCache[r.reportedBy] || '...'}</div>
                      <div className="text-xs text-gray-500">ID: {r.reportedBy}</div>
                    </td>
                    <td className="px-4 py-2 text-sm">{r.category}</td>
                    <td className="px-4 py-2 text-sm flex items-center gap-1">
                      {r.status === 'PENDING' && <Clock className="w-4 h-4 text-yellow-500" />}
                      {r.status === 'UNDER_REVIEW' && <Hourglass className="w-4 h-4 text-blue-500" />}
                      {r.status === 'RESOLVED' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      {r.status === 'REJECTED' && <XCircle className="w-4 h-4 text-red-500" />}
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          r.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : r.status === 'UNDER_REVIEW'
                            ? 'bg-blue-100 text-blue-800'
                            : r.status === 'RESOLVED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination controls */}
            {list.length > pageSize && (
              <div className="flex justify-end mt-2 gap-2 text-sm">
                <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-2 py-1 border rounded disabled:opacity-50">Önceki</button>
                <span>{page}/{Math.ceil(sortedReports.length/pageSize)}</span>
                <button disabled={page>=Math.ceil(sortedReports.length/pageSize)} onClick={()=>setPage(p=>p+1)} className="px-2 py-1 border rounded disabled:opacity-50">Sonraki</button>
              </div>
            )}
          </div>
        );
      })}

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 w-full max-w-lg p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Rapor Detayı</h3>
            <p className="mb-4 whitespace-pre-wrap text-sm">{selected.feedback}</p>

            {/* Admin mesajı */}
            {selected.status === 'PENDING' ? (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Admin Mesajı</label>
                <textarea
                  className="w-full border rounded p-2 text-sm dark:bg-zinc-700 dark:border-zinc-600"
                  rows={4}
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Rapor sahibine iletilmek üzere mesajınızı yazın..."
                />
              </div>
            ) : (
              selected.adminResponse && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-1">Admin Yanıtı</h4>
                  <p className="text-sm whitespace-pre-wrap bg-gray-100 dark:bg-zinc-700 p-3 rounded">
                    {selected.adminResponse}
                  </p>
                </div>
              )
            )}

            <div className="space-x-2 flex justify-end">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                disabled={statusUpdating}
                onClick={() => updateStatus('UNDER_REVIEW')}
              >
                İnceleniyor
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded"
                disabled={statusUpdating}
                onClick={() => updateStatus('RESOLVED')}
              >
                Çözüldü
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded"
                disabled={statusUpdating}
                onClick={() => updateStatus('REJECTED')}
              >
                Reddedildi
              </button>
              <button
                className="px-4 py-2 bg-gray-300 dark:bg-zinc-600 text-black dark:text-white rounded"
                onClick={() => setSelected(null)}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 