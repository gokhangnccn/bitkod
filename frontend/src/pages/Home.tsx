import React from 'react';
import { Link } from 'react-router-dom';
import {
    Brain,
    Code,
    Trophy,
    ArrowRight,
    Users,
    BarChart,
    ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Home() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="relative min-h-screen bg-gray-50 dark:bg-zinc-900 dark:text-white overflow-hidden transition-colors duration-300">
            {/* Arka Plan Efekti */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute left-1/2 top-0 transform -translate-x-1/2">
                    <div className="w-[600px] h-[600px] bg-indigo-100 dark:bg-indigo-900 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                </div>
                <div className="absolute right-0 bottom-0 transform translate-x-1/3">
                    <div className="w-[400px] h-[400px] bg-purple-200 dark:bg-purple-900 rounded-full blur-2xl opacity-20 animate-ping"></div>
                </div>
            </div>

            <div className="py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
                        <span className="block">Yapay Zeka Destekli</span>
                        <span className="block text-indigo-600 dark:text-indigo-400">Kodlama Pratiği Platformu</span>
                    </h1>
                    <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Zorluk seviyelerine göre ayrılmış interaktif sorularla kendini geliştir, anlık akıllı geribildirimlerle hatalarını öğren, başarılarını takip et.
                    </p>
                    <div className="mt-8 flex justify-center">
                        <Link
                            to={isAuthenticated ? '/problems' : '/login'}
                            className="inline-flex items-center px-8 py-3 text-lg font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg transition"
                        >
                            {isAuthenticated ? 'Hemen Başla' : 'Ücretsiz Başla'}
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </div>
                </div>

                <div className="mt-24 max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                        {[
                            {
                                icon: <Code className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />,
                                title: 'Kodlama Soruları',
                                text: 'Başlangıçtan ileri seviyeye kadar özenle hazırlanmış sorular ile gerçek dünya problemlerine çözüm üret.',
                            },
                            {
                                icon: <Brain className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />,
                                title: 'Yapay Zeka Geribildirimi',
                                text: 'LLM destekli sistem sayesinde gönderdiğin kodlar anlık analiz edilir, hataların anlaşılır şekilde sana sunulur.',
                            },
                            {
                                icon: <Trophy className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />,
                                title: 'Gelişimini Takip Et',
                                text: 'Çözüm geçmişin, başarı oranın ve ilerleme istatistiklerin detaylı şekilde senin için kaydedilir.',
                            },
                            {
                                icon: <BarChart className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />,
                                title: 'İstatistiklerle İlerle',
                                text: 'Başarı oranlarını grafiklerle takip et, her çözdüğün soruyla gelişimini gözlemle.',
                            },
                            {
                                icon: <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />,
                                title: 'Toplulukla Büyü',
                                text: 'Diğer kullanıcılarla yarış, sıralamalarda yerini al ve en iyiler arasına adını yazdır.',
                            },
                            {
                                icon: <ShieldCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />,
                                title: 'Güvenli ve Kaliteli',
                                text: 'Modern altyapı, güvenli kullanıcı yönetimi ve yüksek kaliteli test sistemleriyle güven içinde öğren.',
                            },
                        ].map((feature, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 p-6 rounded-2xl shadow-sm hover:shadow-md transition"
                            >
                                <div className="bg-indigo-100 dark:bg-indigo-900 rounded-xl p-3 inline-block">
                                    {feature.icon}
                                </div>
                                <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
                                <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm">{feature.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
