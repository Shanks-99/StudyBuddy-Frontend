import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Users, Plus, Search, Video, ArrowRight, Loader2, DoorOpen } from 'lucide-react';
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
    const user = JSON.parse(localStorage.getItem('user'));

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
            // In a real app, maybe show a toast notification
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        if (!newRoomName.trim() || !user) return;

        setIsCreating(true);
        try {
            const newRoom = await createStudyRoom({
                name: newRoomName,
                description: newRoomDesc,
                userId: user.id
            });
            setIsModalOpen(false);
            setNewRoomName('');
            setNewRoomDesc('');
            // Optional: navigate directly to the new room, or just refresh list
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
        <div className="flex h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-y-auto w-full relative">

                {/* Header */}
                <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 p-6 sticky top-0 z-10 w-full">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
                                <Video className="w-8 h-8 text-blue-400" />
                                Study Rooms
                            </h1>
                            <p className="text-gray-400 mt-1">Join collaborative spaces or create your own.</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search rooms..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 w-full md:w-64 transition-all"
                                />
                            </div>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium shadow-lg hover:shadow-purple-500/25 transition-all w-full md:w-auto justify-center"
                            >
                                <Plus className="w-5 h-5" />
                                New Room
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 max-w-7xl mx-auto p-6 w-full">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                        </div>
                    ) : filteredRooms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-8">
                            <div className="bg-white/10 p-4 rounded-full mb-4">
                                <DoorOpen className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">No rooms found</h3>
                            <p className="text-gray-400 max-w-md">
                                {searchTerm ? "We couldn't find any rooms matching your search." : "It looks a bit quiet here. Be the first to create a study room!"}
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="mt-6 text-purple-400 hover:text-purple-300 font-medium flex items-center gap-2"
                                >
                                    Create one now <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRooms.map(room => (
                                <div key={room._id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group flex flex-col h-full hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                                            {room.name}
                                        </h3>
                                        <div className="bg-black/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs text-gray-300 font-medium border border-white/5">
                                            <Users className="w-3.5 h-3.5 text-emerald-400" />
                                            Active
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-400 flex-1 mb-6 line-clamp-2">
                                        {room.description || "No description provided. Jump in and see what they're studying!"}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                                                {room.createdBy?.name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <span className="text-xs text-gray-400">Host: {room.createdBy?.name || 'Unknown'}</span>
                                        </div>

                                        <button
                                            onClick={() => navigate(`/studyroom/${room._id}`)}
                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors border border-white/10 flex items-center gap-2"
                                        >
                                            Join Room <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>

                {/* Create Room Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-gray-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>

                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <Plus className="w-6 h-6 text-purple-500" />
                                Create New Room
                            </h2>

                            <form onSubmit={handleCreateRoom} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Room Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newRoomName}
                                        onChange={(e) => setNewRoomName(e.target.value)}
                                        placeholder="e.g. CS101 Exam Prep"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Description <span className="text-gray-500 font-normal">(Optional)</span></label>
                                    <textarea
                                        value={newRoomDesc}
                                        onChange={(e) => setNewRoomDesc(e.target.value)}
                                        placeholder="What will you be studying?"
                                        rows="3"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={!newRoomName.trim() || isCreating}
                                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 rounded-xl shadow-lg transition-all mt-4 flex items-center justify-center disabled:opacity-50"
                                >
                                    {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Room'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default StudyRoomList;
