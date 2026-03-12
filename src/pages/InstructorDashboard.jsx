import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Bell
} from 'lucide-react';
import InstructorSidebar from '../components/InstructorSidebar';

const InstructorDashboard = () => {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const navigate = useNavigate();

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            navigate('/login');
        } else if (currentUser.role !== 'teacher') {
            navigate('/student-dashboard');
        } else {
            setUser(currentUser);
        }
    }, [navigate]);

    if (!user) return null;

    // Mock data
    const overviewStats = [
        { label: 'Total Students Helped', value: '156', icon: UserCheck, color: 'from-blue-500 to-cyan-500' },
        { label: 'Upcoming Sessions', value: '8', icon: Calendar, color: 'from-purple-500 to-pink-500' },
        { label: 'Resources Uploaded', value: '42', icon: Upload, color: 'from-green-500 to-emerald-500' },
        { label: 'Pending Requests', value: '5', icon: Clock, color: 'from-orange-500 to-yellow-500' },
        { label: 'Community Answers', value: '89', icon: MessageSquare, color: 'from-indigo-500 to-purple-500' },
    ];

    const upcomingSessions = [
        { student: 'Shahzaib Khan ', subject: 'Calculus', time: 'Today, 2:00 PM', status: 'Scheduled' },
        { student: 'Hamza Gul', subject: 'Physics', time: 'Today, 4:00 PM', status: 'Scheduled' },
        { student: 'Waseem Riaz', subject: 'Chemistry', time: 'Tomorrow, 10:00 AM', status: 'Pending' },
    ];

    const sessionRequests = [
        { student: 'Jalal Khan', topic: 'Database', time: 'Wed, 3:00 PM', message: 'Need help with SQL and no SQL' },
        { student: 'Tayyab Alam', topic: 'Software Reverse Engineering', time: 'Thu, 1:00 PM', message: 'Types of Legacy System' },
        { student: 'Asad Ali', topic: 'Artificial Intelligence', time: 'Fri, 11:00 AM', message: 'What is CNN' },
    ];

    const studentProgress = [
        { name: 'Mansoor Shah', progress: 85, quizScore: 92, attendance: 95 },
        { name: 'Ayesha Shah', progress: 72, quizScore: 78, attendance: 88 },
        { name: 'Bisma Khan', progress: 90, quizScore: 95, attendance: 100 },
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
        <div className="flex h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 overflow-hidden">
            {/* Sidebar */}
            <InstructorSidebar activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-white">Welcome, {user.name}! 👨‍🏫</h2>
                            <p className="text-gray-400 mt-1">Manage your mentorship sessions and help students succeed</p>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Search Bar */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
                                />
                            </div>
                            {/* Notifications */}
                            <button className="relative p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                                <Bell className="w-6 h-6 text-white" />
                                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900"></span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Overview Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        {overviewStats.map((stat, idx) => (
                            <div key={idx} className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 shadow-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color}`}>
                                        <stat.icon className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-white">{stat.value}</div>
                                <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Upcoming Sessions */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white">Upcoming Sessions</h3>
                                <Calendar className="w-6 h-6 text-blue-400" />
                            </div>
                            <div className="space-y-3">
                                {upcomingSessions.map((session, idx) => (
                                    <div key={idx} className="bg-white/5 rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-semibold text-white">{session.student}</div>
                                                <div className="text-sm text-gray-400">{session.subject}</div>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded-lg ${session.status === 'Scheduled'
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                }`}>
                                                {session.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs text-purple-400">{session.time}</div>
                                            <button className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all">
                                                JOIN
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Session Requests */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white">Session Requests</h3>
                                <ClipboardList className="w-6 h-6 text-orange-400" />
                            </div>
                            <div className="space-y-3">
                                {sessionRequests.map((request, idx) => (
                                    <div key={idx} className="bg-white/5 rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
                                        <div className="font-semibold text-white text-sm mb-1">{request.student}</div>
                                        <div className="text-xs text-gray-400 mb-2">{request.topic}</div>
                                        <div className="text-xs text-purple-400 mb-2">{request.time}</div>
                                        <div className="text-xs text-gray-300 mb-3 italic">"{request.message}"</div>
                                        <div className="flex gap-2">
                                            <button className="flex-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-lg hover:bg-green-500/30 transition-all border border-green-500/30">
                                                <CheckCircle className="w-3 h-3 inline mr-1" />
                                                Accept
                                            </button>
                                            <button className="flex-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-lg hover:bg-red-500/30 transition-all border border-red-500/30">
                                                <XCircle className="w-3 h-3 inline mr-1" />
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Student Analytics */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white">Student Progress</h3>
                                <TrendingUp className="w-6 h-6 text-green-400" />
                            </div>
                            <div className="space-y-3">
                                {studentProgress.map((student, idx) => (
                                    <div key={idx} className="bg-white/5 rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
                                        <div className="font-semibold text-white text-sm mb-2">{student.name}</div>
                                        <div className="space-y-2">
                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-400">Progress</span>
                                                    <span className="text-blue-400">{student.progress}%</span>
                                                </div>
                                                <div className="w-full bg-white/10 rounded-full h-1.5">
                                                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full" style={{ width: `${student.progress}%` }}></div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-400">Quiz: <span className="text-green-400">{student.quizScore}%</span></span>
                                                <span className="text-gray-400">Attendance: <span className="text-purple-400">{student.attendance}%</span></span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Resource Management */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white">My Resources</h3>
                                <Upload className="w-6 h-6 text-purple-400" />
                            </div>
                            <button className="w-full mb-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all">
                                <Plus className="w-4 h-4 inline mr-2" />
                                Upload New Resource
                            </button>
                            <div className="space-y-3">
                                {uploadedResources.map((resource, idx) => (
                                    <div key={idx} className="bg-white/5 rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <div className="text-white font-medium text-sm">{resource.name}</div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    <span className="text-purple-400">{resource.type}</span> • {resource.downloads} downloads • {resource.date}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <button className="p-1.5 bg-blue-500/20 rounded-lg hover:bg-blue-500/30 transition-all">
                                                <Eye className="w-3 h-3 text-blue-400" />
                                            </button>
                                            <button className="p-1.5 bg-green-500/20 rounded-lg hover:bg-green-500/30 transition-all">
                                                <Download className="w-3 h-3 text-green-400" />
                                            </button>
                                            <button className="p-1.5 bg-yellow-500/20 rounded-lg hover:bg-yellow-500/30 transition-all">
                                                <Edit className="w-3 h-3 text-yellow-400" />
                                            </button>
                                            <button className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-all">
                                                <Trash2 className="w-3 h-3 text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Community Interaction */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white">Community Activity</h3>
                                <MessageSquare className="w-6 h-6 text-blue-400" />
                            </div>
                            <div className="space-y-3">
                                {communityActivity.map((activity, idx) => (
                                    <div key={idx} className="bg-white/5 rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
                                        <div className="text-white font-medium text-sm mb-2 group-hover:text-purple-400 transition-colors">
                                            {activity.question}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3" />
                                                {activity.replies} replies
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <TrendingUp className="w-3 h-3" />
                                                {activity.upvotes} upvotes
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Weekly Summary */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white">Weekly Summary</h3>
                                <BarChart3 className="w-6 h-6 text-cyan-400" />
                            </div>
                            <div className="space-y-4">
                                <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-500/30">
                                    <div className="text-2xl font-bold text-white">12</div>
                                    <div className="text-xs text-gray-300">Sessions This Week</div>
                                </div>
                                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30">
                                    <div className="text-2xl font-bold text-white">18.5 hrs</div>
                                    <div className="text-xs text-gray-300">Total Hours Taught</div>
                                </div>
                                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30">
                                    <div className="text-2xl font-bold text-white">4.8/5.0</div>
                                    <div className="text-xs text-gray-300">Student Feedback Score</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
};

export default InstructorDashboard;
