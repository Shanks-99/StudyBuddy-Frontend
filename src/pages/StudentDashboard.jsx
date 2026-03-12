import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/authService';
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
} from 'lucide-react';

const StudentDashboard = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            navigate('/login');
        } else if (currentUser.role !== 'student') {
            navigate('/instructor-dashboard');
        } else {
            setUser(currentUser);
        }
    }, [navigate]);

    if (!user) return null;

    const upcomingSessions = [
        { mentor: 'Sir Nouman Ul Haq', subject: 'Machine Learning', time: 'Today, 3:00 PM' },
        { mentor: "Ma'am Faiza Hameed", subject: 'Software Reverse Engineering', time: 'Tomorrow, 10:00 AM' },
        { mentor: "Ma'am Faryal Jahangeer", subject: 'Compiler Construction', time: 'Wed, 2:00 PM' },
    ];

    const todoItems = [
        { task: 'Complete Math Assignment Ch. 5', done: false },
        { task: 'Review Physics Notes - Motion', done: true },
        { task: 'Prepare for Chemistry Quiz', done: false },
        { task: 'Read History Chapter 12', done: false },
    ];

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

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 overflow-hidden">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-white">Welcome, {user.name}! 👋</h2>
                            <p className="text-gray-400 mt-1">Ready to achieve your goals today?</p>
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Study Progress Widget */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white">Study Progress</h3>
                                <TrendingUp className="w-6 h-6 text-green-400" />
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-300">Weekly Progress</span>
                                        <span className="text-purple-400 font-bold">75%</span>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full" style={{ width: '75%' }}></div>
                                    </div>
                                </div>
                                <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl p-4 border border-purple-500/30">
                                    <div className="text-3xl font-bold text-white">24.5 hrs</div>
                                    <div className="text-gray-300 text-sm">Total Study Hours</div>
                                </div>
                            </div>
                        </div>

                        {/* Upcoming Sessions */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white">Upcoming Sessions</h3>
                                <Clock className="w-6 h-6 text-blue-400" />
                            </div>
                            <div className="space-y-3">
                                {upcomingSessions.map((session, idx) => (
                                    <div key={idx} className="bg-white/5 rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-semibold text-white">{session.mentor}</div>
                                                <div className="text-sm text-gray-400">{session.subject}</div>
                                            </div>
                                            <button className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all">
                                                JOIN
                                            </button>
                                        </div>
                                        <div className="text-xs text-purple-400">{session.time}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI Content Generator */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white">AI Generator</h3>
                                <FileText className="w-6 h-6 text-purple-400" />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <button onClick={() => navigate('/content-generator')} className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4 hover:from-blue-500/30 hover:to-purple-600/30 transition-all group">
                                    <FileText className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                                    <div className="text-white text-sm font-medium">Generate Notes</div>
                                </button>
                                <button onClick={() => navigate('/content-generator')} className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4 hover:from-purple-500/30 hover:to-pink-600/30 transition-all group">
                                    <BookOpen className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                                    <div className="text-white text-sm font-medium">Generate Summary</div>
                                </button>
                                <button onClick={() => navigate('/content-generator')} className="bg-gradient-to-br from-green-500/20 to-teal-600/20 border border-green-500/30 rounded-xl p-4 hover:from-green-500/30 hover:to-teal-600/30 transition-all group">
                                    <CheckCircle2 className="w-6 h-6 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
                                    <div className="text-white text-sm font-medium">Generate Quiz</div>
                                </button>
                            </div>
                        </div>

                        {/* To-Do List */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white">To-Do List</h3>
                                <Plus className="w-6 h-6 text-green-400 cursor-pointer hover:scale-110 transition-transform" />
                            </div>
                            <div className="space-y-3">
                                {todoItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all">
                                        <input
                                            type="checkbox"
                                            checked={item.done}
                                            className="w-5 h-5 rounded border-2 border-purple-500 bg-transparent checked:bg-purple-500 cursor-pointer"
                                            readOnly
                                        />
                                        <span className={`flex-1 ${item.done ? 'line-through text-gray-500' : 'text-white'}`}>
                                            {item.task}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Community Highlights */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white">Community Highlights</h3>
                                <MessageSquare className="w-6 h-6 text-blue-400" />
                            </div>
                            <div className="space-y-3">
                                {communityPosts.map((post, idx) => (
                                    <div key={idx} className="bg-white/5 rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <div className="text-white font-medium text-sm mb-1 group-hover:text-purple-400 transition-colors">
                                                    {post.title}
                                                </div>
                                                <div className="text-xs text-gray-400">{post.replies} replies</div>
                                            </div>
                                            {post.trending && (
                                                <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-lg border border-orange-500/30">
                                                    🔥 Trending
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Resources */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white">Recent Resources</h3>
                                <BookOpen className="w-6 h-6 text-purple-400" />
                            </div>
                            <div className="space-y-3">
                                {recentResources.map((resource, idx) => (
                                    <div key={idx} className="bg-white/5 rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="text-white font-medium text-sm">{resource.name}</div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    <span className="text-purple-400">{resource.type}</span> • {resource.date}
                                                </div>
                                            </div>
                                            <button className="p-2 bg-purple-500/20 rounded-lg hover:bg-purple-500/30 transition-all group-hover:scale-110">
                                                <Download className="w-4 h-4 text-purple-400" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
