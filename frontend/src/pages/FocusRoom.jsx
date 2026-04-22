import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { Play, Pause, Square, CheckCircle2, Circle, Plus, Trash2, Clock, CalendarDays, Award, Sparkles, Check, RotateCcw } from 'lucide-react';
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

    // Progress Calculations for Circular Timer
    const totalSeconds = mode === 'focus' ? DEFAULT_TIME : 5 * 60;
    const progressPercent = ((totalSeconds - timeLeft) / totalSeconds) * 100;
    const circumference = 2 * Math.PI * 46;

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

        // Play a simple sound
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
        <div className="flex h-screen bg-background dark:bg-[#0a0a0f] text-foreground dark:text-white font-sans relative overflow-hidden">
            {/* Background accent glow */}
            <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
                <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-purple-500/10 dark:bg-[#8c30e8]/10 blur-[120px]" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-blue-500/10 dark:bg-purple-900/10 blur-[100px]" />
            </div>

            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden w-full z-10 relative">
                
                {/* Header */}
                <div className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.06] p-4 shrink-0 z-20">
                    <div className="flex items-center gap-3 max-w-7xl mx-auto px-2">
                        <div className="p-2.5 bg-purple-50 text-purple-600 dark:bg-[#8c30e8]/20 dark:text-[#8c30e8] rounded-xl shadow-sm">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-wide text-slate-900 dark:text-white">Focus Room</h1>
                            <p className="text-xs font-bold tracking-wider text-slate-500 dark:text-gray-400 uppercase">Deep Work Environment</p>
                        </div>
                    </div>
                </div>

                <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Left Column: Timer & Controls */}
                        <div className="lg:col-span-7 flex flex-col">
                            <div className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-sm rounded-3xl p-8 lg:p-12 flex flex-col items-center justify-center relative overflow-hidden flex-1 min-h-[500px]">
                                
                                {/* Mode Selector */}
                                <div className="flex bg-slate-100 dark:bg-black/40 rounded-full p-1.5 mb-12 border border-slate-200 dark:border-white/10 relative z-10 shadow-sm">
                                    <button
                                        onClick={() => { setMode('focus'); setIsActive(false); setTimeLeft(DEFAULT_TIME); }}
                                        className={`px-8 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all ${mode === 'focus' ? 'bg-white dark:bg-[#8c30e8] text-purple-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}
                                    >
                                        Pomodoro
                                    </button>
                                    <button
                                        onClick={() => { setMode('break'); setIsActive(false); setTimeLeft(5 * 60); }}
                                        className={`px-8 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all ${mode === 'break' ? 'bg-white dark:bg-[#8c30e8] text-purple-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}
                                    >
                                        Short Break
                                    </button>
                                </div>

                                {/* Circular SVG Timer */}
                                <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mb-12">
                                    <div
                                        className={`absolute inset-0 rounded-full transition-all duration-700
                                        ${isActive
                                            ? "bg-gradient-to-tr from-purple-500/15 to-pink-400/20 dark:from-[#8c30e8]/20 dark:to-purple-500/15 blur-2xl scale-110"
                                            : "bg-gradient-to-tr from-purple-500/5 to-pink-400/10 dark:from-[#8c30e8]/5 dark:to-purple-400/10 blur-2xl"
                                        }`}
                                    />
                                    <svg className="w-full h-full -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="48" fill="transparent" className="stroke-slate-100 dark:stroke-white/5" strokeWidth="0.5" />
                                        <circle cx="50" cy="50" r="46" fill="none" className="stroke-slate-200 dark:stroke-purple-500/10" strokeWidth="1.5" />
                                        <circle
                                            cx="50" cy="50" r="46" fill="none" stroke="url(#timerGrad)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progressPercent / 100)} className="transition-all duration-1000 ease-linear"
                                        />
                                        <defs>
                                            <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#8c30e8" />
                                                <stop offset="100%" stopColor="#ec4899" />
                                            </linearGradient>
                                        </defs>
                                    </svg>

                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-6xl md:text-8xl font-light tracking-tighter text-slate-900 dark:text-white drop-shadow-sm font-mono">
                                            {formattedTime}
                                        </span>
                                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400/60 uppercase tracking-[0.2em] mt-2">
                                            {isActive ? (mode === 'focus' ? "Focusing…" : "On Break…") : timeLeft === 0 ? "Session Complete" : mode}
                                        </span>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-6 relative z-10">
                                    <button
                                        onClick={resetTimer}
                                        className="w-14 h-14 rounded-full bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-purple-600 flex items-center justify-center transition-all border border-slate-200 dark:border-white/10 shadow-sm"
                                        title="Reset Timer"
                                    >
                                        <RotateCcw size={20} />
                                    </button>

                                    <button
                                        onClick={toggleTimer}
                                        className={`h-16 px-10 rounded-2xl font-bold tracking-wide text-lg flex items-center gap-3 transition-all
                                        ${isActive
                                            ? "bg-purple-50 dark:bg-white/10 hover:bg-purple-100 dark:hover:bg-white/15 text-purple-600 dark:text-white shadow-sm border border-purple-200 dark:border-transparent"
                                            : "bg-purple-600 dark:bg-[#8c30e8] text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-1"
                                        }`}
                                    >
                                        {isActive ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-1" />}
                                        {isActive ? "Pause" : "Start Session"}
                                    </button>

                                    <button
                                        onClick={() => { setTimeLeft(0); handleTimerComplete(); }}
                                        disabled={timeLeft === 0}
                                        className="w-14 h-14 rounded-full bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-purple-600 flex items-center justify-center transition-all border border-slate-200 dark:border-white/10 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Skip Session"
                                    >
                                        <Square size={18} className="fill-current" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Tasks & Stats */}
                        <div className="lg:col-span-5 space-y-6 flex flex-col">

                            {/* Tasks Card */}
                            <div className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 rounded-2xl p-6 flex-1 flex flex-col min-h-[350px] shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                                            <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide">Session Tasks</h2>
                                    </div>
                                </div>

                                <form onSubmit={handleTaskAdd} className="mb-5">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={newTask}
                                            onChange={(e) => setNewTask(e.target.value)}
                                            placeholder="Add a task for this session..."
                                            className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 pl-4 pr-12 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8]/20 transition-all text-sm font-medium"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newTask.trim()}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-purple-600 dark:text-[#8c30e8] hover:text-purple-700 dark:hover:text-white disabled:opacity-50 transition-colors bg-purple-50 dark:bg-[#8c30e8]/20 rounded-lg"
                                        >
                                            <Plus className="w-4 h-4 stroke-[3]" />
                                        </button>
                                    </div>
                                </form>

                                <div className="flex-1 overflow-y-auto space-y-3 max-h-[300px] pr-2 custom-scrollbar">
                                    {tasks.length === 0 ? (
                                        <div className="text-center text-slate-500 dark:text-gray-500 mt-10 text-sm font-medium">
                                            No tasks added yet.<br />What are you focusing on today?
                                        </div>
                                    ) : (
                                        tasks.map(task => (
                                            <div key={task.id} className="group">
                                                <div className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-white/5 bg-slate-50 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.04] transition-all">
                                                    <button 
                                                        onClick={() => toggleTask(task.id)} 
                                                        className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-white/20 flex items-center justify-center cursor-pointer hover:border-purple-500 dark:hover:border-[#8c30e8] transition-colors shrink-0 bg-white dark:bg-transparent"
                                                    >
                                                        {task.completed && <Check size={12} className="text-purple-600 dark:text-[#8c30e8] stroke-[3]" />}
                                                    </button>
                                                    
                                                    <span className={`text-sm font-medium flex-1 break-words transition-colors ${task.completed ? 'text-slate-400 dark:text-gray-500 line-through' : 'text-slate-700 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-[#8c30e8]'}`}>
                                                        {task.text}
                                                    </span>
                                                    
                                                    <button
                                                        onClick={() => deleteTask(task.id)}
                                                        className="text-slate-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Stats Card */}
                            <div className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg">
                                        <Award className="w-5 h-5 text-purple-600 dark:text-[#8c30e8]" />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide">
                                        Focus Statistics
                                    </h2>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 dark:bg-black/20 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                                            <Clock className="w-3.5 h-3.5 text-purple-500" /> Time Focused
                                        </div>
                                        <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                            {totalFocusTime >= 60 ? `${(totalFocusTime / 60).toFixed(1)}h` : `${totalFocusTime}m`}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-black/20 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                                            <CalendarDays className="w-3.5 h-3.5 text-pink-500" /> Sessions
                                        </div>
                                        <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                            {sessions.length}
                                        </div>
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