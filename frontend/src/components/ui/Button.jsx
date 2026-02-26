import React from 'react';

const Button = ({ children, type = 'button', onClick, variant = 'primary', className = '' }) => {
    const baseStyles = "font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 w-full";
    const variants = {
        primary: "bg-blue-500 hover:bg-blue-700 text-white",
        secondary: "bg-gray-500 hover:bg-gray-700 text-white",
        outline: "bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white border border-blue-500 hover:border-transparent"
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
