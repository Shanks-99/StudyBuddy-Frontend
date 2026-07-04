import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { 
    Users, 
    Plus, 
    Search, 
    UserPlus, 
    ArrowRight, 
    Loader2, 
    Lock, 
    Eye, 
    Unlock, 
    BookOpen, 
    Clock, 
    X,
    Filter,
    HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createBuddyRoom, getBuddyRooms, joinBuddyRoom } from '../services/studyBuddyService';

const SUBJECTS = [
    { name: 'All', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 dark:border-purple-500/30' },
    { name: 'Mathematics', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 dark:border-blue-500/30' },
    { name: 'Coding & CS', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:border-emerald-500/30' },
    { name: 'Science & Bio', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 dark:border-amber-500/30' },
    { name: 'Humanities & Art', color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 dark:border-pink-500/30' },
    { name: 'Other', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 dark:border-slate-500/30' }
];

const StudyBuddyLobby = () => {
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('All');

    // Create Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState('Mathematics');
    const [isPrivate, setIsPrivate] = useState(false);
    const [passcode, setPasscode] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Join Private Modal State
    const [isJoinPrivateOpen, setIsJoinPrivateOpen] = useState(false);
    const [selectedRoomToJoin, setSelectedRoomToJoin] = useState(null);
    const [joinPasscode, setJoinPasscode] = useState('');
    const [joinError, setJoinError] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem('user'));
    const userId = user?.id || user?._id;

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchRooms();
        
        // Poll rooms list every 7 seconds to keep lobby updated
        const interval = setInterval(fetchRooms, 7000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchRooms = async () => {
        try {
            const data = await getBuddyRooms();
            // Filter out completed sessions
            setRooms(data.filter(r => r.status !== 'completed'));
        } catch (error) {
            console.error("Failed to fetch study buddy rooms:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        if (!name.trim() || !userId) return;

        setIsCreating(true);
        try {
            const newRoom = await createBuddyRoom({
                name,
                description,
                subject,
                userId,
                isPrivate,
                passcode: isPrivate ? passcode : null
            });
            setIsCreateOpen(false);
            setName('');
            setDescription('');
            setSubject('Mathematics');
            setIsPrivate(false);
            setPasscode('');
            navigate(`/studybuddy/${newRoom._id}`);
        } catch (error) {
            console.error("Failed to create room:", error);
            alert(error.message || "Failed to create study session");
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoinClick = (room) => {
        if (room.isPrivate) {
            setSelectedRoomToJoin(room);
            setJoinPasscode('');
            setJoinError('');
            setIsJoinPrivateOpen(true);
        } else {
            executeJoinRoom(room._id);
        }
    };

    const handlePrivateJoinSubmit = async (e) => {
        e.preventDefault();
        if (!selectedRoomToJoin || !joinPasscode.trim()) return;

        setIsJoining(true);
        setJoinError('');
        try {
            await joinBuddyRoom(selectedRoomToJoin._id, userId, joinPasscode);
            setIsJoinPrivateOpen(false);
            navigate(`/studybuddy/${selectedRoomToJoin._id}`);
        } catch (error) {
            console.error("Failed to join private room:", error);
            setJoinError(error.message || "Incorrect passcode");
        } finally {
            setIsJoining(false);
        }
    };

    const executeJoinRoom = async (roomId) => {
        try {
            await joinBuddyRoom(roomId, userId);
            navigate(`/studybuddy/${roomId}`);
        } catch (error) {
            console.error("Failed to join room:", error);
            alert(error.message || "Could not join this study room.");
        }
    };

    // Filter Rooms
    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (room.description && room.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            room.subject.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesSubject = selectedSubject === 'All' || room.subject === selectedSubject;
        
        // Hide rooms where the user is NOT host/buddy AND room is already active (both slots occupied)
        // If status is 'active' and neither host nor buddy is the current user, we hide it from lobby
        const isParticipant = String(room.host?._id || room.host) === String(userId) || 
            (room.buddy && String(room.buddy?._id || room.buddy) === String(userId));
        const isFull = room.buddy && room.status === 'active';
        const shouldShow = isParticipant || !isFull;

        return matchesSearch && matchesSubject && shouldShow;
    });

    // Counts for stats
    const totalActiveSessions = rooms.filter(r => r.status === 'active').length;
    const roomsWaitingForBuddy = rooms.filter(r => r.status === 'waiting').length;

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 dark:bg-[#0f0a16] dark:text-white font-sans transition-colors duration-300 overflow-hidden relative">
            
            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 dark:bg-[#8c30e8]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 dark:bg-purple-900/10 rounded-full blur-[120px]" />
            </div>

            <Sidebar />

            <div className="flex-1 flex flex-col overflow-y-auto w-full relative z-10 custom-scrollbar">
                
                {/* Header */}
                <header className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6 border-b backdrop-blur-md transition-colors bg-white/80 border-slate-200 dark:bg-[#0f0a16]/80 dark:border-white/5 sticky top-0 w-full">
                    <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                        
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 dark:from-[#8c30e8] dark:to-indigo-900 flex items-center justify-center text-white shadow-xl shadow-purple-500/20">
                                <UserPlus size={22} className="animate-pulse" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                                    Study with Buddy
                                </h1>
                                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 font-medium">
                                    Enforced 2-Person Private & Collaborative Classrooms
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                            {/* Search bar */}
                            <div className="relative flex items-center gap-3 rounded-2xl px-4 py-2 border transition-all duration-300 bg-slate-50 border-slate-200 focus-within:border-purple-400 dark:bg-[#1a1524] dark:border-white/10 dark:focus-within:border-[#8c30e8]/60 w-full sm:w-72">
                                <Search size={18} className="text-slate-400 dark:text-gray-500 shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Search study rooms..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="flex-1 bg-transparent border-none text-sm focus:ring-0 focus:outline-none py-1 text-slate-900 placeholder-slate-400 dark:text-white dark:placeholder-gray-500"
                                />
                            </div>

                            {/* New Request Button */}
                            <button
                                onClick={() => setIsCreateOpen(true)}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 dark:from-[#8c30e8] dark:to-purple-900 dark:hover:from-[#9c4be9] text-white px-6 py-3 rounded-2xl flex items-center gap-2.5 font-bold tracking-wide shadow-lg shadow-purple-500/25 dark:shadow-none hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all w-full sm:w-auto justify-center"
                            >
                                <Plus className="w-5 h-5 stroke-[2.5]" />
                                Ask for Buddy
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 max-w-7xl mx-auto p-6 md:p-12 w-full relative z-10">
                    
                    {/* Lobby Stats Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <div className="bg-white dark:bg-[#150d22] border border-slate-200 dark:border-[#8c30e8]/20 rounded-2xl p-5 flex items-center gap-4 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 dark:bg-[#8c30e8]/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:scale-125 transition-transform" />
                            <div className="w-12 h-12 bg-purple-50 dark:bg-[#8c30e8]/10 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
                                <Users size={22} />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">{rooms.length}</div>
                                <div className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Total Rooms</div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#150d22] border border-slate-200 dark:border-[#8c30e8]/20 rounded-2xl p-5 flex items-center gap-4 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 dark:bg-green-500/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:scale-125 transition-transform" />
                            <div className="w-12 h-12 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center">
                                <Clock size={22} />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">{roomsWaitingForBuddy}</div>
                                <div className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Waiting for Buddy</div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#150d22] border border-slate-200 dark:border-[#8c30e8]/20 rounded-2xl p-5 flex items-center gap-4 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 dark:bg-blue-500/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:scale-125 transition-transform" />
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                                <Users size={22} />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">{totalActiveSessions}</div>
                                <div className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Active P2P Sessions</div>
                            </div>
                        </div>
                    </div>

                    {/* Subject Tags Filter */}
                    <div className="flex flex-wrap items-center gap-2.5 mb-8">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 mr-2 flex items-center gap-1.5">
                            <Filter size={12} /> Filter:
                        </span>
                        {SUBJECTS.map((sub) => (
                            <button
                                key={sub.name}
                                onClick={() => setSelectedSubject(sub.name)}
                                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-200 ${
                                    selectedSubject === sub.name
                                        ? 'bg-purple-600 text-white border-purple-600 dark:bg-[#8c30e8] dark:border-[#8c30e8]'
                                        : `${sub.color} bg-white dark:bg-[#150d22]/40 hover:bg-slate-100 dark:hover:bg-[#150d22] border-slate-200 dark:border-white/5`
                                }`}
                            >
                                {sub.name}
                            </button>
                        ))}
                    </div>

                    {/* Rooms List Grid */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 text-purple-600 dark:text-[#8c30e8] animate-spin mb-4" />
                            <p className="text-sm text-slate-500 dark:text-gray-400">Scanning for study requests...</p>
                        </div>
                    ) : filteredRooms.length === 0 ? (
                        /* Empty state */
                        <div className="flex flex-col items-center justify-center h-[40vh] text-center p-8 bg-white/40 dark:bg-[#150d22]/30 border border-dashed border-slate-200 dark:border-[#8c30e8]/20 rounded-3xl backdrop-blur-sm">
                            <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-[#8c30e8]/10 flex items-center justify-center mb-6">
                                <BookOpen size={28} className="text-purple-600 dark:text-[#8c30e8]" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                No study requests active
                            </h2>
                            <p className="text-slate-500 dark:text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
                                {searchTerm || selectedSubject !== 'All' 
                                    ? "No rooms match your filters. Try selecting a different topic or clearing search." 
                                    : "All quiet here. Click 'Ask for Buddy' above to create a request and start a session!"}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRooms.map(room => {
                                const isHost = String(room.host?._id || room.host) === String(userId);
                                const statusColor = room.status === 'waiting' 
                                    ? 'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20'
                                    : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';

                                // Find subject color
                                const subjectColor = SUBJECTS.find(s => s.name === room.subject)?.color || 'bg-slate-500/10 text-slate-500 dark:text-slate-400';

                                return (
                                    <motion.div
                                        key={room._id}
                                        layout
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex flex-col rounded-3xl p-6 border shadow-sm hover:shadow-xl dark:shadow-none bg-white border-slate-200/60 dark:bg-[#150d22] dark:border-[#8c30e8]/10 hover:border-purple-300 dark:hover:border-[#8c30e8]/50 transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden"
                                    >
                                        {/* Glow highlight */}
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-tr from-purple-500/5 to-indigo-500/5 rounded-full -mr-6 -mt-6 blur-xl" />

                                        {/* Tags */}
                                        <div className="flex items-center justify-between mb-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${subjectColor}`}>
                                                {room.subject}
                                            </span>
                                            
                                            <div className="flex items-center gap-2">
                                                {room.isPrivate && (
                                                    <span className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-400 dark:bg-white/5 dark:border-white/5 dark:text-gray-500">
                                                        <Lock size={12} />
                                                    </span>
                                                )}
                                                <span className={`px-2.5 py-0.5 rounded-md text-[10px] border font-bold uppercase tracking-wider ${statusColor}`}>
                                                    {room.status === 'waiting' ? 'Lobby' : 'Active'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Title & Description */}
                                        <h3 className="text-slate-900 dark:text-white font-bold text-lg leading-tight mb-2 group-hover:text-purple-600 dark:group-hover:text-[#8c30e8] transition-colors line-clamp-1">
                                            {room.name}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-gray-400 flex-1 mb-6 line-clamp-2 leading-relaxed">
                                            {room.description || "No description. Join in to co-study!"}
                                        </p>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-white/5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="relative shrink-0">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm border border-white dark:border-[#150d22]">
                                                        {room.host?.name?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                    <span className="absolute bottom-0 right-0 size-2 bg-green-500 rounded-full border border-white dark:border-[#150d22]" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 dark:text-gray-500">Host</span>
                                                    <span className="text-xs font-bold text-slate-700 dark:text-gray-300 truncate max-w-[100px]">
                                                        {isHost ? 'You' : (room.host?.name || 'Buddy')}
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleJoinClick(room)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm border ${
                                                    isHost 
                                                        ? 'text-purple-600 bg-purple-50 hover:bg-purple-100 border-purple-200/50 dark:text-white dark:bg-[#8c30e8]/20 dark:hover:bg-[#8c30e8]/40 dark:border-[#8c30e8]/30'
                                                        : 'text-white bg-purple-600 hover:bg-purple-700 border-transparent dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] dark:border-transparent'
                                                }`}
                                            >
                                                {isHost ? 'Enter Session' : 'Study Together'} 
                                                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </main>

                {/* Create Session Request Modal */}
                <AnimatePresence>
                    {isCreateOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="rounded-3xl p-8 relative overflow-hidden shadow-2xl border bg-white border-slate-200 dark:bg-[#191121] dark:border-white/10 w-full max-w-md"
                            >
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-purple-500/10 dark:bg-[#8c30e8]/20 rounded-full blur-[80px] pointer-events-none" />

                                <button
                                    onClick={() => setIsCreateOpen(false)}
                                    className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white transition-colors z-10"
                                >
                                    <X size={18} />
                                </button>

                                <div className="relative z-10">
                                    <div className="flex justify-center mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 dark:from-[#8c30e8] dark:to-purple-900 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                            <UserPlus size={22} className="text-white" />
                                        </div>
                                    </div>
                                    
                                    <h2 className="text-2xl font-black text-center text-slate-900 dark:text-white mb-6">
                                        Study with a Buddy
                                    </h2>

                                    <form onSubmit={handleCreateRoom} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5">
                                                Session Subject
                                            </label>
                                            <select
                                                value={subject}
                                                onChange={(e) => setSubject(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:bg-[#1a1524] dark:border-white/10 dark:text-white dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8]"
                                            >
                                                {SUBJECTS.filter(s => s.name !== 'All').map(sub => (
                                                    <option key={sub.name} value={sub.name} className="dark:bg-[#1a1524]">
                                                        {sub.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5">
                                                Request Title
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="e.g. Prep for CS Midterm"
                                                className="w-full px-4 py-3 rounded-xl border bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-slate-400 dark:bg-[#1a1524] dark:border-white/10 dark:text-white dark:placeholder-gray-500 dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5">
                                                Session Details
                                            </label>
                                            <textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="What notes/topics are we covering? (e.g. solving arrays, recursion)"
                                                rows="3"
                                                className="w-full px-4 py-3 rounded-xl border bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-slate-400 dark:bg-[#1a1524] dark:border-white/10 dark:text-white dark:placeholder-gray-500 dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8] resize-none"
                                            />
                                        </div>

                                        {/* Privacy Toggle */}
                                        <div className="pt-2">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={isPrivate}
                                                    onChange={(e) => setIsPrivate(e.target.checked)}
                                                    className="w-4 h-4 text-purple-600 rounded bg-slate-100 border-slate-300 dark:bg-[#1a1524] dark:border-white/10"
                                                />
                                                <span className="text-sm font-medium text-slate-700 dark:text-gray-300 flex items-center gap-1.5 select-none">
                                                    <Lock size={14} className="text-slate-400" /> Private Room (requires passcode)
                                                </span>
                                            </label>
                                        </div>

                                        {/* Slide down Passcode input */}
                                        <AnimatePresence>
                                            {isPrivate && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="pt-2">
                                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5">
                                                            Set Passcode
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required={isPrivate}
                                                            value={passcode}
                                                            onChange={(e) => setPasscode(e.target.value)}
                                                            placeholder="Set numeric or text code"
                                                            className="w-full px-4 py-3 rounded-xl border bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-slate-400 dark:bg-[#1a1524] dark:border-white/10 dark:text-white dark:placeholder-gray-500 dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8]"
                                                        />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <button
                                            type="submit"
                                            disabled={!name.trim() || isCreating}
                                            className="w-full mt-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 dark:from-[#8c30e8] dark:to-purple-900 dark:hover:from-[#9c4be9] text-white rounded-xl font-bold shadow-lg hover:shadow-purple-500/40 transition-all flex items-center justify-center disabled:opacity-50"
                                        >
                                            {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Launch Study Request'}
                                        </button>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Join Private Passcode Input Modal */}
                <AnimatePresence>
                    {isJoinPrivateOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="rounded-3xl p-8 relative overflow-hidden shadow-2xl border bg-white border-slate-200 dark:bg-[#191121] dark:border-white/10 w-full max-w-md animate-in fade-in zoom-in duration-200"
                            >
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-purple-500/10 dark:bg-[#8c30e8]/20 rounded-full blur-[80px] pointer-events-none" />

                                <button
                                    onClick={() => setIsJoinPrivateOpen(false)}
                                    className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white transition-colors z-10"
                                >
                                    <X size={18} />
                                </button>

                                <div className="relative z-10">
                                    <div className="flex justify-center mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center">
                                            <Unlock size={22} />
                                        </div>
                                    </div>

                                    <h2 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">
                                        Private Session
                                    </h2>
                                    <p className="text-xs text-center text-slate-500 dark:text-gray-400 mb-6">
                                        Please enter the passcode provided by the host to join "<strong>{selectedRoomToJoin?.name}</strong>"
                                    </p>

                                    <form onSubmit={handlePrivateJoinSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5">
                                                Room Passcode
                                            </label>
                                            <input
                                                type="password"
                                                required
                                                autoFocus
                                                value={joinPasscode}
                                                onChange={(e) => setJoinPasscode(e.target.value)}
                                                placeholder="Enter passcode"
                                                className="w-full px-4 py-3 rounded-xl border bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:bg-[#1a1524] dark:border-white/10 dark:text-white dark:placeholder-gray-500 dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8] text-center tracking-widest text-lg font-bold"
                                            />
                                        </div>

                                        {joinError && (
                                            <p className="text-red-500 text-xs font-bold text-center">
                                                {joinError}
                                            </p>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={!joinPasscode.trim() || isJoining}
                                            className="w-full mt-4 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 dark:from-[#8c30e8] dark:to-purple-900 dark:hover:from-[#9c4be9] text-white rounded-xl font-bold shadow-lg hover:shadow-purple-500/40 transition-all flex items-center justify-center disabled:opacity-50"
                                        >
                                            {isJoining ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Unlock & Join'}
                                        </button>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default StudyBuddyLobby;
