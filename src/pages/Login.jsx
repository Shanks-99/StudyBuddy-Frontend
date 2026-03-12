import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { login } from '../services/authService';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isTeacher, setIsTeacher] = useState(false);
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const navigate = useNavigate();

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
                if (response.role === 'teacher') {
                    setApiError('This account is registered as a Teacher. Please use "Login as Teacher" option.');
                } else {
                    setApiError('This account is registered as a Student. Please use "Login as Student" option.');
                }
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
        }
    };

    const toggleRole = () => {
        setIsTeacher(!isTeacher);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl w-full max-w-md border border-white/20">
                <div className="text-center mb-8">
                    <div className="bg-white/20 p-3 rounded-full inline-block mb-4">
                        <LogIn className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Study Buddy</h2>
                    <p className="text-purple-100">
                        Login to access your {isTeacher ? 'Instructor' : 'student'} dashboard
                    </p>
                </div>

                {apiError && (
                    <div className="bg-red-500/20 border border-red-500 text-white px-4 py-2 rounded mb-4 text-center">
                        {apiError}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="relative mb-4">
                        <Mail className="absolute left-3 top-9 text-gray-500 w-5 h-5" />
                        <Input
                            label="Email Address"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Ali123@example.com"
                            required
                            className="pl-10"
                        />
                        {errors.email && (
                            <p className="text-red-600 font-bold text-sm mt-1">{errors.email}</p>
                        )}
                    </div>

                    <div className="relative mb-6">
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

                    <Button type="submit" variant="primary" className="mb-4">
                        Login
                    </Button>

                    <div className="text-center mt-4">
                        <button
                            type="button"
                            onClick={toggleRole}
                            className="text-sm text-purple-200 hover:text-white underline mb-4 block w-full"
                        >
                            {isTeacher ? 'Login as Student' : 'Login as Teacher'}
                        </button>
                        <p className="text-white">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-purple-200 hover:text-white font-semibold underline">
                                Register
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
