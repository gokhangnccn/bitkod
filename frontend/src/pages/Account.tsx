import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api/axios';
import {
    User,
    BarChart2,
    CheckCircle2,
    BookOpen,
    Percent,
    Pencil,
    Check as CheckIcon,
    X as XIcon,
    Loader2,
    Flame,
    Target,
    Clock,
    TrendingUp,
    Award,
    Calendar,
    Activity,
    Zap
} from 'lucide-react';
import AdvancedModal from '../components/AdvancedModal';
import { UserCharts } from '../components/UserCharts';
import { UserReports } from '../components/UserReports';
import Loader from '../components/Loader';

interface SubmissionStats {
    totalSubmissions: number;
    successfulSubmissions: number;
    solvedProblemsCount: number;
    successRate: number;
    averageCodeQualityScore: number;
    submissionsByDay: { date: string; count: number }[];
    submissionsByLanguage: { language: string; count: number }[];
    submissionsByDifficulty: { difficulty: string; count: number }[];
    hourlyActivity: { hour: number; count: number }[];
    weeklyTrend: { week: string; count: number }[];
    successRateOverTime: { date: string; successRate: number }[];
    currentStreak: { currentStreak: number; longestStreak: number };
    firstTrySuccessCount: number;
    averageAttemptsPerProblem: number;
    thisMonthSolved: number;
    thisWeekSolved: number;
    languagePerformance: { language: string; solved: number; successRate: number }[];
    leaderboardRank: number;
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
    const [editingUsername, setEditingUsername] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const inputRef = useRef<HTMLInputElement>(null);

    const canSave = !usernameError && usernameAvailable && !updateLoading;

    useEffect(() => {
        if (editingUsername) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [editingUsername]);

    const IconButton = ({ icon: Icon, onClick, disabled=false, ariaLabel='' }: { icon: any; onClick: ()=>void; disabled?: boolean; ariaLabel?: string; }) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            <Icon className="h-4 w-4" />
        </button>
    );

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Önce kullanıcı bilgilerini al
                const userRes = await api.get('/auth/me');
                if (!userRes.data.IsSucceeded) {
                    throw new Error(userRes.data.Message || 'Kullanıcı bilgisi alınamadı');
                }

                const userId = userRes.data.Data.userId;

                // Kullanıcı profilini al
                const profileRes = await api.get(`/users/${userId}`);
                if (!profileRes.data.IsSucceeded) {
                    throw new Error(profileRes.data.Message || 'Profil bilgisi alınamadı');
                }

                // Tarih formatını düzelt
                const createdAt = profileRes.data.Data.createdAt
                    ? new Date(profileRes.data.Data.createdAt).toISOString()
                    : new Date().toISOString();

                setProfile({
                    userId,
                    username: profileRes.data.Data.username || 'Kullanıcı',
                    email: profileRes.data.Data.email || '',
                    createdAt
                });

                // İstatistikleri al
                const statsRes = await api.get(`/submissions/user/${userId}/stats`);
                if (!statsRes.data.IsSucceeded) {
                    throw new Error(statsRes.data.Message || 'İstatistikler alınamadı');
                }

                // İstatistik verilerini düzenle
                const statsData = statsRes.data.Data;

