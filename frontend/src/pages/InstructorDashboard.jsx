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
import {
    getInstructorMentorProfile,
    isInstructorMentorProfileComplete,
    saveInstructorMentorProfile,
} from '../services/instructorMentorProfileService';

const InstructorDashboard = () => {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileStatus, setProfileStatus] = useState('missing');
    const [profileForm, setProfileForm] = useState({
        name: '',
        email: '',
        specializedCourses: '',
        description: '',
        degreeFiles: [],
    });
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const initialize = async () => {
            const currentUser = getCurrentUser();
            if (!currentUser) {
                navigate('/login');
                return;
            }

            if (currentUser.role !== 'teacher') {
                navigate('/student-dashboard');
                return;
            }

            setUser(currentUser);

            try {
                const existingProfile = await getInstructorMentorProfile();

                if (existingProfile) {
                    setProfileForm({
                        name: existingProfile.name || currentUser.name || '',
                        email: existingProfile.email || '',
                        specializedCourses: existingProfile.specializedCourses || '',
                        description: existingProfile.description || '',
                        degreeFiles: Array.isArray(existingProfile.degreeFiles) ? existingProfile.degreeFiles : [],
                    });
                    setProfileStatus(existingProfile.status || 'pending');
                } else {
                    setProfileForm((prev) => ({
                        ...prev,
                        name: currentUser.name || '',
                    }));
                    setProfileStatus('missing');
                }
            } catch (error) {
                console.error('Failed to load mentor profile:', error);
            }
        };

        initialize();
    }, [navigate]);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.get('completeProfile') === '1') {
            setShowProfileModal(true);
        }
    }, [location.search]);

    useEffect(() => {
        if (!showProfileModal) return undefined;

        const previousBodyOverflow = document.body.style.overflow;
        const previousHtmlOverflow = document.documentElement.style.overflow;

        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousBodyOverflow;
            document.documentElement.style.overflow = previousHtmlOverflow;
        };
    }, [showProfileModal]);

    const handleProfileInputChange = (event) => {
        const { name, value } = event.target;
        setProfileForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleDegreeFilesChange = (event) => {
        const files = Array.from(event.target.files || []);
        const validFiles = files.filter((file) => ['image/png', 'image/jpeg'].includes(file.type));

        if (validFiles.length !== files.length) {
            alert('Only PNG or JPG files are allowed for degree attachments.');
        }

        setProfileForm((prev) => ({
            ...prev,
            degreeFiles: validFiles.map((file) => file.name),
        }));
    };

    const handleProfileSubmit = async (event) => {
        event.preventDefault();

        const payload = {
            ...profileForm,
            name: profileForm.name.trim(),
            email: profileForm.email.trim(),
            specializedCourses: profileForm.specializedCourses.trim(),
            description: profileForm.description.trim(),
        };

        if (!isInstructorMentorProfileComplete(payload)) {
            alert('Please complete all fields and attach at least one PNG/JPG degree image.');
            return;
        }

        try {
            const saved = await saveInstructorMentorProfile(payload);
            setProfileStatus(saved?.status || 'pending');
            setShowProfileModal(false);
            alert('Profile saved successfully.');
        } catch (error) {
            alert('Failed to save profile.');
        }
    };

    if (!user) return null;

    // Mock data - Updated with solid background colors mapping to the previous gradient themes
    const overviewStats = [
        { label: 'Total Students Helped', value: '156', icon: UserCheck, color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' },
        { label: 'Upcoming Sessions', value: '8', icon: Calendar, color: 'bg-pink-50 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400' },
        { label: 'Resources Uploaded', value: '42', icon: Upload, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' },
        { label: 'Pending Requests', value: '5', icon: Clock, color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' },
        { label: 'Community Answers', value: '89', icon: MessageSquare, color: 'bg-purple-50 text-purple-600 dark:bg-[#8c30e8]/20 dark:text-[#8c30e8]' },
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
        <div className="flex h-screen bg-slate-50 dark:bg-[#0a0a0f] text-slate-900 dark:text-white font-sans transition-colors duration-300 overflow-hidden relative">
            
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
                
                {/* ── Top Bar ── */}
                <div className="bg-white/80 dark:bg-[#0f0a16]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 p-6 z-20 sticky top-0 transition-colors">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                Welcome, {user.name}!
                            </h2>
                            <p className="text-slate-500 dark:text-gray-400 mt-1 text-sm font-medium">
                                Manage your mentorship sessions and help students succeed
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Search Bar */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8]/20 w-full sm:w-64 transition-all shadow-sm"
                                />
                            </div>
                            {/* Notifications */}
                            <button className="relative p-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-gray-300">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0f0a16]"></span>
                            </button>
                            {/* Mentor Profile */}
                            <button
                                onClick={() => setShowProfileModal(true)}
                                className="relative p-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-gray-300"
                                title="Complete Mentor Profile"
                            >
                                <UserCircle2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Dashboard Content ── */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="max-w-7xl mx-auto">
                        
                        {/* Overview Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                            {overviewStats.map((stat, idx) => (
                                <div key={idx} className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-sm rounded-2xl p-5 hover:-translate-y-1 transition-transform">
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
                            <div className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-sm rounded-2xl p-6 flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Upcoming Sessions</h3>
                                    <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                                <div className="space-y-4 flex-1">
                                    {upcomingSessions.map((session, idx) => (
                                        <div key={idx} className="bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl p-4 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white text-sm">{session.student}</div>
                                                    <div className="text-xs font-medium text-slate-500 dark:text-gray-400 mt-0.5">{session.subject}</div>
                                                </div>
                                                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${session.status === 'Scheduled'
                                                    ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                                                    : 'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20'
                                                    }`}>
                                                    {session.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/5">
                                                <div className="text-xs font-bold text-purple-600 dark:text-[#8c30e8]">{session.time}</div>
                                                <button className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white text-xs font-bold rounded-lg shadow-sm transition-all">
                                                    JOIN
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Session Requests */}
                            <div className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-sm rounded-2xl p-6 flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Session Requests</h3>
                                    <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-lg">
                                        <ClipboardList className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                </div>
                                <div className="space-y-4 flex-1">
                                    {sessionRequests.map((request, idx) => (
                                        <div key={idx} className="bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl p-4 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                                            <div className="font-bold text-slate-900 dark:text-white text-sm mb-1">{request.student}</div>
                                            <div className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5">{request.topic}</div>
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-[#8c30e8] mb-3">{request.time}</div>
                                            <div className="text-xs text-slate-600 dark:text-gray-300 mb-4 italic bg-white dark:bg-black/40 p-2.5 rounded-lg border border-slate-100 dark:border-white/5">
                                                "{request.message}"
                                            </div>
                                            <div className="flex gap-3">
                                                <button className="flex-1 py-2 bg-green-50 hover:bg-green-100 text-green-600 border border-green-200 dark:bg-green-500/10 dark:hover:bg-green-500/20 dark:text-green-400 dark:border-green-500/20 text-xs font-bold rounded-lg transition-all flex items-center justify-center">
                                                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Accept
                                                </button>
                                                <button className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 dark:border-red-500/20 text-xs font-bold rounded-lg transition-all flex items-center justify-center">
                                                    <XCircle className="w-3.5 h-3.5 mr-1.5" /> Decline
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Student Analytics */}
                            <div className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-sm rounded-2xl p-6 flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Student Progress</h3>
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                                        <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                </div>
                                <div className="space-y-4 flex-1">
                                    {studentProgress.map((student, idx) => (
                                        <div key={idx} className="bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl p-4 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                                            <div className="font-bold text-slate-900 dark:text-white text-sm mb-3">{student.name}</div>
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="flex justify-between text-xs font-medium mb-1.5">
                                                        <span className="text-slate-500 dark:text-gray-400">Progress</span>
                                                        <span className="text-purple-600 dark:text-[#8c30e8] font-bold">{student.progress}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-1.5">
                                                        <div className="bg-purple-600 dark:bg-[#8c30e8] h-full rounded-full" style={{ width: `${student.progress}%` }}></div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between text-xs font-medium pt-2 border-t border-slate-200 dark:border-white/5">
                                                    <span className="text-slate-500 dark:text-gray-400">Quiz: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{student.quizScore}%</span></span>
                                                    <span className="text-slate-500 dark:text-gray-400">Attendance: <span className="text-blue-600 dark:text-blue-400 font-bold">{student.attendance}%</span></span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Resource Management */}
                            <div className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-sm rounded-2xl p-6 lg:col-span-2">
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
                                {/* Weekly Summary */}
                                <div className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-sm rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Weekly Summary</h3>
                                        <div className="p-2 bg-cyan-50 dark:bg-cyan-500/10 rounded-lg">
                                            <BarChart3 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-4 border border-blue-200 dark:border-blue-500/20">
                                            <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-300">12</div>
                                            <div className="text-xs font-bold uppercase tracking-wider text-blue-600/70 dark:text-blue-400/70 mt-1">Sessions This Week</div>
                                        </div>
                                        <div className="bg-purple-50 dark:bg-[#8c30e8]/10 rounded-xl p-4 border border-purple-200 dark:border-[#8c30e8]/20">
                                            <div className="text-2xl font-extrabold text-purple-700 dark:text-[#8c30e8]">18.5 hrs</div>
                                            <div className="text-xs font-bold uppercase tracking-wider text-purple-600/70 dark:text-purple-400/70 mt-1">Total Hours Taught</div>
                                        </div>
                                        <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-4 border border-emerald-200 dark:border-emerald-500/20">
                                            <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">4.8/5.0</div>
                                            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70 mt-1">Student Feedback Score</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Community Interaction */}
                                <div className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-sm rounded-2xl p-6 flex-1">
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
            </div>

            {/* ── Profile Modal ── */}
            {showProfileModal && (
                <div
                    className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center overscroll-contain"
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                >
                    <div className="w-full max-w-2xl bg-white dark:bg-[#191121] border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
                        
                        <div className="px-8 py-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-black/20">
                            <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white">Mentor Profile Setup</h3>
                            <button
                                onClick={() => setShowProfileModal(false)}
                                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-gray-400 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleProfileSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar bg-white dark:bg-transparent">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-2">Name</label>
                                <input
                                    name="name"
                                    value={profileForm.name}
                                    onChange={handleProfileInputChange}
                                    className="w-full rounded-xl bg-slate-50 dark:bg-[#1a1524] border border-slate-200 dark:border-white/10 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:ring-[#8c30e8]/20 dark:focus:border-[#8c30e8] transition-all text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-2">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={profileForm.email}
                                    onChange={handleProfileInputChange}
                                    className="w-full rounded-xl bg-slate-50 dark:bg-[#1a1524] border border-slate-200 dark:border-white/10 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:ring-[#8c30e8]/20 dark:focus:border-[#8c30e8] transition-all text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-2">Specialized Courses</label>
                                <input
                                    name="specializedCourses"
                                    value={profileForm.specializedCourses}
                                    onChange={handleProfileInputChange}
                                    placeholder="Example: Calculus, Data Structures, Operating Systems"
                                    className="w-full rounded-xl bg-slate-50 dark:bg-[#1a1524] border border-slate-200 dark:border-white/10 px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:ring-[#8c30e8]/20 dark:focus:border-[#8c30e8] transition-all text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-2">Description</label>
                                <textarea
                                    name="description"
                                    value={profileForm.description}
                                    onChange={handleProfileInputChange}
                                    rows="4"
                                    className="w-full rounded-xl bg-slate-50 dark:bg-[#1a1524] border border-slate-200 dark:border-white/10 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:ring-[#8c30e8]/20 dark:focus:border-[#8c30e8] transition-all text-sm resize-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-2">Attach Degree Files (PNG/JPG)</label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/png,image/jpeg"
                                    onChange={handleDegreeFilesChange}
                                    className="w-full rounded-xl bg-slate-50 dark:bg-[#1a1524] border border-slate-200 dark:border-white/10 px-4 py-2.5 text-slate-600 dark:text-gray-300 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-600 dark:file:bg-[#8c30e8]/20 dark:file:text-white hover:file:bg-purple-100 dark:hover:file:bg-[#8c30e8]/30 transition-all cursor-pointer"
                                    required={profileForm.degreeFiles.length === 0}
                                />
                                {profileForm.degreeFiles.length > 0 && (
                                    <div className="mt-3 text-xs font-medium text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-white/5 p-3 rounded-lg border border-slate-200 dark:border-white/10">
                                        <span className="font-bold text-slate-700 dark:text-gray-300">Attached:</span> {profileForm.degreeFiles.join(', ')}
                                    </div>
                                )}
                            </div>

                            <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 text-amber-700 dark:text-amber-400 text-sm font-medium">
                                Approval checks are disabled for testing right now. You can continue using mentorship features.
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setShowProfileModal(false)}
                                    className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white font-bold shadow-md transition-colors text-sm"
                                >
                                    Submit for Approval
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstructorDashboard;