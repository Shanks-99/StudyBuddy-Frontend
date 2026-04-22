import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Briefcase, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { register, loginWithGoogle, verifyRegistrationCode, resendVerificationCode } from '../services/authService';

const RESEND_COOLDOWN = 60; // seconds

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student'
    });
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const isGoogleAuthEnabled = Boolean(process.env.REACT_APP_GOOGLE_CLIENT_ID);

    // OTP verification state
    const [step, setStep] = useState(1); // 1 = registration form, 2 = OTP verification
    const [verificationEmail, setVerificationEmail] = useState('');
    const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
    const [otpError, setOtpError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [verificationSuccess, setVerificationSuccess] = useState(false);
    const otpInputRefs = useRef([]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    // Focus first OTP input when entering step 2
    useEffect(() => {
        if (step === 2 && otpInputRefs.current[0]) {
            setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
        }
    }, [step]);

    const navigateByRole = (role) => {
        if (role === 'teacher') {
            navigate('/instructor-dashboard');
            return;
        }
        navigate('/student-dashboard');
    };

    const getRoleMismatchMessage = (registeredRole) => {
        if (registeredRole === 'teacher') {
            return 'This account is registered as a Teacher. Please use Teacher role to continue.';
        }
        return 'This account is registered as a Student. Please use Student role to continue.';
    };

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');

        if (!validateForm()) {
            return;
        }

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
        } finally {
            setIsSubmitting(false);
        }
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl w-full max-w-md border border-white/20">
                <div className="text-center mb-8">
                    <div className="bg-white/20 p-3 rounded-full inline-block mb-4">
                        <UserPlus className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Create Account</h2>
                    <p className="text-blue-100">Join StudyBuddy today</p>
                </div>

                {apiError && (
                    <div className="bg-red-500/20 border border-red-500 text-white px-4 py-2 rounded mb-4 text-center">
                        {apiError}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="relative mb-4">
                        <User className="absolute left-3 top-9 text-gray-500 w-5 h-5" />
                        <Input
                            label="Full Name"
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Ali Khan"
                            required
                            className="pl-10"
                        />
                        {errors.name && (
                            <p className="text-red-600 font-bold text-sm mt-1">{errors.name}</p>
                        )}
                    </div>

                    <div className="relative mb-4">
                        <Mail className="absolute left-3 top-9 text-gray-500 w-5 h-5" />
                        <Input
                            label="Email Address"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Ali@example.com"
                            required
                            className="pl-10"
                        />
                        {errors.email && (
                            <p className="text-red-600 font-bold text-sm mt-1">{errors.email}</p>
                        )}
                    </div>

                    <div className="relative mb-4">
                        <Lock className="absolute left-3 top-9 text-gray-500 w-5 h-5" />
                        <Input
                            label="Password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            className="pl-10"
                        />
                        {errors.password && (
                            <p className="text-red-600 font-bold text-sm mt-1">{errors.password}</p>
                        )}
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Role</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="shadow border rounded w-full py-2 px-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500 appearance-none bg-white"
                            >
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-3 rounded-xl text-sm font-bold text-white shadow transition-all duration-200 mb-4
                            ${isSubmitting
                                ? 'bg-gray-400/50 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:shadow-lg'
                            }`}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Sending Code...
                            </span>
                        ) : (
                            'Register'
                        )}
                    </button>

                    <>
                        <div className="relative py-1 mb-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/25" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-transparent px-2 text-[11px] font-semibold uppercase tracking-wide text-blue-100">
                                    or continue with
                                </span>
                            </div>
                        </div>

                        {isGoogleAuthEnabled ? (
                            <div className="mb-4 rounded-xl border border-white/25 bg-white/95 py-1.5">
                                <div className="flex justify-center">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => setApiError('Google registration failed. Please try again.')}
                                        useOneTap={false}
                                        theme="outline"
                                        size="large"
                                        text="continue_with"
                                        shape="pill"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="mb-4 rounded-xl border border-amber-300 bg-amber-100/80 px-3 py-2 text-center text-xs font-medium text-amber-900">
                                Google sign-in is not configured. Add REACT_APP_GOOGLE_CLIENT_ID in frontend .env and restart frontend.
                            </div>
                        )}

                        {isGoogleLoading && (
                            <p className="mb-4 text-center text-xs font-medium text-blue-100">
                                Signing in with Google...
                            </p>
                        )}
                    </>

                    <div className="text-center mt-4">
                        <p className="text-white">
                            Already have an account?{' '}
                            <Link to="/login" className="text-blue-200 hover:text-white font-semibold underline">
                                Login
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
