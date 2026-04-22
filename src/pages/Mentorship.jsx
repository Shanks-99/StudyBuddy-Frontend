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
        <div className="flex h-screen bg-slate-50 dark:bg-[#0a0a0f] text-slate-900 dark:text-white font-sans relative overflow-hidden transition-colors duration-300">
            {/* Atmospheric background */}
            <div className="pointer-events-none absolute inset-0 z-0 opacity-0 dark:opacity-100 transition-opacity">
                <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[160px]" />
                <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-purple-600/5 blur-[140px]" />
                <div className="absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full bg-purple-600/5 blur-[120px]" />
            </div>

            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                {/* ── Top Header ── */}
                <header className="bg-white/80 dark:bg-[#0f0a16]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 p-4 md:px-8 flex items-center justify-between z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-600 dark:bg-[#8c30e8] flex items-center justify-center shadow-md">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-serif font-bold text-slate-900 dark:text-white tracking-wide">Mentorship Hub</h1>
                            <p className="text-xs text-slate-500 dark:text-white/50">Find the right mentor, faster</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="p-2.5 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-white/5 transition-colors">
                            <Bell className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        
                        {/* ── Hero Search Section ── */}
                        <section className="text-center mb-8 relative">
                            <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-200 dark:bg-purple-600/10 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-30 pointer-events-none" />
                            
                            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 tracking-tight text-slate-900 dark:text-white relative z-10">
                                Find Your Mentor
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg mb-8 max-w-2xl mx-auto relative z-10">
                                Connect with top scholars and industry experts to accelerate your learning journey.
                            </p>

                            <div className="max-w-2xl mx-auto relative z-20">
                                <div className="relative flex items-center bg-white/70 dark:bg-white/[0.06] backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 p-2 shadow-sm">
                                    <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search by subject, name, or expertise..."
                                        className="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 py-3 px-4 outline-none text-sm md:text-base"
                                    />
                                    <button className="bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-600 dark:text-slate-300 rounded-xl p-3 transition-colors shrink-0">
                                        <SlidersHorizontal className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* ── Category Pills ── */}
                        <div className="flex overflow-x-auto scrollbar-none space-x-3 mb-8 pb-2 px-1 items-center justify-start md:justify-center">
                            {categories.map((category) => {
                                const active = activeCategory === category;
                                return (
                                    <button
                                        key={category}
                                        onClick={() => setActiveCategory(category)}
                                        className={`whitespace-nowrap px-6 py-2.5 rounded-full font-medium text-sm transition-all ${
                                            active
                                                ? 'bg-purple-600 dark:bg-[#8c30e8] text-white shadow-md border border-purple-500/20'
                                                : 'bg-white/60 dark:bg-white/[0.06] hover:bg-white dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 border border-slate-200 dark:border-white/10 backdrop-blur-sm'
                                        }`}
                                    >
                                        {category}
                                    </button>
                                );
                            })}
                        </div>

                        {/* ── Main Layout: Mentors List & Sidebars ── */}
                        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            
                            {/* Mentors Grid (Left/Main) */}
                            <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {filteredMentors.map((mentor) => (
                                    <article
                                        key={mentor.id}
                                        className="rounded-2xl bg-white/75 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 p-6 backdrop-blur-lg shadow-sm flex flex-col hover:-translate-y-1 hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="relative">
                                                <div className="w-16 h-16 rounded-full bg-purple-600 dark:bg-[#8c30e8] text-white flex items-center justify-center text-xl font-bold shadow-sm">
                                                    {mentor.initials}
                                                </div>
                                                <span
                                                    className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-[#0f0a16] ${
                                                        mentor.active ? 'bg-green-400 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'
                                                    }`}
                                                />
                                            </div>

                                            {mentor.rating !== null ? (
                                                <div className="px-2 py-1 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-400/20 text-yellow-600 dark:text-yellow-400 font-bold flex items-center gap-1 text-xs">
                                                    <Star className="w-3.5 h-3.5 fill-current" /> {mentor.rating}
                                                </div>
                                            ) : (
                                                <div className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-400/20 text-blue-600 dark:text-blue-400 font-bold text-xs capitalize">
                                                    {mentor.status}
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                            {mentor.name}
                                        </h3>
                                        <p className="text-purple-600 dark:text-purple-400 font-medium mt-1 text-sm">{mentor.title}</p>
                                        <p className="text-slate-500 dark:text-slate-400 mt-3 leading-relaxed min-h-[60px] text-sm line-clamp-3">
                                            {mentor.bio}
                                        </p>

                                        <div className="flex flex-wrap gap-2 mt-4 mb-6">
                                            {mentor.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/10 flex items-end justify-between gap-3">
                                            <div>
                                                <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Rate</div>
                                                {mentor.rate !== null ? (
                                                    <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                                                        ${mentor.rate}
                                                        <span className="text-sm text-slate-400 dark:text-slate-500 font-medium">/hr</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs font-semibold text-slate-500">Not specified</div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-300 transition-colors">
                                                    <MessageSquare className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openBookingModal(mentor)}
                                                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white text-sm font-bold shadow-md shadow-purple-500/20 transition-all"
                                                >
                                                    Book Session
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}

                                {filteredMentors.length === 0 && (
                                    <div className="sm:col-span-2 rounded-2xl p-10 text-center border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
                                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center mx-auto mb-4 text-slate-400">
                                            <Search size={24} />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No mentors found</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Try adjusting your category or search term.</p>
                                    </div>
                                )}
                            </div>

                            {/* Sidebars (Right) */}
                            <aside className="space-y-6">
                                
                                {/* Upcoming Sessions */}
                                <div className="rounded-2xl bg-white/75 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 backdrop-blur-lg p-6 shadow-sm">
                                    <h3 className="text-sm font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider mb-4">Your Upcoming Sessions</h3>
                                    <div className="space-y-3">
                                        {featuredSessionCards.map((item) => (
                                            <div
                                                key={`${item.mentor}-${item.time}`}
                                                className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 p-4"
                                            >
                                                <div className="text-slate-900 dark:text-white font-bold text-sm">{item.mentor}</div>
                                                <div className="text-xs font-medium text-purple-600 dark:text-purple-400 mt-1">{item.topic}</div>
                                                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-gray-400 font-medium">
                                                    <span className="flex items-center gap-1.5">
                                                        <CalendarDays className="w-3.5 h-3.5" /> {item.time}
                                                    </span>
                                                    {item.canJoinNow ? (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-500/20 dark:border-purple-500/30 dark:text-purple-300">
                                                            Live Now
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 border border-slate-300 dark:bg-white/10 dark:border-white/10 dark:text-white/70">
                                                            Scheduled
                                                        </span>
                                                    )}
                                                </div>
                                                {item.canJoinNow && (
                                                    <button
                                                        onClick={() => handleJoinSession(item)}
                                                        className="mt-3 w-full rounded-lg bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white text-xs font-bold py-2.5 transition-colors shadow-sm"
                                                    >
                                                        Join Session
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {featuredSessionCards.length === 0 && (
                                            <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 p-4 text-xs text-slate-500 dark:text-gray-400 text-center">
                                                No upcoming sessions yet. Book a session to get started.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Recent Sessions */}
                                <div className="rounded-2xl bg-white/75 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 backdrop-blur-lg p-6 shadow-sm">
                                    <h3 className="text-sm font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider mb-4">Recent Sessions</h3>
                                    <div className="space-y-3">
                                        {recentSessionCards.map((session) => (
                                            <div
                                                key={`recent-${session._id || session.id || session.time}`}
                                                className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 p-4"
                                            >
                                                <div className="text-slate-900 dark:text-white font-bold text-sm">{session.mentor}</div>
                                                <div className="text-xs font-medium text-purple-600 dark:text-purple-400 mt-1">{session.topic}</div>
                                                <div className="mt-2 text-[10px] text-slate-500 dark:text-gray-500 uppercase font-bold tracking-wider">{session.time}</div>
                                            </div>
                                        ))}
                                        {recentSessionCards.length === 0 && (
                                            <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 p-4 text-xs text-slate-500 dark:text-gray-400 text-center">
                                                No recent sessions found.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="rounded-2xl bg-white/75 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 backdrop-blur-lg p-6 shadow-sm">
                                    <h3 className="text-sm font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider mb-4">Quick Actions</h3>
                                    <button
                                        onClick={handleOpenInstantModal}
                                        className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white text-sm font-bold py-3 flex items-center justify-center gap-2 shadow-md transition-all"
                                    >
                                        <Video className="w-4 h-4" /> Start Instant Session
                                    </button>
                                </div>

                            </aside>
                        </section>
                    </div>
                </main>
            </div>

            {/* ── Booking Modal ── */}
            {bookingMentor && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm p-4 md:p-8 flex items-center justify-center">
                    <div className="h-full max-h-[700px] w-full max-w-5xl bg-white dark:bg-[#191121] rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-black/20">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                <CalendarDays className="w-5 h-5 text-purple-600 dark:text-[#8c30e8]" /> Schedule a Session
                            </h3>
                            <button
                                onClick={closeBookingModal}
                                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-gray-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
                            {/* Modal Left: Mentor Info */}
                            <div className="p-6 border-r border-slate-200 dark:border-white/5 overflow-y-auto custom-scrollbar bg-white dark:bg-transparent">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-24 h-24 rounded-full bg-purple-600 dark:bg-[#8c30e8] text-white text-3xl font-extrabold grid place-items-center shadow-md border-4 border-white dark:border-[#191121]">
                                        {bookingMentor.initials}
                                    </div>
                                    <h4 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">{bookingMentor.name}</h4>
                                    <p className="text-purple-600 dark:text-purple-400 font-medium text-sm mt-1">{bookingMentor.title}</p>
                                    
                                    <div className="mt-3 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 border border-slate-200 dark:border-white/10">
                                        <span className={`w-2 h-2 rounded-full ${selectedMentorWeeklySlotsCount > 0 ? 'bg-green-500' : 'bg-gray-400'}`} />
                                        {selectedMentorWeeklySlotsCount > 0 ? 'Availability Set' : 'Availability Not Set'}
                                    </div>
                                    
                                    <p className="mt-6 text-slate-600 dark:text-slate-400 max-w-sm text-sm leading-relaxed">{bookingMentor.bio}</p>

                                    <div className="flex flex-wrap justify-center gap-2 mt-6">
                                        {bookingMentor.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-8 grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-4 bg-slate-50 dark:bg-black/20 text-center">
                                        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Status</div>
                                        <div className="text-lg font-bold text-slate-900 dark:text-white mt-1 capitalize">{bookingMentor.status}</div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-4 bg-slate-50 dark:bg-black/20 text-center">
                                        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Rate</div>
                                        <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                                            {bookingMentor.rate !== null ? `$${bookingMentor.rate}/hr` : 'Not specified'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Right: Calendar & Time */}
                            <div className="p-6 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-black/10">
                                <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-5 bg-white dark:bg-[#191121] shadow-sm mb-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <button onClick={goToPrevMonth} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <div className="text-lg font-bold text-slate-900 dark:text-white tracking-wide">
                                            {monthNames[viewMonthIndex]} {viewYear}
                                        </div>
                                        <button onClick={goToNextMonth} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-7 gap-2 text-center text-slate-400 dark:text-gray-500 font-bold text-[10px] uppercase tracking-wider mb-3">
                                        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                                    </div>

                                    <div className="grid grid-cols-7 gap-2">
                                        {calendarCells.map((day, idx) => {
                                            if (!day) return <div key={`empty-${idx}`} className="h-10" />;

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
                                                    className={`h-10 rounded-xl text-sm font-bold transition-all ${
                                                        activeDay
                                                            ? 'bg-purple-600 dark:bg-[#8c30e8] text-white shadow-md border-transparent'
                                                            : isAvailableDay
                                                                ? 'text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 dark:bg-white/5 dark:text-gray-300 dark:border-white/10 dark:hover:bg-white/10'
                                                                : 'text-slate-300 dark:text-white/10 cursor-not-allowed border border-transparent'
                                                    }`}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-[10px] text-slate-500 dark:text-gray-400 font-bold tracking-wider uppercase mb-3 px-1">Available Time Slots (1 Hour)</div>
                                    <div className="grid grid-cols-3 gap-2.5">
                                        {availableHourlySlots.map((slot) => {
                                            const activeSlot = selectedTime === slot;
                                            return (
                                                <button
                                                    key={slot}
                                                    onClick={() => setSelectedTime(slot)}
                                                    className={`py-2.5 rounded-xl border text-sm font-bold transition-colors ${
                                                        activeSlot
                                                            ? 'border-purple-600 bg-purple-600 text-white dark:border-[#8c30e8] dark:bg-[#8c30e8]'
                                                            : 'border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5'
                                                    }`}
                                                >
                                                    {slot}
                                                </button>
                                            );
                                        })}
                                        {availableHourlySlots.length === 0 && (
                                            <div className="col-span-full text-xs font-medium text-slate-500 dark:text-gray-500 text-center py-4 bg-white dark:bg-[#191121] rounded-xl border border-slate-200 dark:border-white/5">
                                                No slots available on this day.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {availableSlots.length === 0 && selectedDate && (
                                    <div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium px-4 py-3">
                                        Mentor is unavailable on {selectedDayKey ? dayLabelMap[selectedDayKey] : 'this day'}.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-4 bg-slate-50 dark:bg-black/20 shrink-0">
                            <p className="text-xs font-medium text-slate-500 dark:text-gray-400 hidden sm:block">
                                {selectedDate && selectedTime
                                    ? `Selected: ${monthNames[viewMonthIndex]} ${selectedDate}, ${viewYear} at ${selectedTime}`
                                    : 'Select a date and time to continue'}
                            </p>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button
                                    onClick={closeBookingModal}
                                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 text-sm font-bold hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmBooking}
                                    disabled={!selectedDate || !selectedTime}
                                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all inline-flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={16} /> Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Instant Session Modal ── */}
            {showInstantModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center">
                    <div className="h-full max-h-[600px] w-full max-w-2xl bg-white dark:bg-[#191121] rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-black/20">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                <Video className="w-5 h-5 text-purple-600 dark:text-[#8c30e8]" /> Instant Session
                            </h3>
                            <button
                                onClick={handleCloseInstantModal}
                                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-gray-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-transparent">
                            <p className="text-sm text-slate-600 dark:text-gray-400 mb-6 bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                                Showing mentors available at <span className="font-bold text-slate-900 dark:text-white">{nowContext.currentSlot}</span> on{' '}
                                <span className="font-bold text-slate-900 dark:text-white">{nowContext.dateLabel}</span>.
                            </p>

                            <div className="space-y-4">
                                {instantAvailableMentors.map((mentor) => (
                                    <div
                                        key={`instant-${mentor.id}`}
                                        className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-purple-600 dark:bg-[#8c30e8] text-white flex items-center justify-center text-lg font-bold shrink-0">
                                                {mentor.initials}
                                            </div>
                                            <div>
                                                <p className="text-base font-bold text-slate-900 dark:text-white">{mentor.name}</p>
                                                <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mt-0.5">{mentor.category} &middot; {mentor.title}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRequestInstantSession(mentor)}
                                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white text-sm font-bold shadow-md transition-colors whitespace-nowrap"
                                        >
                                            Request Now
                                        </button>
                                    </div>
                                ))}

                                {instantAvailableMentors.length === 0 && (
                                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-8 text-sm font-medium text-slate-500 dark:text-gray-400 text-center">
                                        No mentors are free right now for this exact time slot.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 flex justify-end">
                            <button
                                onClick={handleCloseInstantModal}
                                className="px-6 py-2.5 rounded-xl border border-slate-300 dark:border-white/20 text-slate-700 dark:text-gray-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-white/10 transition-colors w-full sm:w-auto"
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