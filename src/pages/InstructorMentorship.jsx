import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InstructorSidebar from '../components/InstructorSidebar';
import { getCurrentUser } from '../services/authService';
import {
    CalendarDays,
    Save,
    CheckCircle2,
    XCircle,
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
        <div className="flex h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 overflow-hidden">
            <InstructorSidebar activeTab="mentorship" />

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 p-6">
                    <h1 className="text-3xl font-bold text-white">Instructor Mentorship</h1>
                    <p className="text-gray-400 mt-1">This area is separate from student mentorship. You can use mentorship tools now.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <button
                                onClick={() => setActivePanel('sessions')}
                                className={`rounded-xl px-4 py-3 font-semibold border transition-colors ${
                                    activePanel === 'sessions'
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent'
                                        : 'bg-white/10 text-gray-300 border-white/15 hover:bg-white/15'
                                }`}
                            >
                                Sessions
                            </button>
                            <button
                                onClick={() => setActivePanel('requests')}
                                className={`rounded-xl px-4 py-3 font-semibold border transition-colors ${
                                    activePanel === 'requests'
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent'
                                        : 'bg-white/10 text-gray-300 border-white/15 hover:bg-white/15'
                                }`}
                            >
                                Session Requests
                            </button>
                            <button
                                onClick={() => setActivePanel('availability')}
                                className={`rounded-xl px-4 py-3 font-semibold border transition-colors ${
                                    activePanel === 'availability'
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent'
                                        : 'bg-white/10 text-gray-300 border-white/15 hover:bg-white/15'
                                }`}
                            >
                                Availability
                            </button>
                        </div>

                        {activePanel === 'sessions' && (
                            <div className="space-y-5">
                                <div className="rounded-2xl p-5 border border-white/15 bg-white/10">
                                    <h3 className="text-white font-bold text-xl mb-4">Upcoming Sessions</h3>
                                    <div className="space-y-3">
                                        {upcomingSessions.map((session) => (
                                            <div key={session.id} className="rounded-xl p-4 border border-white/10 bg-black/20 flex items-center justify-between gap-4">
                                                <div>
                                                    <p className="text-white font-semibold">{session.student}</p>
                                                    <p className="text-purple-200 text-sm">{session.subject}</p>
                                                    <p className="text-gray-400 text-sm mt-1">{session.time} • {session.mode}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    {session.canJoinNow && (
                                                        <button
                                                            onClick={() => handleTakeSession(session)}
                                                            className="px-3 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
                                                        >
                                                            Take Session
                                                        </button>
                                                    )}
                                                    {!session.canJoinNow && (
                                                        <span className="px-3 py-1 rounded-lg text-xs bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                                                            {session.status}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {upcomingSessions.length === 0 && (
                                            <div className="rounded-xl p-4 border border-white/10 bg-black/20 text-sm text-gray-300">
                                                No upcoming sessions yet. Accept student requests to schedule sessions.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-2xl p-5 border border-white/15 bg-white/10">
                                    <h3 className="text-white font-bold text-xl mb-4">Recent Sessions (Top 3)</h3>
                                    <div className="space-y-3">
                                        {recentSessions.map((session) => (
                                            <div key={`recent-${session.id}`} className="rounded-xl p-4 border border-white/10 bg-black/20">
                                                <p className="text-white font-semibold">{session.student}</p>
                                                <p className="text-purple-200 text-sm">{session.subject}</p>
                                                <p className="text-gray-400 text-sm mt-1">{session.time} • {session.mode || 'Video'}</p>
                                            </div>
                                        ))}
                                        {recentSessions.length === 0 && (
                                            <div className="rounded-xl p-4 border border-white/10 bg-black/20 text-sm text-gray-300">
                                                No recent sessions yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activePanel === 'requests' && (
                            <div className="rounded-2xl p-5 border border-white/15 bg-white/10">
                                <h3 className="text-white font-bold text-xl mb-4">Session Requests</h3>
                                <div className="space-y-3">
                                    {sessionRequests.map((request) => (
                                        <div key={request.id} className="rounded-xl p-4 border border-white/10 bg-black/20">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-white font-semibold">{request.student}</p>
                                                    <p className="text-purple-200 text-sm">{request.subject}</p>
                                                    <p className="text-gray-400 text-sm mt-1">Preferred: {request.preferred}</p>
                                                    <p className="text-gray-300 text-sm mt-2 italic">"{request.message}"</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleAcceptRequest(request.id)} className="px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/30">
                                                        <CheckCircle2 className="w-4 h-4 inline mr-1" /> Accept
                                                    </button>
                                                    <button onClick={() => handleDeclineRequest(request.id)} className="px-3 py-2 rounded-lg bg-red-500/20 border border-red-400/30 text-red-300 hover:bg-red-500/30">
                                                        <XCircle className="w-4 h-4 inline mr-1" /> Decline
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {sessionRequests.length === 0 && (
                                        <div className="rounded-xl p-4 border border-white/10 bg-black/20 text-sm text-gray-300">
                                            No pending requests right now.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activePanel === 'availability' && (
                            <div className="rounded-2xl p-5 border border-white/15 bg-white/10 space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <h3 className="text-white font-bold text-xl">
                                        <CalendarDays className="w-5 h-5 inline mr-2 text-purple-300" /> Set Availability (1-hour slots)
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleAllDays(true)}
                                            className="px-3 py-2 rounded-lg border border-white/15 text-gray-200 bg-white/10 hover:bg-white/20 text-sm"
                                        >
                                            All Days Full Day
                                        </button>
                                        <button
                                            onClick={() => toggleAllDays(false)}
                                            className="px-3 py-2 rounded-lg border border-white/15 text-gray-200 bg-white/10 hover:bg-white/20 text-sm"
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
                                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:from-blue-600 hover:to-purple-700"
                                        >
                                            <Save className="w-4 h-4 inline mr-2" /> Save
                                        </button>
                                    </div>
                                </div>

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
                                        <div key={dayKey} className="rounded-xl border border-white/10 p-4 bg-black/20">
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                                                <div className="text-white font-semibold">{dayLabels[dayKey]}</div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={toggleDay}
                                                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                                                            dayEnabled
                                                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                                                                : 'bg-white/10 text-gray-300 border-white/15'
                                                        }`}
                                                    >
                                                        {dayEnabled ? 'Available' : 'Unavailable'}
                                                    </button>
                                                    <button
                                                        onClick={toggleFullDay}
                                                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                                                            fullDay
                                                                ? 'bg-purple-600 text-white border-purple-500'
                                                                : 'bg-white/10 text-gray-300 border-white/15'
                                                        }`}
                                                    >
                                                        {fullDay ? 'Full Day On' : 'Set Full Day'}
                                                    </button>
                                                </div>
                                            </div>

                                            {dayEnabled && (
                                                <>
                                                    <div className="text-xs text-gray-400 mb-2">
                                                        Select 1-hour slots ({activeSlots.length} selected)
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                                        {HOURLY_SLOT_OPTIONS.map((slot) => {
                                                            const selected = activeSlots.includes(slot);
                                                            return (
                                                                <button
                                                                    key={`${dayKey}-${slot}`}
                                                                    onClick={() => toggleSlot(slot)}
                                                                    className={`px-2.5 py-1.5 rounded-lg text-xs border ${
                                                                        selected
                                                                            ? 'bg-purple-600 text-white border-purple-500'
                                                                            : 'bg-white/5 text-gray-300 border-white/10'
                                                                    }`}
                                                                >
                                                                    {slot}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstructorMentorship;
