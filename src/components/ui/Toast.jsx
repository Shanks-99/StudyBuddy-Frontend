import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [message, duration, onClose]);

    if (!message) return null;

    const styles = {
        success: 'bg-green-50/90 border-green-200/50 text-green-800 dark:bg-green-950/90 dark:border-green-800/50 dark:text-green-200',
        error: 'bg-red-50/90 border-red-200/50 text-red-800 dark:bg-red-950/90 dark:border-red-800/50 dark:text-red-200',
        info: 'bg-blue-50/90 border-blue-200/50 text-blue-800 dark:bg-blue-950/90 dark:border-blue-800/50 dark:text-blue-200'
    };

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />,
        error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
        info: <Info className="w-5 h-5 text-blue-500 shrink-0" />
    };

    return (
        <div className="fixed top-6 right-6 z-[9999] animate-in fade-in slide-in-from-top-4 duration-300 max-w-md w-full">
            <div className={`flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-lg ${styles[type]}`}>
                {icons[type]}
                <div className="flex-1 text-sm font-semibold leading-relaxed">{message}</div>
                <button 
                    onClick={onClose} 
                    className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-current/60 hover:text-current transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Toast;
