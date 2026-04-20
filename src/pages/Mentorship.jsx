import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
    Search,
    SlidersHorizontal,
    Star,
    X,
    ChevronLeft,
    ChevronRight,
    Bell,
    CalendarDays,
    CheckCircle2,
    Video,
    MessageSquare,
    Sparkles,
} from 'lucide-react';
import {
    DEFAULT_WEEKLY_AVAILABILITY,
    getMentorAvailabilityByName,
    getWeekdayKeyFromDate,
    getSlotsForDateFromAvailability,
    HOURLY_SLOT_OPTIONS,
    sortSlotsByHour,
} from '../services/mentorAvailabilityService';
import { getMentorsForStudents } from '../services/instructorMentorProfileService';
import {
    createSessionRequest,
    getMentorshipCallRoomId,
    getSessionStartDateTime,
    isSessionPast,
    isSessionJoinableNow,
    isSessionUpcomingOrJoinableNow,
    getUpcomingSessionsForStudent,
    isMentorBusyAt,
} from '../services/mentorSessionService';

const getInitials = (name = 'Mentor') => name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'ME';

const getMentorTags = (specializedCourses = '') => String(specializedCourses)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const dayLabelMap = {
    sun: 'Sunday',
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
};

const Mentorship = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All Mentors');
    const [bookingMentor, setBookingMentor] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState('');
    const [viewMonthIndex, setViewMonthIndex] = useState(new Date().getMonth());
    const [viewYear, setViewYear] = useState(new Date().getFullYear());
    const [sessionVersion, setSessionVersion] = useState(0);
    const [showInstantModal, setShowInstantModal] = useState(false);
    const [featuredSessions, setFeaturedSessions] = useState([]);
    const [mentorProfiles, setMentorProfiles] = useState([]);
    const [mentorAvailabilityMap, setMentorAvailabilityMap] = useState({});
    const [instantAvailableMentors, setInstantAvailableMentors] = useState([]);

    const sessionTimeline = useMemo(
        () => featuredSessions
            .map((session) => {
                const startAt = getSessionStartDateTime(session?.dateLabel, session?.timeSlot);
                return {
                    ...session,
                    startAt,
                    mentor: session.mentorName,
                    topic: session.subject,
                    time: `${session.dateLabel}, ${session.timeSlot}`,
                    canJoinNow: isSessionJoinableNow(session),
                };
            })
            .filter((session) => Boolean(session.startAt)),
        [featuredSessions]
    );

    const featuredSessionCards = useMemo(() => {
        const now = new Date();
        return sessionTimeline
            .filter((session) => isSessionUpcomingOrJoinableNow(session, now))
            .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
    }, [sessionTimeline]);

    const recentSessionCards = useMemo(() => {
        const now = new Date();
        return sessionTimeline
            .filter((session) => isSessionPast(session, now))
            .sort((a, b) => b.startAt.getTime() - a.startAt.getTime())
            .slice(0, 3);
    }, [sessionTimeline]);

    useEffect(() => {
        const loadMentorshipData = async () => {
            try {
                const mentors = await getMentorsForStudents();
                const safeMentors = Array.isArray(mentors) ? mentors : [];
                setMentorProfiles(safeMentors);

                const availabilityEntries = await Promise.all(
                    safeMentors
                        .filter((profile) => Boolean(profile?.name))
                        .map(async (profile) => {
                            try {
                                const availability = await getMentorAvailabilityByName(profile.name);
                                return [profile.name, availability];
                            } catch (error) {
                                return [profile.name, DEFAULT_WEEKLY_AVAILABILITY];
                            }
                        })
                );

                const availabilityByMentorName = {};
                availabilityEntries.forEach(([mentorName, availability]) => {
                    availabilityByMentorName[mentorName] = availability;
                });
                setMentorAvailabilityMap(availabilityByMentorName);

                const sessions = await getUpcomingSessionsForStudent();
                setFeaturedSessions(Array.isArray(sessions) ? sessions : []);
            } catch (error) {
                console.error('Failed to load mentorship data:', error);
                setMentorProfiles([]);
                setMentorAvailabilityMap({});
            }
        };

        loadMentorshipData();
    }, [sessionVersion]);

    const mentorsForListing = useMemo(() => {
        return mentorProfiles
            .filter((profile) => Boolean(profile?.name))
            .map((profile) => {
                const tags = getMentorTags(profile.specializedCourses);
                const category = tags[0] || 'General';
                const availability = mentorAvailabilityMap[profile.name] || DEFAULT_WEEKLY_AVAILABILITY;
                const hasAvailability = Object.values(availability).some(
                    (slots) => Array.isArray(slots) && slots.length > 0
                );

                return {
                    id: profile._id || profile.mentor || profile.name,
                    mentorId: profile.mentor || null,
                    name: profile.name,
                    initials: getInitials(profile.name),
                    title: `${category} Mentor`,
                    bio: profile.description || 'No mentor description provided yet.',
                    category,
                    tags: tags.length > 0 ? tags : ['Mentorship'],
                    rating: typeof profile.rating === 'number' ? profile.rating : null,
                    sessions: typeof profile.sessionsCount === 'number' ? profile.sessionsCount : null,
                    rate: typeof profile.rate === 'number' ? profile.rate : null,
                    active: hasAvailability,
                    status: profile.status || 'pending',
                    availability,
                };
            });
    }, [mentorProfiles, mentorAvailabilityMap]);

    const categories = useMemo(() => {
        const categorySet = new Set(
            mentorsForListing
                .map((mentor) => mentor.category)
                .filter(Boolean)
        );

        return ['All Mentors', ...Array.from(categorySet)];
    }, [mentorsForListing]);

    useEffect(() => {
        if (!categories.includes(activeCategory)) {
            setActiveCategory('All Mentors');
        }
    }, [activeCategory, categories]);

    const filteredMentors = useMemo(() => {
        const normalized = query.trim().toLowerCase();

        return mentorsForListing.filter((mentor) => {
            const categoryMatch = activeCategory === 'All Mentors' || mentor.category === activeCategory;

            if (!normalized) return categoryMatch;

            const searchBlob = [
                mentor.name,
                mentor.title,
                mentor.bio,
                mentor.category,
                mentor.tags.join(' '),
            ]
                .join(' ')
                .toLowerCase();

            return categoryMatch && searchBlob.includes(normalized);
        });
    }, [query, activeCategory, mentorsForListing]);

    const buildNowContext = () => {
        const now = new Date();
        const currentSlot = HOURLY_SLOT_OPTIONS[now.getHours()];
        const dateLabel = `${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

        return {
            now,
            currentSlot,
            dateLabel,
        };
    };

    const [nowContext, setNowContext] = useState(() => buildNowContext());

    const refreshInstantAvailableMentors = async (context = buildNowContext()) => {
        try {
            const candidates = mentorsForListing.filter((mentor) => {
                const todaySlots = getSlotsForDateFromAvailability(
                    mentor.availability,
                    context.now.getDate(),
                    context.now.getFullYear(),
                    context.now.getMonth()
                );

                return todaySlots.includes(context.currentSlot);
            });

            const busyChecks = await Promise.all(
                candidates.map(async (mentor) => {
                    const busy = await isMentorBusyAt(mentor.name, context.dateLabel, context.currentSlot);
                    return { mentor, busy };
                })
            );

            setInstantAvailableMentors(busyChecks.filter((item) => !item.busy).map((item) => item.mentor));
        } catch (error) {
            console.error('Failed to refresh instant mentors:', error);
            setInstantAvailableMentors([]);
        }
    };

    const closeBookingModal = () => {
        setBookingMentor(null);
        setSelectedDate(null);
        setSelectedTime('');
    };

    const openBookingModal = async (mentor) => {
        if (mentor?.name && !mentorAvailabilityMap[mentor.name]) {
            try {
                const availability = await getMentorAvailabilityByName(mentor.name);
                setMentorAvailabilityMap((prev) => ({
                    ...prev,
                    [mentor.name]: availability,
                }));
            } catch (error) {
                setMentorAvailabilityMap((prev) => ({
                    ...prev,
                    [mentor.name]: DEFAULT_WEEKLY_AVAILABILITY,
                }));
            }
        }

        setBookingMentor(mentor);
        const now = new Date();
        setViewMonthIndex(now.getMonth());
        setViewYear(now.getFullYear());
        setSelectedDate(null);
        setSelectedTime('');
    };

    const handleOpenInstantModal = async () => {
        const context = buildNowContext();
        setNowContext(context);
        await refreshInstantAvailableMentors(context);
        setShowInstantModal(true);
    };

    const handleCloseInstantModal = () => {
        setShowInstantModal(false);
    };

    const handleRequestInstantSession = async (mentor) => {
        try {
            await createSessionRequest({
                mentorName: mentor.name,
                mentorId: mentor.mentorId,
                subject: mentor.category,
                dateLabel: nowContext.dateLabel,
                timeSlot: nowContext.currentSlot,
                message: `Instant session request for ${mentor.category}`,
            });

            alert(`Instant request sent to ${mentor.name} for ${nowContext.currentSlot}.`);
            await refreshInstantAvailableMentors();
            setSessionVersion((prev) => prev + 1);
        } catch (error) {
            alert(error?.response?.data?.msg || 'Failed to send instant request.');
        }
    };

    const handleJoinSession = (session) => {
        const callRoomId = getMentorshipCallRoomId(session);
        if (!callRoomId) {
            alert('Unable to join this session right now.');
            return;
        }

        navigate(`/mentorship-call/${encodeURIComponent(callRoomId)}`);
    };

    const handleConfirmBooking = async () => {
        if (!bookingMentor || !selectedDate || !selectedTime) return;

        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const selectedDateObj = new Date(viewYear, viewMonthIndex, selectedDate);
        if (selectedDateObj < todayStart) {
            alert('Past dates cannot be booked. Please select today or a future date.');
            return;
        }

        try {
            await createSessionRequest({
                mentorName: bookingMentor.name,
                mentorId: bookingMentor.mentorId,
                subject: bookingMentor.category,
                dateLabel: `${monthNames[viewMonthIndex]} ${selectedDate}, ${viewYear}`,
                timeSlot: selectedTime,
                message: `Session request for ${bookingMentor.category}`,
            });

            alert(`Session request sent to ${bookingMentor.name}.`);
            closeBookingModal();
            setSessionVersion((prev) => prev + 1);
        } catch (error) {
            alert(error?.response?.data?.msg || 'Failed to create session request.');
        }
    };

    const daysInViewMonth = useMemo(() => new Date(viewYear, viewMonthIndex + 1, 0).getDate(), [viewMonthIndex, viewYear]);
    const firstWeekdayOfMonth = useMemo(() => new Date(viewYear, viewMonthIndex, 1).getDay(), [viewMonthIndex, viewYear]);

    const calendarCells = useMemo(() => {
        const cells = [];
        for (let i = 0; i < firstWeekdayOfMonth; i += 1) cells.push(null);
        for (let day = 1; day <= daysInViewMonth; day += 1) cells.push(day);
        while (cells.length % 7 !== 0) cells.push(null);
        return cells;
    }, [daysInViewMonth, firstWeekdayOfMonth]);

    const selectedMentorAvailability = useMemo(() => {
        if (!bookingMentor?.name) return DEFAULT_WEEKLY_AVAILABILITY;

        return mentorAvailabilityMap[bookingMentor.name]
            || bookingMentor.availability
            || DEFAULT_WEEKLY_AVAILABILITY;
    }, [bookingMentor, mentorAvailabilityMap]);

    const selectedMentorWeeklySlotsCount = useMemo(
        () => Object.values(selectedMentorAvailability).reduce(
            (total, slots) => total + (Array.isArray(slots) ? slots.length : 0),
            0
        ),
        [selectedMentorAvailability]
    );

    const availableSlots = useMemo(
        () => getSlotsForDateFromAvailability(selectedMentorAvailability, selectedDate, viewYear, viewMonthIndex),
        [selectedMentorAvailability, selectedDate, viewYear, viewMonthIndex]
    );
    const selectedDayKey = useMemo(
        () => getWeekdayKeyFromDate(selectedDate, viewYear, viewMonthIndex),
        [selectedDate, viewYear, viewMonthIndex]
    );
    const availableHourlySlots = useMemo(
        () => sortSlotsByHour(HOURLY_SLOT_OPTIONS.filter((slot) => availableSlots.includes(slot))),
        [availableSlots]
    );

    const goToPrevMonth = () => {
        setSelectedDate(null);
        setSelectedTime('');
        setViewMonthIndex((prev) => {
            if (prev === 0) {
                setViewYear((year) => year - 1);
                return 11;
            }
            return prev - 1;
        });
    };

    const goToNextMonth = () => {
        setSelectedDate(null);
        setSelectedTime('');
        setViewMonthIndex((prev) => {
            if (prev === 11) {
                setViewYear((year) => year + 1);
                return 0;
            }
            return prev + 1;
        });
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Mentorship Hub</h1>
                                <p className="text-sm text-gray-300">Find the right mentor, faster</p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <button className="relative p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors">
                                <Bell className="w-5 h-5 text-gray-200" />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <section className="rounded-3xl border border-white/15 bg-gradient-to-r from-white/10 via-white/5 to-transparent p-6 text-center">
                            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
                                Find Your Mentor
                            </h2>
                            <p className="text-gray-300 max-w-3xl mx-auto mt-3 text-base md:text-lg">
                                Connect with top scholars and industry experts to accelerate your learning journey.
                            </p>

                            <div className="mt-6 max-w-5xl mx-auto">
                                <div className="rounded-2xl bg-white/10 border border-white/15 shadow-xl shadow-purple-500/10 px-4 py-3 flex items-center gap-3">
                                    <Search className="w-5 h-5 text-gray-300" />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search by subject, name, or expertise..."
                                        className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
                                    />
                                    <button className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 grid place-items-center transition-colors">
                                        <SlidersHorizontal className="w-5 h-5 text-gray-200" />
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-white/10 bg-black/10 p-3 overflow-x-auto">
                            <div className="flex items-center gap-3 min-w-max">
                                {categories.map((category) => {
                                    const active = activeCategory === category;
                                    return (
                                        <button
                                            key={category}
                                            onClick={() => setActiveCategory(category)}
                                            className={`px-6 py-3 rounded-full font-semibold text-sm border transition-all ${
                                                active
                                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-transparent text-white shadow-lg shadow-purple-500/30'
                                                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                            }`}
                                        >
                                            {category}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                            <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                                {filteredMentors.map((mentor) => (
                                    <article
                                        key={mentor.id}
                                        className="rounded-2xl bg-white/10 border border-white/15 p-5 backdrop-blur-lg shadow-xl flex flex-col"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="relative">
                                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-extrabold grid place-items-center border border-white/20">
                                                    {mentor.initials}
                                                </div>
                                                <span
                                                    className={`absolute bottom-1 right-0 w-5 h-5 rounded-full border-2 border-gray-900 ${
                                                        mentor.active ? 'bg-emerald-400' : 'bg-gray-400'
                                                    }`}
                                                />
                                            </div>

                                            {mentor.rating !== null ? (
                                                <div className="px-3 py-1.5 rounded-xl bg-yellow-500/20 border border-yellow-400/30 text-yellow-200 font-semibold flex items-center gap-1 text-sm">
                                                    <Star className="w-4 h-4 fill-current" /> {mentor.rating}
                                                </div>
                                            ) : (
                                                <div className="px-3 py-1.5 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-200 font-semibold text-sm capitalize">
                                                    {mentor.status}
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="text-2xl font-bold text-white leading-tight">{mentor.name}</h3>
                                        <p className="text-purple-300 font-semibold mt-1 text-lg">{mentor.title}</p>
                                        <p className="text-gray-300 mt-3 leading-relaxed min-h-[64px] text-sm md:text-base">{mentor.bio}</p>

                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {mentor.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="px-3 py-1 rounded-full text-xs bg-white/10 border border-white/10 text-gray-200"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-white/10 flex items-end justify-between gap-3">
                                            <div>
                                                <div className="text-gray-400 text-xs">Rate</div>
                                                {mentor.rate !== null ? (
                                                    <div className="text-2xl font-bold text-white">
                                                        ${mentor.rate}
                                                        <span className="text-base text-gray-400 font-medium">/hr</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm font-semibold text-gray-300">Not specified</div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors">
                                                    <MessageSquare className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openBookingModal(mentor)}
                                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-purple-500/30 transition-all"
                                                >
                                                    Book Session
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}

                                {filteredMentors.length === 0 && (
                                    <div className="md:col-span-2 rounded-2xl p-8 text-center border border-white/10 bg-white/5 text-gray-300">
                                        No mentors found for this filter. Try another category or search keyword.
                                    </div>
                                )}
                            </div>

                            <aside className="space-y-6">
                                <div className="rounded-3xl bg-white/10 border border-white/15 backdrop-blur-lg p-6">
                                    <h3 className="text-xl font-bold text-white mb-4">Your Upcoming Sessions</h3>
                                    <div className="space-y-3">
                                        {featuredSessionCards.map((item) => (
                                            <div
                                                key={`${item.mentor}-${item.time}`}
                                                className="rounded-xl border border-white/10 bg-white/5 p-4"
                                            >
                                                <div className="text-white font-semibold">{item.mentor}</div>
                                                <div className="text-sm text-purple-300 mt-1">{item.topic}</div>
                                                <div className="mt-3 flex items-center justify-between text-xs text-gray-300">
                                                    <span className="flex items-center gap-1">
                                                        <CalendarDays className="w-3.5 h-3.5" /> {item.time}
                                                    </span>
                                                    {item.canJoinNow ? (
                                                        <span className="px-2 py-1 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300">
                                                            Live Now
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                                                            Scheduled
                                                        </span>
                                                    )}
                                                </div>
                                                {item.canJoinNow && (
                                                    <button
                                                        onClick={() => handleJoinSession(item)}
                                                        className="mt-3 w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold py-2 hover:from-emerald-600 hover:to-teal-600 transition-colors"
                                                    >
                                                        Join Session
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {featuredSessionCards.length === 0 && (
                                            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
                                                No upcoming sessions yet. Book a session and wait for mentor acceptance.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-3xl bg-white/10 border border-white/15 backdrop-blur-lg p-6">
                                    <h3 className="text-xl font-bold text-white mb-4">Recent Sessions (Top 3)</h3>
                                    <div className="space-y-3">
                                        {recentSessionCards.map((session) => (
                                            <div
                                                key={`recent-${session._id || session.id || session.time}`}
                                                className="rounded-xl border border-white/10 bg-white/5 p-4"
                                            >
                                                <div className="text-white font-semibold">{session.mentor}</div>
                                                <div className="text-sm text-purple-300 mt-1">{session.topic}</div>
                                                <div className="mt-2 text-xs text-gray-300">{session.time}</div>
                                            </div>
                                        ))}
                                        {recentSessionCards.length === 0 && (
                                            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
                                                No recent sessions yet.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-3xl bg-white/10 border border-white/15 backdrop-blur-lg p-6">
                                    <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
                                    <div className="space-y-3">
                                        <button
                                            onClick={handleOpenInstantModal}
                                            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 flex items-center justify-center gap-2 hover:from-blue-600 hover:to-purple-700 transition-all"
                                        >
                                            <Video className="w-4 h-4" /> Start Instant Session
                                        </button>
                                    </div>
                                </div>
                            </aside>
                        </section>
                    </div>
                </main>
            </div>

            {bookingMentor && (
                <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm p-3 md:p-6">
                    <div className="h-full w-full max-w-6xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                <CalendarDays className="w-6 h-6 text-purple-600" /> Schedule a Session
                            </h3>
                            <button
                                onClick={closeBookingModal}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                            >
                                <X className="w-7 h-7" />
                            </button>
                        </div>

                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
                            <div className="p-6 border-r border-gray-200 overflow-y-auto">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl font-bold grid place-items-center shadow-lg">
                                        {bookingMentor.initials}
                                    </div>
                                    <h4 className="mt-4 text-4xl font-extrabold text-gray-800">{bookingMentor.name}</h4>
                                    <p className="text-gray-600 text-xl mt-1">{bookingMentor.title}</p>
                                    <p className="mt-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-600 text-lg font-semibold inline-flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                        {selectedMentorWeeklySlotsCount > 0 ? 'Availability Set' : 'Availability Not Set'}
                                    </p>
                                    <p className="mt-5 text-gray-600 max-w-lg text-[22px] leading-relaxed">{bookingMentor.bio}</p>

                                    <div className="flex flex-wrap justify-center gap-2 mt-5">
                                        {bookingMentor.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="px-4 py-1.5 rounded-full bg-purple-100 text-purple-600 text-lg font-semibold"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
                                        <div className="text-gray-500 text-base">Profile Status</div>
                                        <div className="text-2xl font-bold text-gray-800 mt-1 capitalize">{bookingMentor.status}</div>
                                    </div>
                                    <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
                                        <div className="text-gray-500 text-base">Weekly Slots</div>
                                        <div className="text-2xl font-bold text-gray-800 mt-1">{selectedMentorWeeklySlotsCount}</div>
                                    </div>
                                    <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
                                        <div className="text-gray-500 text-base">Rate</div>
                                        <div className="text-2xl font-bold text-gray-800 mt-1">
                                            {bookingMentor.rate !== null ? `$${bookingMentor.rate}/hr` : 'Not specified'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <div className="rounded-2xl border border-gray-200 p-5 bg-white">
                                    <div className="flex items-center justify-between mb-4">
                                        <button onClick={goToPrevMonth} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <div className="text-3xl font-bold text-gray-800">{monthNames[viewMonthIndex]} {viewYear}</div>
                                        <button onClick={goToNextMonth} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-7 gap-2 text-center text-gray-500 font-semibold text-sm mb-2">
                                        <span>SUN</span><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span>
                                    </div>

                                    <div className="grid grid-cols-7 gap-2">
                                        {calendarCells.map((day, idx) => {
                                            if (!day) return <div key={`empty-${idx}`} className="h-12" />;

                                            const dayDate = new Date(viewYear, viewMonthIndex, day);
                                            const now = new Date();
                                            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                            const isPastDay = dayDate < todayStart;
                                            const daySlots = getSlotsForDateFromAvailability(selectedMentorAvailability, day, viewYear, viewMonthIndex);
                                            const isAvailableDay = daySlots.length > 0 && !isPastDay;
                                            const activeDay = selectedDate === day;

                                            return (
                                                <button
                                                    key={`${viewYear}-${viewMonthIndex}-${day}`}
                                                    onClick={() => {
                                                        if (!isAvailableDay) return;
                                                        setSelectedDate(day);
                                                        setSelectedTime('');
                                                    }}
                                                    disabled={!isAvailableDay}
                                                    className={`h-12 rounded-xl font-semibold transition-all ${
                                                        activeDay
                                                            ? 'bg-purple-600 text-white shadow-md'
                                                            : isAvailableDay
                                                                ? 'text-gray-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                                                                : 'text-gray-300 cursor-not-allowed'
                                                    }`}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <div className="text-center text-gray-500 font-bold tracking-wide mb-3">AVAILABLE TIME SLOTS (1 HOUR)</div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {availableHourlySlots.map((slot) => {
                                            const activeSlot = selectedTime === slot;
                                            return (
                                                <button
                                                    key={slot}
                                                    onClick={() => setSelectedTime(slot)}
                                                    className={`py-3 rounded-2xl border text-base font-semibold transition-colors ${
                                                        activeSlot
                                                            ? 'border-purple-500 bg-purple-600 text-white'
                                                            : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {slot}
                                                </button>
                                            );
                                        })}
                                        {availableHourlySlots.length === 0 && (
                                            <div className="col-span-full text-sm text-gray-500 text-center py-2">
                                                No slots available on this day.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {availableSlots.length === 0 && (
                                    <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3">
                                        Mentor is unavailable on {selectedDayKey ? dayLabelMap[selectedDayKey] : 'this day'}.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-4 bg-white">
                            <p className="text-gray-500 text-lg">
                                {selectedDate && selectedTime
                                    ? `Selected: ${monthNames[viewMonthIndex]} ${selectedDate}, ${viewYear} at ${selectedTime}`
                                    : 'Select a date and time to continue'}
                            </p>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={closeBookingModal}
                                    className="px-8 py-3 rounded-2xl border border-gray-300 text-gray-700 text-xl font-semibold hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmBooking}
                                    disabled={!selectedDate || !selectedTime}
                                    className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl font-semibold disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed shadow-md inline-flex items-center gap-2"
                                >
                                    <CheckCircle2 className="w-5 h-5" /> Confirm Booking
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showInstantModal && (
                <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm p-4 md:p-6">
                    <div className="h-full w-full max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                <Video className="w-6 h-6 text-purple-600" /> Instant Session
                            </h3>
                            <button
                                onClick={handleCloseInstantModal}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                            >
                                <X className="w-7 h-7" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <p className="text-gray-600 mb-4">
                                Showing mentors available at <span className="font-semibold">{nowContext.currentSlot}</span> on{' '}
                                <span className="font-semibold">{nowContext.dateLabel}</span>.
                            </p>

                            <div className="space-y-3">
                                {instantAvailableMentors.map((mentor) => (
                                    <div
                                        key={`instant-${mentor.id}`}
                                        className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex items-center justify-between gap-4"
                                    >
                                        <div>
                                            <p className="text-gray-800 font-semibold">{mentor.name}</p>
                                            <p className="text-sm text-gray-600">{mentor.category} • {mentor.title}</p>
                                        </div>
                                        <button
                                            onClick={() => handleRequestInstantSession(mentor)}
                                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:from-blue-600 hover:to-purple-700"
                                        >
                                            Request Now
                                        </button>
                                    </div>
                                ))}

                                {instantAvailableMentors.length === 0 && (
                                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                                        No mentors are free right now for this exact time slot.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-end">
                            <button
                                onClick={handleCloseInstantModal}
                                className="px-6 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Mentorship;
