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
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

interface UserChartsProps {
    submissionsByDay: { date: string; count: number }[];
    submissionsByLanguage: { language: string; count: number }[];
    submissionsByDifficulty: { difficulty: string; count: number }[];
    hourlyActivity?: { hour: number; count: number }[];
    weeklyTrend?: { week: string; count: number }[];
    successRateOverTime?: { date: string; successRate: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

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
    submissionsByDifficulty,
    hourlyActivity = [],
    weeklyTrend = [],
    successRateOverTime = []
}) => {
    // Veri kontrolü
    const hasData = submissionsByDay?.length > 0 || 
                   submissionsByLanguage?.length > 0 || 
                   submissionsByDifficulty?.length > 0;

    // Günlük gönderim verilerini formatla
    const dailyData = submissionsByDay?.map(item => ({
        date: new Date(item.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }),
        count: item.count
    })) || [];

    // Saatlik aktivite verilerini formatla
    const hourlyData = Array.from({ length: 24 }, (_, i) => {
        const found = hourlyActivity.find(h => h.hour === i);
        return {
            hour: `${i.toString().padStart(2, '0')}:00`,
            count: found ? found.count : 0
        };
    });

    // Haftalık trend verilerini formatla
    const weeklyData = weeklyTrend.map(item => ({
        week: new Date(item.week).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }),
        count: item.count
    }));

    // Başarı oranı trendi verilerini formatla
    const successData = successRateOverTime.map(item => ({
        date: new Date(item.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }),
        successRate: Number(item.successRate.toFixed(2))
    }));

    if (!hasData) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Henüz istatistik verisi bulunmuyor.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Mevcut grafikler */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Son 7 Gün Grafiği */}
                {dailyData && dailyData.length > 0 && (
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow border border-gray-200 dark:border-zinc-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                            Son 7 Gün Gönderim Sayısı
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis 
                                    dataKey="date" 
                                    className="text-xs"
                                    tick={{ fill: 'currentColor', fontSize: 12 }}
                                />
                                <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#fff', 
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        color: '#1f2937'
                                    }}
                                />
                                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Programlama Dilleri */}
                {submissionsByLanguage && submissionsByLanguage.length > 0 && (
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow border border-gray-200 dark:border-zinc-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                            Programlama Dilleri
                        </h3>
                        <div className="flex flex-col lg:flex-row items-center">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={submissionsByLanguage}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ language, percent }) => `${language} (${(percent * 100).toFixed(0)}%)`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="count"
                                    >
                                        {submissionsByLanguage.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            {/* Zorluk Seviyesi Grafiği */}
            {submissionsByDifficulty && submissionsByDifficulty.length > 0 && (
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow border border-gray-200 dark:border-zinc-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        Zorluk Seviyelerine Göre Çözülen Problemler
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={submissionsByDifficulty}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis 
                                dataKey="difficulty" 
                                tick={{ fill: 'currentColor', fontSize: 12 }}
                                tickFormatter={(value) => {
                                    switch (value) {
                                        case 'EASY': return 'Kolay';
                                        case 'MEDIUM': return 'Orta';
                                        case 'HARD': return 'Zor';
                                        default: return value;
                                    }
                                }}
                            />
                            <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#fff', 
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    color: '#1f2937'
                                }}
                                formatter={(value, name) => [value, 'Problem Sayısı']}
                                labelFormatter={(label) => {
                                    switch (label) {
                                        case 'EASY': return 'Kolay';
                                        case 'MEDIUM': return 'Orta';
                                        case 'HARD': return 'Zor';
                                        default: return label;
                                    }
                                }}
                            />
                            <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Yeni grafikler */}
            {hourlyActivity.length > 0 && (
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow border border-gray-200 dark:border-zinc-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        Saatlik Aktivite Dağılımı
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={hourlyData}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis 
                                dataKey="hour" 
                                className="text-xs"
                                tick={{ fill: 'currentColor', fontSize: 12 }}
                            />
                            <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#fff', 
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    color: '#1f2937'
                                }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="count" 
                                stroke="#8B5CF6" 
                                fill="#8B5CF6" 
                                fillOpacity={0.3}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {weeklyTrend.length > 0 && (
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow border border-gray-200 dark:border-zinc-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        Haftalık Aktivite Trendi
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis 
                                dataKey="week" 
                                className="text-xs"
                                tick={{ fill: 'currentColor', fontSize: 12 }}
                            />
                            <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#fff', 
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    color: '#1f2937'
                                }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="count" 
                                stroke="#F59E0B" 
                                strokeWidth={3}
                                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 6 }}
                                activeDot={{ r: 8 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {successRateOverTime.length > 0 && (
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow border border-gray-200 dark:border-zinc-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        Başarı Oranı Gelişimi (Son 30 Gün)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={successData}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis 
                                dataKey="date" 
                                className="text-xs"
                                tick={{ fill: 'currentColor', fontSize: 12 }}
                            />
                            <YAxis 
                                tick={{ fill: 'currentColor', fontSize: 12 }}
                                domain={[0, 100]}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#fff', 
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    color: '#1f2937'
                                }}
                                formatter={(value) => [`%${Number(value).toFixed(2)}`, 'Başarı Oranı']}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="successRate" 
                                stroke="#EF4444" 
                                fill="#EF4444" 
                                fillOpacity={0.3}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}; 