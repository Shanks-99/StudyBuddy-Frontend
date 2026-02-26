import React, { useState } from 'react';
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');

        // Frontend validation
        if (!validateForm()) {
            return;
        }

        try {
            await register(formData);
            navigate('/login');
        } catch (err) {
            setApiError(err.response?.data?.msg || 'Registration failed. Please try again.');
        }
    };

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
            </div>
        </div>
    );
};

export default Register;
