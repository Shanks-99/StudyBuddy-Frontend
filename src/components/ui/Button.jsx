import React from 'react';

const Button = ({ children, type = 'button', onClick, variant = 'primary', className = '' }) => {
    // Premium base styles with smooth transitions and focus rings
    const baseStyles = "inline-flex items-center justify-center font-bold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-[#8c30e8]/20 w-full text-sm tracking-wide";
    
    const variants = {
        // Solid Premium Purple
        primary: "bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white shadow-md shadow-purple-500/20",
        
        // Glassmorphic / Neutral for Secondary
        secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-200 border border-slate-200 dark:border-white/10",
        
        // Premium Outline
        outline: "bg-transparent hover:bg-purple-50 text-purple-600 border border-purple-200 dark:border-[#8c30e8]/30 dark:text-[#8c30e8] dark:hover:bg-[#8c30e8]/10"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            type={type}
            onClick={onClick}
        >
            {children}
        </button>
    );
};

export default Button;