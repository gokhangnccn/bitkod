import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/axios';
import { toast } from 'sonner';
import Loader from '../../components/Loader';

interface TestCase {
  id?: number;
  input: string;
  expectedOutput: string;
}

export default function ProblemEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('EASY');
  const [loading, setLoading] = useState(true);
  const [exampleInput, setExampleInput] = useState('');
  const [exampleOutput, setExampleOutput] = useState('');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const prefix = window.location.hostname.startsWith('admin.') ? '' : '/admin';

  useEffect(() => {
    async function fetchProblem() {
      try {
        const res = await api.get(`/admin/problems/${id}`);
        if (res.data.IsSucceeded) {
          const p = res.data.Data;
          setTitle(p.title);
          setDescription(p.description);
          setDifficulty(p.difficulty);
          setExampleInput(p.exampleInput || '');
          setExampleOutput(p.exampleOutput || '');
          setTestCases((p.testCases || []).map((tc: any) => ({
            id: tc.id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
          })));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchProblem();
  }, [id]);

  function updateTestCase(idx: number, field: keyof TestCase, value: string) {
    setTestCases(prev => prev.map((tc, i) => i === idx ? { ...tc, [field]: value } : tc));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.put(`/admin/problems/${id}`, {
        title,
        description,
        difficulty,
        exampleInput,
        exampleOutput,
        testCases: testCases.map((tc) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
        })),
      });
      toast.success('Güncellendi');
      navigate(`${prefix}/problems`);
    } catch (e) {
      toast.error('Hata');
    }
  }

  if (loading) return <Loader fullHeight />;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Soru Düzenle</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Başlık</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block text-sm mb-1">Açıklama</label>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} className="w-full border px-3 py-2 rounded min-h-[120px]" />
        </div>
        <div>
          <label className="block text-sm mb-1">Zorluk</label>
          <select value={difficulty} onChange={e=>setDifficulty(e.target.value)} className="w-full border px-3 py-2 rounded">
            <option value="EASY">EASY</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HARD">HARD</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Örnek Girdi</label>
          <textarea value={exampleInput} onChange={e=>setExampleInput(e.target.value)} className="w-full border px-3 py-2 rounded min-h-[60px]" />
        </div>
        <div>
          <label className="block text-sm mb-1">Örnek Çıktı</label>
          <textarea value={exampleOutput} onChange={e=>setExampleOutput(e.target.value)} className="w-full border px-3 py-2 rounded min-h-[60px]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mt-6 mb-2">Test Case'ler</h3>
          {testCases.map((tc, idx) => (
            <div key={idx} className="border p-4 rounded mb-3 bg-gray-50 dark:bg-zinc-800">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Test Case #{idx+1}</span>
                <button type="button" className="text-red-500 text-sm" onClick={() => setTestCases(testCases.filter((_,i)=>i!==idx))}>Sil</button>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs mb-1">Girdi</label>
                  <textarea value={tc.input} onChange={e=>updateTestCase(idx, 'input', e.target.value)} className="w-full border px-2 py-1 rounded min-h-[60px] text-sm" />
                </div>
                <div>
                  <label className="block text-xs mb-1">Beklenen Çıktı</label>
                  <textarea value={tc.expectedOutput} onChange={e=>updateTestCase(idx, 'expectedOutput', e.target.value)} className="w-full border px-2 py-1 rounded min-h-[60px] text-sm" />
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setTestCases([...testCases, {input:'', expectedOutput:''}])} className="px-3 py-1 bg-green-600 text-white rounded text-sm">+ Test Case Ekle</button>
        </div>
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Kaydet</button>
      </form>
    </div>
  );
} 