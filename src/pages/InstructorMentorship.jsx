import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InstructorSidebar from '../components/InstructorSidebar';
import { getCurrentUser } from '../services/authService';
import {
    CalendarDays,
    Save,
    CheckCircle2,
    XCircle,
    Clock
} from 'lucide-react';
import { getInstructorMentorProfile } from '../services/instructorMentorProfileService';
import {
    DEFAULT_WEEKLY_AVAILABILITY,
    getMentorWeeklyAvailability,
    HOURLY_SLOT_OPTIONS,
    saveMentorWeeklyAvailability,
    sortSlotsByHour,
    WEEK_DAYS,
} from '../services/mentorAvailabilityService';
import {
    acceptSessionRequest,
    declineSessionRequest,
    getMentorshipCallRoomId,
    getSessionRequestsForMentor,
    getSessionStartDateTime,
    getUpcomingSessionsForMentor,
    isSessionPast,
    isSessionJoinableNow,
    isSessionUpcomingOrJoinableNow,
} from '../services/mentorSessionService';

const dayLabels = {
    sun: 'Sunday',
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
};

const toTitleCase = (value = '') => {
    const normalized = String(value).trim();
    if (!normalized) return '';
    return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
};

const InstructorMentorship = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [weeklyAvailability, setWeeklyAvailability] = useState(DEFAULT_WEEKLY_AVAILABILITY);
    const [activePanel, setActivePanel] = useState('sessions');
    const [mentorRequests, setMentorRequests] = useState([]);
    const [mentorUpcoming, setMentorUpcoming] = useState([]);
    const [mentorName, setMentorName] = useState('');

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
                const profile = await getInstructorMentorProfile();
                const resolvedMentorName = profile?.name || currentUser.name;
                setMentorName(resolvedMentorName);

                const [availability, requests, upcoming] = await Promise.all([
                    getMentorWeeklyAvailability(),
                    getSessionRequestsForMentor(resolvedMentorName),
                    getUpcomingSessionsForMentor(resolvedMentorName),
                ]);

                setWeeklyAvailability(availability);
                setMentorRequests(requests);
                setMentorUpcoming(upcoming);
            } catch (error) {
                console.error('Failed to initialize instructor mentorship:', error);
            }
        };

        initialize();
    }, [navigate]);

    const parsedSessions = useMemo(
        () => mentorUpcoming
            .map((session) => {
                const startAt = getSessionStartDateTime(session?.dateLabel, session?.timeSlot);
                return {
                    ...session,
                    id: session.id || session._id || `${session.studentName}-${session.dateLabel}-${session.timeSlot}`,
                    student: session.studentName,
                    time: `${session.dateLabel}, ${session.timeSlot}`,
                    startAt,
                    canJoinNow: isSessionJoinableNow(session),
                };
            })
            .filter((session) => Boolean(session.startAt)),
        [mentorUpcoming]
    );

    const upcomingSessions = useMemo(() => {
        const now = new Date();
        return parsedSessions
            .filter((session) => isSessionUpcomingOrJoinableNow(session, now))
            .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
    }, [parsedSessions]);

    const recentSessions = useMemo(() => {
        const now = new Date();
        return parsedSessions
            .filter((session) => isSessionPast(session, now))
            .sort((a, b) => b.startAt.getTime() - a.startAt.getTime())
            .slice(0, 3);
    }, [parsedSessions]);

    const sessionRequests = mentorRequests.map((request) => ({
        id: request.id || request._id,
        student: request.studentName,
        subject: request.subject,
        preferred: `${request.dateLabel}, ${request.timeSlot}`,
        message: request.message,
    }));

    const refreshMentorSessionData = async () => {
        if (!mentorName) return;
        try {
            const [requests, upcoming] = await Promise.all([
                getSessionRequestsForMentor(mentorName),
                getUpcomingSessionsForMentor(mentorName),
            ]);
            setMentorRequests(requests);
            setMentorUpcoming(upcoming);
        } catch (error) {
            console.error('Failed to refresh mentor session data:', error);
        }
    };

    useEffect(() => {
        if (!mentorName) return undefined;

        const interval = setInterval(() => {
            refreshMentorSessionData();
        }, 2000);

        return () => clearInterval(interval);
    }, [mentorName]);

    const handleAcceptRequest = async (requestId) => {
        await acceptSessionRequest(requestId, mentorName);
        await refreshMentorSessionData();
    };

    const handleDeclineRequest = async (requestId) => {
        await declineSessionRequest(requestId, mentorName);
        await refreshMentorSessionData();
    };

    const handleTakeSession = (session) => {
        const callRoomId = getMentorshipCallRoomId(session);
        if (!callRoomId) {
            alert('Unable to start this session right now.');
            return;
        }

        navigate(`/mentorship-call/${encodeURIComponent(callRoomId)}`);
    };

    const toggleAllDays = (enable) => {
        const updated = WEEK_DAYS.reduce((acc, dayKey) => {
            acc[dayKey] = enable ? [...HOURLY_SLOT_OPTIONS] : [];
            return acc;
        }, {});
        setWeeklyAvailability(updated);
    };

    if (!user) return null;

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-[#0a0a0f] text-slate-900 dark:text-white font-sans transition-colors duration-300 overflow-hidden relative">
            
            {/* ── Background Ambience ── */}
            <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/5 dark:bg-[#8c30e8]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 dark:bg-[#8c30e8]/5 rounded-full blur-[120px]" />
            </div>

            <InstructorSidebar activeTab="mentorship" />

<<<<<<< HEAD
            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                
                {/* ── Top Bar ── */}
                <header className="bg-white/80 dark:bg-[#0f0a16]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 p-6 z-20 sticky top-0 transition-colors">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-slate-900 dark:text-white">
                                Instructor Mentorship
                            </h1>
                            <p className="text-sm font-medium text-slate-500 dark:text-gray-400 mt-1">
                                Manage your availability and student sessions
                            </p>
                        </div>
                    </div>
                </header>
=======
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 p-6">
                    <h1 className="text-3xl font-bold text-white">Instructor Mentorship</h1>
                    <p className="text-gray-400 mt-1">Guide learners with focused 1:1 sessions, shape their momentum, and track every milestone.</p>
                </div>
>>>>>>> 2847710994b1259fcef4f688b7892cf24fcdf658

                {/* ── Main Content ── */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <div className="max-w-6xl mx-auto space-y-6">
                        
                        {/* Tab Navigation */}
                        <div className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-sm rounded-xl p-1.5 flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 mb-6">
                            <button
                                onClick={() => setActivePanel('sessions')}
                                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold tracking-wide transition-all duration-200 ${
                                    activePanel === 'sessions'
                                        ? 'bg-purple-50 text-purple-600 dark:bg-[#8c30e8] dark:text-white shadow-sm'
                                        : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                                }`}
                            >
                                Sessions
                            </button>
                            <button
                                onClick={() => setActivePanel('requests')}
                                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold tracking-wide transition-all duration-200 ${
                                    activePanel === 'requests'
                                        ? 'bg-purple-50 text-purple-600 dark:bg-[#8c30e8] dark:text-white shadow-sm'
                                        : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                                }`}
                            >
                                Session Requests
                                {sessionRequests.length > 0 && (
                                    <span className="ml-2 px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 text-[10px]">
                                        {sessionRequests.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActivePanel('availability')}
                                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold tracking-wide transition-all duration-200 ${
                                    activePanel === 'availability'
                                        ? 'bg-purple-50 text-purple-600 dark:bg-[#8c30e8] dark:text-white shadow-sm'
                                        : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                                }`}
                            >
                                Availability
                            </button>
                        </div>

                        {/* ── Sessions Panel ── */}
                        {activePanel === 'sessions' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                {/* Upcoming Sessions */}
                                <div className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-sm rounded-2xl p-6">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Upcoming Sessions</h3>
                                    <div className="space-y-4">
                                        {upcomingSessions.map((session) => (
                                            <div key={session.id} className="bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl p-5 hover:border-purple-200 dark:hover:border-[#8c30e8]/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white text-base">{session.student}</p>
                                                    <p className="text-sm font-medium text-slate-500 dark:text-gray-400 mt-1">{session.subject}</p>
                                                    <div className="flex items-center gap-1.5 mt-2">
                                                        <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-[#8c30e8]" />
                                                        <p className="text-xs font-bold text-purple-600 dark:text-[#8c30e8]">{session.time}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                                    {session.canJoinNow ? (
                                                        <button
                                                            onClick={() => handleTakeSession(session)}
                                                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white transition-colors shadow-md"
                                                        >
                                                            Take Session
                                                        </button>
<<<<<<< HEAD
                                                    ) : (
                                                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 dark:bg-white/5 dark:text-gray-300 dark:border-white/10">
                                                            {session.status}
=======
                                                    )}
                                                    {!session.canJoinNow && (
                                                        <span className="px-3 py-1 rounded-lg text-xs bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                                                            {toTitleCase(session.status)}
>>>>>>> 2847710994b1259fcef4f688b7892cf24fcdf658
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {upcomingSessions.length === 0 && (
                                            <div className="rounded-xl p-8 border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 text-sm font-medium text-slate-500 dark:text-gray-400 text-center">
                                                No upcoming sessions yet. Accept student requests to schedule sessions.
                                            </div>
                                        )}
                                    </div>
                                </div>

<<<<<<< HEAD
                                {/* Recent Sessions */}
                                <div className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-sm rounded-2xl p-6">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Recent Sessions (Top 3)</h3>
                                    <div className="space-y-4">
=======
                                <div className="rounded-2xl p-5 border border-white/15 bg-white/10">
                                    <h3 className="text-white font-bold text-xl mb-4">Recent Sessions</h3>
                                    <div className="space-y-3">
>>>>>>> 2847710994b1259fcef4f688b7892cf24fcdf658
                                        {recentSessions.map((session) => (
                                            <div key={`recent-${session.id}`} className="bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl p-5 hover:border-slate-200 dark:hover:border-white/10 transition-all">
                                                <p className="font-bold text-slate-900 dark:text-white text-base">{session.student}</p>
                                                <p className="text-sm font-medium text-slate-500 dark:text-gray-400 mt-1">{session.subject}</p>
                                                <div className="flex items-center gap-1.5 mt-2">
                                                    <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500" />
                                                    <p className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">{session.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {recentSessions.length === 0 && (
                                            <div className="rounded-xl p-8 border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 text-sm font-medium text-slate-500 dark:text-gray-400 text-center">
                                                No recent sessions yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Requests Panel ── */}
                        {activePanel === 'requests' && (
                            <div className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-sm rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Session Requests</h3>
                                <div className="space-y-4">
                                    {sessionRequests.map((request) => (
                                        <div key={request.id} className="bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all hover:border-slate-200 dark:hover:border-white/10">
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-900 dark:text-white text-base">{request.student}</p>
                                                <p className="text-sm font-medium text-slate-500 dark:text-gray-400 mt-0.5">{request.subject}</p>
                                                <p className="text-xs font-bold text-purple-600 dark:text-[#8c30e8] mt-2">Preferred: {request.preferred}</p>
                                                <div className="text-sm text-slate-700 dark:text-gray-300 mt-3 italic bg-white dark:bg-[#1a1524] p-3 rounded-lg border border-slate-200 dark:border-white/5">
                                                    "{request.message}"
                                                </div>
                                            </div>
                                            <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto">
                                                <button 
                                                    onClick={() => handleAcceptRequest(request.id)} 
                                                    className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20 dark:hover:bg-green-500/20 text-sm font-bold transition-all flex items-center justify-center gap-1.5"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" /> Accept
                                                </button>
                                                <button 
                                                    onClick={() => handleDeclineRequest(request.id)} 
                                                    className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 dark:hover:bg-red-500/20 text-sm font-bold transition-all flex items-center justify-center gap-1.5"
                                                >
                                                    <XCircle className="w-4 h-4" /> Decline
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {sessionRequests.length === 0 && (
                                        <div className="rounded-xl p-10 border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 text-sm font-medium text-slate-500 dark:text-gray-400 text-center">
                                            No pending requests right now.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Availability Panel ── */}
                        {activePanel === 'availability' && (
                            <div className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-sm rounded-2xl p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/10">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <CalendarDays className="w-5 h-5 text-purple-600 dark:text-[#8c30e8]" /> 
                                        Set Availability (1-hour slots)
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            onClick={() => toggleAllDays(true)}
                                            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 text-sm font-bold transition-colors"
                                        >
                                            All Days Full Day
                                        </button>
                                        <button
                                            onClick={() => toggleAllDays(false)}
                                            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 text-sm font-bold transition-colors"
                                        >
                                            Clear All
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const saved = await saveMentorWeeklyAvailability(weeklyAvailability);
                                                    setWeeklyAvailability(saved);
                                                    alert('Availability saved and connected to student booking.');
                                                } catch (error) {
                                                    alert('Failed to save availability.');
                                                }
                                            }}
                                            className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white font-bold transition-colors shadow-md flex items-center gap-2 text-sm"
                                        >
                                            <Save className="w-4 h-4" /> Save
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {WEEK_DAYS.map((dayKey) => {
                                        const activeSlots = sortSlotsByHour(weeklyAvailability[dayKey] || []);
                                        const dayEnabled = activeSlots.length > 0;
                                        const fullDay = activeSlots.length === HOURLY_SLOT_OPTIONS.length;

                                        const toggleDay = () => {
                                            setWeeklyAvailability((prev) => ({
                                                ...prev,
                                                [dayKey]: dayEnabled ? [] : ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM'],
                                            }));
                                        };

                                        const toggleFullDay = () => {
                                            setWeeklyAvailability((prev) => ({
                                                ...prev,
                                                [dayKey]: fullDay ? [] : [...HOURLY_SLOT_OPTIONS],
                                            }));
                                        };

                                        const toggleSlot = (slot) => {
                                            setWeeklyAvailability((prev) => {
                                                const current = prev[dayKey] || [];
                                                const exists = current.includes(slot);
                                                return {
                                                    ...prev,
                                                    [dayKey]: exists ? current.filter((item) => item !== slot) : sortSlotsByHour([...current, slot]),
                                                };
                                            });
                                        };

                                        return (
                                            <div key={dayKey} className="rounded-2xl border border-slate-200 dark:border-white/10 p-5 bg-slate-50 dark:bg-black/20">
                                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                                                    <div className="text-slate-900 dark:text-white font-bold text-lg capitalize">{dayLabels[dayKey]}</div>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={toggleDay}
                                                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                                                                dayEnabled
                                                                    ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30'
                                                                    : 'bg-white border-slate-200 text-slate-500 dark:bg-white/5 dark:text-gray-400 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
                                                            }`}
                                                        >
                                                            {dayEnabled ? 'Available' : 'Unavailable'}
                                                        </button>
                                                        <button
                                                            onClick={toggleFullDay}
                                                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                                                                fullDay
                                                                    ? 'bg-purple-600 text-white border-purple-600 dark:bg-[#8c30e8] dark:border-[#8c30e8]'
                                                                    : 'bg-white border-slate-200 text-slate-500 dark:bg-white/5 dark:text-gray-400 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
                                                            }`}
                                                        >
                                                            {fullDay ? 'Full Day On' : 'Set Full Day'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {dayEnabled && (
                                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5">
                                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-3">
                                                            Select 1-hour slots ({activeSlots.length} selected)
                                                        </div>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                                                            {HOURLY_SLOT_OPTIONS.map((slot) => {
                                                                const selected = activeSlots.includes(slot);
                                                                return (
                                                                    <button
                                                                        key={`${dayKey}-${slot}`}
                                                                        onClick={() => toggleSlot(slot)}
                                                                        className={`px-3 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                                                                            selected
                                                                                ? 'bg-purple-600 text-white border-purple-600 dark:bg-[#8c30e8] dark:border-[#8c30e8] shadow-sm'
                                                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-[#1a1524] dark:text-gray-300 dark:border-white/10 dark:hover:bg-white/10'
                                                                        }`}
                                                                    >
                                                                        {slot}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default InstructorMentorship;