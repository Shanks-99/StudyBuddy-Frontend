import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Mail, Lock, User, CheckCircle, GraduationCap, Briefcase, ArrowLeft, AlertCircle, Loader2, ShieldCheck, RefreshCw } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { register, loginWithGoogle, verifyRegistrationCode, resendVerificationCode } from '../services/authService';

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
    const [step, setStep] = useState(1); // 1: Registration Form, 2: OTP Verification
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpLoading, setOtpLoading] = useState(false);
    const [timer, setTimer] = useState(0);

    const otpRefs = useRef([]);
    const navigate = useNavigate();
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateName = (name) => {
        const nameRegex = /^[a-zA-Z\s]+$/;
        return nameRegex.test(name);
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Full name is required';
        else if (formData.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';
        else if (!validateName(formData.name)) newErrors.name = 'Name should not contain numbers';

        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!validateEmail(formData.email)) newErrors.email = 'Invalid email';

        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) setErrors({ ...errors, [name]: '' });
        if (apiError) setApiError('');
    };

    const handleRoleSelect = (selectedRole) => {
        setFormData({ ...formData, role: selectedRole });
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsSubmitting(true);
            try {
                const response = await loginWithGoogle({ 
                    idToken: tokenResponse.access_token,
                    role: formData.role
                });
                if (response.role === 'teacher') navigate('/instructor-dashboard');
                else navigate('/student-dashboard');
            } catch (err) {
                setApiError(err.response?.data?.msg || 'Google registration failed');
                setIsSubmitting(false);
            }
        },
        onError: () => setApiError('Google Login Failed'),
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            await register(formData);
            setStep(2);
            setTimer(60);
        } catch (err) {
            setApiError(err.response?.data?.msg || 'Registration failed');
            setIsSubmitting(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);
        if (value && index < 5) otpRefs.current[index + 1].focus();
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1].focus();
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length !== 6) return;
        setOtpLoading(true);
        try {
            await verifyRegistrationCode({ email: formData.email, code });
            navigate('/login', { state: { msg: 'Verification successful! Please login.' } });
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

    const roleConfig = {
        student: {
            title: "Student",
            description: "I want to learn and track my progress.",
            icon: GraduationCap,
            primaryColor: "border-purple-600 bg-purple-50 dark:bg-[#8c30e8]/10 dark:border-[#8c30e8]",
            hoverColor: "hover:border-purple-600/50 dark:hover:border-[#8c30e8]/50",
            shadowColor: "shadow-md shadow-purple-600/10 dark:shadow-[#8c30e8]/20",
            buttonBg: "bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white",
            iconBg: "bg-purple-600 dark:bg-[#8c30e8] text-white",
            checkColor: "text-purple-600 dark:text-[#8c30e8]",
        },
        teacher: {
            title: "Mentor",
            description: "I want to guide others and share resources.",
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
                className={`relative cursor-pointer p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center text-center gap-2 group ${
                    isSelected 
                        ? `${config.primaryColor} ${config.shadowColor} scale-[1.02]` 
                        : `border-slate-200 dark:border-white/10 ${config.hoverColor} hover:bg-slate-50 dark:hover:bg-white/5 opacity-70 hover:opacity-100`
                }`}
            >
                {isSelected && (
                    <div className={`absolute top-2 right-2 ${config.checkColor}`}>
                        <CheckCircle size={18} fill="currentColor" className="text-white dark:text-[#191121]" />
                    </div>
                )}
                <div className={`p-3 rounded-full transition-colors ${isSelected ? config.iconBg : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-gray-400"}`}>
                    <Icon size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">{config.title}</h3>
                    <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-1 leading-tight">{config.description}</p>
                </div>
            </div>
        );
    };

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f] text-slate-900 dark:text-white px-4 py-12 flex flex-col items-center justify-center transition-colors duration-300 relative overflow-hidden font-sans">
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
                className="mx-auto w-full max-w-2xl rounded-[2rem] p-8 md:p-10 shadow-2xl relative overflow-hidden bg-white/90 dark:bg-[#191121]/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 min-h-[500px]"
            >
                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                            <div className="text-center mb-8">
                                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 dark:text-gray-400 font-bold mb-3">Choose Your Path</p>
                                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Join StudyBuddy as...</h1>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {apiError && (
                                    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10 p-4">
                                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-red-600 dark:text-red-400 font-bold">{apiError}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <RoleCard roleKey="student" config={roleConfig.student} />
                                    <RoleCard roleKey="teacher" config={roleConfig.teacher} />
                                </div>

                                <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-white/10">
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 h-5 w-5 z-10" />
                                        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" required className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1a1524] text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8]/20 transition-all text-sm font-medium" />
                                        {errors.name && <p className="text-red-500 dark:text-red-400 font-bold text-xs mt-1 absolute -bottom-5 left-1">{errors.name}</p>}
                                    </div>

                                    <div className="relative group pt-1">
                                        <Mail className="absolute left-4 top-[24px] text-slate-400 dark:text-gray-500 h-5 w-5 z-10" />
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" required className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1a1524] text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8]/20 transition-all text-sm font-medium" />
                                        {errors.email && <p className="text-red-500 dark:text-red-400 font-bold text-xs mt-1 absolute -bottom-5 left-1">{errors.email}</p>}
                                    </div>

                                    <div className="relative group pt-1">
                                        <Lock className="absolute left-4 top-[24px] text-slate-400 dark:text-gray-500 h-5 w-5 z-10" />
                                        <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create Password" required className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1a1524] text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8]/20 transition-all text-sm font-medium" />
                                        {errors.password && <p className="text-red-500 dark:text-red-400 font-bold text-xs mt-1 absolute -bottom-5 left-1">{errors.password}</p>}
                                    </div>
                                </div>

                                <button type="submit" disabled={isSubmitting} className={`w-full mt-4 py-4 rounded-xl font-bold shadow-lg transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2 ${roleConfig[formData.role].buttonBg}`}>
                                    {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : `Join as ${roleConfig[formData.role].title}`}
                                </button>

                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100 dark:border-white/5"></span></div>
                                    <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white dark:bg-[#191121] px-4 text-slate-500 font-bold tracking-[0.2em]">Social Register</span></div>
                                </div>

                                <button onClick={() => handleGoogleLogin()} type="button" className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-all font-bold text-sm text-slate-700 dark:text-white">
                                    <svg width="18" height="18" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                    Continue with Google
                                </button>

                                <div className="text-center text-sm font-medium text-slate-500 dark:text-gray-400">
                                    Already have an account? <Link to="/login" className="text-purple-600 dark:text-[#8c30e8] hover:underline font-bold">Log in</Link>
                                </div>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 flex flex-col items-center py-4">
                            <div className="p-5 rounded-full bg-purple-50 dark:bg-[#8c30e8]/10 text-purple-600 dark:text-[#8c30e8]">
                                <ShieldCheck size={40} />
                            </div>
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Check your email</h2>
                                <p className="text-sm text-slate-500 dark:text-gray-400">We've sent a 6-digit verification code to<br/><span className="font-bold text-slate-900 dark:text-white">{formData.email}</span></p>
                            </div>

                            <div className="flex justify-center gap-2 w-full max-w-xs">
                                {otp.map((digit, idx) => (
                                    <input key={idx} ref={(el) => (otpRefs.current[idx] = el)} type="text" maxLength="1" value={digit} onChange={(e) => handleOtpChange(idx, e.target.value)} onKeyDown={(e) => handleKeyDown(idx, e)} className="w-10 h-14 text-center text-xl font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8]/20 outline-none transition-all" />
                                ))}
                            </div>

                            {apiError && <div className="text-sm text-red-500 font-bold bg-red-50 dark:bg-red-500/10 px-4 py-2 rounded-lg">{apiError}</div>}

                            <button onClick={handleVerifyOtp} disabled={otpLoading || otp.includes('')} className={`w-full max-w-sm py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${roleConfig[formData.role].buttonBg}`}>
                                {otpLoading ? <RefreshCw className="animate-spin h-5 w-5" /> : 'Verify Account'}
                            </button>

                            <div className="text-center space-y-4">
                                <button onClick={handleResendOtp} disabled={timer > 0} className={`text-sm font-bold ${timer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-purple-600 hover:text-purple-700 dark:text-[#8c30e8]'}`}>
                                    {timer > 0 ? `Resend code in ${timer}s` : 'Resend Code Now'}
                                </button>
                                <button onClick={() => setStep(1)} className="flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors text-sm font-medium w-full">
                                    <ArrowLeft size={16} /> Edit Registration Details
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </main>
    );
};

export default Register;