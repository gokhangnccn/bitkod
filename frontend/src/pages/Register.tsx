import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, AlertCircle } from 'lucide-react';
import { api } from '../api/axios';

const registerSchema = z.object({
  username: z.string()
      .min(4, 'Kullanıcı adınız en az 4 karakterden oluşmalı')
      .max(16, 'Kullanıcı adınız en fazal 16 karakter olabilir')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Kullanıcı adınız sadece şunları içerebilir: harfler, sayılar, özel karakterler'),
  email: z.string().email('Geçersiz e-mail adresi'),
  password: z.string()
      .min(8, 'Şifreniz en az 8 karakter olmalı')
      .regex(/[A-Z]/, 'Şifreniz en az 1 büyük harf içermeli')
      .regex(/[a-z]/, 'Şifreniz en az 1 küçük harf içermeli')
      .regex(/[0-9]/, 'Şifreniz en az 1 sayı içermeli'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifreleriniz eşleşmiyor",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.post('/auth/register', data);

      if (response.data.IsSucceeded) {
        await login(response.data.Data.token);
        navigate('/');
      } else {
        setError(response.data.Message || 'Kayıt işlemi başarısız');
      }
    } catch (error: any) {
      setError(
          error.response?.data?.Message ||
          error.response?.data?.message ||
          'An error occurred during registration'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-zinc-900 transition-colors duration-300">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-lg">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Hesabınızı Oluşturun
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-zinc-400">
              Zaten bir hesaba sahip misiniz?{' '}
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Giriş Yap
              </Link>
            </p>
          </div>

          {error && (
              <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-4 flex items-center text-red-700 dark:text-red-300">
                <AlertCircle className="h-5 w-5 mr-3" />
                <span className="text-sm">{error}</span>
              </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Kullanıcı Adı
                </label>
                <div className="mt-1">
                  <input
                      {...register('username')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-zinc-500 bg-white dark:bg-zinc-700 text-gray-900 dark:text-white sm:text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Bir kullanıcı adı seçiniz"
                  />
                  {errors.username && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <div className="mt-1">
                  <input
                      {...register('email')}
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-zinc-500 bg-white dark:bg-zinc-700 text-gray-900 dark:text-white sm:text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="E-mail adresinizi giriniz"
                  />
                  {errors.email && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Şifre
                </label>
                <div className="mt-1">
                  <input
                      {...register('password')}
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-zinc-500 bg-white dark:bg-zinc-700 text-gray-900 dark:text-white sm:text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Güçlü bir şifre oluşturun"
                  />
                  {errors.password && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
                  )}
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Şifrenizi doğrulayın
                </label>
                <div className="mt-1">
                  <input
                      {...register('confirmPassword')}
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-zinc-500 bg-white dark:bg-zinc-700 text-gray-900 dark:text-white sm:text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Girdiğiniz şifreyi tekrar giriniz"
                  />
                  {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div>
              <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 ${
                      isLoading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {isLoading ? 'Hesap Oluşturuluyor...' : 'Hesabını Oluştur'}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}
