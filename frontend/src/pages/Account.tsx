import React, { useEffect, useState } from 'react';
import { api } from '../api/axios';
import {
    User,
    BarChart2,
    CheckCircle2,
    BookOpen,
    Percent,
} from 'lucide-react';
import AdvancedModal from '../components/AdvancedModal';

interface SubmissionStats {
    totalSubmissions: number;
    successfulSubmissions: number;
    solvedProblemsCount: number;
    successRate: number;
    averageCodeQualityScore: number;
}

interface UserProfile {
    userId: number;
    username: string;
    email: string;
    createdAt: string;
}

const AccountPage = () => {
    const [stats, setStats] = useState<SubmissionStats | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userRes = await api.get('/auth/me');
                if (!userRes.data.IsSucceeded) throw new Error('Kullanıcı bilgisi alınamadı');

                const userId = userRes.data.Data.userId;
                const profileRes = await api.get(`/users/${userId}`);
                if (!profileRes.data.IsSucceeded) throw new Error('Profil bilgisi alınamadı');

                setProfile({
                    userId,
                    username: profileRes.data.Data.username,
                    email: profileRes.data.Data.email,
                    createdAt: profileRes.data.Data.createdAt,
                });

                const statsRes = await api.get(`/submissions/user/${userId}/stats`);
                if (statsRes.data.IsSucceeded) {
                    setStats(statsRes.data.Data);
                } else {
                    throw new Error('İstatistikler alınamadı');
                }
            } catch (err: any) {
                setError(err.response?.data?.Message || err.message || 'Hata oluştu');
                setShowModal(true);
            }
        };

        fetchData();
    }, []);

    const StatCard = ({icon: Icon, label, value, color}: {
        icon: any;
        label: string;
        value: string | number;
        color: string;
    }) => (
        <div className={`bg-white dark:bg-zinc-800 p-4 rounded-xl shadow border-l-4 ${color}`}>
            <div className="flex items-center gap-3">
                <Icon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{value}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-900 dark:to-zinc-800 transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-zinc-700">
                <div className="flex items-center mb-8">
                    <User className="h-10 w-10 text-indigo-600 mr-4" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Merhaba{profile?.username ? `, ${profile.username}` : ''}
                        </h1>
                        {profile && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Katılım tarihi: {new Date(profile.createdAt).toLocaleDateString('tr-TR')}
                            </p>
                        )}
                    </div>
                </div>

                {profile && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Kullanıcı Adı</p>
                            <p className="text-lg font-semibold text-gray-800 dark:text-white">{profile.username}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">E-posta</p>
                            <p className="text-lg font-semibold text-gray-800 dark:text-white">{profile.email}</p>
                        </div>
                    </div>
                )}

                {stats && (
                    <>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">İstatistikler</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <StatCard
                                icon={BarChart2}
                                label="Toplam Gönderim"
                                value={stats.totalSubmissions}
                                color="border-indigo-500"
                            />
                            <StatCard
                                icon={CheckCircle2}
                                label="Başarılı Gönderim"
                                value={stats.successfulSubmissions}
                                color="border-green-500"
                            />
                            <StatCard
                                icon={BookOpen}
                                label="Çözülen Problem"
                                value={stats.solvedProblemsCount}
                                color="border-blue-500"
                            />
                            <StatCard
                                icon={Percent}
                                label="Başarı Oranı"
                                value={`%${stats.successRate.toFixed(2)}`}
                                color="border-yellow-500"
                            />
                            <StatCard
                                icon={BarChart2}
                                label="Ortalama Kod Kalite Skoru"
                                value={stats.averageCodeQualityScore ? stats.averageCodeQualityScore.toFixed(2) : 'N/A'}
                                color="border-purple-500"
                            />
                        </div>
                    </>
                )}
            </div>

            <AdvancedModal
                show={showModal}
                onClose={() => setShowModal(false)}
                message={error || 'Beklenmeyen bir hata oluştu'}
            />
        </div>
    );
};

export default AccountPage;
