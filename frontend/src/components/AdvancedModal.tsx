import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface AdvancedModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    message: string;
    title?: string;
    type?: 'info' | 'success' | 'error' | 'warning';
    confirmText?: string;
    cancelText?: string;
    autoClose?: number;
}

const typeConfig = {
    info: {
        icon: <Info className="text-blue-500 w-6 h-6" />,
        title: 'Bilgi',
    },
    success: {
        icon: <CheckCircle className="text-green-500 w-6 h-6" />,
        title: 'Başarılı',
    },
    error: {
        icon: <XCircle className="text-red-500 w-6 h-6" />,
        title: 'Hata',
    },
    warning: {
        icon: <AlertTriangle className="text-yellow-500 w-6 h-6" />,
        title: 'Uyarı',
    },
};

const AdvancedModal: React.FC<AdvancedModalProps> = ({
                                                         show,
                                                         onClose,
                                                         onConfirm,
                                                         message,
                                                         title,
                                                         type = 'info',
                                                         confirmText = 'Tamam',
                                                         cancelText = 'İptal',
                                                         autoClose,
                                                     }) => {
    useEffect(() => {
        if (autoClose) {
            const timer = setTimeout(onClose, autoClose);
            return () => clearTimeout(timer);
        }
    }, [autoClose, onClose]);

    if (!show) return null;

    const config = typeConfig[type];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white dark:bg-white-800 rounded-lg p-6 shadow-xl max-w-sm w-full animate-scale-in">
                <div className="flex items-center mb-4">
                    {config.icon}
                    <h2 className="ml-2 text-lg font-semibold text-black-800 dark:text-black-800">
                        {title || config.title}
                    </h2>
                </div>
                <p className="text-gray-700 dark:text-black-300 whitespace-pre-line">{message}</p>
                <div className="mt-6 flex justify-end space-x-3">
                    {onConfirm && (
                        <button
                            onClick={onConfirm}
                            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                        >
                            {confirmText}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                    >
                        {onConfirm ? cancelText : 'Kapat'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdvancedModal;