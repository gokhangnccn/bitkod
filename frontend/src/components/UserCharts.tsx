import React from 'react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface UserChartsProps {
    submissionsByDay: { date: string; count: number }[];
    submissionsByLanguage: { language: string; count: number }[];
    submissionsByDifficulty: { difficulty: string; count: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-zinc-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    {payload[0].name}: {payload[0].value}
                </p>
            </div>
        );
    }
    return null;
};

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
};

export const UserCharts: React.FC<UserChartsProps> = ({
    submissionsByDay,
    submissionsByLanguage,
    submissionsByDifficulty
}) => {
    // Veri kontrolü
    const hasData = submissionsByDay?.length > 0 || 
                   submissionsByLanguage?.length > 0 || 
                   submissionsByDifficulty?.length > 0;

    if (!hasData) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Henüz istatistik verisi bulunmuyor.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Günlük Gönderimler */}
            {submissionsByDay?.length > 0 && (
                <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Günlük Gönderimler</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={submissionsByDay}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                                <XAxis 
                                    dataKey="date" 
                                    tickFormatter={formatDate}
                                    stroke="#6B7280"
                                    tick={{ fill: '#6B7280' }}
                                />
                                <YAxis 
                                    stroke="#6B7280"
                                    tick={{ fill: '#6B7280' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar 
                                    dataKey="count" 
                                    fill="#8884d8" 
                                    name="Gönderim Sayısı"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Programlama Dilleri */}
            {submissionsByLanguage?.length > 0 && (
                <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Programlama Dilleri</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={submissionsByLanguage}
                                    dataKey="count"
                                    nameKey="language"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    labelLine={false}
                                >
                                    {submissionsByLanguage.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Zorluk Seviyeleri */}
            {submissionsByDifficulty?.length > 0 && (
                <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Zorluk Seviyelerine Göre Başarılı Çözümler</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={submissionsByDifficulty}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                                <XAxis 
                                    dataKey="difficulty" 
                                    stroke="#6B7280"
                                    tick={{ fill: '#6B7280' }}
                                    tickFormatter={(value) => {
                                        switch (value) {
                                            case 'EASY': return 'Kolay';
                                            case 'MEDIUM': return 'Orta';
                                            case 'HARD': return 'Zor';
                                            default: return value;
                                        }
                                    }}
                                />
                                <YAxis 
                                    stroke="#6B7280"
                                    tick={{ fill: '#6B7280' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar 
                                    dataKey="count" 
                                    fill="#82ca9d" 
                                    name="Başarılı Çözüm Sayısı"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Başarı Oranı Trendi */}
            {submissionsByDay?.length > 0 && (
                <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Başarı Oranı Trendi</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={submissionsByDay}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                                <XAxis 
                                    dataKey="date" 
                                    tickFormatter={formatDate}
                                    stroke="#6B7280"
                                    tick={{ fill: '#6B7280' }}
                                />
                                <YAxis 
                                    stroke="#6B7280"
                                    tick={{ fill: '#6B7280' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#8884d8"
                                    name="Başarı Oranı"
                                    strokeWidth={2}
                                    dot={{ fill: '#8884d8', strokeWidth: 2 }}
                                    activeDot={{ r: 6, fill: '#8884d8' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}; 