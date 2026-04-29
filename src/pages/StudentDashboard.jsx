import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentUser } from '../services/authService';
import { getFocusSessions } from '../services/focusService';
import {
    getUpcomingSessionsForStudent,
    isSessionJoinableNow,
    getMentorshipCallRoomId,
    getSessionStartDateTime
} from '../services/mentorSessionService';
import Sidebar from '../components/Sidebar';
import SettingsView from '../components/SettingsView';
import {
    FileText,
    MessageSquare,
    BookOpen,
    CheckCircle2,
    Clock,
    TrendingUp,
    Download,
    Plus,
    ArrowRight,
    Zap,
    Brain,
    Sparkles,
    Loader2,
    Trash2,
    ClipboardList,
    X
} from 'lucide-react';

const fadeIn = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
};

const StudentDashboard = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [upcomingSessions, setUpcomingSessions] = useState([]);
    const [focusSessions, setFocusSessions] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

    // Sync isDark with document class
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const toggleTheme = (val) => {
        const html = document.documentElement;
        if (val) {
            html.classList.add('dark');
            localStorage.setItem('studybuddy-theme', 'dark');
        } else {
            html.classList.remove('dark');
            localStorage.setItem('studybuddy-theme', 'light');
        }
        setIsDark(val);
    };

    const [todoItems, setTodoItems] = useState([
        { id: 1, task: 'Complete Math Assignment Ch. 5', done: false },
        { id: 2, task: 'Review Physics Notes - Motion', done: true },
        { id: 3, task: 'Prepare for Chemistry Quiz', done: false },
    ]);
    const [newTodo, setNewTodo] = useState('');
    const [showAddTodo, setShowAddTodo] = useState(false);

    const navigate = useNavigate();

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
        fetchDashboardData(currentUser.id || currentUser._id);
    }, [navigate]);

    const fetchDashboardData = async (userId) => {
        setLoading(true);
        try {
            const [sessions, focus] = await Promise.all([
                getUpcomingSessionsForStudent(),
                getFocusSessions(userId)
            ]);
            setUpcomingSessions(sessions || []);
            setFocusSessions(focus || []);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter and Sort Sessions: Only 3 closest upcoming ones
    const processedSessions = useMemo(() => {
        const now = new Date();
        return upcomingSessions
            .map(s => ({
                ...s,
                startTime: getSessionStartDateTime(s.dateLabel, s.timeSlot)
            }))
            .filter(s => s.startTime && s.startTime > new Date(now.getTime() - 60 * 60 * 1000)) // Keep upcoming or joinable
            .sort((a, b) => a.startTime - b.startTime)
            .slice(0, 3);
    }, [upcomingSessions]);

    const handleToggleTodo = (id) => {
        setTodoItems(prev => prev.map(item =>
            item.id === id ? { ...item, done: !item.done } : item
        ));
    };

    const handleDeleteTodo = (e, id) => {
        e.stopPropagation(); // Don't trigger toggle
        setTodoItems(prev => prev.filter(item => item.id !== id));
    };

    const handleAddTodo = (e) => {
        e.preventDefault();
        if (!newTodo.trim()) return;
        setTodoItems(prev => [
            { id: Date.now(), task: newTodo, done: false },
            ...prev
        ]);
        setNewTodo('');
        setShowAddTodo(false);
    };

    const handleJoinSession = (session) => {
        const roomId = getMentorshipCallRoomId(session);
        if (roomId) {
            navigate(`/mentorship/call/${roomId}`);
        }
    };

    // Calculations for Progress Widget
    const totalMinutes = focusSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    const weeklyGoalHours = 30; // Mock goal
    const progressPercent = Math.min(Math.round((parseFloat(totalHours) / weeklyGoalHours) * 100), 100);

    if (!user) return null;

    const communityPosts = [
        { title: 'Best study techniques for exams?', replies: 24, trending: true },
        { title: 'Looking for study group - Calculus', replies: 12, trending: false },
        { title: 'Free resources for Python learning', replies: 45, trending: true },
    ];

    const recentResources = [
        { name: 'Physics Quiz - Kinematics', type: 'Quiz', date: 'Yesterday' },
        { name: 'Chemistry Summary', type: 'Summary', date: '3 days ago' },
    ];

    return (
        <div className="flex h-screen bg-background dark:bg-[#0a0a0f] text-foreground dark:text-white transition-colors duration-300 overflow-hidden relative font-sans">

            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 dark:bg-[#8c30e8]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 dark:bg-purple-900/10 rounded-full blur-[120px]" />
            </div>

            {/* Sidebar */}
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                {activeTab === 'settings' ? (
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <SettingsView isDark={isDark} setIsDark={toggleTheme} />
                    </div>
                ) : (
                    <>

                        {/* ── Page Header ── */}
                        <div className="px-6 py-8">
                            <div className="max-w-7xl mx-auto flex justify-between items-end">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                        Welcome back, {user.name}!
                                    </h2>
                                    <p className="text-slate-500 dark:text-gray-400 mt-1.5 text-sm font-medium">
                                        You're doing great! Ready to tackle your study goals today?
                                    </p>
                                </div>
                                {loading && (
                                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Syncing Data...
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Dashboard Content ── */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <div className="max-w-7xl mx-auto space-y-8">

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Study Progress Widget */}
                                    <motion.div {...fadeIn} className="md:col-span-2 relative overflow-hidden bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-md shadow-slate-200/50 dark:shadow-none rounded-[2rem] p-8 group">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 dark:bg-[#8c30e8]/20 rounded-full -mr-20 -mt-20 blur-[80px] group-hover:bg-purple-500/20 dark:group-hover:bg-[#8c30e8]/30 transition-all duration-700 pointer-events-none" />

                                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                            <div className="flex-1">
                                                <span className="inline-flex items-center gap-1.5 text-purple-600 dark:text-[#8c30e8] font-bold text-[10px] uppercase tracking-widest bg-purple-50 dark:bg-[#8c30e8]/10 border border-purple-200 dark:border-[#8c30e8]/30 px-3 py-1 rounded-full mb-4">
                                                    <TrendingUp size={12} /> Weekly Progress
                                                </span>
                                                <h2 className="text-3xl md:text-4xl font-black mb-3 text-slate-900 dark:text-white tracking-tight">
                                                    {progressPercent >= 75 ? "Excellent work!" : progressPercent >= 50 ? "Keep it up!" : "Let's get started!"}
                                                </h2>
                                                <p className="text-slate-500 dark:text-gray-400 max-w-md text-sm leading-relaxed">
                                                    You've reached <span className="text-slate-900 dark:text-white font-bold">{progressPercent}%</span> of your weekly study goal. {progressPercent < 100 ? "Keep pushing to hit your target!" : "Goal achieved! Excellent dedication."}
                                                </p>
                                                <button
                                                    onClick={() => navigate('/focus')}
                                                    className="mt-8 inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 hover:-translate-y-1 transition-all"
                                                >
                                                    <span>Focus Now</span>
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
                                                            animate={{ strokeDashoffset: 439.8 * (1 - progressPercent / 100) }}
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
                                                        <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{progressPercent}%</span>
                                                        <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Goal</span>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3 text-center w-full">
                                                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalHours}<span className="text-sm font-medium text-slate-500 ml-0.5">h</span></div>
                                                    <div className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Total Focus Time</div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Upcoming Sessions */}
                                    <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-md shadow-slate-200/50 dark:shadow-none rounded-[2rem] p-6 flex flex-col">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Next Sessions</h3>
                                            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                                                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                        </div>
                                        <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                                            {processedSessions.length > 0 ? (
                                                processedSessions.map((session, idx) => {
                                                    const joinable = isSessionJoinableNow(session);
                                                    return (
                                                        <div key={idx} className="bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div className="flex-1">
                                                                    <div className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-purple-600 dark:group-hover:text-[#8c30e8] transition-colors">{session.mentorName}</div>
                                                                    <div className="text-xs font-medium text-slate-500 dark:text-gray-400 mt-1">{session.subject}</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/5">
                                                                <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-[#8c30e8] bg-purple-50 dark:bg-[#8c30e8]/10 px-2 py-1 rounded-md border border-purple-100 dark:border-[#8c30e8]/20">
                                                                    {session.dateLabel} • {session.timeSlot}
                                                                </div>
                                                                <button
                                                                    onClick={() => handleJoinSession(session)}
                                                                    disabled={!joinable}
                                                                    className={`px-4 py-1.5 text-xs font-bold rounded-lg shadow-sm transition-all ${joinable
                                                                            ? "bg-purple-600 hover:bg-purple-700 text-white animate-pulse"
                                                                            : "bg-slate-200 dark:bg-white/5 text-slate-400 cursor-not-allowed"
                                                                        }`}
                                                                >
                                                                    {joinable ? 'JOIN' : 'WAIT'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                                    <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-3 text-slate-400">
                                                        <Clock size={24} />
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-500">No sessions scheduled</p>
                                                    <button
                                                        onClick={() => navigate('/mentorship')}
                                                        className="mt-3 text-xs font-bold text-purple-600 dark:text-[#8c30e8] hover:underline"
                                                    >
                                                        Find a Mentor
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                    {/* AI Content Generator */}
                                    <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="lg:col-span-2 bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-md shadow-slate-200/50 dark:shadow-none rounded-2xl p-6">
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
                                    <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-md shadow-slate-200/50 dark:shadow-none rounded-2xl p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">To-Do List</h3>
                                            <button
                                                onClick={() => setShowAddTodo(!showAddTodo)}
                                                className="p-1.5 bg-purple-50 dark:bg-[#8c30e8]/10 text-purple-600 dark:text-[#8c30e8] rounded-lg hover:bg-purple-100 dark:hover:bg-[#8c30e8]/20 transition-colors"
                                            >
                                                <Plus className={`w-5 h-5 stroke-[2.5] transition-transform ${showAddTodo ? 'rotate-45' : ''}`} />
                                            </button>
                                        </div>

                                        <AnimatePresence>
                                            {showAddTodo && (
                                                <motion.form
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    onSubmit={handleAddTodo}
                                                    className="mb-4 overflow-hidden"
                                                >
                                                    <div className="flex gap-2">
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            value={newTodo}
                                                            onChange={(e) => setNewTodo(e.target.value)}
                                                            placeholder="What's next?"
                                                            className="flex-1 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                                        />
                                                        <button type="submit" className="bg-purple-600 text-white p-2 rounded-xl">
                                                            <Plus size={18} />
                                                        </button>
                                                    </div>
                                                </motion.form>
                                            )}
                                        </AnimatePresence>

                                        <div className="space-y-2.5">
                                            {todoItems.length > 0 ? (
                                                todoItems.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => handleToggleTodo(item.id)}
                                                        className="flex items-center gap-3 bg-slate-50 dark:bg-black/20 rounded-xl p-3 border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 transition-all group cursor-pointer"
                                                    >
                                                        <div className="relative flex items-center justify-center shrink-0">
                                                            <input
                                                                type="checkbox"
                                                                checked={item.done}
                                                                onChange={() => { }}
                                                                className="w-5 h-5 rounded border-2 border-slate-300 dark:border-white/20 appearance-none cursor-pointer checked:bg-purple-600 checked:border-purple-600 dark:checked:bg-[#8c30e8] dark:checked:border-[#8c30e8] transition-colors"
                                                            />
                                                            {item.done && <CheckCircle2 className="w-3.5 h-3.5 text-white absolute pointer-events-none" />}
                                                        </div>
                                                        <span className={`flex-1 text-sm font-medium transition-colors ${item.done ? 'line-through text-slate-400 dark:text-gray-500' : 'text-slate-700 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-white'}`}>
                                                            {item.task}
                                                        </span>
                                                        <button
                                                            onClick={(e) => handleDeleteTodo(e, item.id)}
                                                            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                                                    <ClipboardList size={32} className="mb-2 opacity-20" />
                                                    <p className="text-xs font-medium">All caught up!</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
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
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;