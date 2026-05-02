import React from 'react';

const Input = ({ label, className = '', ...props }) => {
    return (
        <div className="mb-4 flex flex-col">
            {label && (
                <label 
                    className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5" 
                    htmlFor={props.name}
                >
                    {label}
                </label>
            )}
            <input
                className={`w-full px-4 py-2.5 rounded-xl border transition-all bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder-slate-400 dark:bg-[#191121] dark:border-white/10 dark:text-white dark:placeholder-gray-500 dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8]/20 text-sm shadow-sm ${className}`}
                {...props}
            />
        </div>
    );
};

export default Input;