                setStats({
                    totalSubmissions: statsData.totalSubmissions || 0,
                    successfulSubmissions: statsData.successfulSubmissions || 0,
                    solvedProblemsCount: statsData.solvedProblemsCount || 0,
                    successRate: statsData.successRate || 0,
                    averageCodeQualityScore: statsData.averageCodeQualityScore || 0,
                    submissionsByDay: Array.isArray(statsData.submissionsByDay) ? statsData.submissionsByDay : [],
                    submissionsByLanguage: Array.isArray(statsData.submissionsByLanguage) ? statsData.submissionsByLanguage : [],
                    submissionsByDifficulty: Array.isArray(statsData.submissionsByDifficulty) ? statsData.submissionsByDifficulty : [],
                    hourlyActivity: Array.isArray(statsData.hourlyActivity) ? statsData.hourlyActivity : [],
                    weeklyTrend: Array.isArray(statsData.weeklyTrend) ? statsData.weeklyTrend : [],
                    successRateOverTime: Array.isArray(statsData.successRateOverTime) ? statsData.successRateOverTime : [],
                    currentStreak: statsData.currentStreak || { currentStreak: 0, longestStreak: 0 },
                    firstTrySuccessCount: statsData.firstTrySuccessCount || 0,
                    averageAttemptsPerProblem: statsData.averageAttemptsPerProblem || 0,
                    thisMonthSolved: statsData.thisMonthSolved || 0,
                    thisWeekSolved: statsData.thisWeekSolved || 0,
                    languagePerformance: Array.isArray(statsData.languagePerformance) ? statsData.languagePerformance : [],
                    leaderboardRank: statsData.leaderboardRank || 0
                });
            } catch (err: any) {
                console.error('Error fetching data:', err);
                setError(err.response?.data?.Message || err.message || 'Veriler yüklenirken bir hata oluştu');
                setShowModal(true);
            } finally {
                setLoading(false);
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

    const handleUsernameUpdate = async () => {
        if (!profile) return;

        setUpdateLoading(true);
        try {
            const res = await api.put(`/users/${profile.userId}/username`, { username: newUsername });
            if (res.data.IsSucceeded) {
                setProfile(prev => ({ ...prev!, username: newUsername }));
                setEditingUsername(false);
            } else {
                throw new Error(res.data.Message || 'Kullanıcı adı güncellenirken bir hata oluştu');
            }
        } catch (err: any) {
            console.error('Error updating username:', err);
            setError(err.response?.data?.Message || err.message || 'Kullanıcı adı güncellenirken bir hata oluştu');
            setShowModal(true);
        } finally {
            setUpdateLoading(false);
        }
    };

    const validateUsernameLocal = (value: string): string | null => {
        if (!value) {
            return 'Kullanıcı adı boş olamaz.';
        }
        if (value.length < 3 || value.length > 20) {
            return 'Kullanıcı adı 3-20 karakter olmalıdır.';
        }
        if (/[^a-z0-9_]/.test(value)) {
            return 'Sadece küçük harf, rakam ve alt çizgi(_) kullanabilirsiniz.';
        }
        return null;
    };

    const checkUsernameAvailability = async () => {
        const localErr = validateUsernameLocal(newUsername);
        if (localErr) {
            setUsernameError(localErr);
            setUsernameAvailable(false);
            return;
        }
        if (!newUsername || newUsername === profile?.username) return;
        setAvailabilityLoading(true);
        try {
            const res = await api.get(`/users/check-username`, { params: { username: newUsername } });
            if (res.data.IsSucceeded) {
                setUsernameAvailable(true);
                setUsernameError(null);
            } else {
                setUsernameAvailable(false);
                setUsernameError('Kullanıcı adı kullanımda.');
            }
        } catch (err: any) {
            console.error('Error checking username availability:', err);
            setUsernameAvailable(false);
            setUsernameError('Kullanıcı adı kontrol edilirken bir hata oluştu');
        } finally {
            setAvailabilityLoading(false);
        }
    };

    useEffect(() => {
        if (!editingUsername) return;

        const localErr = validateUsernameLocal(newUsername);
        setUsernameError(localErr);
        if (localErr) {
            setUsernameAvailable(false);
            return;
        }
        const handler = setTimeout(() => {
            checkUsernameAvailability();
        }, 2000);
        return () => {
            clearTimeout(handler);
            setAvailabilityLoading(false);
        };
    }, [newUsername]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-900 dark:to-zinc-800 transition-colors duration-300">
                <div className="max-w-4xl mx-auto">
                    <Loader message="İstatistikler yükleniyor..." fullHeight />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-900 dark:to-zinc-800 transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Profile Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-zinc-700">
                    <div className="flex items-center mb-8">
                        <User className="h-10 w-10 text-indigo-600 mr-4" />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Merhaba{profile?.username ? `, ${profile.username}` : ''}
                            </h1>
                            {profile && profile.createdAt && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Katılım tarihi: {new Date(profile.createdAt).toLocaleDateString('tr-TR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            )}
                        </div>
                    </div>

                    {profile && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Kullanıcı Adı
                                </p>
                                {!editingUsername ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-semibold text-gray-800 dark:text-white">
                                            {profile.username}
                                        </span>
                                        <Pencil
                                            className="h-4 w-4 cursor-pointer hover:text-indigo-600"
                                            onClick={() => {
                                                setEditingUsername(true);
                                                setNewUsername(profile!.username);
                                                setUsernameAvailable(null);
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="relative w-full max-w-xs">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={newUsername}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setNewUsername(val);
                                                const err = validateUsernameLocal(val);
                                                setUsernameError(err);
                                                setUsernameAvailable(err ? false : null);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && canSave) {
                                                    handleUsernameUpdate();
                                                }
                                                if (e.key === 'Escape') {
                                                    setEditingUsername(false);
                                                }
                                            }}
                                            className={`w-full border rounded px-2 py-1 pr-16 dark:bg-zinc-800 dark:border-zinc-600 dark:text-white transition-colors ${usernameError ? 'border-red-500' : usernameAvailable ? 'border-green-500' : ''}`}
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
                                            {availabilityLoading && <Loader2 className="animate-spin h-4 w-4" />}
                                            {!availabilityLoading && (
                                                <>
                                                    <IconButton icon={CheckIcon} ariaLabel="Kaydet" disabled={!canSave} onClick={handleUsernameUpdate} />
                                                    <IconButton icon={XIcon} ariaLabel="İptal" onClick={() => setEditingUsername(false)} />
                                                </>
                                            )}
                                        </div>
                                        {usernameError && (
                                            <p role="alert" className="mt-1 text-sm text-red-500 absolute left-0 top-full">
                                                {usernameError}
                                            </p>
                                        )}
                                    </div>
                                )}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                <StatCard
                                    icon={Award}
                                    label="Sıralama"
                                    value={stats.leaderboardRank ? `#${stats.leaderboardRank}` : 'N/A'}
                                    color="border-orange-500"
                                />
                            </div>
                            
                            <div className="mt-8">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Gelişim Takibi</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <StatCard
                                        icon={Flame}
                                        label="Mevcut Streak"
                                        value={`${stats.currentStreak.currentStreak} gün`}
                                        color="border-red-500"
                                    />
                                    <StatCard
                                        icon={Target}
                                        label="En Uzun Streak"
                                        value={`${stats.currentStreak.longestStreak} gün`}
                                        color="border-pink-500"
                                    />
                                    <StatCard
                                        icon={Calendar}
                                        label="Bu Ay Çözülen"
                                        value={stats.thisMonthSolved}
                                        color="border-teal-500"
                                    />
                                    <StatCard
                                        icon={Activity}
                                        label="Bu Hafta Çözülen"
                                        value={stats.thisWeekSolved}
                                        color="border-cyan-500"
                                    />
                                </div>
                            </div>
                            
                            <div className="mt-8">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Performans Analizi</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <StatCard
                                        icon={Zap}
                                        label="İlk Denemede Başarılı"
                                        value={stats.firstTrySuccessCount}
                                        color="border-emerald-500"
                                    />
                                    <StatCard
                                        icon={TrendingUp}
                                        label="Ortalama Deneme Sayısı"
                                        value={stats.averageAttemptsPerProblem.toFixed(1)}
                                        color="border-amber-500"
                                    />
                                    <StatCard
                                        icon={Clock}
                                        label="En Aktif Saat"
                                        value={stats.hourlyActivity.length > 0 ? 
                                            `${stats.hourlyActivity.reduce((max, curr) => curr.count > max.count ? curr : max).hour}:00` : 
                                            'N/A'}
                                        color="border-violet-500"
                                    />
                                </div>
                            </div>
                            
                            {stats.languagePerformance.length > 0 && (
                                <div className="mt-8">
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Dil Bazlı Performans</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {stats.languagePerformance.map((lang, index) => (
                                            <div key={index} className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow border border-gray-200 dark:border-zinc-700">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{lang.language}</p>
                                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                            {lang.solved} problem
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Başarı Oranı</p>
                                                        <p className="text-lg font-semibold text-green-600">
                                                            %{lang.successRate.toFixed(1)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Charts Section */}
                {stats && (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-zinc-700">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Detaylı İstatistikler</h2>
                        <UserCharts
                            submissionsByDay={stats.submissionsByDay}
                            submissionsByLanguage={stats.submissionsByLanguage}
                            submissionsByDifficulty={stats.submissionsByDifficulty}
                            hourlyActivity={stats.hourlyActivity}
                            weeklyTrend={stats.weeklyTrend}
                            successRateOverTime={stats.successRateOverTime}
                        />
                    </div>
                )}

                {/* Reports Section */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-zinc-700">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Problem Raporlarım</h2>
                    <UserReports />
                </div>
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
