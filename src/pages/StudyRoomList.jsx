import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Users, Plus, Search, Video, ArrowRight, Loader2, DoorOpen, X } from 'lucide-react';
import { getStudyRooms, createStudyRoom } from '../services/studyRoomService';

const StudyRoomList = () => {
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomDesc, setNewRoomDesc] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem('user'));

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        setIsLoading(true);
        try {
            const data = await getStudyRooms();
            setRooms(data);
        } catch (error) {
            console.error("Failed to fetch rooms:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        if (!newRoomName.trim() || !user) return;

        const userId = user.id || user._id;
        if (!userId) {
            alert('Please log in again (missing user id).');
            return;
        }

        setIsCreating(true);
        try {
            const newRoom = await createStudyRoom({
                name: newRoomName,
                description: newRoomDesc,
                userId
            });
            setIsModalOpen(false);
            setNewRoomName('');
            setNewRoomDesc('');
            navigate(`/studyroom/${newRoom._id}`);
        } catch (error) {
            console.error("Failed to create room:", error);
            alert(error.message || "Failed to create room");
        } finally {
            setIsCreating(false);
        }
    };

    const filteredRooms = rooms.filter(room =>
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (room.description && room.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 dark:bg-[#0f0a16] dark:text-white font-sans transition-colors duration-300 overflow-hidden relative">
            
            {/* ── Background Ambience ── */}
            <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/5 dark:bg-[#8c30e8]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-purple-500/5 dark:bg-[#8c30e8]/5 rounded-full blur-[120px]" />
            </div>

            <Sidebar />

            <div className="flex-1 flex flex-col overflow-y-auto w-full relative z-10 custom-scrollbar">

                {/* ── Header ── */}
                <header className="relative z-20 flex items-center justify-between px-4 md:px-8 py-4 border-b backdrop-blur-md transition-colors bg-white/80 border-slate-200 dark:bg-[#0f0a16]/80 dark:border-white/5 sticky top-0 w-full">
                    <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                        
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-600 dark:bg-[#8c30e8] flex items-center justify-center text-white shadow-md hidden sm:flex">
                                <Video size={18} />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-serif font-medium tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
                                    Study Rooms
                                </h1>
                                <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">
                                    Collaborative Spaces &middot; Online
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            {/* Search Input */}
                            <div className="relative flex items-center gap-2 rounded-full px-3 py-1.5 border transition-colors bg-slate-50 border-slate-200 dark:bg-[#1a1524] dark:border-white/10 w-full sm:w-64">
                                <Search size={16} className="text-slate-400 dark:text-white/30" />
                                <input
                                    type="text"
                                    placeholder="Search rooms..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="flex-1 bg-transparent border-none text-sm focus:ring-0 focus:outline-none py-1 transition-colors text-slate-900 placeholder-slate-400 dark:text-white dark:placeholder-white/30"
                                />
                            </div>

                            {/* Create Button */}
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white px-5 py-2.5 rounded-full flex items-center gap-2 font-bold tracking-wide shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:w-auto justify-center"
                            >
                                <Plus className="w-5 h-5 stroke-[2.5]" />
                                New Room
                            </button>
                        </div>
                    </div>
                </header>

                {/* ── Main Content ── */}
                <main className="flex-1 max-w-7xl mx-auto p-4 md:p-8 w-full relative z-10">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 text-purple-600 dark:text-[#8c30e8] animate-spin mb-4" />
                            <p className="text-sm text-slate-500 dark:text-white/50">Discovering study spaces...</p>
                        </div>
                    ) : filteredRooms.length === 0 ? (
                        /* Empty State */
                        <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8">
                            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-6 shadow-sm">
                                <DoorOpen size={32} className="text-slate-400 dark:text-white/30" />
                            </div>
                            <h2 className="text-2xl font-serif font-medium text-slate-900 dark:text-white mb-2 tracking-tight">
                                No rooms found
                            </h2>
                            <p className="text-slate-500 dark:text-white/50 text-sm max-w-md mx-auto">
                                {searchTerm ? "We couldn't find any rooms matching your search." : "It looks a bit quiet here. Be the first to create a study room!"}
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="mt-6 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 bg-purple-50 border-purple-200 text-purple-600 dark:bg-[#8c30e8]/20 dark:border-[#8c30e8]/40 dark:text-white shadow-sm flex items-center gap-2 hover:bg-purple-100 dark:hover:bg-[#8c30e8]/30"
                                >
                                    Create a Room <ArrowRight size={14} />
                                </button>
                            )}
                        </div>
                    ) : (
                        /* Rooms Grid */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRooms.map(room => (
                                <div 
                                    key={room._id} 
                                    className="flex flex-col rounded-2xl p-5 border shadow-sm transition-all duration-300 bg-white border-slate-100 dark:bg-[#1f192b] dark:border-white/5 hover:border-purple-300 dark:hover:border-[#8c30e8]/50 group hover:-translate-y-1"
                                >
                                    {/* Card Header */}
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-slate-900 dark:text-white font-semibold text-lg truncate pr-2 flex-1">
                                            {room.name}
                                        </h3>
                                        <span className="px-1.5 py-0.5 rounded text-[10px] border font-mono transition-colors bg-green-50 text-green-500 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20 shrink-0">
                                            ACTIVE
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-slate-500 dark:text-white/50 flex-1 mb-6 line-clamp-2 leading-relaxed">
                                        {room.description || "No description provided. Jump in and see what they're studying!"}
                                    </p>

                                    {/* Card Footer */}
                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="relative shrink-0">
                                                <div className="w-8 h-8 rounded-full bg-purple-500 dark:bg-[#8c30e8] flex items-center justify-center text-xs font-bold text-white shadow-sm">
                                                    {room.createdBy?.name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <span className="absolute bottom-0 right-0 size-2.5 bg-green-500 rounded-full border-2 border-white dark:border-[#1f192b]" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-white/30">Host</span>
                                                <span className="text-xs font-medium text-slate-700 dark:text-white/80 truncate max-w-[100px]">
                                                    {room.createdBy?.name || 'Unknown'}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => navigate(`/studyroom/${room._id}`)}
                                            className="px-4 py-2 rounded-full text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 dark:text-white dark:bg-[#8c30e8]/20 dark:hover:bg-[#8c30e8]/40 transition-colors border border-transparent dark:border-[#8c30e8]/30 flex items-center gap-1.5"
                                        >
                                            Join <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>

                {/* ── Create Room Modal ── */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm">
                        <div className="rounded-3xl p-8 relative overflow-hidden shadow-2xl border bg-white border-slate-200 dark:bg-[#191121] dark:border-white/10 w-full max-w-md animate-in fade-in zoom-in duration-200">
                            
                            {/* Decorative modal glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-purple-500/10 dark:bg-[#8c30e8]/20 rounded-full blur-[80px] pointer-events-none" />

                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white transition-colors z-10"
                            >
                                <X size={18} />
                            </button>

                            <div className="relative z-10">
                                <div className="flex justify-center mb-4">
                                    <div className="w-12 h-12 rounded-full bg-purple-600 dark:bg-[#8c30e8] flex items-center justify-center shadow-lg shadow-purple-500/30">
                                        <Plus size={24} className="text-white" />
                                    </div>
                                </div>
                                <h2 className="text-2xl font-serif font-medium text-center text-slate-900 dark:text-white mb-6">
                                    Create New Room
                                </h2>

                                <form onSubmit={handleCreateRoom} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                                            Room Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={newRoomName}
                                            onChange={(e) => setNewRoomName(e.target.value)}
                                            placeholder="e.g. Organic Chemistry Prep"
                                            className="w-full px-4 py-2.5 rounded-xl border transition-colors bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-slate-400 dark:bg-[#1a1524] dark:border-white/10 dark:text-white dark:placeholder-white/30 dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                                            Description <span className="font-normal normal-case opacity-70">(Optional)</span>
                                        </label>
                                        <textarea
                                            value={newRoomDesc}
                                            onChange={(e) => setNewRoomDesc(e.target.value)}
                                            placeholder="What's the main focus?"
                                            rows="3"
                                            className="w-full px-4 py-2.5 rounded-xl border transition-colors bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-slate-400 dark:bg-[#1a1524] dark:border-white/10 dark:text-white dark:placeholder-white/30 dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8] resize-none"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!newRoomName.trim() || isCreating}
                                        className="w-full mt-6 py-3.5 rounded-xl font-bold text-white shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] shadow-purple-500/30 flex items-center justify-center"
                                    >
                                        {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Room'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default StudyRoomList;