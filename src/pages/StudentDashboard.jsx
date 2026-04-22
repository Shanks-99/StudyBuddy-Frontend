<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCurrentUser } from '../services/authService';
=======
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import { getFocusSessions } from '../services/focusService';
import { getUpcomingSessionsForStudent } from '../services/mentorSessionService';
>>>>>>> 2847710994b1259fcef4f688b7892cf24fcdf658
import Sidebar from '../components/Sidebar';
import {
    FileText,
    MessageSquare,
    BookOpen,
    Search,
    Bell,
    CheckCircle2,
    Clock,
    TrendingUp,
    Download,
    Plus,
<<<<<<< HEAD
    ArrowRight,
    Zap,
    Brain,
    Sparkles
=======
    Trash2,
    Flame,
>>>>>>> 2847710994b1259fcef4f688b7892cf24fcdf658
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    CartesianGrid,
} from 'recharts';

const communityPosts = [
    { title: 'Best study techniques for exams?', replies: 24, trending: true },
    { title: 'Looking for study group - Calculus', replies: 12, trending: false },
    { title: 'Free resources for Python learning', replies: 45, trending: true },
];

const recentResources = [
    { name: 'Math Notes - Chapter 5', type: 'Notes', date: '2 hours ago' },
    { name: 'Physics Quiz - Kinematics', type: 'Quiz', date: 'Yesterday' },
    { name: 'Chemistry Summary', type: 'Summary', date: '3 days ago' },
];

const DEFAULT_CHART_COLORS = ['#6C47FF', '#DDE4F4'];

const getSubjectAccent = (subject = '') => {
    const lowered = subject.toLowerCase();

    if (lowered.includes('math')) return '#6C47FF';
    if (lowered.includes('physics')) return '#00C9A7';
    if (lowered.includes('chem')) return '#FF6B6B';
    if (lowered.includes('bio')) return '#4F9DFF';

    const palette = ['#6C47FF', '#00C9A7', '#FF6B6B', '#4F9DFF', '#F59E0B'];
    const hash = subject.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return palette[hash % palette.length];
};

const MotionCard = ({ children, className = '', delay = 0 }) => (
    <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay }}
        className={`dashboard-card ${className}`}
    >
        {children}
    </motion.section>
);

const fadeIn = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
};

