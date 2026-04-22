import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Briefcase } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { register } from '../services/authService';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student'
    });
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const navigate = useNavigate();

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

        if (!formData.name.trim()) {
            newErrors.name = 'Full name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        } else if (!validateName(formData.name)) {
            newErrors.name = 'Name should not contain numbers or special characters';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Invalid email';
        }

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

        if (name === 'name' && value.trim()) {
            if (!validateName(value)) {
                setErrors({ ...errors, name: 'Name should not contain numbers or special characters' });
            } else if (errors.name) {
                setErrors({ ...errors, name: '' });
            }
        } else if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }

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

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            setIsSubmitting(true);
            const response = await register(formData);

            if (response.requiresVerification) {
                setVerificationEmail(response.email);
                setStep(2);
                setResendCooldown(RESEND_COOLDOWN);
            } else {
                navigate('/login');
            }
        } catch (err) {
            setApiError(err.response?.data?.msg || 'Registration failed. Please try again.');
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

    // OTP input handlers
    const handleOtpChange = useCallback((index, value) => {
        if (value.length > 1) {
            // Handle paste
            const digits = value.replace(/\D/g, '').slice(0, 6);
            const newOtp = [...otpValues];
            for (let i = 0; i < 6; i++) {
                newOtp[i] = digits[i] || '';
            }
            setOtpValues(newOtp);
            setOtpError('');

            // Focus last filled input or the next empty one
            const focusIdx = Math.min(digits.length, 5);
            otpInputRefs.current[focusIdx]?.focus();
            return;
        }

        if (!/^\d*$/.test(value)) return; // Only digits

        const newOtp = [...otpValues];
        newOtp[index] = value;
        setOtpValues(newOtp);
        setOtpError('');

        // Auto-focus next input
        if (value && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }
    }, [otpValues]);

    const handleOtpKeyDown = useCallback((index, e) => {
        if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    }, [otpValues]);

    const handleVerifyCode = async () => {
        const code = otpValues.join('');
        if (code.length !== 6) {
            setOtpError('Please enter the complete 6-digit code');
            return;
        }

        try {
            setIsVerifying(true);
            setOtpError('');
            await verifyRegistrationCode({ email: verificationEmail, code });
            setVerificationSuccess(true);

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setOtpError(err.response?.data?.msg || 'Verification failed. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendCode = async () => {
        if (resendCooldown > 0 || isResending) return;

        try {
            setIsResending(true);
            setOtpError('');
            await resendVerificationCode({ email: verificationEmail });
            setResendCooldown(RESEND_COOLDOWN);
            setOtpValues(['', '', '', '', '', '']);
            otpInputRefs.current[0]?.focus();
        } catch (err) {
            const retryAfter = err.response?.data?.retryAfter;
            if (retryAfter) {
                setResendCooldown(retryAfter);
            }
            setOtpError(err.response?.data?.msg || 'Failed to resend code. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    const handleBackToForm = () => {
        setStep(1);
        setOtpValues(['', '', '', '', '', '']);
        setOtpError('');
        setVerificationSuccess(false);
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setApiError('');

        if (!credentialResponse?.credential) {
            setApiError('Google registration failed. No token received.');
            return;
        }

        try {
            setIsGoogleLoading(true);
            const expectedRole = formData.role === 'teacher' ? 'teacher' : 'student';

            const response = await loginWithGoogle({
                idToken: credentialResponse.credential,
                role: expectedRole,
            });

            if (response.role !== expectedRole) {
                setApiError(getRoleMismatchMessage(response.role));
                return;
            }

            navigateByRole(response.role);
        } catch (err) {
            setApiError(err.response?.data?.msg || 'Google registration failed. Please try again.');
        } finally {
            setIsGoogleLoading(false);
        }
    };

    // ==================== OTP VERIFICATION SCREEN ====================
    if (step === 2) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl w-full max-w-md border border-white/20">
                    {/* Back button */}
                    <button
                        onClick={handleBackToForm}
                        className="flex items-center gap-1.5 text-blue-100 hover:text-white text-sm font-medium mb-6 transition group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        Back to registration
                    </button>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="bg-white/20 p-3 rounded-full inline-block mb-4">
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white">Verify Your Email</h2>
                        <p className="text-blue-100 mt-2">
                            We've sent a 6-digit code to
                        </p>
                        <p className="text-white font-semibold mt-1 text-sm bg-white/10 rounded-lg px-3 py-1.5 inline-block">
                            {verificationEmail}
                        </p>
                    </div>

                    {verificationSuccess ? (
                        /* Success state */
                        <div className="text-center">
                            <div className="bg-green-500/20 border border-green-400 rounded-xl p-6 mb-4">
                                <div className="text-4xl mb-3">✅</div>
                                <h3 className="text-white text-lg font-bold mb-1">Email Verified!</h3>
                                <p className="text-green-100 text-sm">Redirecting to login...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* OTP error */}
                            {otpError && (
                                <div className="bg-red-500/20 border border-red-500 text-white px-4 py-2 rounded-lg mb-4 text-center text-sm">
                                    {otpError}
                                </div>
                            )}

                            {/* OTP Input Boxes */}
                            <div className="flex justify-center gap-2.5 mb-6">
                                {otpValues.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => (otpInputRefs.current[index] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={index === 0 ? 6 : 1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all duration-200
                                            ${digit
                                                ? 'border-indigo-400 bg-white text-indigo-700 shadow-lg shadow-indigo-500/20'
                                                : 'border-white/30 bg-white/10 text-white'
                                            }
                                            focus:border-indigo-400 focus:bg-white focus:text-indigo-700 focus:shadow-lg focus:shadow-indigo-500/30
                                            hover:border-white/50`}
                                        autoComplete="one-time-code"
                                    />
                                ))}
                            </div>

                            {/* Verify Button */}
                            <button
                                onClick={handleVerifyCode}
                                disabled={isVerifying || otpValues.join('').length !== 6}
                                className={`w-full py-3 rounded-xl text-sm font-bold text-white shadow transition-all duration-200 mb-4
                                    ${isVerifying || otpValues.join('').length !== 6
                                        ? 'bg-gray-400/50 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-lg hover:shadow-green-500/25'
                                    }`}
                            >
                                {isVerifying ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Verifying...
                                    </span>
                                ) : (
                                    'Verify & Continue'
                                )}
                            </button>

                            {/* Resend section */}
                            <div className="text-center">
                                <p className="text-blue-100 text-sm mb-2">Didn't receive the code?</p>
                                {resendCooldown > 0 ? (
                                    <p className="text-white/60 text-sm">
                                        Resend available in <span className="font-bold text-white">{resendCooldown}s</span>
                                    </p>
                                ) : (
                                    <button
                                        onClick={handleResendCode}
                                        disabled={isResending}
                                        className="text-white font-semibold text-sm hover:text-blue-200 underline underline-offset-2 transition disabled:opacity-50"
                                    >
                                        {isResending ? 'Sending...' : 'Resend Code'}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // ==================== REGISTRATION FORM (Step 1) ====================
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

                    <Button type="submit" variant="primary" className="mb-4">
                        Register
                    </Button>

                    <div className="text-center mt-4">
                        <p className="text-white">
                            Already have an account?{' '}
                            <Link to="/login" className="text-blue-200 hover:text-white font-semibold underline">
                                Login
                            </Link>
                        </p>
                    </div>
                </form>
            </motion.div>
        </main>
    );
};

export default Register;