import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Mail, Lock, User, CheckCircle, GraduationCap, Briefcase, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { register } from '../services/authService';

const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const scaleIn = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
};

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student'
    });
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const prefersReducedMotion = useReducedMotion();

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateName = (name) => {
        // Check if name contains numbers or special characters
        const nameRegex = /^[a-zA-Z\s]+$/;
        return nameRegex.test(name);
    };

    const validateForm = () => {
        const newErrors = {};

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Full name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        } else if (!validateName(formData.name)) {
            newErrors.name = 'Name should not contain numbers or special characters';
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Invalid email';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password)) {
            newErrors.password = 'Password must contain uppercase and lowercase letters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // Real-time validation for name field
        if (name === 'name' && value.trim()) {
            if (!validateName(value)) {
                setErrors({ ...errors, name: 'Name should not contain numbers or special characters' });
            } else if (errors.name) {
                setErrors({ ...errors, name: '' });
            }
        } else if (errors[name]) {
            // Clear error for other fields when user starts typing
            setErrors({ ...errors, [name]: '' });
        }

        // Clear API error when user modifies input
        if (apiError) {
            setApiError('');
        }
    };

    const handleRoleSelect = (selectedRole) => {
        setFormData({ ...formData, role: selectedRole });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');

        // Frontend validation
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await register(formData);
            navigate('/login');
        } catch (err) {
            setApiError(err.response?.data?.msg || 'Registration failed. Please try again.');
            setIsSubmitting(false);
        }
    };

    // Configuration for Role Cards
    const roleConfig = {
        student: {
            title: "Student",
            description: "I want to learn, join study rooms, and track my progress.",
            icon: GraduationCap,
            primaryColor: "border-purple-600 bg-purple-50 dark:bg-[#8c30e8]/10 dark:border-[#8c30e8]",
            hoverColor: "hover:border-purple-600/50 dark:hover:border-[#8c30e8]/50",
            shadowColor: "shadow-md shadow-purple-600/10 dark:shadow-[#8c30e8]/20",
            buttonBg: "bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white",
            iconBg: "bg-purple-600 dark:bg-[#8c30e8] text-white",
            checkColor: "text-purple-600 dark:text-[#8c30e8]",
        },
        teacher: {
            title: "Teacher",
            description: "I want to guide others, host sessions, and share resources.",
            icon: Briefcase,
            primaryColor: "border-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500",
            hoverColor: "hover:border-blue-600/50 dark:hover:border-blue-500/50",
            shadowColor: "shadow-md shadow-blue-600/10 dark:shadow-blue-500/20",
            buttonBg: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white",
            iconBg: "bg-blue-600 dark:bg-blue-500 text-white",
            checkColor: "text-blue-600 dark:text-blue-400",
        },
    };

    const RoleCard = ({ roleKey, config }) => {
        const isSelected = formData.role === roleKey;
        const Icon = config.icon;

        return (
            <div
                onClick={() => handleRoleSelect(roleKey)}
                className={`relative cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center text-center gap-3 group ${
                    isSelected 
                        ? `${config.primaryColor} ${config.shadowColor} scale-[1.02]` 
                        : `border-slate-200 dark:border-white/10 ${config.hoverColor} hover:bg-slate-50 dark:hover:bg-white/5 opacity-70 hover:opacity-100`
                }`}
            >
                {isSelected && (
                    <div className={`absolute top-3 right-3 ${config.checkColor}`}>
                        <CheckCircle size={20} fill="currentColor" className="text-white dark:text-[#191121]" />
                    </div>
                )}
                <div className={`p-4 rounded-full transition-colors ${isSelected ? config.iconBg : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-gray-400 group-hover:text-slate-700 dark:group-hover:text-white"}`}>
                    <Icon size={28} />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{config.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">{config.description}</p>
                </div>
            </div>
        );
    };

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f] text-slate-900 dark:text-white px-4 py-12 flex flex-col items-center justify-center transition-colors duration-300 relative overflow-hidden font-sans">
            
            {/* Animated Background Glows (Solid Colors, No Gradients) */}
            <div className="fixed inset-0 -z-10 pointer-events-none opacity-0 dark:opacity-100 transition-opacity">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#8c30e8]/15 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
            </div>

            <Link to="/login" className="absolute top-8 left-8 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-[#8c30e8] transition-colors z-20">
                <ArrowLeft size={18} /> Back to Login
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="mx-auto w-full max-w-2xl rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden bg-white/90 dark:bg-[#191121]/90 backdrop-blur-xl border border-slate-200 dark:border-white/10"
            >
                <div className="text-center mb-8">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 dark:text-gray-400 font-bold mb-3">
                        Choose Your Path
                    </p>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Join StudyBuddy as...
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* API Error Message */}
                    {apiError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10 p-4"
                        >
                            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-600 dark:text-red-400 font-bold">{apiError}</p>
                        </motion.div>
                    )}

                    {/* Role Selection Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <RoleCard roleKey="student" config={roleConfig.student} />
                        <RoleCard roleKey="teacher" config={roleConfig.teacher} />
                    </div>

                    <div className="space-y-5 pt-6 border-t border-slate-100 dark:border-white/10">
                        {/* Full Name Input */}
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 h-5 w-5 transition-colors group-focus-within:text-purple-600 dark:group-focus-within:text-[#8c30e8]" />
                            <input 
                                type="text" 
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Full Name (e.g. Ali Khan)" 
                                required
                                className={`w-full pl-12 pr-4 py-3.5 rounded-xl border bg-slate-50 dark:bg-[#1a1524] text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-gray-500 text-sm font-medium ${
                                    errors.name ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8]/20'
                                }`}
                            />
                            {errors.name && <p className="text-red-500 dark:text-red-400 font-bold text-xs mt-1.5 absolute -bottom-5 left-1">{errors.name}</p>}
                        </div>

                        {/* Email Input */}
                        <div className="relative group pt-2">
                            <Mail className="absolute left-4 top-[26px] -translate-y-1/2 text-slate-400 dark:text-gray-500 h-5 w-5 transition-colors group-focus-within:text-purple-600 dark:group-focus-within:text-[#8c30e8]" />
                            <input 
                                type="email" 
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Email Address (e.g. Ali@example.com)" 
                                required
                                className={`w-full pl-12 pr-4 py-3.5 rounded-xl border bg-slate-50 dark:bg-[#1a1524] text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-gray-500 text-sm font-medium ${
                                    errors.email ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8]/20'
                                }`}
                            />
                            {errors.email && <p className="text-red-500 dark:text-red-400 font-bold text-xs mt-1.5 absolute -bottom-5 left-1">{errors.email}</p>}
                        </div>

                        {/* Password Input */}
                        <div className="relative group pt-2">
                            <Lock className="absolute left-4 top-[26px] -translate-y-1/2 text-slate-400 dark:text-gray-500 h-5 w-5 transition-colors group-focus-within:text-purple-600 dark:group-focus-within:text-[#8c30e8]" />
                            <input 
                                type="password" 
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create Password" 
                                required
                                className={`w-full pl-12 pr-4 py-3.5 rounded-xl border bg-slate-50 dark:bg-[#1a1524] text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-gray-500 text-sm font-medium ${
                                    errors.password ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8]/20'
                                }`}
                            />
                            {errors.password && <p className="text-red-500 dark:text-red-400 font-bold text-xs mt-1.5 absolute -bottom-5 left-1">{errors.password}</p>}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full mt-4 py-4 rounded-xl font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 ${roleConfig[formData.role].buttonBg}`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin h-5 w-5" /> Creating Account...
                            </>
                        ) : (
                            `Join as ${roleConfig[formData.role].title}`
                        )}
                    </button>

                    <div className="text-center text-sm font-medium text-slate-500 dark:text-gray-400 mt-6">
                        Already have an account?{" "}
                        <Link to="/login" className="text-purple-600 dark:text-[#8c30e8] hover:underline font-bold">
                            Log in
                        </Link>
                    </div>
                </form>
            </motion.div>
        </main>
    );
};

export default Register;