import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/authService';
import {
    Users,
    Calendar,
    ClipboardList,
    MessageSquare,
    BookOpen,
    Settings,
    Clock,
    CheckCircle,
    XCircle,
    Upload,
    Download,
    TrendingUp,
    BarChart3,
    UserCheck,
    FileText,
    Plus,
    Eye,
    Trash2,
    Edit,
    Search,
    Bell,
    UserCircle2,
    X
} from 'lucide-react';
import InstructorSidebar from '../components/InstructorSidebar';
import { useMemo } from 'react';
import {
    getInstructorMentorProfile,
    isInstructorMentorProfileComplete,
    saveInstructorMentorProfile,
} from '../services/instructorMentorProfileService';
import {
    getUpcomingSessionsForMentor,
    getSessionRequestsForMentor,
    acceptSessionRequest,
    declineSessionRequest,
    isSessionJoinableNow,
    getMentorshipCallRoomId,
    getSessionStartDateTime
} from '../services/mentorSessionService';

import SettingsView from '../components/SettingsView';

const InstructorDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState(() => {
        const params = new URLSearchParams(location.search);
        return params.get('tab') || 'dashboard';
    });
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileStatus, setProfileStatus] = useState('missing');
    const [loading, setLoading] = useState(true);
    const [upcomingSessions, setUpcomingSessions] = useState([]);
    const [sessionRequests, setSessionRequests] = useState([]);
    const [profileForm, setProfileForm] = useState({
        name: '',
        email: '',
        specializedCourses: '',
        description: '',
        degreeFiles: [],
    });

    // Theme handling for SettingsView
    const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Sync activeTab with URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [location.search, activeTab]);

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

    useEffect(() => {
        const initialize = async () => {
            const currentUser = getCurrentUser();
            if (!currentUser) {
                navigate('/login');
                return;
            }

            if (currentUser.role === 'student') {
                navigate('/student-dashboard');
                return;
            }

            if (currentUser.role !== 'teacher') {
                navigate('/login');
                return;
            }

            setUser(currentUser);
            fetchDashboardData(currentUser.name);

            try {
                const existingProfile = await getInstructorMentorProfile();

                if (existingProfile) {
                    setProfileStatus(existingProfile.status || 'pending');
                } else {
                    setProfileStatus('missing');
                    // Redirect to profile setup if missing
                    navigate('/instructor-profile?setup=1');
                }
            } catch (error) {
                console.error('Failed to load mentor profile:', error);
            }
        };

        initialize();
    }, [navigate]);

    const fetchDashboardData = async (mentorName) => {
        setLoading(true);
        try {
            const [sessions, requests] = await Promise.all([
                getUpcomingSessionsForMentor(mentorName),
                getSessionRequestsForMentor(mentorName)
            ]);
            setUpcomingSessions(sessions);
            setSessionRequests(requests);
        } catch (error) {
            console.error('Error fetching instructor data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter and Sort Sessions: Only 3 closest upcoming ones
    const allProcessedSessions = useMemo(() => {
        const now = new Date();
        return upcomingSessions
            .map(s => ({
                ...s,
                startTime: getSessionStartDateTime(s.dateLabel, s.timeSlot)
            }))
            .filter(s => s.startTime && s.startTime > new Date(now.getTime() - 60 * 60 * 1000))
            .sort((a, b) => a.startTime - b.startTime);
    }, [upcomingSessions]);

    const displaySessions = allProcessedSessions.slice(0, 3);
    const displayRequests = sessionRequests.slice(0, 2);

    const handleAcceptRequest = async (requestId) => {
        try {
            await acceptSessionRequest(requestId, user.name);
            fetchDashboardData(user.name);
        } catch (error) {
            alert('Failed to accept request');
        }
    };

    const handleDeclineRequest = async (requestId) => {
        try {
            await declineSessionRequest(requestId, user.name);
            fetchDashboardData(user.name);
        } catch (error) {
            alert('Failed to decline request');
        }
    };

    const handleJoinSession = (session) => {
        const roomId = getMentorshipCallRoomId(session);
        if (roomId) {
            navigate(`/mentorship-call/${roomId}`);
        }
    };



    if (!user) return null;

    // Mock data - Updated with solid background colors mapping to the previous gradient themes
    const overviewStats = [
        { label: 'Upcoming Sessions', value: allProcessedSessions.length.toString(), icon: Calendar, color: 'bg-pink-50 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400' },
        { label: 'Pending Requests', value: sessionRequests.length.toString(), icon: Clock, color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' },
        { label: 'Total Students Helped', value: '156', icon: UserCheck, color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' },
        { label: 'Resources Uploaded', value: '42', icon: Upload, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' },
        { label: 'Community Answers', value: '89', icon: MessageSquare, color: 'bg-purple-50 text-purple-600 dark:bg-[#8c30e8]/20 dark:text-[#8c30e8]' },
    ];


    const uploadedResources = [
        { name: 'Database Notes- Chapter 5', type: 'PDF', downloads: 45, date: '2 days ago' },
        { name: 'AI Notes', type: 'PDF', downloads: 32, date: '1 week ago' },
        { name: 'Calculus Practice Questions', type: 'PDF', downloads: 28, date: '3 days ago' },
    ];

    const communityActivity = [
        { question: 'How to solve quadratic equations?', replies: 12, upvotes: 24 },
        { question: 'What is Node.Js', replies: 8, upvotes: 15 },
        { question: 'What is User Interface?', replies: 15, upvotes: 30 },
    ];

    return (
        <div className="flex h-screen bg-background dark:bg-[#0a0a0f] text-slate-900 dark:text-white font-sans transition-colors duration-300 overflow-hidden relative">

            {/* Atmospheric Background */}
            <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/5 dark:bg-[#8c30e8]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-600/5 rounded-full blur-[120px]" />
            </div>

            {/* Sidebar */}
            {/* Sidebar */}
            <InstructorSidebar activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                {activeTab === 'settings' ? (
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <SettingsView isDark={isDark} setIsDark={toggleTheme} />
                    </div>
                ) : (
                    <>
                        <div className="px-6 py-8">
                            <div className="max-w-7xl mx-auto">
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                    Welcome back, {user?.name}!
                                </h2>
                                <p className="text-slate-500 dark:text-gray-400 mt-1.5 text-sm font-medium">
                                    Manage your mentorship sessions and help students succeed
                                </p>
                            </div>
                        </div>

                        {/* ── Dashboard Content ── */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <div className="max-w-7xl mx-auto">

                                {/* Overview Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                                    {overviewStats.map((stat, idx) => (
                                        <div key={idx} className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-md shadow-slate-200/50 dark:shadow-none rounded-2xl p-5 hover:-translate-y-1 transition-transform">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className={`p-2.5 rounded-xl ${stat.color}`}>
                                                    <stat.icon className="w-5 h-5" />
                                                </div>
                                            </div>
                                            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{stat.value}</div>
                                            <div className="text-xs font-bold text-slate-500 dark:text-gray-400 mt-1 uppercase tracking-wider">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                    {/* Upcoming Sessions */}
                                    <div className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-md shadow-slate-200/50 dark:shadow-none rounded-2xl p-6 flex flex-col">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Upcoming Sessions</h3>
                                            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                                                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                        </div>
                                        <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
                                            {displaySessions.length > 0 ? (
                                                displaySessions.map((session, idx) => {
                                                    const joinable = isSessionJoinableNow(session);
                                                    return (
                                                        <div key={idx} className="bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl p-4 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div>
                                                                    <div className="font-bold text-slate-900 dark:text-white text-sm">{session.studentName}</div>
                                                                    <div className="text-xs font-medium text-slate-500 dark:text-gray-400 mt-0.5">{session.subject}</div>
                                                                </div>
                                                                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border bg-green-50 text-green-600 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20">
                                                                    Accepted
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/5">
                                                                <div className="text-xs font-bold text-purple-600 dark:text-[#8c30e8]">{session.dateLabel} • {session.timeSlot}</div>
                                                                <button
                                                                    onClick={() => handleJoinSession(session)}
                                                                    disabled={!joinable}
                                                                    className={`px-4 py-1.5 text-xs font-bold rounded-lg shadow-sm transition-all ${joinable
                                                                            ? "bg-purple-600 hover:bg-purple-700 text-white animate-pulse"
                                                                            : "bg-slate-200 dark:bg-white/5 text-slate-400 cursor-not-allowed"
                                                                        }`}
                                                                >
                                                                    {joinable ? 'JOIN NOW' : 'WAIT'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                                                    <Calendar className="w-8 h-8 mb-2 text-slate-400" />
                                                    <p className="text-sm font-medium text-slate-500">No sessions scheduled</p>
                                                </div>
                                            )}
                                        </div>
                                        {allProcessedSessions.length > 3 && (
                                            <button
                                                onClick={() => navigate('/instructor-mentorship')}
                                                className="mt-4 text-xs font-bold text-purple-600 dark:text-[#8c30e8] hover:underline flex items-center justify-center gap-1 mx-auto"
                                            >
                                                See All Sessions ({allProcessedSessions.length})
                                            </button>
                                        )}
                                    </div>

                                    {/* Session Requests */}
                                    <div className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-md shadow-slate-200/50 dark:shadow-none rounded-2xl p-6 flex flex-col">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Session Requests</h3>
                                            <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-lg">
                                                <ClipboardList className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                            </div>
                                        </div>
                                        <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
                                            {displayRequests.length > 0 ? (
                                                displayRequests.map((request, idx) => (
                                                    <div key={idx} className="bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl p-4 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                                                        <div className="font-bold text-slate-900 dark:text-white text-sm mb-1">{request.studentName}</div>
                                                        <div className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5">{request.subject}</div>
                                                        <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-[#8c30e8] mb-3">{request.dateLabel} • {request.timeSlot}</div>
                                                        <div className="text-xs text-slate-600 dark:text-gray-300 mb-4 italic bg-white dark:bg-black/40 p-2.5 rounded-lg border border-slate-100 dark:border-white/5">
                                                            "{request.message || 'No message provided'}"
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={() => handleAcceptRequest(request._id || request.id)}
                                                                className="flex-1 py-2 bg-green-50 hover:bg-green-100 text-green-600 border border-green-200 dark:bg-green-500/10 dark:hover:bg-green-500/20 dark:text-green-400 dark:border-green-500/20 text-xs font-bold rounded-lg transition-all flex items-center justify-center"
                                                            >
                                                                <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Accept
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeclineRequest(request._id || request.id)}
                                                                className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 dark:border-red-500/20 text-xs font-bold rounded-lg transition-all flex items-center justify-center"
                                                            >
                                                                <XCircle className="w-3.5 h-3.5 mr-1.5" /> Decline
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                                                    <ClipboardList className="w-8 h-8 mb-2 text-slate-400" />
                                                    <p className="text-sm font-medium text-slate-500">No pending requests</p>
                                                </div>
                                            )}
                                        </div>
                                        {sessionRequests.length > 2 && (
                                            <button
                                                onClick={() => navigate('/instructor-mentorship')}
                                                className="mt-4 text-xs font-bold text-purple-600 dark:text-[#8c30e8] hover:underline flex items-center justify-center gap-1 mx-auto"
                                            >
                                                See All Requests ({sessionRequests.length})
                                            </button>
                                        )}
                                    </div>

                                    {/* Weekly Summary */}
                                    <div className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-md shadow-slate-200/50 dark:shadow-none rounded-2xl p-6 flex flex-col">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Weekly Summary</h3>
                                            <div className="p-2 bg-cyan-50 dark:bg-cyan-500/10 rounded-lg">
                                                <BarChart3 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                                            </div>
                                        </div>
                                        <div className="space-y-4 flex-1">
                                            <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-4 border border-blue-200 dark:border-blue-500/20 hover:bg-blue-100 transition-colors">
                                                <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-300">12</div>
                                                <div className="text-xs font-bold uppercase tracking-wider text-blue-600/70 dark:text-blue-400/70 mt-1">Sessions This Week</div>
                                            </div>
                                            <div className="bg-purple-50 dark:bg-[#8c30e8]/10 rounded-xl p-4 border border-purple-200 dark:border-[#8c30e8]/20 hover:bg-purple-100 transition-colors">
                                                <div className="text-2xl font-extrabold text-purple-700 dark:text-[#8c30e8]">18.5 hrs</div>
                                                <div className="text-xs font-bold uppercase tracking-wider text-purple-600/70 dark:text-purple-400/70 mt-1">Total Hours Taught</div>
                                            </div>
                                            <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-4 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 transition-colors">
                                                <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">4.8/5.0</div>
                                                <div className="text-xs font-bold uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70 mt-1">Student Feedback Score</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Resource Management */}
                                    <div className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-md shadow-slate-200/50 dark:shadow-none rounded-2xl p-6 lg:col-span-2">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">My Resources</h3>
                                            <div className="p-2 bg-purple-50 dark:bg-[#8c30e8]/10 rounded-lg">
                                                <Upload className="w-5 h-5 text-purple-600 dark:text-[#8c30e8]" />
                                            </div>
                                        </div>
                                        <button className="w-full mb-5 py-3 bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center">
                                            <Plus className="w-4 h-4 inline mr-2 stroke-[3]" /> Upload New Resource
                                        </button>
                                        <div className="space-y-3">
                                            {uploadedResources.map((resource, idx) => (
                                                <div key={idx} className="bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl p-4 hover:bg-slate-100 dark:hover:bg-white/5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="text-slate-900 dark:text-white font-bold text-sm">{resource.name}</div>
                                                        <div className="text-xs font-medium text-slate-500 dark:text-gray-400 mt-1.5">
                                                            <span className="text-purple-600 dark:text-[#8c30e8] font-bold">{resource.type}</span> • {resource.downloads} downloads • {resource.date}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 rounded-lg transition-colors">
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 rounded-lg transition-colors">
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 dark:bg-yellow-500/10 dark:hover:bg-yellow-500/20 dark:text-yellow-400 rounded-lg transition-colors">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 rounded-lg transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Weekly Summary & Community Layout container */}
                                    <div className="flex flex-col gap-6 lg:col-span-1">


                                        {/* Community Interaction */}
                                        <div className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-md shadow-slate-200/50 dark:shadow-none rounded-2xl p-6 flex-1">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Community Activity</h3>
                                                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                                                    <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                {communityActivity.map((activity, idx) => (
                                                    <div key={idx} className="bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl p-4 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer group">
                                                        <div className="text-slate-900 dark:text-white font-bold text-sm mb-3 group-hover:text-purple-600 dark:group-hover:text-[#8c30e8] transition-colors leading-snug">
                                                            {activity.question}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                                                            <span className="flex items-center gap-1.5">
                                                                <MessageSquare className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500" />
                                                                {activity.replies} replies
                                                            </span>
                                                            <span className="flex items-center gap-1.5">
                                                                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                                                {activity.upvotes} upvotes
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default InstructorDashboard;