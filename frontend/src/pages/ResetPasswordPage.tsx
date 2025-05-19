import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { toast } from 'sonner';
import { useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from "zod";
import { validationFieldsSchema } from "../utils/validationFields.ts";

export const resetPasswordSchema = z.object({
    newPassword: validationFieldsSchema,
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"]
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();
    const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(resetPasswordSchema)
    });

    useEffect(() => {
        if (!token) {
            toast.error("Şifre sıfırlama bağlantısı geçersiz.");
            setIsTokenValid(false);
            return;
        }

        api.get(`/auth/reset-password/validate`, { params: { token } })
            .then(res => setIsTokenValid(res.data?.valid))
            .catch(() => {
                toast.error("Sunucuyla bağlantı kurulamadı.");
                setIsTokenValid(false);
            });
    }, [token]);

    const onSubmit = async (data: ResetPasswordFormData) => {
        if (!token) return;

        setIsLoading(true);
        try {
            await api.post('/auth/reset-password', {
                token,
                newPassword: data.newPassword
            });
            toast.success("Şifre başarıyla güncellendi.");
            navigate("/login");
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.message ||
                err.response?.data ||
                "Bir hata oluştu.";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (isTokenValid === null) {
        return <div className="text-center mt-10 text-white">Token doğrulanıyor...</div>;
    }

    if (isTokenValid === false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-zinc-900">
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-lg w-full max-w-md text-center">
                    <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">
                        Bu şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.
                    </h2>
                    <button
                        onClick={() => navigate('/forgot-password')}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                        Yeni bağlantı al
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-zinc-900">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-lg w-full max-w-md"
            >
                <h2 className="text-2xl font-semibold text-center mb-4 text-gray-800 dark:text-white">
                    Yeni Şifre Belirle
                </h2>

                <input
                    type="password"
                    placeholder="Yeni şifre"
                    {...register("newPassword")}
                    className="w-full p-2 border rounded mb-2 dark:bg-zinc-700 dark:text-white"
                />
                {errors.newPassword && (
                    <p className="text-red-500 text-sm mb-2">{errors.newPassword.message}</p>
                )}

                <input
                    type="password"
                    placeholder="Yeni şifre (tekrar)"
                    {...register("confirmPassword")}
                    className="w-full p-2 border rounded mb-2 dark:bg-zinc-700 dark:text-white"
                />
                {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mb-4">{errors.confirmPassword.message}</p>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700"
                >
                    {isLoading ? 'Gönderiliyor...' : 'Şifreyi Güncelle'}
                </button>
            </form>
        </div>
    );
}
