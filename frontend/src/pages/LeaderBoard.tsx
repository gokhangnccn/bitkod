import React, { useEffect, useState } from 'react';
import { api } from '../api/axios';
import { BarChart3, User, BookOpen, Percent, BarChart2, Star } from 'lucide-react';
import AdvancedModal from '../components/AdvancedModal';

interface UserStats {
    userId: number;
    username: string;
    solvedProblemsCount: number;
    successRate: number;
    totalSubmissions: number;
    score: number;
}

export default function Leaderboard() {
    const [stats, setStats] = useState<UserStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await api.get('/leaderboard');
                if (!res.data.IsSucceeded) throw new Error('Leaderboard yüklenemedi');
                setStats(res.data.Data.slice(0, 10));
            } catch (err: any) {
                setError(err.response?.data?.Message || err.message || 'Leaderboard yüklenemedi');
                setShowModal(true);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-900 dark:to-zinc-800 transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-gray-100 dark:border-zinc-700 p-8">
                <div className="flex items-center mb-8">
                    <BarChart3 className="h-8 w-8 text-indigo-600 mr-3" />
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Liderlik Tablosu</h1>
                </div>

                {loading ? (
                    <div className="text-center text-gray-600 dark:text-gray-300 py-8">Yükleniyor...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-auto text-sm text-left text-gray-700 dark:text-gray-200">
                            <thead className="bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3">Sıra</th>
                                <th className="px-6 py-3">Kullanıcı Adı</th>
                                <th className="px-6 py-3">Çözülen</th>
                                <th className="px-6 py-3">Başarı Oranı</th>
                                <th className="px-6 py-3">Toplam Gönderim</th>
                                <th className="px-6 py-3">Skor</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-100 dark:divide-zinc-800">
                            {stats.map((user, index) => (
                                <tr key={user.userId} className="hover:bg-gray-50 dark:hover:bg-zinc-800 transition">
                                    <td className="px-6 py-4 text-indigo-600 font-semibold">#{index + 1}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-gray-800 dark:text-white">
                                            <User className="h-4 w-4 text-indigo-500"/>
                                            {user.username}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-gray-800 dark:text-white">
                                            <BookOpen className="h-4 w-4 text-blue-500"/>
                                            {user.solvedProblemsCount}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-gray-800 dark:text-white">
                                            <Percent className="h-4 w-4 text-green-500"/>
                                            %{user.successRate.toFixed(2)}
                                        </div>
                                    </td>
                                    <td className="px-16 py-4">
                                        <div className="flex items-center gap-2 text-gray-800 dark:text-white">
                                            <BarChart2 className="h-4 w-4 text-yellow-500"/>
                                            {user.totalSubmissions}
                                        </div>
                                    </td>
                                    <td className="px-2 py-4">
                                        <div className="flex items-center gap-2 text-gray-800 dark:text-white">
                                            <Star className="h-4 w-4 text-yellow-500"/>
                                            {user.score.toFixed(2)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <AdvancedModal
                    show={showModal}
                    onClose={() => setShowModal(false)}
                    message={error || 'Bilinmeyen bir hata oluştu'}
                />
            </div>
        </div>
    );
}
