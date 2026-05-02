import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, 
    Lock, 
    Moon, 
    Sun, 
    Bug, 
    Trash2, 
    ChevronRight, 
    CheckCircle2, 
    AlertTriangle,
    Camera,
    Loader2,
    Tags,
    X,
    Upload,
    FileText
} from 'lucide-react';
import { getCurrentUser, updateProfile, changePassword, deleteAccount, logout } from '../services/authService';
import { getInstructorMentorProfile, saveInstructorMentorProfile } from '../services/instructorMentorProfileService';
import { useNavigate } from 'react-router-dom';

const SettingsView = ({ isDark, setIsDark, onProfileUpdate }) => {
    const [user, setUser] = useState(null);
    const [activeSection, setActiveSection] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();

    // Profile State
    const [profileForm, setProfileForm] = useState({
        name: '',
        email: '',
        avatar: '',
        grade: '',
        field: '',
        bio: '',
        // Mentor specific
        qualification: '',
        specializedCourses: '',
        skillLevel: 'Beginner',
        tags: [],
        degreeFiles: [],
        hourlyRate: ''
    });

    const [tagInput, setTagInput] = useState('');

    // Password State
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Bug Report State
    const [bugReport, setBugReport] = useState({
        title: '',
        description: '',
        severity: 'low'
    });

    useEffect(() => {
        const initialize = async () => {
            const currentUser = getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                
                let initialForm = {
                    name: currentUser.name || '',
                    email: currentUser.email || '',
                    avatar: currentUser.avatar || '',
                    grade: currentUser.grade || '',
                    field: currentUser.field || '',
                    bio: '',
                    qualification: '',
                    specializedCourses: '',
                    skillLevel: 'Beginner',
                    tags: [],
                    degreeFiles: [],
                    hourlyRate: ''
                };

                if (currentUser.role === 'teacher') {
                    try {
                        const mentorProfile = await getInstructorMentorProfile();
                        if (mentorProfile) {
                            initialForm = {
                                ...initialForm,
                                qualification: mentorProfile.qualification ?? '',
                                specializedCourses: mentorProfile.specializedCourses ?? '',
                                skillLevel: mentorProfile.skillLevel ?? 'Beginner',
                                tags: Array.isArray(mentorProfile.tags) ? mentorProfile.tags : [],
                                degreeFiles: Array.isArray(mentorProfile.degreeFiles) ? mentorProfile.degreeFiles : [],
                                bio: mentorProfile.description ?? currentUser.bio ?? '',
                                hourlyRate: mentorProfile.hourlyRate ?? ''
                            };
                        }
                    } catch (error) {
                        console.error('Failed to load mentor profile in settings:', error);
                    }
                }
                
                setProfileForm(initialForm);
            }
        };
        initialize();
    }, []);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Update base auth profile
            const res = await updateProfile({
                name: profileForm.name,
                email: profileForm.email,
                avatar: profileForm.avatar,
                grade: profileForm.grade,
                field: profileForm.field,
                bio: profileForm.bio
            });
            
            // If teacher, also update mentor profile
            if (user?.role === 'teacher') {
                // Validation for all mentor fields
                const mentorRequired = [
                    profileForm.qualification,
                    profileForm.specializedCourses,
                    profileForm.bio,
                    profileForm.hourlyRate
                ];
                
                if (mentorRequired.some(val => !val || (typeof val === 'string' && val.trim() === ''))) {
                    return showMessage('error', 'Please fill all mentor professional details');
                }

                if (!profileForm.degreeFiles || profileForm.degreeFiles.length === 0) {
                    return showMessage('error', 'Please upload at least one degree document');
                }

                await saveInstructorMentorProfile({
                    name: profileForm.name,
                    email: profileForm.email,
                    qualification: profileForm.qualification,
                    specializedCourses: profileForm.specializedCourses,
                    skillLevel: profileForm.skillLevel,
                    tags: [], // Tags removed as requested
                    description: profileForm.bio,
                    profilePicture: profileForm.avatar,
                    degreeFiles: profileForm.degreeFiles,
                    hourlyRate: profileForm.hourlyRate
                });
            }

            setUser(res.user);
            showMessage('success', 'Profile updated successfully!');
            if (onProfileUpdate) {
                onProfileUpdate();
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            return showMessage('error', 'New passwords do not match');
        }
        setLoading(true);
        try {
            await changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            showMessage('success', 'Password changed successfully!');
        } catch (err) {
            showMessage('error', err.response?.data?.msg || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const handleBugSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate bug report submission
        setTimeout(() => {
            setLoading(false);
            setBugReport({ title: '', description: '', severity: 'low' });
            showMessage('success', 'Bug reported! Our team will look into it.');
        }, 1500);
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('Are you absolutely sure? This action cannot be undone and all your data will be permanently deleted.')) {
            try {
                await deleteAccount();
                logout();
                navigate('/login');
            } catch (err) {
                showMessage('error', 'Failed to delete account');
            }
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('File size too large. Please choose an image under 2MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileForm(prev => ({ ...prev, avatar: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const sections = [
        { id: 'profile', label: 'Profile', icon: User, desc: 'Manage your personal details' },
        { id: 'security', label: 'Security', icon: Lock, desc: 'Change password and account safety' },
        { id: 'appearance', label: 'Appearance', icon: isDark ? Moon : Sun, desc: 'Customize your theme' },
        { id: 'support', label: 'Report a Bug', icon: Bug, desc: 'Help us improve StudyBuddy' },
        { id: 'danger', label: 'Danger Zone', icon: Trash2, desc: 'Account deletion options', color: 'text-red-500' },
    ];

    return (
        <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto py-4">
            {/* Sidebar Navigation */}
            <div className="w-full lg:w-72 shrink-0">
                <div className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 dark:border-white/5">
                        <h2 className="font-bold text-slate-900 dark:text-white">Settings</h2>
                    </div>
                    <div className="p-2 space-y-1">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all group ${
                                    activeSection === section.id 
                                    ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400' 
                                    : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-gray-400'
                                }`}
                            >
                                <div className={`p-2 rounded-lg transition-colors ${
                                    activeSection === section.id 
                                    ? 'bg-purple-100 dark:bg-purple-500/20' 
                                    : 'bg-slate-100 dark:bg-white/5 group-hover:bg-slate-200 dark:group-hover:bg-white/10'
                                }`}>
                                    <section.icon className={`w-4 h-4 ${section.color || ''}`} />
                                </div>
                                <div className="flex-1">
                                    <div className={`text-sm font-bold ${section.color || ''}`}>{section.label}</div>
                                    <div className="text-[10px] opacity-70 font-medium truncate">{section.desc}</div>
                                </div>
                                <ChevronRight className={`w-4 h-4 transition-transform ${activeSection === section.id ? 'translate-x-1' : ''}`} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-sm"
                    >
                        {/* Status Message */}
                        {message.text && (
                            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${
                                message.type === 'success' 
                                ? 'bg-green-50 border-green-100 text-green-700 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400' 
                                : 'bg-red-50 border-red-100 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'
                            }`}>
                                {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                                <span className="text-sm font-medium">{message.text}</span>
                            </div>
                        )}

                        {activeSection === 'profile' && (
                            <form onSubmit={handleProfileSubmit} className="space-y-8">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Profile Settings</h3>
                                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Update your personal information and public profile</p>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-full border-4 border-purple-500/10 overflow-hidden bg-slate-50 dark:bg-white/5 flex items-center justify-center">
                                            {profileForm.avatar ? (
                                                <img src={profileForm.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-10 h-10 text-slate-400" />
                                            )}
                                        </div>
                                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                            <Camera size={24} />
                                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                        </label>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">Profile Photo</h4>
                                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">PNG or JPG, max 2MB</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Full Name</label>
                                        <input 
                                            value={profileForm.name} 
                                            onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                                            required
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/10 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all dark:text-white text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Email Address</label>
                                        <input 
                                            value={profileForm.email} 
                                            onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                                            required
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/10 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all dark:text-white text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Grade</label>
                                        <input 
                                            value={profileForm.grade} 
                                            onChange={e => setProfileForm({...profileForm, grade: e.target.value})}
                                            required
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/10 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all dark:text-white text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Field of Study</label>
                                        <input 
                                            value={profileForm.field} 
                                            onChange={e => setProfileForm({...profileForm, field: e.target.value})}
                                            required
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/10 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all dark:text-white text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Bio / Description</label>
                                    <textarea 
                                        rows="4" 
                                        value={profileForm.bio} 
                                        onChange={e => setProfileForm({...profileForm, bio: e.target.value})}
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/10 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all dark:text-white text-sm resize-none"
                                        placeholder={user?.role === 'teacher' ? "Tell students about your background..." : "Write a short bio..."}
                                    />
                                </div>

                                {user?.role === 'teacher' && (
                                    <div className="space-y-8 pt-6 border-t border-slate-100 dark:border-white/5">
                                        <div>
                                            <h4 className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-6">Mentor Professional Details</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Highest Qualification</label>
                                                    <input 
                                                        value={profileForm.qualification} 
                                                        onChange={e => setProfileForm({...profileForm, qualification: e.target.value})}
                                                        required
                                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/10 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all dark:text-white text-sm"
                                                        placeholder="e.g. MS in Computer Science"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Subjects Taught</label>
                                                    <input 
                                                        value={profileForm.specializedCourses} 
                                                        onChange={e => setProfileForm({...profileForm, specializedCourses: e.target.value})}
                                                        required
                                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/10 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all dark:text-white text-sm"
                                                        placeholder="e.g. OOP, Data Structures"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Rate per Session</label>
                                                    <input 
                                                        type="text"
                                                        value={profileForm.hourlyRate} 
                                                        onChange={e => {
                                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                                            setProfileForm({...profileForm, hourlyRate: val})
                                                        }}
                                                        required
                                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/10 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all dark:text-white text-sm"
                                                        placeholder="e.g. 25"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Skill Level</label>
                                            <div className="flex gap-2">
                                                {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                                                    <button
                                                        key={level}
                                                        type="button"
                                                        onClick={() => setProfileForm({ ...profileForm, skillLevel: level })}
                                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                                                            profileForm.skillLevel === level 
                                                            ? 'bg-purple-600 border-purple-600 text-white shadow-md' 
                                                            : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400'
                                                        }`}
                                                    >
                                                        {level}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>



                                        <div className="space-y-4">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 flex items-center gap-2">
                                                <Upload size={14} /> Degree Documents
                                            </label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <label className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer group">
                                                    <Upload size={20} className="text-slate-400 mb-2 group-hover:text-purple-500 transition-colors" />
                                                    <span className="text-xs font-bold">Upload Document</span>
                                                    <input 
                                                        type="file" 
                                                        multiple 
                                                        className="hidden" 
                                                        onChange={async e => {
                                                            const filesArray = Array.from(e.target.files);
                                                            const base64Promises = filesArray.map(f => {
                                                                return new Promise((resolve) => {
                                                                    const reader = new FileReader();
                                                                    reader.onloadend = () => resolve(`${f.name}|DATA|${reader.result}`);
                                                                    reader.readAsDataURL(f);
                                                                });
                                                            });
                                                            const base64Files = await Promise.all(base64Promises);
                                                            setProfileForm({...profileForm, degreeFiles: [...profileForm.degreeFiles, ...base64Files]});
                                                        }} 
                                                    />
                                                </label>
                                                <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                                                    {profileForm.degreeFiles.map((file, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-lg">
                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                <FileText size={14} className="text-slate-400 shrink-0" />
                                                                <span className="text-[10px] font-medium truncate">{file && file.includes && file.includes('|DATA|') ? file.split('|DATA|')[0] : file && file.startsWith && file.startsWith('data:') ? `Document ${idx + 1}` : file}</span>
                                                            </div>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => setProfileForm({...profileForm, degreeFiles: profileForm.degreeFiles.filter((_, i) => i !== idx)})}
                                                                className="text-slate-400 hover:text-red-500"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button 
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Save Profile
                                </button>
                            </form>
                        )}

                        {activeSection === 'security' && (
                            <form onSubmit={handlePasswordSubmit} className="space-y-8">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Security Settings</h3>
                                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Manage your password and account security</p>
                                </div>

                                {user?.authProvider === 'google' ? (
                                    <div className="p-6 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl">
                                        <div className="flex gap-3">
                                            <AlertTriangle className="text-blue-600 dark:text-blue-400 shrink-0" size={20} />
                                            <div>
                                                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">Google Account Linked</h4>
                                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                                    You are currently signed in via Google. Password management is handled by your Google account.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="max-w-md space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Current Password</label>
                                            <input 
                                                type="password"
                                                value={passwordForm.currentPassword}
                                                onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/10 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all dark:text-white text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">New Password</label>
                                            <input 
                                                type="password"
                                                value={passwordForm.newPassword}
                                                onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/10 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all dark:text-white text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Confirm New Password</label>
                                            <input 
                                                type="password"
                                                value={passwordForm.confirmPassword}
                                                onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/10 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all dark:text-white text-sm"
                                            />
                                        </div>
                                        <button 
                                            type="submit"
                                            disabled={loading}
                                            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Update Password
                                        </button>
                                    </div>
                                )}
                            </form>
                        )}

                        {activeSection === 'appearance' && (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Appearance Settings</h3>
                                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Customize how StudyBuddy looks on your device</p>
                                </div>

                                <div className="p-6 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-amber-100 text-amber-600'}`}>
                                            {isDark ? <Moon size={24} /> : <Sun size={24} />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white">{isDark ? 'Dark Mode' : 'Light Mode'}</h4>
                                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Toggle between light and dark themes</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setIsDark(!isDark)}
                                        className={`w-14 h-7 rounded-full transition-all relative ${isDark ? 'bg-purple-600' : 'bg-slate-300'}`}
                                    >
                                        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${isDark ? 'right-1' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeSection === 'support' && (
                            <form onSubmit={handleBugSubmit} className="space-y-8">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Report a Bug</h3>
                                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Found something broken? Let us know so we can fix it.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Bug Title</label>
                                        <input 
                                            placeholder="What happened?"
                                            value={bugReport.title}
                                            onChange={e => setBugReport({...bugReport, title: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/10 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all dark:text-white text-sm"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Severity</label>
                                        <div className="flex gap-4">
                                            {['low', 'medium', 'high'].map(sev => (
                                                <button
                                                    key={sev}
                                                    type="button"
                                                    onClick={() => setBugReport({...bugReport, severity: sev})}
                                                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                                                        bugReport.severity === sev
                                                        ? 'bg-purple-600 text-white'
                                                        : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
                                                    }`}
                                                >
                                                    {sev}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Description</label>
                                        <textarea 
                                            placeholder="Describe the steps to reproduce the issue..."
                                            rows="5"
                                            value={bugReport.description}
                                            onChange={e => setBugReport({...bugReport, description: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/10 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all dark:text-white text-sm resize-none"
                                            required
                                        />
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={loading}
                                        className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Submit Report
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeSection === 'danger' && (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-xl font-bold text-red-500">Danger Zone</h3>
                                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Irreversible actions regarding your account</p>
                                </div>

                                <div className="p-6 border border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5 rounded-2xl space-y-4">
                                    <div className="flex gap-4">
                                        <div className="p-3 bg-red-100 dark:bg-red-500/20 text-red-600 rounded-2xl shrink-0">
                                            <Trash2 size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white">Delete Account</h4>
                                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">
                                                Once you delete your account, there is no going back. Please be certain. 
                                                All your generated notes, quizzes, and study progress will be wiped from our servers.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-2 flex justify-end">
                                        <button 
                                            onClick={handleDeleteAccount}
                                            className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-500/20"
                                        >
                                            Delete My Account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SettingsView;
