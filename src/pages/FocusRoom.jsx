import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { Play, Pause, Square, CheckCircle2, Circle, Plus, Trash2, Clock, CalendarDays, Award } from 'lucide-react';
import { saveFocusSession, getFocusSessions } from '../services/focusService';

const FocusRoom = () => {
    // --- Timer State ---
    const DEFAULT_TIME = 25 * 60; // 25 minutes
    const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('focus'); // 'focus' | 'break'

    // --- Task State ---
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');

    // --- Session History State ---
    const [sessions, setSessions] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem('user'));

    // Formatting time
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Load sessions on mount
    useEffect(() => {
        if (user && user.id) {
            fetchSessions();
        }
    }, [user?.id]);

    const fetchSessions = async () => {
        try {
            const data = await getFocusSessions(user.id);
            setSessions(data);
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
        }
    };

    // Timer Effect
    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(time => time - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            handleTimerComplete();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const handleTimerComplete = async () => {
        setIsActive(false);

        // Play a simple sound (optional, assuming browser allows it without interaction if they started it)
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log("Audio play blocked", e));

        if (mode === 'focus') {
            await saveSessionToDb();
            // Switch to break
            setMode('break');
            setTimeLeft(5 * 60); // 5 minute break
        } else {
            // Switch back to focus
            setMode('focus');
            setTimeLeft(DEFAULT_TIME);
        }
    };

    const saveSessionToDb = async () => {
        if (!user || !user.id || isSaving) return;

        const completedTasksCount = tasks.filter(t => t.completed).length;

        // Let's assume the session was 25 minutes for this MVP. 
        // In a real app, you might track actual elapsed time if they quit early.
        const durationLogged = 25;

        setIsSaving(true);
        try {
            await saveFocusSession({
                userId: user.id,
                duration: durationLogged,
                completedTasks: completedTasksCount
            });
            await fetchSessions(); // Refresh list
        } catch (error) {
            console.error("Error saving session", error);
            alert("Failed to save session to stats.");
        } finally {
            setIsSaving(false);
        }
    };


    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(mode === 'focus' ? DEFAULT_TIME : 5 * 60);
    };

    const handleTaskAdd = (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;
        setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
        setNewTask('');
    };

    const toggleTask = (taskId) => {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
    };

    const deleteTask = (taskId) => {
        setTasks(tasks.filter(t => t.id !== taskId));
    };

    // Calculate stats
    const totalFocusTime = sessions.reduce((acc, curr) => acc + curr.duration, 0);
    const totalTasksFinished = sessions.reduce((acc, curr) => acc + curr.completedTasks, 0);

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-y-auto w-full">
                {/* Header */}
                <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 p-6 sticky top-0 z-10 w-full">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                Focus Room
                            </h1>
                            <p className="text-gray-400 mt-1">Deep work environment. Eliminate distractions.</p>
                        </div>
                    </div>
                </header>

                <main className="flex-1 max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">

                    {/* Left Column: Timer & Controls */}
                    <div className="lg:col-span-2 space-y-6 flex flex-col">

                        {/* Timer Card */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 lg:p-12 flex flex-col items-center justify-center relative overflow-hidden flex-1 min-h-[400px]">
                            {/* Decorative background shapes */}
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-to-br transition-all duration-1000 opacity-20 blur-3xl rounded-full ${mode === 'focus' ? 'from-purple-600 to-blue-600' : 'from-emerald-500 to-teal-500'}`} />

                            <div className="relative z-10 flex flex-col items-center">
                                {/* Mode Selector */}
                                <div className="flex bg-black/40 rounded-full p-1 mb-12 backdrop-blur-sm border border-white/10">
                                    <button
                                        onClick={() => { setMode('focus'); setIsActive(false); setTimeLeft(DEFAULT_TIME); }}
                                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${mode === 'focus' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Pomodoro
                                    </button>
                                    <button
                                        onClick={() => { setMode('break'); setIsActive(false); setTimeLeft(5 * 60); }}
                                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${mode === 'break' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Short Break
                                    </button>
                                </div>

                                {/* Timer Display */}
                                <div className="text-7xl md:text-9xl font-bold text-white tracking-widest tabular-nums font-mono drop-shadow-2xl mb-12">
                                    {formattedTime}
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-6">
                                    <button
                                        onClick={toggleTimer}
                                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95 ${isActive ? 'bg-white text-purple-900 border-4 border-white/20' : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-4 border-transparent'}`}
                                    >
                                        {isActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-2" />}
                                    </button>

                                    <button
                                        onClick={resetTimer}
                                        className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white backdrop-blur-md transition-all border border-white/10 hover:scale-105"
                                        title="Reset Timer"
                                    >
                                        <Square className="w-5 h-5 fill-current" />
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Tasks & Stats */}
                    <div className="space-y-6 flex flex-col">

                        {/* Tasks Card */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex-1 flex flex-col min-h-[350px]">
                            <div className="flex items-center gap-3 mb-6">
                                <CheckCircle2 className="w-6 h-6 text-blue-400" />
                                <h2 className="text-xl font-semibold text-white">Session Tasks</h2>
                            </div>

                            <form onSubmit={handleTaskAdd} className="mb-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={newTask}
                                        onChange={(e) => setNewTask(e.target.value)}
                                        placeholder="Add a task for this session..."
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pl-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newTask.trim()}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-purple-400 hover:text-white disabled:opacity-50 disabled:hover:text-purple-400 transition-colors"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>

                            <div className="flex-1 overflow-y-auto space-y-2 max-h-[250px] pr-2 scrollbar-thin scrollbar-thumb-white/10">
                                {tasks.length === 0 ? (
                                    <div className="text-center text-gray-500 mt-8">
                                        No tasks added yet.<br />What are you focusing on today?
                                    </div>
                                ) : (
                                    tasks.map(task => (
                                        <div key={task.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${task.completed ? 'bg-white/5 opacity-50' : 'bg-black/20 hover:bg-black/40'}`}>
                                            <button onClick={() => toggleTask(task.id)} className="text-gray-400 hover:text-purple-400 transition-colors flex-shrink-0">
                                                {task.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5" />}
                                            </button>
                                            <span className={`text-sm flex-1 break-words ${task.completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                                                {task.text}
                                            </span>
                                            <button
                                                onClick={() => deleteTask(task.id)}
                                                className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Stats Card */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Award className="w-5 h-5 text-purple-400" />
                                Focus Statistics
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                                    <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
                                        <Clock className="w-4 h-4" /> Time Focused
                                    </div>
                                    <div className="text-2xl font-bold text-white">
                                        {totalFocusTime >= 60 ? `${(totalFocusTime / 60).toFixed(1)}h` : `${totalFocusTime}m`}
                                    </div>
                                </div>
                                <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                                    <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
                                        <CalendarDays className="w-4 h-4" /> Sessions
                                    </div>
                                    <div className="text-2xl font-bold text-white">
                                        {sessions.length}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
};

export default FocusRoom;
