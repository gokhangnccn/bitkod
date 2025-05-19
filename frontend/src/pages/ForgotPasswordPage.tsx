import React, { useState } from 'react';
import { api } from '../api/axios';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.error("Lütfen geçerli bir e-posta girin.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/auth/forgot-password', { email });

            // Eğer sadece mesaj dönüyorsa:
            const message = response.data?.message || response.data;
            toast.success(message || "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.Message ||
                err.response?.data?.message ||
                err.response?.data ||
                "Bir hata oluştu.";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-zinc-900">
            <form
                onSubmit={handleReset}
                className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-lg w-full max-w-md"
            >
                <h2 className="text-2xl font-semibold text-center mb-4 text-gray-800 dark:text-white">
                    Şifremi Unuttum
                </h2>
                <input
                    type="email"
                    placeholder="E-posta adresiniz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full p-2 border rounded mb-4 dark:bg-zinc-700 dark:text-white"
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700"
                >
                    {isLoading ? 'Gönderiliyor...' : 'Şifre Sıfırlama Linki Gönder'}
                </button>
            </form>
        </div>
    );
}
