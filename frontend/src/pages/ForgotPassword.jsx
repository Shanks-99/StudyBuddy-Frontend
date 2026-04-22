import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Mail, ArrowLeft, RefreshCw, Lock, ShieldCheck, CheckCircle } from 'lucide-react';
import { forgotPassword, verifyResetCode, resetPassword } from '../services/authService';

const RESEND_COOLDOWN = 60;

const ForgotPassword = () => {
    const navigate = useNavigate();

    // Step 1: Email, Step 2: OTP, Step 3: New password
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [apiError, setApiError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // OTP state
    const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [isResending, setIsResending] = useState(false);
    const otpInputRefs = useRef([]);

    // New password state
    const [verifiedCode, setVerifiedCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [resetSuccess, setResetSuccess] = useState(false);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) { clearInterval(timer); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    // Focus first OTP input
    useEffect(() => {
        if (step === 2 && otpInputRefs.current[0]) {
            setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
        }
    }, [step]);

    const validateEmail = (em) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);

    // ============ STEP 1: Send reset code ============
    const handleSendCode = async (e) => {
        e.preventDefault();
        setEmailError('');
        setApiError('');

        if (!email.trim()) {
            setEmailError('Email is required');
            return;
        }
        if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address');
            return;
        }

        try {
            setIsSubmitting(true);
            await forgotPassword({ email });
            setStep(2);
            setResendCooldown(RESEND_COOLDOWN);
        } catch (err) {
            setApiError(err.response?.data?.msg || 'Failed to send reset code. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ============ STEP 2: OTP handlers ============
    const handleOtpChange = useCallback((index, value) => {
        if (value.length > 1) {
            const digits = value.replace(/\D/g, '').slice(0, 6);
            const newOtp = [...otpValues];
            for (let i = 0; i < 6; i++) newOtp[i] = digits[i] || '';
            setOtpValues(newOtp);
            setApiError('');
            const focusIdx = Math.min(digits.length, 5);
            otpInputRefs.current[focusIdx]?.focus();
            return;
        }
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otpValues];
        newOtp[index] = value;
        setOtpValues(newOtp);
        setApiError('');
        if (value && index < 5) otpInputRefs.current[index + 1]?.focus();
    }, [otpValues]);

    const handleOtpKeyDown = useCallback((index, e) => {
        if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    }, [otpValues]);

    const handleVerifyCode = async () => {
        const code = otpValues.join('');
        if (code.length !== 6) {
            setApiError('Please enter the complete 6-digit code');
            return;
        }

        try {
            setIsSubmitting(true);
            setApiError('');
            const response = await verifyResetCode({ email, code });
            if (response.verified) {
                setVerifiedCode(code);
                setStep(3);
            }
        } catch (err) {
            setApiError(err.response?.data?.msg || 'Invalid code. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendCode = async () => {
        if (resendCooldown > 0 || isResending) return;
        try {
            setIsResending(true);
            setApiError('');
            await forgotPassword({ email });
            setResendCooldown(RESEND_COOLDOWN);
            setOtpValues(['', '', '', '', '', '']);
            otpInputRefs.current[0]?.focus();
        } catch (err) {
            const retryAfter = err.response?.data?.retryAfter;
            if (retryAfter) setResendCooldown(retryAfter);
            setApiError(err.response?.data?.msg || 'Failed to resend code.');
        } finally {
            setIsResending(false);
        }
    };

    // ============ STEP 3: Reset password ============
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setApiError('');

        if (!newPassword) {
            setPasswordError('New password is required');
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])/.test(newPassword)) {
            setPasswordError('Password must contain uppercase and lowercase letters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        try {
            setIsSubmitting(true);
            await resetPassword({ email, code: verifiedCode, newPassword });
            setResetSuccess(true);
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            setApiError(err.response?.data?.msg || 'Failed to reset password. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-400 via-orange-500 to-red-500">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl w-full max-w-md border border-white/20">

                {/* ===================== STEP 1: Enter Email ===================== */}
                {step === 1 && (
                    <>
                        <Link
                            to="/login"
                            className="flex items-center gap-1.5 text-orange-100 hover:text-white text-sm font-medium mb-6 transition group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            Back to login
                        </Link>

                        <div className="text-center mb-8">
                            <div className="bg-white/20 p-3 rounded-full inline-block mb-4">
                                <KeyRound className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-white">Forgot Password?</h2>
                            <p className="text-orange-100 mt-2">
                                No worries! Enter your email and we'll send you a reset code.
                            </p>
                        </div>

                        {apiError && (
                            <div className="bg-red-500/20 border border-red-500 text-white px-4 py-2 rounded-lg mb-4 text-center text-sm">
                                {apiError}
                            </div>
                        )}

                        <form onSubmit={handleSendCode}>
                            <div className="mb-5">
                                <label className="block text-white text-sm font-semibold mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setEmailError(''); setApiError(''); }}
                                        placeholder="Enter your registered email"
                                        className="w-full rounded-xl border border-white/25 bg-white/90 py-3 pl-11 pr-4 text-sm text-gray-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30"
                                    />
                                </div>
                                {emailError && <p className="text-red-200 font-bold text-sm mt-1.5">{emailError}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full py-3 rounded-xl text-sm font-bold text-white shadow transition-all duration-200
                                    ${isSubmitting
                                        ? 'bg-gray-400/50 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 hover:shadow-lg hover:shadow-red-500/25'
                                    }`}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Sending Code...
                                    </span>
                                ) : 'Send Reset Code'}
                            </button>
                        </form>
                    </>
                )}

                {/* ===================== STEP 2: Enter OTP ===================== */}
                {step === 2 && (
                    <>
                        <button
                            onClick={() => { setStep(1); setOtpValues(['', '', '', '', '', '']); setApiError(''); }}
                            className="flex items-center gap-1.5 text-orange-100 hover:text-white text-sm font-medium mb-6 transition group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            Change email
                        </button>

                        <div className="text-center mb-8">
                            <div className="bg-white/20 p-3 rounded-full inline-block mb-4">
                                <ShieldCheck className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-white">Enter Reset Code</h2>
                            <p className="text-orange-100 mt-2">We've sent a 6-digit code to</p>
                            <p className="text-white font-semibold mt-1 text-sm bg-white/10 rounded-lg px-3 py-1.5 inline-block">
                                {email}
                            </p>
                        </div>

                        {apiError && (
                            <div className="bg-red-500/20 border border-red-500 text-white px-4 py-2 rounded-lg mb-4 text-center text-sm">
                                {apiError}
                            </div>
                        )}

                        {/* OTP Input */}
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
                                            ? 'border-orange-400 bg-white text-orange-700 shadow-lg shadow-orange-500/20'
                                            : 'border-white/30 bg-white/10 text-white'
                                        }
                                        focus:border-orange-400 focus:bg-white focus:text-orange-700 focus:shadow-lg focus:shadow-orange-500/30
                                        hover:border-white/50`}
                                    autoComplete="one-time-code"
                                />
                            ))}
                        </div>

                        <button
                            onClick={handleVerifyCode}
                            disabled={isSubmitting || otpValues.join('').length !== 6}
                            className={`w-full py-3 rounded-xl text-sm font-bold text-white shadow transition-all duration-200 mb-4
                                ${isSubmitting || otpValues.join('').length !== 6
                                    ? 'bg-gray-400/50 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 hover:shadow-lg'
                                }`}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Verifying...
                                </span>
                            ) : 'Verify Code'}
                        </button>

                        <div className="text-center">
                            <p className="text-orange-100 text-sm mb-2">Didn't receive the code?</p>
                            {resendCooldown > 0 ? (
                                <p className="text-white/60 text-sm">
                                    Resend available in <span className="font-bold text-white">{resendCooldown}s</span>
                                </p>
                            ) : (
                                <button
                                    onClick={handleResendCode}
                                    disabled={isResending}
                                    className="text-white font-semibold text-sm hover:text-orange-200 underline underline-offset-2 transition disabled:opacity-50"
                                >
                                    {isResending ? 'Sending...' : 'Resend Code'}
                                </button>
                            )}
                        </div>
                    </>
                )}

                {/* ===================== STEP 3: New Password ===================== */}
                {step === 3 && !resetSuccess && (
                    <>
                        <div className="text-center mb-8">
                            <div className="bg-white/20 p-3 rounded-full inline-block mb-4">
                                <Lock className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-white">Set New Password</h2>
                            <p className="text-orange-100 mt-2">Choose a strong password for your account</p>
                        </div>

                        {apiError && (
                            <div className="bg-red-500/20 border border-red-500 text-white px-4 py-2 rounded-lg mb-4 text-center text-sm">
                                {apiError}
                            </div>
                        )}

                        <form onSubmit={handleResetPassword}>
                            <div className="mb-4">
                                <label className="block text-white text-sm font-semibold mb-2">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); setApiError(''); }}
                                        placeholder="••••••••"
                                        className="w-full rounded-xl border border-white/25 bg-white/90 py-3 pl-11 pr-4 text-sm text-gray-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30"
                                    />
                                </div>
                            </div>

                            <div className="mb-5">
                                <label className="block text-white text-sm font-semibold mb-2">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                                        placeholder="••••••••"
                                        className="w-full rounded-xl border border-white/25 bg-white/90 py-3 pl-11 pr-4 text-sm text-gray-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30"
                                    />
                                </div>
                                {passwordError && <p className="text-red-200 font-bold text-sm mt-1.5">{passwordError}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full py-3 rounded-xl text-sm font-bold text-white shadow transition-all duration-200
                                    ${isSubmitting
                                        ? 'bg-gray-400/50 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-lg hover:shadow-green-500/25'
                                    }`}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Resetting...
                                    </span>
                                ) : 'Reset Password'}
                            </button>
                        </form>
                    </>
                )}

                {/* ===================== SUCCESS ===================== */}
                {resetSuccess && (
                    <div className="text-center">
                        <div className="bg-green-500/20 border border-green-400 rounded-xl p-8 mb-4">
                            <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                            <h3 className="text-white text-xl font-bold mb-2">Password Reset!</h3>
                            <p className="text-green-100 text-sm">Your password has been changed successfully.</p>
                            <p className="text-green-200 text-sm mt-2">Redirecting to login...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
