import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

const ConfirmModal = ({ isOpen, title = 'Confirm Action', message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onCancel}
            />
            
            {/* Modal Content */}
            <div className="relative bg-white dark:bg-[#12121a] rounded-3xl border border-slate-200 dark:border-white/10 p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 text-center">
                <button 
                    onClick={onCancel}
                    className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                    <X size={16} />
                </button>

                <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={24} />
                </div>

                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">{message}</p>

                <div className="flex gap-3">
                    <Button variant="secondary" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={onConfirm} className="!bg-red-600 hover:!bg-red-700 dark:!bg-red-500 dark:hover:!bg-red-600 shadow-red-500/20 text-white">
                        Confirm
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
