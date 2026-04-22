import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { LogIn, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { login } from '../services/authService';

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

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isTeacher, setIsTeacher] = useState(false);
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const prefersReducedMotion = useReducedMotion();

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateForm = () => {
        const newErrors = {};

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Invalid email';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
        // Clear API error when user modifies input
        if (apiError) {
            setApiError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');
        setIsLoading(true);

        // Frontend validation
        if (!validateForm()) {
            setIsLoading(false);
            return;
        }

        try {
            const response = await login(formData);

            // Check if user's registered role matches the selected login mode
            const expectedRole = isTeacher ? 'teacher' : 'student';
            if (response.role !== expectedRole) {
                if (response.role === 'teacher') {
                    setApiError('This account is registered as a Teacher. Please use "Login as Teacher" option.');
                } else {
                    setApiError('This account is registered as a Student. Please use "Login as Student" option.');
                }
                setIsLoading(false);
                return;
            }

            // Redirect based on user's registered role
            if (response.role === 'teacher') {
                navigate('/instructor-dashboard');
            } else {
                navigate('/student-dashboard');
            }
        } catch (err) {
            setApiError(err.response?.data?.msg || 'Login failed. Please try again.');
            setIsLoading(false);
        }
    };

    const toggleRole = () => {
        setIsTeacher(!isTeacher);
    };

    return (
        <main className="relative min-h-screen bg-slate-50 dark:bg-[#0a0a0f] text-slate-900 dark:text-white flex items-center justify-center px-6 py-16 overflow-hidden font-sans transition-colors duration-300">
            
            {/* Animated Background Glows (Solid Colors, No Gradients) */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none opacity-0 dark:opacity-100 transition-opacity">
                <motion.div 
                    className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-[#8c30e8]/15 blur-[120px]"
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.15, 0.2, 0.15],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div 
                    className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-purple-600/10 blur-[100px]"
                    animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.1, 0.15, 0.1],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                    }}
                />
            </div>

            <motion.div
                initial="initial"
                animate="animate"
                variants={staggerContainer}
                className="w-full max-w-md z-10"
            >
                {/* Header Section */}
                <motion.div variants={fadeInUp} className="mb-8 text-center">
                    <motion.div variants={scaleIn} className="mb-6 inline-flex">
                        <motion.div
                            className="relative"
                            whileHover={prefersReducedMotion ? {} : { 
                                rotate: [0, -10, 10, -10, 0],
                                scale: 1.05
                            }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="absolute inset-0 rounded-2xl bg-purple-600/20 dark:bg-[#8c30e8]/20 blur-xl" />
                            <div className="relative rounded-2xl bg-white dark:bg-[#191121] p-5 shadow-sm border border-slate-200 dark:border-white/10">
                                <Sparkles className="h-8 w-8 text-purple-600 dark:text-[#8c30e8]" strokeWidth={2.5} />
                            </div>
                        </motion.div>
                    </motion.div>

                    <motion.p
                        variants={fadeInUp}
                        className="text-[10px] uppercase tracking-[0.3em] text-slate-500 dark:text-gray-400 font-bold mb-3"
                    >
                        Welcome Back, Scholar
                    </motion.p>
                    
                    <motion.h1
                        variants={fadeInUp}
                        className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-3 text-slate-900 dark:text-white"
                    >
                        StudyBuddy
                    </motion.h1>
                    
                    <motion.p
                        variants={fadeInUp}
                        className="text-sm text-slate-500 dark:text-gray-400 max-w-sm mx-auto font-medium"
                    >
                        Login to access your <span className="font-bold text-purple-600 dark:text-[#8c30e8]">{isTeacher ? 'Instructor' : 'Student'}</span> dashboard
                    </motion.p>
                </motion.div>

                {/* Form Card */}
                <motion.div
                    variants={scaleIn}
                    className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191121] p-8 shadow-2xl"
                >
                    <form className="relative space-y-5" onSubmit={handleSubmit}>
                        
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

                        {/* Email Input */}
                        <motion.div variants={fadeInUp} className="relative">
                            <Mail className="absolute left-4 top-[38px] text-slate-400 dark:text-gray-500 w-5 h-5 z-10" strokeWidth={2} />
                            <Input
                                label="Email Address"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="scholar@studybuddy.com"
                                required
                                className="pl-12"
                            />
                            {errors.email && (
                                <p className="text-red-500 dark:text-red-400 font-bold text-xs mt-1 absolute -bottom-5 left-1">{errors.email}</p>
                            )}
                        </motion.div>

                        {/* Password Input */}
                        <motion.div variants={fadeInUp} className="relative pt-2">
                            <Lock className="absolute left-4 top-[46px] text-slate-400 dark:text-gray-500 w-5 h-5 z-10" strokeWidth={2} />
                            <Input
                                label="Password"
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                className="pl-12"
                            />
                            {errors.password && (
                                <p className="text-red-500 dark:text-red-400 font-bold text-xs mt-1 absolute -bottom-5 left-1">{errors.password}</p>
                            )}
                        </motion.div>

                        {/* Submit Button */}
                        <motion.div variants={fadeInUp} className="pt-4">
                            <Button 
                                type="submit" 
                                variant="primary" 
                                className="w-full py-3.5 text-base"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        Signing in...
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <LogIn className="w-5 h-5" />
                                        Login Securely
                                    </div>
                                )}
                            </Button>
                        </motion.div>

                        {/* Toggle Role & Register Links */}
                        <motion.div variants={fadeInUp} className="text-center pt-4 border-t border-slate-100 dark:border-white/5 mt-6">
                            <button
                                type="button"
                                onClick={toggleRole}
                                className="text-sm font-bold text-purple-600 hover:text-purple-700 dark:text-[#8c30e8] dark:hover:text-[#a760eb] transition-colors mb-4 block w-full"
                            >
                                {isTeacher ? 'Wait, I am a Student' : 'Login as an Instructor'}
                            </button>
                            <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">
                                Don't have an account?{' '}
                                <Link to="/register" className="text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-[#8c30e8] font-bold transition-colors">
                                    Create one now
                                </Link>
                            </p>
                        </motion.div>
                    </form>
                </motion.div>
            </motion.div>
        </main>
    );
};

export default Login;