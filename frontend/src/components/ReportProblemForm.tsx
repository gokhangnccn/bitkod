import React, { useState } from 'react';
import { api } from '../api/axios';
import { Flag } from 'lucide-react';

interface ReportProblemFormProps {
    problemUid: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export const ReportProblemForm: React.FC<ReportProblemFormProps> = ({ problemUid, onSuccess, onCancel }) => {
    const [category, setCategory] = useState('WRONG_SOLUTION');
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await api.post('/problems/report', {
                problemUid,
                category,
                feedback
            });

            if (response.data.IsSucceeded) {
                onSuccess();
            } else {
                setError(response.data.Message || 'Rapor gönderilirken bir hata oluştu');
            }
        } catch (err: any) {
            setError(err.response?.data?.Message || 'Rapor gönderilirken bir hata oluştu');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rapor Kategorisi
                </label>
                <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                >
                    <option value="WRONG_SOLUTION">Yanlış Çözüm</option>
                    <option value="INCORRECT_TEST_CASES">Test Durumu Hatası</option>
                    <option value="UNCLEAR_DESCRIPTION">Açıklama Hatası</option>
                    <option value="TECHNICAL_ISSUE">Teknik Sorun</option>
                    <option value="OTHER">Diğer</option>
                </select>
            </div>

            <div>
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rapor Detayı
                </label>
                <textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Lütfen problemi detaylı bir şekilde açıklayın..."
                    required
                    minLength={10}
                    maxLength={1000}
                />
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                >
                    İptal
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
                        isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                >
                    <Flag className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Gönderiliyor...' : 'Raporu Gönder'}
                </button>
            </div>
        </form>
    );
}; 