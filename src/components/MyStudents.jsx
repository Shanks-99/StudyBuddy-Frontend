import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, 
    Search, 
    Eye, 
    MessageSquare, 
    BookOpen, 
    Calendar, 
    Clock, 
    Award, 
    User, 
    GraduationCap, 
    BookOpenCheck, 
    Sparkles, 
    Video, 
    Download, 
    Send, 
    ChevronLeft, 
    ChevronRight, 
    ArrowLeft,
    X
} from 'lucide-react';
import { getMyStudentsForMentor } from '../services/instructorMentorProfileService';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { getMentorshipCallRoomId } from '../services/mentorSessionService';
import { sendDirectMessage } from '../services/directMessageService';
import { assignTaskToStudent, getTasks as getStudentTasks, deleteTask as deleteStudentTask } from '../services/taskService';

const MyStudents = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [activeModalTab, setActiveModalTab] = useState('profile');
    const [messageText, setMessageText] = useState('');
    const [sendingMsg, setSendingMsg] = useState(false);
    
    // Task Assignment States
    const [assignedTasks, setAssignedTasks] = useState([]);
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDesc, setTaskDesc] = useState('');
    const [assigningTask, setAssigningTask] = useState(false);
    const [expandedTaskId, setExpandedTaskId] = useState(null);

    const itemsPerPage = 5;

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const data = await getMyStudentsForMentor();
                setStudents(data || []);
            } catch (err) {
                console.error("Failed to load students:", err);
                showToast("Failed to retrieve student connections.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [showToast]);

    useEffect(() => {
        if (selectedStudent && activeModalTab === 'tasks') {
            const fetchTasks = async () => {
                try {
                    const data = await getStudentTasks(selectedStudent._id);
                    setAssignedTasks(data || []);
                } catch (err) {
                    console.error("Failed to load tasks:", err);
                }
            };
            fetchTasks();
        }
    }, [selectedStudent, activeModalTab]);

    const handleAssignTask = async (e) => {
        e.preventDefault();
        if (!taskTitle.trim()) {
            showToast("Please enter a task title.", "error");
            return;
        }
        if (!selectedStudent || !selectedStudent._id) {
            showToast("Cannot assign task to unregistered student profile.", "error");
            return;
        }
        setAssigningTask(true);
        try {
            const newTask = await assignTaskToStudent(selectedStudent._id, taskTitle.trim(), taskDesc.trim());
            setAssignedTasks(prev => [newTask, ...prev]);
            showToast("Task assigned successfully!", "success");
            setTaskTitle('');
            setTaskDesc('');
        } catch (err) {
            console.error("Failed to assign task:", err);
            showToast("Failed to assign task.", "error");
        } finally {
            setAssigningTask(false);
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            await deleteStudentTask(taskId);
            setAssignedTasks(prev => prev.filter(t => t._id !== taskId));
            showToast("Task removed successfully.", "success");
        } catch (err) {
            console.error("Failed to delete task:", err);
            showToast("Failed to remove task.", "error");
        }
    };

    // Filtering logic
    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 student.subject.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === 'all' || student.status.toLowerCase() === statusFilter.toLowerCase();
            
            return matchesSearch && matchesStatus;
        });
    }, [students, searchTerm, statusFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedStudents = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredStudents, currentPage]);

    const handleSendMessage = async (studentId, studentName) => {
        if (!messageText.trim()) {
            showToast("Please enter a message to send.", "error");
            return;
        }
        if (!studentId) {
            showToast("Cannot message an unregistered student user profile.", "error");
            return;
        }
        setSendingMsg(true);
        try {
            await sendDirectMessage(studentId, messageText.trim());
            showToast(`Message successfully delivered to ${studentName}!`, 'success');
            setMessageText('');
        } catch (err) {
            console.error("Failed to send message from MyStudents:", err);
            showToast("Failed to deliver message.", "error");
        } finally {
            setSendingMsg(false);
        }
    };

    const handleJoinSession = (session) => {
        const roomId = getMentorshipCallRoomId(session);
        if (roomId) {
            navigate(`/mentorship-call/${roomId}`);
        } else {
            showToast("Video session is not active or ready.", "info");
        }
    };

    const getStatusStyle = (status) => {
        switch (status.toLowerCase()) {
            case 'active':
                return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
            case 'completed':
                return 'bg-green-50 text-green-600 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20';
            case 'pending':
                return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
            default:
                return 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10';
        }
    };

    const getInitials = (name) => {
        if (!name) return 'ST';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Aggregate modal statistics
    const stats = useMemo(() => {
        if (!selectedStudent) return { completedCount: 0, totalHours: '0.0', uniqueSubjects: [] };
        
        const completedCount = selectedStudent.sessionHistory.filter(s => s.status === 'completed').length;
        const totalHours = (completedCount * 1.5).toFixed(1);
        const uniqueSubjects = [...new Set(selectedStudent.sessionHistory.map(s => s.subject))];
        
        return { completedCount, totalHours, uniqueSubjects };
    }, [selectedStudent]);

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Users className="w-8 h-8 text-purple-600 dark:text-[#8c30e8]" /> My Students
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and track your student mentorship connections</p>
                </div>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/20 p-4 rounded-2xl shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search student by name, email, or subject..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm outline-none focus:border-purple-500 transition-colors"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        className="px-3 py-2.5 bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-purple-500 transition-colors cursor-pointer"
                    >
                        <option value="all">All Students</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                    </select>
                </div>
            </div>

            {/* Main Table */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
                </div>
            ) : filteredStudents.length === 0 ? (
                <div className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/20 rounded-2xl p-16 text-center shadow-sm">
                    <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No students found</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2">Try adjusting your filters or search keywords.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/20 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                                    <th className="py-4 px-6">Student Name</th>
                                    <th className="py-4 px-6">Subject</th>
                                    <th className="py-4 px-6">Session Status</th>
                                    <th className="py-4 px-6">Last Session</th>
                                    <th className="py-4 px-6 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                                {paginatedStudents.map((student) => (
                                    <tr key={student._id || student.name} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-[#8c30e8]/10 text-purple-600 dark:text-[#8c30e8] flex items-center justify-center text-xs font-bold uppercase overflow-hidden shrink-0 shadow-inner">
                                                    {student.avatar ? (
                                                        <img src={student.avatar} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        getInitials(student.name)
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white">{student.name}</div>
                                                    <div className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{student.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-300">
                                            {student.subject}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border uppercase tracking-wider shrink-0 inline-block ${getStatusStyle(student.status)}`}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-medium">
                                            {student.lastSessionDate || '-'}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <button 
                                                onClick={() => { setSelectedStudent(student); setActiveModalTab('profile'); }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-[#8c30e8]/10 dark:text-[#8c30e8] dark:hover:bg-[#8c30e8]/20 border border-purple-200 dark:border-[#8c30e8]/20 text-xs font-bold rounded-xl transition-all"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 p-4 bg-slate-50 dark:bg-black/10">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Page <strong className="text-slate-700 dark:text-white">{currentPage}</strong> of {totalPages}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Student Details Modal */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#1a1225] border border-slate-200 dark:border-[#8c30e8]/30 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[90vh] md:h-[80vh]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => setSelectedStudent(null)}
                                    className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 rounded-xl transition-all"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedStudent.name}</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{selectedStudent.email}</p>
                                </div>
                            </div>
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border uppercase tracking-wider shrink-0 ${getStatusStyle(selectedStudent.status)}`}>
                                {selectedStudent.status}
                            </span>
                        </div>

                        {/* Modal Tabs Selector */}
                        <div className="flex border-b border-slate-100 dark:border-white/5 px-6 gap-6 bg-slate-50/20 dark:bg-black/10 text-sm overflow-x-auto shrink-0">
                            {[
                                { id: 'profile', label: 'Overview', icon: User },
                                { id: 'sessions', label: 'Session History', icon: Calendar },
                                { id: 'tasks', label: 'Assign Task', icon: BookOpenCheck },
                                { id: 'chat', label: 'Quick Message', icon: MessageSquare }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveModalTab(tab.id)}
                                    className={`flex items-center gap-1.5 py-4 border-b-2 font-bold transition-all relative shrink-0 ${
                                        activeModalTab === tab.id
                                            ? 'border-purple-600 text-purple-600 dark:border-[#8c30e8] dark:text-purple-400'
                                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                                    }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Modal Content Window */}
                        <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-white dark:bg-[#1a1225] custom-scrollbar">
                            {activeModalTab === 'profile' && (
                                <div className="space-y-6">
                                    {/* Stats grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="bg-blue-50/50 border border-blue-100 dark:bg-blue-500/5 dark:border-blue-500/10 p-5 rounded-2xl">
                                            <div className="text-3xl font-black text-blue-600 dark:text-blue-400">{stats.completedCount}</div>
                                            <div className="text-xs font-bold uppercase tracking-wider text-blue-500/70 mt-1">Completed Sessions</div>
                                        </div>
                                        <div className="bg-purple-50/50 border border-purple-100 dark:bg-purple-500/5 dark:border-purple-500/10 p-5 rounded-2xl">
                                            <div className="text-3xl font-black text-purple-600 dark:text-purple-400">{stats.totalHours} hrs</div>
                                            <div className="text-xs font-bold uppercase tracking-wider text-purple-500/70 mt-1">Total study hours</div>
                                        </div>
                                        <div className="bg-emerald-50/50 border border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/10 p-5 rounded-2xl">
                                            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.uniqueSubjects.length}</div>
                                            <div className="text-xs font-bold uppercase tracking-wider text-emerald-500/70 mt-1">Subjects Covered</div>
                                        </div>
                                    </div>

                                    {/* Student profile info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 p-6 rounded-2xl">
                                        <div className="space-y-4">
                                            <div>
                                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Field of Study</div>
                                                <div className="font-semibold text-slate-800 dark:text-white flex items-center gap-1.5 mt-1">
                                                    <GraduationCap className="w-4 h-4 text-purple-500" />
                                                    {selectedStudent.field}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Class / Grade</div>
                                                <div className="font-semibold text-slate-800 dark:text-white flex items-center gap-1.5 mt-1">
                                                    <Award className="w-4 h-4 text-purple-500" />
                                                    {selectedStudent.grade}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Biography</div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                                    {selectedStudent.bio || 'No profile biography provided yet.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeModalTab === 'sessions' && (
                                <div className="space-y-4">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">Mentorship Bookings</h3>
                                    {selectedStudent.sessionHistory.length === 0 ? (
                                        <div className="text-center py-10 text-slate-400">No session history available.</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {selectedStudent.sessionHistory.map((session, idx) => {
                                                const isActiveSession = ['accepted', 'scheduled'].includes(session.status);
                                                return (
                                                    <div key={idx} className="bg-slate-50 dark:bg-black/25 border border-slate-100 dark:border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div className="space-y-1">
                                                            <div className="text-sm font-bold text-slate-900 dark:text-white">{session.subject}</div>
                                                            <div className="text-xs font-medium text-slate-500 dark:text-gray-400 flex items-center gap-1.5">
                                                                <Calendar className="w-3.5 h-3.5 text-purple-500" /> {session.dateLabel}
                                                                <Clock className="w-3.5 h-3.5 text-purple-500 ml-1.5" /> {session.timeSlot}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border uppercase tracking-wider shrink-0 ${getStatusStyle(session.status)}`}>
                                                                {session.status}
                                                            </span>
                                                            {isActiveSession && (
                                                                <button
                                                                    onClick={() => handleJoinSession(session)}
                                                                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1"
                                                                >
                                                                    <Video className="w-3.5 h-3.5" /> Join Session
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeModalTab === 'tasks' && (
                                <div className="space-y-6">
                                    {/* Assign Task Form */}
                                    <form onSubmit={handleAssignTask} className="bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 p-4 rounded-2xl space-y-3">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Assign New Task</h4>
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                placeholder="Task title (e.g. Finish Binary Search Tree assignment)"
                                                value={taskTitle}
                                                onChange={(e) => setTaskTitle(e.target.value)}
                                                className="w-full bg-white dark:bg-black/45 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white outline-none focus:border-purple-500 transition-colors"
                                            />
                                            <textarea
                                                placeholder="Task details/instructions (optional)"
                                                value={taskDesc}
                                                onChange={(e) => setTaskDesc(e.target.value)}
                                                rows={2}
                                                className="w-full bg-white dark:bg-black/45 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-slate-800 dark:text-white outline-none focus:border-purple-500 transition-colors resize-none"
                                            />
                                            <button
                                                type="submit"
                                                disabled={assigningTask}
                                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1 disabled:opacity-50"
                                            >
                                                {assigningTask ? 'Assigning...' : 'Assign Task'}
                                            </button>
                                        </div>
                                    </form>

                                    {/* Assigned Tasks list */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Tasks</h4>
                                        {assignedTasks.length === 0 ? (
                                            <div className="text-center py-8 text-slate-400 text-xs">No tasks assigned to this student yet.</div>
                                        ) : (
                                            <div className="space-y-2.5">
                                                {assignedTasks.map((t) => (
                                                    <div 
                                                        key={t._id} 
                                                        onClick={() => setExpandedTaskId(expandedTaskId === t._id ? null : t._id)}
                                                        className="bg-slate-50 dark:bg-black/25 border border-slate-100 dark:border-white/5 p-4 rounded-2xl flex flex-col gap-2 hover:bg-slate-100 dark:hover:bg-black/35 transition-all cursor-pointer"
                                                    >
                                                        <div className="flex items-center justify-between gap-4 w-full">
                                                            <div className="space-y-1">
                                                                <div className="text-xs font-bold text-slate-900 dark:text-white">{t.title}</div>
                                                                <div className="text-[10px] font-semibold flex items-center gap-1.5 mt-1">
                                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border tracking-wider ${
                                                                        t.status === 'completed'
                                                                            ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                                                                            : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                                                    }`}>
                                                                        {t.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteTask(t._id); }}
                                                                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 rounded-xl transition-all"
                                                                title="Delete Task"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                        {expandedTaskId === t._id && t.description && (
                                                            <div className="border-t border-slate-100 dark:border-white/5 pt-2 text-[11px] text-slate-500 dark:text-gray-400 leading-relaxed">
                                                                {t.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeModalTab === 'chat' && (
                                <div className="space-y-4">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Quick Message to Student</h3>
                                    <p className="text-xs text-slate-500">Send an instant direct message or session notes directly to the student's inbox.</p>
                                    <div className="space-y-3">
                                        <textarea
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            placeholder="Type your message here..."
                                            rows={5}
                                            className="w-full bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm text-slate-800 dark:text-white outline-none focus:border-purple-500 transition-colors resize-none"
                                        />
                                        <button
                                            onClick={() => handleSendMessage(selectedStudent._id, selectedStudent.name)}
                                            disabled={sendingMsg}
                                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                        >
                                            {sendingMsg ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <><Send className="w-4 h-4" /> Send Announcement</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyStudents;
