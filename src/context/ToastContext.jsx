import React, { createContext, useContext, useState } from 'react';
import Toast from '../components/ui/Toast';
import ConfirmModal from '../components/ui/ConfirmModal';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState({ message: null, type: 'success' });
    const [confirm, setConfirm] = useState({ isOpen: false, title: 'Confirm Action', message: '', onConfirm: null, onCancel: null });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const showConfirm = ({ title, message, onConfirm, onCancel }) => {
        setConfirm({
            isOpen: true,
            title: title || 'Confirm Action',
            message,
            onConfirm: () => {
                setConfirm(prev => ({ ...prev, isOpen: false }));
                if (onConfirm) onConfirm();
            },
            onCancel: () => {
                setConfirm(prev => ({ ...prev, isOpen: false }));
                if (onCancel) onCancel();
            }
        });
    };

    const hideToast = () => setToast({ message: null, type: 'success' });
    const hideConfirm = () => setConfirm({ isOpen: false, title: 'Confirm Action', message: '', onConfirm: null, onCancel: null });

    return (
        <ToastContext.Provider value={{ showToast, showConfirm }}>
            {children}
            <Toast message={toast.message} type={toast.type} onClose={hideToast} />
            <ConfirmModal 
                isOpen={confirm.isOpen} 
                title={confirm.title}
                message={confirm.message} 
                onConfirm={confirm.onConfirm} 
                onCancel={confirm.onCancel || hideConfirm} 
            />
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
