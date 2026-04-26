import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { LogIn, Mail, Lock, AlertCircle, Sparkles, ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { login, loginWithGoogle, verifyRegistrationCode, resendVerificationCode } from '../services/authService';

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
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Login, 2: OTP Verification
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpLoading, setOtpLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    
    const otpRefs = useRef([]);
    const navigate = useNavigate();
    const prefersReducedMotion = useReducedMotion();

    // Timer for Resend OTP
    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Invalid email';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) setErrors({ ...errors, [name]: '' });
        if (apiError) setApiError('');
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsLoading(true);
            try {
                const response = await loginWithGoogle({ 
                    idToken: tokenResponse.access_token,
                    role: isTeacher ? 'teacher' : 'student'
                });
                if (response.role === 'teacher') {
                    navigate('/instructor-dashboard');
                } else {
                    navigate('/student-dashboard');
                }
            } catch (err) {
                setApiError(err.response?.data?.msg || 'Google login failed');
                setIsLoading(false);
            }
        },
        onError: () => setApiError('Google Login Failed'),
    });

    const toggleRole = () => {
        setIsTeacher(!isTeacher);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');
        setIsLoading(true);

        if (!validateForm()) {
            setIsLoading(false);
            return;
        }

        try {
            const response = await login(formData);
<<<<<<< HEAD

            // Redirect based on user's registered role
            if (response.role === 'teacher') {
                navigate('/instructor-dashboard');
            } else if (response.role === 'student') {
                navigate('/student-dashboard');
            }
=======
            const expectedRole = isTeacher ? 'teacher' : 'student';
            if (response.role !== expectedRole) {
                setApiError(`This account is registered as a ${response.role === 'teacher' ? 'Teacher' : 'Student'}. Please switch roles.`);
                setIsLoading(false);
                return;
            }

            if (response.role === 'teacher') navigate('/instructor-dashboard');
            else navigate('/student-dashboard');
>>>>>>> 65a0b6981d7dfb01d25095472e657ac10c11f75e
        } catch (err) {
            if (err.response?.status === 403 && err.response?.data?.requiresVerification) {
                setStep(2);
                setTimer(60);
            } else {
                setApiError(err.response?.data?.msg || 'Login failed. Please try again.');
            }
            setIsLoading(false);
        }
    };

<<<<<<< HEAD
=======
    // OTP Handlers
    const handleOtpChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        if (value && index < 5) {
            otpRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1].focus();
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length !== 6) return;

        setOtpLoading(true);
        setApiError('');
        try {
            await verifyRegistrationCode({ email: formData.email, code });
            // Re-attempt login or just show success and let them login
            setApiError('Email verified! You can now login.');
            setStep(1);
        } catch (err) {
            setApiError(err.response?.data?.msg || 'Verification failed');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (timer > 0) return;
        try {
            await resendVerificationCode({ email: formData.email });
            setTimer(60);
            setApiError('New code sent to your email.');
        } catch (err) {
            setApiError(err.response?.data?.msg || 'Failed to resend code');
        }
    };

