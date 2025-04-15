import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Code, Trophy, ArrowRight, Users, BarChart, ShieldCheck, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Home() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="relative min-h-screen bg-gray-50 overflow-hidden">
            {/* Arka Plan Efekti */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute left-1/2 top-0 transform -translate-x-1/2">
                    <div className="w-[600px] h-[600px] bg-indigo-100 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                </div>
                <div className="absolute right-0 bottom-0 transform translate-x-1/3">
                    <div className="w-[400px] h-[400px] bg-purple-200 rounded-full blur-2xl opacity-20 animate-ping"></div>
                </div>
            </div>

            <div className="py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
                        <span className="block">Yapay Zeka Destekli</span>
                        <span className="block text-indigo-600">Kodlama Pratiği Platformu</span>
                    </h1>
                    <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
                        Zorluk seviyelerine göre ayrılmış interaktif sorularla kendini geliştir, anlık akıllı geribildirimlerle hatalarını öğren, başarılarını takip et.
                    </p>
                    <div className="mt-8 flex justify-center">
                        {isAuthenticated ? (
                            <Link
                                to="/problems"
                                className="inline-flex items-center px-8 py-3 text-lg font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg transition"
                            >
                                Hemen Başla <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        ) : (
                            <Link
                                to="/login"
                                className="inline-flex items-center px-8 py-3 text-lg font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg transition"
                            >
                                Ücretsiz Başla <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        )}
                    </div>
                </div>

                <div className="mt-24 max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                        {/* ... Mevcut kartlar burada kalıyor ... */}
                        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
                            <div className="bg-indigo-100 rounded-xl p-3 inline-block">
                                <Code className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="mt-4 text-xl font-semibold text-gray-900">Kodlama Soruları</h3>
                            <p className="mt-2 text-gray-600 text-sm">
                                Başlangıçtan ileri seviyeye kadar özenle hazırlanmış sorular ile gerçek dünya problemlerine çözüm üret.
                            </p>
                        </div>
                        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
                            <div className="bg-indigo-100 rounded-xl p-3 inline-block">
                                <Brain className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="mt-4 text-xl font-semibold text-gray-900">Yapay Zeka Geribildirimi</h3>
                            <p className="mt-2 text-gray-600 text-sm">
                                LLM destekli sistem sayesinde gönderdiğin kodlar anlık analiz edilir, hataların anlaşılır şekilde sana sunulur.
                            </p>
                        </div>
                        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
                            <div className="bg-indigo-100 rounded-xl p-3 inline-block">
                                <Trophy className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="mt-4 text-xl font-semibold text-gray-900">Gelişimini Takip Et</h3>
                            <p className="mt-2 text-gray-600 text-sm">
                                Çözüm geçmişin, başarı oranın ve ilerleme istatistiklerin detaylı şekilde senin için kaydedilir.
                            </p>
                        </div>
                        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
                            <div className="bg-indigo-100 rounded-xl p-3 inline-block">
                                <BarChart className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="mt-4 text-xl font-semibold text-gray-900">İstatistiklerle İlerle</h3>
                            <p className="mt-2 text-gray-600 text-sm">
                                Başarı oranlarını grafiklerle takip et, her çözdüğün soruyla gelişimini gözlemle.
                            </p>
                        </div>
                        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
                            <div className="bg-indigo-100 rounded-xl p-3 inline-block">
                                <Users className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="mt-4 text-xl font-semibold text-gray-900">Toplulukla Büyü</h3>
                            <p className="mt-2 text-gray-600 text-sm">
                                Diğer kullanıcılarla yarış, sıralamalarda yerini al ve en iyiler arasına adını yazdır.
                            </p>
                        </div>
                        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
                            <div className="bg-indigo-100 rounded-xl p-3 inline-block">
                                <ShieldCheck className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="mt-4 text-xl font-semibold text-gray-900">Güvenli ve Kaliteli</h3>
                            <p className="mt-2 text-gray-600 text-sm">
                                Modern altyapı, güvenli kullanıcı yönetimi ve yüksek kaliteli test sistemleriyle güven içinde öğren.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}