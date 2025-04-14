import React from 'react';
import { Brain, Code, Trophy} from 'lucide-react';

export function Home() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Tanıtım Bölümü */}
            <div className="text-center">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                    <span className="block">Kodlama Becerilerini Geliştir</span>
                    <span className="block text-indigo-600">Yapay Zeka Destekli!</span>
                </h1>
                <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                    Etkileşimli sorular ve gerçek zamanlı geribildirim sistemiyle kodlama becerilerini geliştiren binlerce geliştiriciye katıl!
                </p>
                <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                    <div className="rounded-md shadow">
                        <a href="#" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-extrabold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10">
                            Hemen Başla
                        </a>
                    </div>
                </div>
            </div>

            {/* Özellikler */}
            <div className="mt-24">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="bg-indigo-100 rounded-lg p-3 inline-block">
                            <Code className="h-6 w-6 text-indigo-600" />
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-gray-900">Kodlama Soruları</h3>
                        <p className="mt-2 text-gray-500">Farklı zorluk seviyelerinde özenle hazırlanmış kodlama soruları ile pratik yap.</p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="bg-indigo-100 rounded-lg p-3 inline-block">
                            <Brain className="h-6 w-6 text-indigo-600" />
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-gray-900">Yapay Zeka Geribildirimi</h3>
                        <p className="mt-2 text-gray-500">Nerede yanlış yaptığını yapay zeka desteği ile gör.</p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="bg-indigo-100 rounded-lg p-3 inline-block">
                            <Trophy className="h-6 w-6 text-indigo-600" />
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-gray-900">Gelişimini Takip Et</h3>
                        <p className="mt-2 text-gray-500">İstatistikler ve başarımlar ile gelişimini takip et.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