>>>>>>> 65a0b6981d7dfb01d25095472e657ac10c11f75e
    return (
        <main className="relative min-h-screen bg-slate-50 dark:bg-[#0a0a0f] text-slate-900 dark:text-white flex items-center justify-center px-6 py-16 overflow-hidden font-sans transition-colors duration-300">
            
            {/* Animated Background Glows */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none opacity-0 dark:opacity-100 transition-opacity">
                <motion.div 
                    className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-[#8c30e8]/15 blur-[120px]"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.2, 0.15] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div 
                    className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-purple-600/10 blur-[100px]"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.15, 0.1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
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
                            whileHover={prefersReducedMotion ? {} : { rotate: [0, -10, 10, -10, 0], scale: 1.05 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="absolute inset-0 rounded-2xl bg-purple-600/20 dark:bg-[#8c30e8]/20 blur-xl" />
                            <div className="relative rounded-2xl bg-white dark:bg-[#191121] p-5 shadow-sm border border-slate-200 dark:border-white/10">
                                <Sparkles className="h-8 w-8 text-purple-600 dark:text-[#8c30e8]" strokeWidth={2.5} />
                            </div>
                        </motion.div>
                    </motion.div>

                    <motion.p variants={fadeInUp} className="text-[10px] uppercase tracking-[0.3em] text-slate-500 dark:text-gray-400 font-bold mb-3">
                        {step === 1 ? 'Welcome Back, Scholar' : 'Verify Your Identity'}
                    </motion.p>
                    
                    <motion.h1 variants={fadeInUp} className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-3 text-slate-900 dark:text-white">
                        StudyBuddy
                    </motion.h1>
                    
<<<<<<< HEAD
                    <motion.p
                        variants={fadeInUp}
                        className="text-sm text-slate-500 dark:text-gray-400 max-w-sm mx-auto font-medium"
                    >
                        Login to access your <span className="font-bold text-purple-600 dark:text-[#8c30e8]">dashboard</span>
=======
                    <motion.p variants={fadeInUp} className="text-sm text-slate-500 dark:text-gray-400 max-w-sm mx-auto font-medium">
                        {step === 1 
                            ? `Login to access your ${isTeacher ? 'Instructor' : 'Student'} dashboard`
                            : `Please enter the 6-digit code sent to ${formData.email}`}
>>>>>>> 65a0b6981d7dfb01d25095472e657ac10c11f75e
                    </motion.p>
                </motion.div>

                {/* Form Card */}
                <motion.div
                    variants={scaleIn}
                    className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191121] p-8 shadow-2xl min-h-[400px]"
                >
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="login"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-5"
                            >
                                <form className="space-y-5" onSubmit={handleSubmit}>
                                    {apiError && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10 p-4">
                                            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm text-red-600 dark:text-red-400 font-bold">{apiError}</p>
                                        </motion.div>
                                    )}

                                    <div className="relative">
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
                                        {errors.email && <p className="text-red-500 dark:text-red-400 font-bold text-xs mt-1 absolute -bottom-5 left-1">{errors.email}</p>}
                                    </div>
<<<<<<< HEAD
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <LogIn className="w-5 h-5" />
                                        Enter StudyBuddy
=======

                                    <div className="relative pt-2">
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
                                        {errors.password && <p className="text-red-500 dark:text-red-400 font-bold text-xs mt-1 absolute -bottom-5 left-1">{errors.password}</p>}
                                    </div>

                                    <div className="pt-4">
                                        <Button type="submit" variant="primary" className="w-full py-3.5 text-base" disabled={isLoading}>
                                            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <div className="flex items-center justify-center gap-2"><LogIn className="w-5 h-5" />Login Securely</div>}
                                        </Button>
                                    </div>
                                </form>

                                {/* Google Login */}
                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100 dark:border-white/5"></span></div>
                                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-[#191121] px-4 text-slate-500 font-bold tracking-widest">Or Continue With</span></div>
                                </div>

                                <button
                                    onClick={() => handleGoogleLogin()}
                                    className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-all font-bold text-slate-700 dark:text-white"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                    Google
                                </button>

                                <div className="text-center pt-4 border-t border-slate-100 dark:border-white/5 mt-6">
                                    <button onClick={toggleRole} className="text-sm font-bold text-purple-600 hover:text-purple-700 dark:text-[#8c30e8] dark:hover:text-[#a760eb] transition-colors mb-4 block w-full">
                                        {isTeacher ? 'Wait, I am a Student' : 'Login as an Instructor'}
                                    </button>
                                    <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Don't have an account? <Link to="/register" className="text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-[#8c30e8] font-bold transition-colors">Create one now</Link></p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="otp"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 flex flex-col items-center"
                            >
                                <div className="p-4 rounded-full bg-purple-50 dark:bg-[#8c30e8]/10 text-purple-600 dark:text-[#8c30e8] mb-2">
                                    <ShieldCheck size={32} />
                                </div>

                                {apiError && (
                                    <div className="w-full flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10 p-4">
                                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-red-600 dark:text-red-400 font-bold">{apiError}</p>
>>>>>>> 65a0b6981d7dfb01d25095472e657ac10c11f75e
                                    </div>
                                )}

<<<<<<< HEAD
                        {/* Register Links */}
                        <motion.div variants={fadeInUp} className="text-center pt-4 border-t border-slate-100 dark:border-white/5 mt-6">
                            <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">
                                Don't have an account?{' '}
                                <Link to="/register" className="text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-[#8c30e8] font-bold transition-colors">
                                    Create one now
                                </Link>
                            </p>
                        </motion.div>
                    </form>
=======
                                <div className="flex justify-between w-full gap-2">
                                    {otp.map((digit, idx) => (
                                        <input
                                            key={idx}
                                            ref={(el) => (otpRefs.current[idx] = el)}
                                            type="text"
                                            maxLength="1"
                                            value={digit}
                                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(idx, e)}
                                            className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8]/20 transition-all outline-none"
                                        />
                                    ))}
                                </div>

                                <Button onClick={handleVerifyOtp} variant="primary" className="w-full py-4 text-base mt-4" disabled={otpLoading || otp.includes('')}>
                                    {otpLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
                                </Button>

                                <div className="text-center space-y-3">
                                    <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">
                                        Didn't receive the code?
                                    </p>
                                    <button
                                        onClick={handleResendOtp}
                                        disabled={timer > 0}
                                        className={`text-sm font-bold transition-colors ${timer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-purple-600 hover:text-purple-700 dark:text-[#8c30e8] dark:hover:text-[#a760eb]'}`}
                                    >
                                        {timer > 0 ? `Resend Code in ${timer}s` : 'Resend Code Now'}
                                    </button>
                                    <button onClick={() => setStep(1)} className="flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors text-sm font-medium w-full mt-4">
                                        <ArrowLeft size={16} /> Back to Login
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
>>>>>>> 65a0b6981d7dfb01d25095472e657ac10c11f75e
                </motion.div>
            </motion.div>
        </main>
    );
};

export default Login;