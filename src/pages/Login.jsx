import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { login, loginWithGoogle } from '../services/authService';

const LOGIN_BACKGROUND_SRC = '/login-background.png';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isTeacher, setIsTeacher] = useState(false);
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const navigate = useNavigate();
    const isGoogleAuthEnabled = Boolean(process.env.REACT_APP_GOOGLE_CLIENT_ID);

    const getRoleMismatchMessage = (registeredRole) => {
        if (registeredRole === 'teacher') {
            return 'This account is registered as a Teacher. Please use "Login as Teacher" option.';
        }
        return 'This account is registered as a Student. Please use "Login as Student" option.';
    };

    const navigateByRole = (role) => {
        if (role === 'teacher') {
            navigate('/instructor-dashboard');
            return;
        }
        navigate('/student-dashboard');
    };

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

        // Password validation - only check if provided
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

        // Frontend validation
        if (!validateForm()) {
            return;
        }

        try {
            const response = await login(formData);

            // Check if user's registered role matches the selected login mode
            const expectedRole = isTeacher ? 'teacher' : 'student';
            if (response.role !== expectedRole) {
                setApiError(getRoleMismatchMessage(response.role));
                return;
            }

            // Redirect based on user's registered role
            navigateByRole(response.role);
        } catch (err) {
            setApiError(err.response?.data?.msg || 'Login failed. Please try again.');
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setApiError('');

        if (!credentialResponse?.credential) {
            setApiError('Google login failed. No token received.');
            return;
        }

        try {
            setIsGoogleLoading(true);
            const expectedRole = isTeacher ? 'teacher' : 'student';
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
            setApiError(err.response?.data?.msg || 'Google login failed. Please try again.');
        } finally {
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="relative h-screen overflow-hidden bg-[#140f2a]">
            <div
                className="absolute inset-0 bg-cover bg-center opacity-20"
                style={{ backgroundImage: `url(${LOGIN_BACKGROUND_SRC})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1233]/93 via-[#2b1a53]/90 to-[#3a3f8d]/88" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(139,173,255,0.24),transparent_32%),radial-gradient(circle_at_78%_84%,rgba(191,157,255,0.2),transparent_36%),radial-gradient(circle_at_90%_16%,rgba(92,220,255,0.16),transparent_28%)]" />

            <div className="relative z-10 flex h-full items-center justify-center p-3 sm:p-4">
                <div className="h-full w-full max-h-[760px] max-w-6xl">
                    <div className="h-full rounded-[2.1rem] bg-[#101129]/90 p-3 shadow-[0_24px_80px_rgba(7,6,18,0.68)] sm:p-4">
                        <div className="h-full rounded-[1.6rem] border border-white/14 bg-black/35 p-2.5 sm:p-3">
                            <div className="grid h-full rounded-[1.15rem] bg-white lg:grid-cols-[1.02fr_1fr]">
                                <section className="relative flex flex-col overflow-hidden bg-gradient-to-b from-[#f4f1ff] to-[#edf2ff] p-6 sm:p-8">
                                    <div className="absolute right-[-60px] top-[-60px] h-44 w-44 rounded-full bg-indigo-200/45 blur-2xl" />

                                    <div className="relative z-10">
                                        <p className="text-4xl font-black leading-none tracking-tight sm:text-5xl">
                                            <span className="text-[#1f4f96]">Study</span>{' '}
                                            <span className="text-[#e07a2f]">Buddy</span>
                                        </p>

                                        <h2 className="mt-6 text-4xl font-extrabold leading-tight text-[#1b2450]">
                                            Welcome Back,
                                            <br />
                                            Study Buddy!
                                        </h2>

                                        <h3 className="mt-5 text-3xl font-extrabold leading-tight text-[#1b2450]">
                                            Find Your Perfect Study Partner!
                                        </h3>
                                    </div>
                                </section>

                                <section
                                    className="relative overflow-y-auto bg-gradient-to-br from-[#3d2a89] via-[#4b3aa0] to-[#2f6bb2]"
                                    style={{
                                        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.08), rgba(0,0,0,0.22)), url(${LOGIN_BACKGROUND_SRC})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat',
                                    }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#241552]/25 via-[#1f1454]/28 to-[#10163e]/42" />

                                    <div className="relative z-10 flex items-center justify-center min-h-full py-6 px-4 overflow-y-auto">
                                        <div className="w-[84%] max-w-[360px] rounded-3xl border border-slate-200 bg-white/96 p-5 shadow-[0_18px_45px_rgba(16,28,72,0.34)] sm:p-6">
                                            <h3 className="text-2xl font-extrabold text-[#202d59]">Log In to Your Account</h3>

                                        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsTeacher(false);
                                                    setApiError('');
                                                }}
                                                className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                                                    !isTeacher
                                                        ? 'bg-white text-[#4f37b9] shadow'
                                                        : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                            >
                                                Student
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsTeacher(true);
                                                    setApiError('');
                                                }}
                                                className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                                                    isTeacher
                                                        ? 'bg-white text-[#4f37b9] shadow'
                                                        : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                            >
                                                Teacher
                                            </button>
                                        </div>

                                        {apiError && (
                                            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                                                {apiError}
                                            </div>
                                        )}

                                        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                                            <div>
                                                <label htmlFor="email" className="mb-1 block text-xs font-semibold text-slate-600">
                                                    Email or Username
                                                </label>
                                                <div className="relative">
                                                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        id="email"
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        placeholder="john.doe@email.com"
                                                        required
                                                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#5a45c6]"
                                                    />
                                                </div>
                                                {errors.email && <p className="mt-1 text-xs font-semibold text-red-500">{errors.email}</p>}
                                            </div>

                                            <div>
                                                <label htmlFor="password" className="mb-1 block text-xs font-semibold text-slate-600">
                                                    Password
                                                </label>
                                                <div className="relative">
                                                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        id="password"
                                                        type="password"
                                                        name="password"
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        placeholder="••••••••"
                                                        required
                                                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#5a45c6]"
                                                    />
                                                </div>
                                                {errors.password && <p className="mt-1 text-xs font-semibold text-red-500">{errors.password}</p>}
                                            </div>

                                            <div className="text-right">
                                                <Link to="/forgot-password" className="text-xs font-semibold text-slate-500 hover:text-indigo-600">
                                                    Forgot Password?
                                                </Link>
                                            </div>

                                            <button
                                                type="submit"
                                                className="w-full rounded-xl bg-gradient-to-r from-[#2f57bf] via-[#4766d1] to-[#6949d4] py-2.5 text-sm font-bold text-white shadow transition hover:from-[#2a4dac] hover:to-[#5b3fc0]"
                                            >
                                                {isTeacher ? 'Log In as Teacher' : 'Log In'}
                                            </button>

                                            <>
                                                <div className="relative py-1">
                                                    <div className="absolute inset-0 flex items-center">
                                                        <div className="w-full border-t border-slate-200" />
                                                    </div>
                                                    <div className="relative flex justify-center">
                                                        <span className="bg-white px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                                            or continue with
                                                        </span>
                                                    </div>
                                                </div>

                                                {isGoogleAuthEnabled ? (
                                                    <div className="rounded-xl border border-slate-200 bg-white py-1.5">
                                                        <div className="flex justify-center">
                                                            <GoogleLogin
                                                                onSuccess={handleGoogleSuccess}
                                                                onError={() => setApiError('Google login failed. Please try again.')}
                                                                useOneTap={false}
                                                                theme="outline"
                                                                size="large"
                                                                text="continue_with"
                                                                shape="pill"
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-700">
                                                        Google sign-in is not configured. Add REACT_APP_GOOGLE_CLIENT_ID in frontend .env and restart frontend.
                                                    </div>
                                                )}

                                                {isGoogleLoading && (
                                                    <p className="text-center text-xs font-medium text-slate-500">
                                                        Signing in with Google...
                                                    </p>
                                                )}
                                            </>

                                            <p className="text-center text-sm text-slate-600">
                                                Don't have an account?{' '}
                                                <Link to="/register" className="font-bold text-indigo-700 hover:text-indigo-800">
                                                    Register
                                                </Link>
                                            </p>
                                        </form>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>

                        <div className="mx-auto mt-3 h-3 w-40 rounded-full bg-slate-700/80" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