const StudentDashboard = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    const [studyHours, setStudyHours] = useState(0);
    const [focusSessions, setFocusSessions] = useState([]);
    const [upcomingSessions, setUpcomingSessions] = useState([]);
    const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

    const [todos, setTodos] = useState(() => {
        const saved = localStorage.getItem('studyBuddyTodos');
        if (saved) return JSON.parse(saved);
        return [
            { task: 'Complete Math Assignment Ch. 5', done: false },
            { task: 'Review Physics Notes - Motion', done: true },
            { task: 'Prepare for Chemistry Quiz', done: false },
        ];
    });
    const [isAddingTodo, setIsAddingTodo] = useState(false);
    const [newTodoText, setNewTodoText] = useState('');

    useEffect(() => {
        localStorage.setItem('studyBuddyTodos', JSON.stringify(todos));
    }, [todos]);

    const handleAddTodo = (e) => {
        e.preventDefault();
        if (!newTodoText.trim()) return;
        setTodos([...todos, { task: newTodoText.trim(), done: false }]);
        setNewTodoText('');
        setIsAddingTodo(false);
    };

    const toggleTodo = (index) => {
        const updated = [...todos];
        updated[index].done = !updated[index].done;
        setTodos(updated);
    };

    const deleteTodo = (index) => {
        setTodos((prev) => prev.filter((_, i) => i !== index));
    };

    const loadDashboardData = async (userId) => {
        setIsLoadingDashboard(true);
        try {
            const [focusData, sessionsData] = await Promise.all([
                getFocusSessions(userId),
                getUpcomingSessionsForStudent(),
            ]);

            if (Array.isArray(focusData)) {
                const totalMinutes = focusData.reduce((acc, curr) => acc + (curr.duration || 0), 0);
                setStudyHours(totalMinutes / 60);
                setFocusSessions(focusData);
            }

            if (Array.isArray(sessionsData)) {
                setUpcomingSessions(sessionsData);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setIsLoadingDashboard(false);
        }
    };

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            navigate('/login');
            return;
        }

        if (currentUser.role !== 'student') {
            navigate('/instructor-dashboard');
            return;
        }

        setUser(currentUser);
        loadDashboardData(currentUser.id);
    }, [navigate]);

    const chartData = useMemo(() => {
        const days = Array.from({ length: 7 }, (_, idx) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - idx));

            return {
                key: date.toISOString().slice(0, 10),
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                hours: 0,
            };
        });

        const byDate = Object.fromEntries(days.map((item, idx) => [item.key, idx]));

        focusSessions.forEach((session) => {
            const rawDate = session.createdAt || session.updatedAt || session.date;
            if (!rawDate) return;

            const parsed = new Date(rawDate);
            if (Number.isNaN(parsed.getTime())) return;

            const key = parsed.toISOString().slice(0, 10);
            const position = byDate[key];

            if (position !== undefined) {
                days[position].hours += (session.duration || 0) / 60;
            }
        });

        return days.map((item) => ({ ...item, hours: Number(item.hours.toFixed(1)) }));
    }, [focusSessions]);

    const weeklyHours = useMemo(() => chartData.reduce((acc, item) => acc + item.hours, 0), [chartData]);
    const weeklyTargetHours = 12;
    const weeklyProgress = Math.min(100, Math.round((weeklyHours / weeklyTargetHours) * 100));
    const streakDays = Math.max(1, chartData.filter((item) => item.hours > 0).length);

    const completionData = useMemo(() => {
        const remaining = Math.max(weeklyTargetHours - weeklyHours, 0);
        return [
            { name: 'Completed', value: Number(weeklyHours.toFixed(1)) },
            { name: 'Remaining', value: Number(remaining.toFixed(1)) },
        ];
    }, [weeklyHours]);

    const userInitials = useMemo(() => {
        if (!user?.name) return 'SB';

        return user.name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0].toUpperCase())
            .join('');
    }, [user]);

    if (!user) return null;

    return (
<<<<<<< HEAD
        <div className="flex h-screen bg-background dark:bg-[#0a0a0f] text-foreground dark:text-white transition-colors duration-300 overflow-hidden relative font-sans">
            
            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 dark:bg-[#8c30e8]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 dark:bg-purple-900/10 rounded-full blur-[120px]" />
            </div>

            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                
                {/* ── Top Bar ── */}
                <div className="bg-white/80 dark:bg-[#0f0a16]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 p-6 z-20 sticky top-0 transition-colors">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                Welcome, {user.name}!
                            </h2>
                            <p className="text-slate-500 dark:text-gray-400 mt-1 text-sm font-medium">
                                Ready to achieve your goals today?
                            </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            {/* Search Bar */}
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="w-full sm:w-64 pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8]/20 transition-all shadow-sm"
                                />
                            </div>
                            {/* Notifications */}
                            <button className="relative p-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-gray-300">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0f0a16]"></span>
=======
        <div className="studybuddy-light flex h-screen overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="frosted-topbar px-6 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="font-heading text-3xl text-[var(--text-primary)]">Welcome, {user.name}</h2>
                            <p className="text-[var(--text-muted)] mt-1">Your learning plan is ready. Let&apos;s keep the momentum.</p>
                        </div>

                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <div className="relative flex-1 lg:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    placeholder="Search topics, rooms, mentors..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-white/85 border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
                                />
                            </div>

                            <div className="hidden sm:flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-600">
                                <Flame className="w-4 h-4" />
                                <span>{streakDays}-day streak</span>
                            </div>

                            <button className="relative p-2.5 bg-white border border-[var(--border)] rounded-xl hover:bg-slate-50 transition-colors">
                                <Bell className="w-5 h-5 text-[var(--text-primary)]" />
                                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[var(--accent-warm)] rounded-full"></span>
>>>>>>> 2847710994b1259fcef4f688b7892cf24fcdf658
                            </button>

                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white font-semibold flex items-center justify-center shadow">
                                {userInitials}
                            </div>
                        </div>
                    </div>
                </header>

<<<<<<< HEAD
                {/* ── Dashboard Content ── */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="max-w-7xl mx-auto space-y-8">
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Study Progress Widget */}
                            <motion.div {...fadeIn} className="md:col-span-2 relative overflow-hidden bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-sm rounded-[2rem] p-8 group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 dark:bg-[#8c30e8]/20 rounded-full -mr-20 -mt-20 blur-[80px] group-hover:bg-purple-500/20 dark:group-hover:bg-[#8c30e8]/30 transition-all duration-700 pointer-events-none" />
                                
                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="flex-1">
                                        <span className="inline-flex items-center gap-1.5 text-purple-600 dark:text-[#8c30e8] font-bold text-[10px] uppercase tracking-widest bg-purple-50 dark:bg-[#8c30e8]/10 border border-purple-200 dark:border-[#8c30e8]/30 px-3 py-1 rounded-full mb-4">
                                            <TrendingUp size={12} /> Weekly Progress
                                        </span>
                                        <h2 className="text-3xl md:text-4xl font-black mb-3 text-slate-900 dark:text-white tracking-tight">Great job this week!</h2>
                                        <p className="text-slate-500 dark:text-gray-400 max-w-md text-sm leading-relaxed">
                                            You've completed <span className="text-slate-900 dark:text-white font-bold">75%</span> of your weekly goals. Finish a few more tasks to reach 100%.
                                        </p>
                                        <button className="mt-8 inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 hover:-translate-y-1 transition-all">
                                            <span>Continue Learning</span>
                                            <ArrowRight size={18} />
                                        </button>
                                    </div>

                                    {/* Circular Progress & Total Hours */}
                                    <div className="flex flex-col items-center justify-center gap-4 flex-shrink-0">
                                        <div className="relative w-40 h-40">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle className="text-slate-100 dark:text-white/5" cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="12" />
                                                <motion.circle 
                                                    initial={{ strokeDashoffset: 439.8 }}
                                                    animate={{ strokeDashoffset: 439.8 * (1 - 0.75) }}
                                                    transition={{ duration: 1.5, delay: 0.3 }}
                                                    className="text-purple-600 dark:text-[#8c30e8]" 
                                                    cx="80" 
                                                    cy="80" 
                                                    r="70" 
                                                    fill="transparent" 
                                                    stroke="currentColor" 
                                                    strokeWidth="12"
                                                    strokeDasharray="439.8"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">75%</span>
                                                <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Done</span>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3 text-center w-full">
                                            <div className="text-2xl font-bold text-slate-900 dark:text-white">24.5<span className="text-sm font-medium text-slate-500">h</span></div>
                                            <div className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Total Study Time</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Upcoming Sessions */}
                            <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-sm rounded-[2rem] p-6 flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Upcoming Sessions</h3>
                                    <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                                        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                                <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                                    {upcomingSessions.map((session, idx) => (
                                        <div key={idx} className="bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <div className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-purple-600 dark:group-hover:text-[#8c30e8] transition-colors">{session.mentor}</div>
                                                    <div className="text-xs font-medium text-slate-500 dark:text-gray-400 mt-1">{session.subject}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/5">
                                                <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-[#8c30e8] bg-purple-50 dark:bg-[#8c30e8]/10 px-2 py-1 rounded-md border border-purple-100 dark:border-[#8c30e8]/20">
                                                    {session.time}
                                                </div>
                                                <button className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white text-xs font-bold rounded-lg shadow-sm transition-all">
                                                    JOIN
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* AI Content Generator */}
                            <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="lg:col-span-2 bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-sm rounded-2xl p-6">
                                <div className="flex items-center justify-between px-1 mb-6">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        AI Study Tools <Sparkles className="text-purple-600 dark:text-[#8c30e8]" size={20} />
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <button onClick={() => navigate('/content-generator')} className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl p-5 hover:-translate-y-1 hover:shadow-lg hover:border-purple-300 dark:hover:border-[#8c30e8]/50 transition-all group flex flex-col items-center text-center">
                                        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-[#8c30e8]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Brain className="text-purple-600 dark:text-[#8c30e8]" size={24} />
                                        </div>
                                        <div className="text-slate-900 dark:text-white text-sm font-bold">Generate Notes</div>
                                        <div className="text-xs text-slate-500 dark:text-gray-400 mt-1.5">Create smart study material</div>
                                    </button>
                                    <button onClick={() => navigate('/content-generator')} className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl p-5 hover:-translate-y-1 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500/50 transition-all group flex flex-col items-center text-center">
                                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <FileText className="text-blue-600 dark:text-blue-400" size={24} />
                                        </div>
                                        <div className="text-slate-900 dark:text-white text-sm font-bold">Generate Summary</div>
                                        <div className="text-xs text-slate-500 dark:text-gray-400 mt-1.5">Condense long articles</div>
                                    </button>
                                    <button onClick={() => navigate('/content-generator')} className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl p-5 hover:-translate-y-1 hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-all group flex flex-col items-center text-center">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Zap className="text-emerald-600 dark:text-emerald-400" size={24} />
                                        </div>
                                        <div className="text-slate-900 dark:text-white text-sm font-bold">Generate Quiz</div>
                                        <div className="text-xs text-slate-500 dark:text-gray-400 mt-1.5">Test your knowledge</div>
                                    </button>
                                </div>
                            </motion.div>

                            {/* To-Do List */}
                            <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-sm rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">To-Do List</h3>
                                    <button className="p-1.5 bg-purple-50 dark:bg-[#8c30e8]/10 text-purple-600 dark:text-[#8c30e8] rounded-lg hover:bg-purple-100 dark:hover:bg-[#8c30e8]/20 transition-colors">
                                        <Plus className="w-5 h-5 stroke-[2.5]" />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {todoItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-slate-50 dark:bg-black/20 rounded-xl p-3 border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 transition-all group cursor-pointer">
                                            <div className="relative flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={item.done}
                                                    className="w-5 h-5 rounded border-2 border-slate-300 dark:border-white/20 appearance-none cursor-pointer checked:bg-purple-600 checked:border-purple-600 dark:checked:bg-[#8c30e8] dark:checked:border-[#8c30e8] transition-colors"
                                                    readOnly
                                                />
                                                {item.done && <CheckCircle2 className="w-3.5 h-3.5 text-white absolute pointer-events-none" />}
                                            </div>
                                            <span className={`flex-1 text-sm font-medium transition-colors ${item.done ? 'line-through text-slate-400 dark:text-gray-500' : 'text-slate-700 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-white'}`}>
                                                {item.task}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Community Highlights */}
                            <motion.div {...fadeIn} transition={{ delay: 0.4 }} className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-sm rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Community Activity</h3>
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                                        <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {communityPosts.map((post, idx) => (
                                        <div key={idx} className="bg-slate-50 dark:bg-black/20 rounded-xl p-4 border border-slate-100 dark:border-white/5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group flex justify-between items-center gap-4">
                                            <div className="flex-1">
                                                <div className="text-slate-900 dark:text-white font-bold text-sm mb-1.5 group-hover:text-purple-600 dark:group-hover:text-[#8c30e8] transition-colors">
                                                    {post.title}
                                                </div>
                                                <div className="text-xs font-medium text-slate-500 dark:text-gray-400 flex items-center gap-1.5">
                                                    <MessageSquare className="w-3.5 h-3.5" /> {post.replies} replies
                                                </div>
                                            </div>
                                            {post.trending && (
                                                <span className="px-2.5 py-1 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-orange-200 dark:border-orange-500/20 shrink-0">
                                                    🔥 Trending
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Recent Resources */}
                            <motion.div {...fadeIn} transition={{ delay: 0.5 }} className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-sm rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Resources</h3>
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                                        <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {recentResources.map((resource, idx) => (
                                        <div key={idx} className="bg-slate-50 dark:bg-black/20 rounded-xl p-4 border border-slate-100 dark:border-white/5 hover:shadow-md hover:-translate-y-0.5 transition-all group flex items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="text-slate-900 dark:text-white font-bold text-sm mb-1">{resource.name}</div>
                                                <div className="text-[11px] font-medium text-slate-500 dark:text-gray-400">
                                                    <span className="text-purple-600 dark:text-[#8c30e8] font-bold uppercase tracking-wider">{resource.type}</span> • {resource.date}
                                                </div>
                                            </div>
                                            <button className="p-2 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-gray-300 rounded-lg transition-colors shadow-sm">
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

=======
                <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <MotionCard className="p-6 xl:col-span-3" delay={0.02}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-heading text-2xl text-[var(--text-primary)]">Study Progress</h3>
                                <TrendingUp className="w-6 h-6 text-[var(--accent-secondary)]" />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                <div className="rounded-2xl border border-[var(--border)] bg-[#fafbff] p-4">
                                    <div className="flex justify-between text-sm mb-2 text-[var(--text-muted)]">
                                        <span>Weekly Goal</span>
                                        <span className="font-semibold text-[var(--accent-primary)]">{weeklyProgress}%</span>
                                    </div>
                                    <div className="progress-track">
                                        <div className="progress-fill" style={{ width: `${weeklyProgress}%` }}></div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                        <div className="rounded-xl bg-white border border-[var(--border)] p-3">
                                            <div className="text-[var(--text-muted)]">This week</div>
                                            <div className="text-xl font-semibold text-[var(--text-primary)]">{weeklyHours.toFixed(1)}h</div>
                                        </div>
                                        <div className="rounded-xl bg-white border border-[var(--border)] p-3">
                                            <div className="text-[var(--text-muted)]">All time</div>
                                            <div className="text-xl font-semibold text-[var(--text-primary)]">{studyHours.toFixed(1)}h</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-[var(--border)] bg-white p-4 h-[220px]">
                                    <div className="text-sm text-[var(--text-muted)] mb-3">Last 7 days</div>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 10 }}>
                                            <defs>
                                                <linearGradient id="studyArea" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6C47FF" stopOpacity={0.25} />
                                                    <stop offset="95%" stopColor="#6C47FF" stopOpacity={0.01} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="4 4" stroke="#E8ECF4" />
                                            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#8892B0', fontSize: 12 }} />
                                            <Tooltip
                                                formatter={(value) => [`${Number(value).toFixed(1)} hrs`, 'Study']}
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: '1px solid #E8ECF4',
                                                    boxShadow: '0 10px 24px rgba(108, 71, 255, 0.12)',
                                                }}
                                            />
                                            <Area type="monotone" dataKey="hours" stroke="#6C47FF" strokeWidth={2.5} fill="url(#studyArea)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="rounded-2xl border border-[var(--border)] bg-white p-4 h-[220px]">
                                    <div className="text-sm text-[var(--text-muted)] mb-3">Target Split</div>
                                    <div className="relative h-[170px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={completionData} dataKey="value" innerRadius={46} outerRadius={70} paddingAngle={2}>
                                                    {completionData.map((entry, idx) => (
                                                        <Cell key={entry.name} fill={DEFAULT_CHART_COLORS[idx % DEFAULT_CHART_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value) => [`${Number(value).toFixed(1)} hrs`, 'Hours']}
                                                    contentStyle={{
                                                        borderRadius: '12px',
                                                        border: '1px solid #E8ECF4',
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                            <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Goal</div>
                                            <div className="font-heading text-xl text-[var(--text-primary)]">{weeklyTargetHours}h</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </MotionCard>

                        <MotionCard className="p-6" delay={0.06}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-heading text-xl text-[var(--text-primary)]">Upcoming Sessions</h3>
                                <Clock className="w-5 h-5 text-[var(--accent-primary)]" />
                            </div>

                            <div className="space-y-3">
                                {isLoadingDashboard && (
                                    <>
                                        <div className="skeleton h-16"></div>
                                        <div className="skeleton h-16"></div>
                                        <div className="skeleton h-16"></div>
                                    </>
                                )}

                                {!isLoadingDashboard && upcomingSessions.length > 0 && upcomingSessions.map((session, idx) => (
                                    <div
                                        key={`${session._id || idx}-${session.timeSlot || ''}`}
                                        className="dashboard-list-item rounded-xl p-3"
                                        style={{ borderLeft: `4px solid ${getSubjectAccent(session.subject || '')}` }}
                                    >
                                        <div className="flex justify-between items-start gap-3 mb-2">
                                            <div>
                                                <div className="font-semibold text-[var(--text-primary)]">{session.mentorName}</div>
                                                <div className="text-sm text-[var(--text-muted)]">{session.subject}</div>
                                            </div>
                                            <button
                                                onClick={() => navigate('/mentorship')}
                                                className="btn-gradient px-3 py-1.5 text-xs rounded-lg font-semibold"
                                            >
                                                JOIN
                                            </button>
                                        </div>
                                        <div className="text-xs text-[var(--accent-primary)]">{session.dateLabel}, {session.timeSlot}</div>
                                    </div>
                                ))}

                                {!isLoadingDashboard && upcomingSessions.length === 0 && (
                                    <div className="text-[var(--text-muted)] text-sm py-4 text-center">No upcoming sessions.</div>
                                )}
                            </div>
                        </MotionCard>

                        <MotionCard className="p-6" delay={0.1}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-heading text-xl text-[var(--text-primary)]">AI Generator</h3>
                                <FileText className="w-5 h-5 text-[var(--accent-primary)]" />
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => navigate('/content-generator')}
                                    className="group flex items-center gap-4 rounded-xl border border-[var(--border)] bg-gradient-to-r from-[#f6f3ff] to-[#ecfbf7] p-4 hover:scale-[1.01] transition-transform"
                                >
                                    <div className="bg-white p-2 rounded-lg border border-[var(--border)]">
                                        <FileText className="w-5 h-5 text-[var(--accent-primary)] group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="text-sm font-medium text-[var(--text-primary)]">Generate Notes</div>
                                </button>

                                <button
                                    onClick={() => navigate('/content-generator')}
                                    className="group flex items-center gap-4 rounded-xl border border-[var(--border)] bg-gradient-to-r from-[#f9f6ff] to-[#eef3ff] p-4 hover:scale-[1.01] transition-transform"
                                >
                                    <div className="bg-white p-2 rounded-lg border border-[var(--border)]">
                                        <BookOpen className="w-5 h-5 text-[#8051ff] group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="text-sm font-medium text-[var(--text-primary)]">Generate Summary</div>
                                </button>

                                <button
                                    onClick={() => navigate('/content-generator')}
                                    className="group flex items-center gap-4 rounded-xl border border-[var(--border)] bg-gradient-to-r from-[#edfbf5] to-[#f2fffb] p-4 hover:scale-[1.01] transition-transform"
                                >
                                    <div className="bg-white p-2 rounded-lg border border-[var(--border)]">
                                        <CheckCircle2 className="w-5 h-5 text-[var(--accent-secondary)] group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="text-sm font-medium text-[var(--text-primary)]">Generate Quiz</div>
                                </button>
                            </div>
                        </MotionCard>

                        <MotionCard className="p-6 flex flex-col max-h-[430px]" delay={0.14}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-heading text-xl text-[var(--text-primary)]">To-Do List</h3>
                                <button
                                    onClick={() => setIsAddingTodo((prev) => !prev)}
                                    className="w-8 h-8 rounded-lg border border-[var(--border)] bg-white text-[var(--accent-secondary)] hover:scale-105 transition-transform flex items-center justify-center"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            {isAddingTodo && (
                                <form onSubmit={handleAddTodo} className="mb-3 flex gap-2">
                                    <input
                                        type="text"
                                        autoFocus
                                        value={newTodoText}
                                        onChange={(e) => setNewTodoText(e.target.value)}
                                        placeholder="What needs to be done?"
                                        className="flex-1 border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] bg-white outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newTodoText.trim()}
                                        className="btn-gradient px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
                                    >
                                        Add
                                    </button>
                                </form>
                            )}

                            <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar flex-1">
                                {todos.length > 0 ? todos.map((item, idx) => (
                                    <div key={`${item.task}-${idx}`} className="dashboard-list-item flex items-center gap-3 rounded-xl p-3 group">
                                        <input
                                            type="checkbox"
                                            checked={item.done}
                                            onChange={() => toggleTodo(idx)}
                                            className="w-5 h-5 rounded border-2 border-[var(--accent-primary)] cursor-pointer accent-[var(--accent-primary)]"
                                        />
                                        <span
                                            onClick={() => toggleTodo(idx)}
                                            className={`flex-1 cursor-pointer select-none transition-colors ${item.done ? 'line-through text-slate-400' : 'text-[var(--text-primary)]'}`}
                                        >
                                            {item.task}
                                        </span>
                                        <button
                                            onClick={() => deleteTodo(idx)}
                                            className="p-1.5 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition-all"
                                            title="Delete Task"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )) : (
                                    <div className="text-[var(--text-muted)] text-sm py-4 text-center">Nothing to do. You are all caught up.</div>
                                )}
                            </div>
                        </MotionCard>

                        <MotionCard className="p-6" delay={0.18}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-heading text-xl text-[var(--text-primary)]">Community Highlights</h3>
                                <MessageSquare className="w-5 h-5 text-[var(--accent-primary)]" />
                            </div>

                            <div className="space-y-3">
                                {communityPosts.map((post, idx) => (
                                    <div key={`${post.title}-${idx}`} className="dashboard-list-item rounded-xl p-3 cursor-pointer">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <div className="text-[var(--text-primary)] font-medium text-sm mb-1">{post.title}</div>
                                                <div className="text-xs text-[var(--text-muted)]">{post.replies} replies</div>
                                            </div>
                                            {post.trending && (
                                                <span className="px-2 py-1 bg-[#fff1f1] text-[var(--accent-warm)] text-xs rounded-lg border border-[#ffd6d6]">
                                                    Trending
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </MotionCard>

                        <MotionCard className="p-6" delay={0.22}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-heading text-xl text-[var(--text-primary)]">Recent Resources</h3>
                                <BookOpen className="w-5 h-5 text-[var(--accent-primary)]" />
                            </div>

                            <div className="space-y-3">
                                {recentResources.map((resource, idx) => (
                                    <div key={`${resource.name}-${idx}`} className="dashboard-list-item rounded-xl p-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="text-[var(--text-primary)] font-medium text-sm">{resource.name}</div>
                                                <div className="text-xs text-[var(--text-muted)] mt-1">
                                                    <span className="text-[var(--accent-primary)]">{resource.type}</span> • {resource.date}
                                                </div>
                                            </div>
                                            <button className="btn-gradient p-2 rounded-lg">
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </MotionCard>
>>>>>>> 2847710994b1259fcef4f688b7892cf24fcdf658
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StudentDashboard;