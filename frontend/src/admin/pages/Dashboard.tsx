import React, { useEffect, useState } from 'react';
import { api } from '../../api/axios';
import { Line, Bar, Pie } from 'react-chartjs-2';
import Loader from '../../components/Loader';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

interface DetailedStats {
  overview: {
    usersTotal: number;
    submissionsTotal: number;
    reportsOpen: number;
    reportsClosed: number;
    averageSubmissionPerUser: number;
    averageReportResolutionTime: number;
  };
  dailyStats: {
    date: string;
    newUsers: number;
    newSubmissions: number;
    newReports: number;
  }[];
  userRoles: {
    role: string;
    count: number;
  }[];
  submissionStatus: {
    status: string;
    count: number;
  }[];
  problemStats?: {
    mostSolvedProblems: Array<{ problemId: number; title: string; solveCount: number }>;
    hardestProblems: Array<{ problemId: number; title: string; successRate: number }>;
  };
  userPerformance?: {
    mostActiveUsers: Array<{ userId: number; username: string; submissionCount: number }>;
    mostSuccessfulUsers: Array<{ userId: number; username: string; successRate: number }>;
    averageCodeQuality: number;
  };
  timeAnalysis?: {
    hourlyActivity: Array<{ hour: number; count: number }>;
    weeklyTrend: Array<{ week: string; count: number }>;
    seasonalAnalysis: Array<{ season: string; count: number }>;
  };
  llmDetailed?: {
    llmUsageOverTime: Array<{ date: string; count: number }>;
    llmFeatureUsage: Array<{ feature: string; count: number }>;
  };
  languageStats?: Array<{ language: string; count: number }>;
  difficultyStats?: Array<{ difficulty: string; count: number }>;
  successRateTrend?: Array<{ date: string; successRate: number }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DetailedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [llmUsageData, setLlmUsageData] = useState<{ tool: string; count: number }[]>([]);
  const [llmFeatureUsage, setLlmFeatureUsage] = useState<{ feature: string; count: number }[]>([]);
  const [languageStats, setLanguageStats] = useState<{ language: string; count: number }[]>([]);
  const [difficultyStats, setDifficultyStats] = useState<{ difficulty: string; count: number }[]>([]);
  const [successRateTrend, setSuccessRateTrend] = useState<{ date: string; successRate: number }[]>([]);

  useEffect(() => {
    async function fetchAllStats() {
      try {
        const [detailedRes, llmRes, problemRes, userRes, timeRes, llmDetailedRes, langRes, diffRes, successTrendRes] = await Promise.all([
          api.get(`/admin/stats/detailed?range=${timeRange}`),
          api.get('/admin/stats/llm-usage'),
          api.get('/admin/stats/problem-stats'),
          api.get('/admin/stats/user-performance'),
          api.get('/admin/stats/time-analysis'),
          api.get('/admin/stats/llm-detailed'),
          api.get('/admin/stats/language-stats'),
          api.get('/admin/stats/difficulty-stats'),
          api.get('/admin/stats/success-rate-trend')
        ]);

        if (detailedRes.data.IsSucceeded) {
          setStats({
            ...detailedRes.data.Data,
            problemStats: problemRes.data.Data,
            userPerformance: userRes.data.Data,
            timeAnalysis: timeRes.data.Data,
            llmDetailed: llmDetailedRes.data.Data,
            languageStats: langRes.data.Data,
            difficultyStats: diffRes.data.Data,
            successRateTrend: successTrendRes.data.Data
          });
        }
        if (llmRes.data.IsSucceeded) {
          setLlmUsageData(llmRes.data.Data);
        }
        if (llmDetailedRes.data.IsSucceeded) {
          setLlmFeatureUsage(llmDetailedRes.data.Data.llmFeatureUsage || []);
        }
        if (langRes.data.IsSucceeded) {
          setLanguageStats(langRes.data.Data);
        }
        if (diffRes.data.IsSucceeded) {
          setDifficultyStats(diffRes.data.Data);
        }
        if (successTrendRes.data.IsSucceeded) {
          setSuccessRateTrend(successTrendRes.data.Data);
        }
      } catch (e: any) {
        setError(e.response?.data?.Message || e.message || 'İstatistikler alınamadı');
      } finally {
        setLoading(false);
      }
    }
    fetchAllStats();
  }, [timeRange]);

  if (loading) return <Loader fullHeight />;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!stats) return null;

  const StatCard = ({ title, value }: { title: string; value: number | string }) => (
      <div className="p-4 rounded-lg shadow-sm bg-white dark:bg-zinc-800">
        <h3 className="text-xs font-medium text-gray-500 dark:text-zinc-400 tracking-wide uppercase">
          {title}
        </h3>
        <p className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white break-words">
          {value}
        </p>
      </div>
  );

  const ChartCard: React.FC<{ title: string; children: React.ReactNode; heightClass?: string }> = ({ title, children, heightClass = 'h-64' }) => (
      <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">{title}</h3>
        <div className={`relative w-full ${heightClass}`}>
          {children}
        </div>
      </div>
  );

  const dailyChartData = {
    labels: stats.dailyStats.map(s => s.date),
    datasets: [
      {
        label: 'Yeni Kullanıcılar',
        data: stats.dailyStats.map(s => s.newUsers),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Yeni Gönderimler',
        data: stats.dailyStats.map(s => s.newSubmissions),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
      {
        label: 'Yeni Raporlar',
        data: stats.dailyStats.map(s => s.newReports),
        borderColor: 'rgb(54, 162, 235)',
        tension: 0.1,
      },
    ],
  };

  const roleChartData = {
    labels: stats.userRoles.map(r => r.role),
    datasets: [{
      label: 'Kullanıcı Sayısı',
      data: stats.userRoles.map(r => r.count),
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
      ],
    }],
  };

  const llmChartData = {
    labels: llmUsageData.map(item => item.tool),
    datasets: [
      {
        label: 'LLM Kullanım Sayısı',
        data: llmUsageData.map(item => item.count),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const llmFeatureChartData = {
    labels: llmFeatureUsage.map(item => item.feature),
    datasets: [{
      label: 'Kullanım',
      data: llmFeatureUsage.map(item => item.count),
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
      ],
    }]
  };

  const seasonalChartData = {
    labels: stats.timeAnalysis?.seasonalAnalysis.map(s => s.season) || [],
    datasets: [{
      label: 'Aktivite',
      data: stats.timeAnalysis?.seasonalAnalysis.map(s => s.count) || [],
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
      ],
    }]
  };

  const languageChartData = {
    labels: languageStats.map(l => l.language),
    datasets: [{
      label: 'Gönderim',
      data: languageStats.map(l => l.count),
      backgroundColor: 'rgba(153, 102, 255, 0.6)'
    }]
  };

  const difficultyChartData = {
    labels: difficultyStats.map(d => d.difficulty),
    datasets: [{
      label: 'Gönderim',
      data: difficultyStats.map(d => d.count),
      backgroundColor: [
        'rgba(75, 192, 192, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(255, 99, 132, 0.6)'
      ],
    }]
  };

  const successRateChartData = {
    labels: successRateTrend.map(s => s.date),
    datasets: [{
      label: 'Başarı Oranı (%)',
      data: successRateTrend.map(s => s.successRate),
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1,
    }]
  };

  const reportPieData = {
    labels: ['Açık', 'Kapalı'],
    datasets: [{
      data: [stats.overview.reportsOpen, stats.overview.reportsClosed],
      backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(75, 192, 192, 0.6)'],
    }]
  };

  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Genel Bakış</h2>
          <select
              className="border rounded px-3 py-1.5 text-sm dark:bg-zinc-700 dark:border-zinc-600"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
          >
            <option value="7d">Son 7 Gün</option>
            <option value="30d">Son 30 Gün</option>
            <option value="90d">Son 90 Gün</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-6">
          <StatCard title="Toplam Kullanıcı" value={stats.overview.usersTotal} />
          <StatCard title="Toplam Gönderim" value={stats.overview.submissionsTotal} />
          <StatCard title="Açık Rapor" value={stats.overview.reportsOpen} />
          <StatCard title="Kapalı Rapor" value={stats.overview.reportsClosed} />
          <StatCard title="Ort. Gönderim / Kullanıcı" value={stats.overview.averageSubmissionPerUser.toFixed(2)} />
          <StatCard title="Ort. Rapor Çözüm (saat)" value={stats.overview.averageReportResolutionTime.toFixed(1)} />
          <StatCard title="Ort. Kod Kalitesi" value={stats.userPerformance?.averageCodeQuality?.toFixed(1) ?? '-'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="Günlük Aktivite">
            <Line
              data={dailyChartData}
              options={{
                responsive: true,
                plugins: { legend: { position: 'top' as const } },
              }}
            />
          </ChartCard>

          <ChartCard title="Kullanıcı Rolleri">
            <Bar
              data={roleChartData}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
              }}
            />
          </ChartCard>

          <ChartCard title="LLM Kullanım İstatistikleri">
            <Bar
              data={llmChartData}
              options={{
                responsive: true,
                plugins: { legend: { position: 'top' } },
              }}
            />
          </ChartCard>
        </div>

        <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Gönderim Durumları</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {stats.submissionStatus.map((status, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-zinc-700 rounded">
                  <p className="text-sm text-gray-500 dark:text-zinc-400">{status.status}</p>
                  <p className="text-lg font-semibold">{status.count}</p>
                </div>
            ))}
          </div>
        </div>

        {stats.problemStats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="En Çok Çözülen Problemler">
              <div className="space-y-2">
                {stats.problemStats.mostSolvedProblems.map((problem, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-zinc-700 rounded">
                    <span>{problem.title}</span>
                    <span className="font-semibold">{problem.solveCount} çözüm</span>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="En Zor Problemler">
              <div className="space-y-2">
                {stats.problemStats.hardestProblems.map((problem, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-zinc-700 rounded">
                    <span>{problem.title}</span>
                    <span className="font-semibold">%{problem.successRate.toFixed(1)} başarı</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        )}

        {stats.userPerformance && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="En Aktif Kullanıcılar">
              <div className="space-y-2">
                {stats.userPerformance.mostActiveUsers.map((user, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-zinc-700 rounded">
                    <span>{user.username}</span>
                    <span className="font-semibold">{user.submissionCount} gönderim</span>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="En Başarılı Kullanıcılar">
              <div className="space-y-2">
                {stats.userPerformance.mostSuccessfulUsers.map((user, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-zinc-700 rounded">
                    <span>{user.username}</span>
                    <span className="font-semibold">%{user.successRate.toFixed(1)} başarı</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        )}

        {stats.timeAnalysis && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Saatlik Aktivite Dağılımı">
              <Bar
                data={{
                  labels: stats.timeAnalysis.hourlyActivity.map(h => `${h.hour}:00`),
                  datasets: [{
                    label: 'Aktivite Sayısı',
                    data: stats.timeAnalysis.hourlyActivity.map(h => h.count),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                }}
              />
            </ChartCard>

            <ChartCard title="Haftalık Aktivite Trendi">
              <Line
                data={{
                  labels: stats.timeAnalysis.weeklyTrend.map(w => w.week),
                  datasets: [{
                    label: 'Aktivite Sayısı',
                    data: stats.timeAnalysis.weeklyTrend.map(w => w.count),
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                }}
              />
            </ChartCard>
          </div>
        )}

        {stats.llmDetailed && (
          <ChartCard title="LLM Kullanım Trendi">
            <Line
              data={{
                labels: stats.llmDetailed.llmUsageOverTime.map(u => u.date),
                datasets: [{
                  label: 'LLM Kullanım Sayısı',
                  data: stats.llmDetailed.llmUsageOverTime.map(u => u.count),
                  borderColor: 'rgb(75, 192, 192)',
                  tension: 0.1,
                }]
              }}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
              }}
            />
          </ChartCard>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="Mevsimsel Aktivite" heightClass="h-48">
            <Pie data={seasonalChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </ChartCard>

          <ChartCard title="LLM Feature Kullanımı" heightClass="h-48">
            <Pie data={llmFeatureChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </ChartCard>

          <ChartCard title="Rapor Durumu (Açık/Kapalı)" heightClass="h-48">
            <Pie data={reportPieData} options={{ responsive: true, maintainAspectRatio: false }} />
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Programlama Dili Dağılımı">
            <Bar data={languageChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </ChartCard>

          <ChartCard title="Zorluk Seviyesine Göre Gönderimler" heightClass="h-48">
            <Pie data={difficultyChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </ChartCard>
        </div>

        <ChartCard title="Başarı Oranı Trendi">
          <Line data={successRateChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </ChartCard>
      </div>
  );
}