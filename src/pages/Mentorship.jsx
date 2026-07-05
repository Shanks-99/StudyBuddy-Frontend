import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import Sidebar from '../components/Sidebar';
import { useToast } from '../context/ToastContext';
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
    Users,
    BookOpen,
    CreditCard,
    ArrowLeft,
    Send,
    Clock,
    DollarSign,
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
    markSessionPaymentSent,
} from '../services/mentorSessionService';
import {
    createGroupSessionRequest,
    getGroupSessionsForStudent,
    markPaymentSent,
    joinPaymentSent,
} from '../services/groupSessionService';

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
    const { showToast } = useToast();
    const currentUser = getCurrentUser();
    const userId = currentUser?.id || currentUser?._id || '';
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
    const [payingSession, setPayingSession] = useState(null); // { session, type: '1-1' | 'group' }
    const [showFinder, setShowFinder] = useState(false);

    // ── Group Session State ──
    const [sessionTypeStep, setSessionTypeStep] = useState(null); // null = choosing, '1-to-1', 'group'
    const [groupTopic, setGroupTopic] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [groupDate, setGroupDate] = useState('');
    const [groupTime, setGroupTime] = useState('');
    const [groupMaxParticipants, setGroupMaxParticipants] = useState(10);
    const [studentGroupSessions, setStudentGroupSessions] = useState([]);
    const [groupSessionVersion, setGroupSessionVersion] = useState(0);

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

                const availabilityByMentorName = {};
                safeMentors.forEach((profile) => {
                    if (profile.name) {
                        availabilityByMentorName[profile.name] = profile.weeklyAvailability || DEFAULT_WEEKLY_AVAILABILITY;
                    }
                });
                setMentorAvailabilityMap(availabilityByMentorName);

                const sessions = await getUpcomingSessionsForStudent();
                setFeaturedSessions(Array.isArray(sessions) ? sessions : []);

                // Load group sessions for student
                try {
                    const groupSessions = await getGroupSessionsForStudent();
                    setStudentGroupSessions(groupSessions);
                } catch (err) {
                    console.error('Failed to load group sessions:', err);
                }
            } catch (error) {
                console.error('Failed to load mentorship data:', error);
                setMentorProfiles([]);
                setMentorAvailabilityMap({});
            }
        };

        loadMentorshipData();
    }, [sessionVersion, groupSessionVersion]);

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
                    title: profile.qualification || `${category} Mentor`,
                    bio: profile.description || 'No mentor description provided yet.',
                    category,
                    tags: Array.isArray(profile.tags) && profile.tags.length > 0 ? profile.tags : tags,
                    profilePicture: profile.profilePicture || '',
                    skillLevel: profile.skillLevel || 'Beginner',
                    rating: typeof profile.rating === 'number' ? profile.rating : null,
                    sessions: typeof profile.sessionsCount === 'number' ? profile.sessionsCount : null,
                    rate: typeof profile.hourlyRate === 'number' ? profile.hourlyRate : null,
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
        setSessionTypeStep(null);
        setGroupTopic('');
        setGroupDescription('');
        setGroupDate('');
        setGroupTime('');
        setGroupMaxParticipants(10);
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
        setSessionTypeStep(null); // Reset to session type chooser
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

            showToast(`Instant request sent to ${mentor.name} for ${nowContext.currentSlot}.`, 'success');
            await refreshInstantAvailableMentors();
            setSessionVersion((prev) => prev + 1);
        } catch (error) {
            showToast(error?.response?.data?.msg || 'Failed to send instant request.', 'error');
        }
    };

    const handleJoinSession = (session) => {
        const callRoomId = getMentorshipCallRoomId(session);
        if (!callRoomId) {
            showToast('Unable to join this session right now.', 'error');
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
            showToast('Past dates cannot be booked. Please select today or a future date.', 'error');
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

            showToast(`Session request sent to ${bookingMentor.name}.`, 'success');
            closeBookingModal();
            setSessionVersion((prev) => prev + 1);
        } catch (error) {
            showToast(error?.response?.data?.msg || 'Failed to create session request.', 'error');
        }
    };

    // ── Group Session Handlers ──
    const handleSubmitGroupRequest = async () => {
        if (!bookingMentor || !groupTopic || !groupDescription || !groupDate || !groupTime) {
            showToast('Please fill in all required fields.', 'error');
            return;
        }

        try {
            await createGroupSessionRequest({
                mentorId: bookingMentor.mentorId,
                mentorName: bookingMentor.name,
                topic: groupTopic,
                description: groupDescription,
                dateLabel: groupDate,
                timeSlot: groupTime,
                maxParticipants: groupMaxParticipants,
            });

            showToast(`Group session request sent to ${bookingMentor.name}!`, 'success');
            closeBookingModal();
            setGroupSessionVersion((prev) => prev + 1);
        } catch (error) {
            showToast(error?.response?.data?.msg || 'Failed to submit group session request.', 'error');
        }
    };

    const handleMarkPaymentSent = async (sessionId) => {
        try {
            const session = studentGroupSessions.find(s => s._id === sessionId);
            if (session && session.status === 'scheduled') {
                await joinPaymentSent(sessionId);
            } else {
                await markPaymentSent(sessionId);
            }
            showToast('Payment marked as sent! The mentor will verify it shortly.', 'success');
            setGroupSessionVersion((prev) => prev + 1);
        } catch (error) {
            showToast(error?.response?.data?.msg || 'Failed to mark payment as sent.', 'error');
        }
    };

    const handleMark11PaymentSent = async (sessionId) => {
        try {
            await markSessionPaymentSent(sessionId);
            showToast('Payment marked as sent! The mentor will verify it shortly.', 'success');
            setSessionVersion((prev) => prev + 1);
        } catch (error) {
            showToast(error?.response?.data?.msg || 'Failed to mark payment as sent.', 'error');
        }
    };

    const getGroupSessionStatusBadge = (session) => {
        const participant = session.participants?.find(
            (p) => String(p.student?._id || p.student) === String(userId)
        );
        const paymentStatus = participant?.paymentStatus || 'pending';

        if (session.status === 'pending') return { label: 'Pending Request', color: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' };
        if (session.status === 'declined') return { label: 'Declined', color: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' };
        
        // If student is creator and status is accepted OR student is joiner and payment status is accepted
        if ((session.status === 'accepted' && paymentStatus === 'pending') || paymentStatus === 'accepted') {
            return { label: 'Payment Due', color: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20' };
        }
        if (session.status === 'scheduled' && paymentStatus === 'pending') {
            return { label: 'Awaiting Acceptance', color: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' };
        }
        if (paymentStatus === 'sent') return { label: 'Payment Sent', color: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' };
        if (paymentStatus === 'rejected') return { label: 'Payment Rejected', color: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' };
        if (session.status === 'scheduled' && paymentStatus === 'verified') return { label: 'Scheduled', color: 'bg-green-50 text-green-600 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' };
        if (session.status === 'completed') return { label: 'Completed', color: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10' };
        return { label: session.status, color: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10' };
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
    const availableHourlySlots = useMemo(() => {
        const slots = HOURLY_SLOT_OPTIONS.filter((slot) => availableSlots.includes(slot));
        const now = new Date();
        const isToday =
            selectedDate === now.getDate() &&
            viewMonthIndex === now.getMonth() &&
            viewYear === now.getFullYear();

        if (!isToday) return sortSlotsByHour(slots);

        // Filter out past slots for today
        return sortSlotsByHour(
            slots.filter((slot) => {
                const dateLabel = `${monthNames[viewMonthIndex]} ${selectedDate}, ${viewYear}`;
                const startTime = getSessionStartDateTime(dateLabel, slot);
                return startTime && startTime > now;
            })
        );
    }, [availableSlots, selectedDate, viewMonthIndex, viewYear]);

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
                <header className="bg-white/80 dark:bg-[#0f0a16]/80 backdrop-blur-md p-4 md:px-8 flex items-center justify-between z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-600 dark:bg-[#8c30e8] flex items-center justify-center shadow-md">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-serif font-bold text-slate-900 dark:text-white tracking-wide">Mentorship Hub</h1>
                            <p className="text-xs text-slate-500 dark:text-white/50">Find the right mentor, faster</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {showFinder ? (
                            <button 
                                onClick={() => setShowFinder(false)}
                                className="px-7 py-3.5 text-sm font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl transition-all flex items-center gap-1.5 shadow-sm border border-purple-100 dark:border-purple-500/20 hover:-translate-y-0.5"
                            >
                                <ArrowLeft size={16} /> Back to Hub
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowFinder(true)}
                                className="px-8 py-3.5 bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all text-sm text-center"
                            >
                                Find a Mentor
                            </button>
                        )}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {showFinder ? (
                            // ── FIND YOUR MENTOR WINDOW (FINDER VIEW) ──
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-8">
                                {/* Back Button & Title Area */}
                                <section className="text-center relative">
                                    <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-200 dark:bg-purple-600/10 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-30 pointer-events-none" />
                                    
                                    <div className="flex items-center justify-start mb-6">
                                        <button 
                                            onClick={() => setShowFinder(false)}
                                            className="px-4 py-2 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl transition-all flex items-center gap-1.5 shadow-sm border border-purple-100 dark:border-purple-500/20"
                                        >
                                            <ArrowLeft size={14} /> Back to Hub
                                        </button>
                                    </div>

                                    <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 tracking-tight text-slate-900 dark:text-white relative z-10">
                                        Find Your Mentor
                                    </h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg mb-8 max-w-2xl mx-auto relative z-10 font-medium">
                                        Connect with Ivy League scholars and industry experts to accelerate your learning journey.
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

                                {/* Main Layout Split on Finder View */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left 2 Columns: Category Pills & Mentors Grid */}
                                    <div className="lg:col-span-2 space-y-6">
                                        {/* Category Pills */}
                                        <div className="flex overflow-x-auto scrollbar-none space-x-3 pb-2 px-1 items-center justify-start">
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

                                        {/* Mentors Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            {filteredMentors.map((mentor) => (
                                                <article
                                                    key={mentor.id}
                                                    className="rounded-2xl bg-white/75 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 p-6 backdrop-blur-lg shadow-sm flex flex-col hover:-translate-y-1 hover:shadow-md transition-all group"
                                                >
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="relative">
                                                            <div className="w-16 h-16 rounded-full bg-purple-600 dark:bg-[#8c30e8] text-white flex items-center justify-center text-xl font-bold shadow-sm overflow-hidden border-2 border-white dark:border-white/10">
                                                                {mentor.profilePicture ? (
                                                                    <img src={mentor.profilePicture} alt={mentor.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    mentor.initials
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="px-2 py-1 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-400/20 text-yellow-600 dark:text-yellow-400 font-bold flex items-center gap-1 text-xs">
                                                            <Star className="w-3.5 h-3.5 fill-current" /> {mentor.rating || '5.0'}
                                                        </div>
                                                    </div>

                                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                                        {mentor.name}
                                                    </h3>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <p className="text-purple-600 dark:text-purple-400 font-medium text-sm">{mentor.title}</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mb-4 mt-2">
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase rounded-xl border border-green-100 dark:border-green-500/20">
                                                            <Users size={12} />
                                                            <span className="text-sm font-black">{mentor.sessions || 0}</span> sessions
                                                        </div>
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase rounded-xl border border-purple-100 dark:border-purple-500/20">
                                                            <Sparkles size={12} />
                                                            {mentor.skillLevel || 'Expert'}
                                                        </div>
                                                    </div>
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
                                                                    Rs. {mentor.rate}
                                                                    <span className="text-sm text-slate-400 dark:text-slate-500 font-medium"> / hr</span>
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
                                                <div className="col-span-full rounded-2xl p-10 text-center border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
                                                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center mx-auto mb-4 text-slate-400">
                                                        <Search size={24} />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No mentors found</h3>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">Try adjusting your category or search term.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right 1 Column: Quick Actions sidebar on Finder View */}
                                    <div className="space-y-8">
                                        <div className="rounded-3xl bg-white/75 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 backdrop-blur-lg p-6 shadow-sm">
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
                                            <button
                                                onClick={handleOpenInstantModal}
                                                className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white text-sm font-bold py-3.5 flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 transition-all"
                                            >
                                                <Video className="w-4 h-4" /> Start Instant Session
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // ── ACTIVITIES HUB WINDOW (MAIN VIEW) ──
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-8">


                                {/* 3-Column main mentorship layout */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    
                                    {/* Column 1: Upcoming Sessions */}
                                    <div className="rounded-3xl bg-white/75 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 backdrop-blur-lg p-6 md:p-8 shadow-sm flex flex-col">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Upcoming Sessions</h3>
                                        <div className="space-y-4 flex-1">
                                            {featuredSessionCards.map((item) => {
                                                const isPaid = item.paymentStatus === 'verified' || item.paymentStatus === 'none';
                                                const showPay11Button = !isPaid && item.paymentStatus !== 'sent';
                                                const mentorObj = mentorProfiles.find(m => m.name === item.mentor || m.mentor === item.mentor);
                                                const rate = mentorObj?.hourlyRate || 1000;

                                                return (
                                                    <div
                                                        key={`${item.mentor}-${item.time}`}
                                                        className="rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 p-5 hover:border-purple-200 dark:hover:border-[#8c30e8]/30 transition-all flex flex-col justify-between"
                                                    >
                                                        <div>
                                                            <div className="text-slate-900 dark:text-white font-bold text-base">{item.mentor}</div>
                                                            <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mt-1 uppercase tracking-wider">{item.topic}</div>
                                                            <div className="mt-4 flex flex-col gap-1.5 text-xs text-slate-500 dark:text-gray-400 font-semibold">
                                                                <span className="flex items-center gap-1.5">
                                                                    <CalendarDays className="w-4 h-4 text-purple-500" /> {item.time}
                                                                </span>
                                                                <div className="mt-1 flex items-center justify-between">
                                                                    <span className="text-slate-400">Status</span>
                                                                    {!isPaid ? (
                                                                        item.paymentStatus === 'sent' ? (
                                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 shrink-0">
                                                                                Sent - Checking
                                                                            </span>
                                                                        ) : (
                                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20 shrink-0">
                                                                                Payment Due
                                                                            </span>
                                                                        )
                                                                    ) : item.canJoinNow ? (
                                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-500/20 dark:border-purple-500/30 dark:text-purple-300 shrink-0">
                                                                            Live Now
                                                                        </span>
                                                                    ) : (
                                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 border border-slate-300 dark:bg-white/10 dark:border-white/10 dark:text-white/70 shrink-0">
                                                                            Scheduled
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="mt-4">
                                                            {showPay11Button && (
                                                                <button
                                                                    onClick={() => setPayingSession({ session: item, type: '1-1', rate })}
                                                                    className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold py-2.5 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                                                                >
                                                                    <CreditCard size={14} /> Complete Payment
                                                                </button>
                                                            )}

                                                            {item.paymentStatus === 'sent' && (
                                                                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                                                    ⏳ Payment sent — waiting for verification...
                                                                </p>
                                                            )}

                                                            {isPaid && item.canJoinNow && (
                                                                <button
                                                                    onClick={() => handleJoinSession(item)}
                                                                    className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white text-xs font-bold py-2.5 transition-colors shadow-sm"
                                                                >
                                                                    Join Session
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {featuredSessionCards.length === 0 && (
                                                <div className="rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 p-8 text-sm text-slate-500 dark:text-gray-400 text-center">
                                                    No upcoming private sessions yet.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Column 2: Group Sessions */}
                                    <div className="rounded-3xl bg-white/75 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 backdrop-blur-lg p-6 md:p-8 shadow-sm flex flex-col">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Group Sessions</h3>
                                        <div className="space-y-4 flex-1">
                                            {studentGroupSessions.filter(gs => gs.status !== 'declined').map((gs) => {
                                                const badge = getGroupSessionStatusBadge(gs);
                                                const participant = gs.participants?.find(
                                                    (p) => String(p.student?._id || p.student) === String(userId)
                                                );
                                                const showPayButton = (gs.status === 'accepted' && participant?.paymentStatus === 'pending') || participant?.paymentStatus === 'accepted' || participant?.paymentStatus === 'rejected';

                                                return (
                                                    <div
                                                        key={gs._id}
                                                        className="rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 p-5 hover:border-emerald-200 dark:hover:border-emerald-500/20 transition-all flex flex-col justify-between"
                                                    >
                                                        <div>
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="text-slate-900 dark:text-white font-bold text-base flex items-center gap-1.5">
                                                                    <Users size={16} className="text-emerald-500" />
                                                                    {gs.topic}
                                                                </div>
                                                            </div>
                                                            <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mt-1">{gs.mentorName}</div>
                                                            <div className="mt-3 flex flex-col gap-1.5 text-xs text-slate-500 dark:text-gray-400 font-semibold">
                                                                <span className="flex items-center gap-1"><CalendarDays size={14} className="text-slate-400" /> {gs.dateLabel} • {gs.timeSlot}</span>
                                                                <div className="mt-1 flex items-center justify-between">
                                                                    <span className="text-slate-400">Rs. {gs.rate} / student</span>
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badge.color}`}>
                                                                        {badge.label}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-4">
                                                            {showPayButton && (
                                                                <button
                                                                    onClick={() => setPayingSession({ session: gs, type: 'group', rate: gs.rate })}
                                                                    className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold py-2.5 flex items-center justify-center gap-1.5 transition-colors"
                                                                >
                                                                    <CreditCard size={14} /> Complete Payment
                                                                </button>
                                                            )}

                                                            {participant?.paymentStatus === 'sent' && (
                                                                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                                                    ⏳ Payment sent — waiting for verification...
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {studentGroupSessions.filter(gs => gs.status !== 'declined').length === 0 && (
                                                <div className="rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 p-8 text-sm text-slate-500 dark:text-gray-400 text-center">
                                                    No group sessions yet.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Column 3: Recent Sessions */}
                                    <div className="rounded-3xl bg-white/75 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 backdrop-blur-lg p-6 md:p-8 shadow-sm flex flex-col">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Recent Sessions</h3>
                                        <div className="space-y-4 flex-1">
                                            {recentSessionCards.map((session) => (
                                                <div
                                                    key={`recent-${session._id || session.id || session.time}`}
                                                    className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 p-4 animate-in fade-in"
                                                >
                                                    <div className="text-slate-900 dark:text-white font-bold text-sm">{session.mentor}</div>
                                                    <div className="text-xs font-medium text-purple-600 dark:text-purple-400 mt-1">{session.topic}</div>
                                                    <div className="mt-2 text-[10px] text-slate-500 dark:text-gray-500 uppercase font-bold tracking-wider">{session.time}</div>
                                                </div>
                                            ))}
                                            {recentSessionCards.length === 0 && (
                                                <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 p-6 text-sm text-slate-500 dark:text-gray-400 text-center">
                                                    No recent sessions found.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )}
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
                                    
                                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                                        <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 border border-slate-200 dark:border-white/10">
                                            <span className={`w-2 h-2 rounded-full ${selectedMentorWeeklySlotsCount > 0 ? 'bg-green-500' : 'bg-gray-400'}`} />
                                            {selectedMentorWeeklySlotsCount > 0 ? 'Availability Set' : 'Availability Not Set'}
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 border border-green-200 dark:border-green-400/20">
                                            <Users size={10} />
                                            {bookingMentor.sessions || 0} Sessions
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 border border-yellow-200 dark:border-yellow-400/20">
                                            <Star size={10} className="fill-current" />
                                            {bookingMentor.rating || '5.0'}
                                        </div>
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

                                {/* Session Type Selector */}
                                <div className="mt-8 space-y-3">
                                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider px-1">Choose Session Type</div>
                                    
                                    {/* 1-to-1 Card */}
                                    <button
                                        onClick={() => setSessionTypeStep('1-to-1')}
                                        className={`w-full rounded-2xl border p-4 text-left transition-all ${
                                            sessionTypeStep === '1-to-1'
                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10 dark:border-purple-500/40 shadow-md ring-2 ring-purple-500/20'
                                                : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 hover:border-purple-300 dark:hover:border-purple-500/30 hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                                                <BookOpen size={18} className="text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-bold text-slate-900 dark:text-white">Book 1-to-1 Session</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Private mentorship session</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">Rate</div>
                                                <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                                                    {bookingMentor.rate !== null ? `Rs. ${bookingMentor.rate}` : 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Group Session Card */}
                                    <button
                                        onClick={() => setSessionTypeStep('group')}
                                        className={`w-full rounded-2xl border p-4 text-left transition-all ${
                                            sessionTypeStep === 'group'
                                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/40 shadow-md ring-2 ring-emerald-500/20'
                                                : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                                                <Users size={18} className="text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-bold text-slate-900 dark:text-white">Book Group Session</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Collaborative group session</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">Rate</div>
                                                <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                                                    {bookingMentor.rate !== null ? `Rs. ${Math.round(bookingMentor.rate / 2)}` : 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Modal Right: Calendar/Time OR Group Form */}
                            <div className="p-6 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-black/10">

                                {/* Prompt to select session type if not yet chosen */}
                                {!sessionTypeStep && (
                                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                        <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center mb-4">
                                            <CalendarDays size={28} className="text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">Select a Session Type</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs">
                                            Choose between a private 1-to-1 session or a collaborative group session from the options on the left.
                                        </p>
                                    </div>
                                )}

                                {/* ── 1-to-1 Calendar Flow (existing, unchanged) ── */}
                                {sessionTypeStep === '1-to-1' && (
                                    <>
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

                                            <div className="grid grid-cols-7 gap-1 mb-3">
                                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                                                    <div key={day} className="text-center text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase">{day}</div>
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-7 gap-1">
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
                                    </>
                                )}

                                {/* ── Group Session Request Form ── */}
                                {sessionTypeStep === 'group' && (
                                    <div className="space-y-5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <button
                                                onClick={() => setSessionTypeStep(null)}
                                                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 transition-colors"
                                            >
                                                <ArrowLeft size={16} />
                                            </button>
                                            <h4 className="text-base font-bold text-slate-900 dark:text-white">Book Group Session</h4>
                                        </div>

                                        <div>
                                            <label className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Session Topic *</label>
                                            <input
                                                type="text"
                                                value={groupTopic}
                                                onChange={(e) => setGroupTopic(e.target.value)}
                                                placeholder='e.g., "Advanced React Hooks Deep Dive"'
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191121] text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Description *</label>
                                            <textarea
                                                value={groupDescription}
                                                onChange={(e) => setGroupDescription(e.target.value)}
                                                placeholder="What would you like to cover in this session?"
                                                rows={3}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191121] text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all resize-none"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Preferred Date *</label>
                                                <input
                                                    type="date"
                                                    onChange={(e) => {
                                                        const d = new Date(e.target.value);
                                                        if (!isNaN(d.getTime())) {
                                                            setGroupDate(`${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`);
                                                        }
                                                    }}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191121] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                                                />
                                                {groupDate && (
                                                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">{groupDate}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Preferred Time *</label>
                                                <input
                                                    type="time"
                                                    onChange={(e) => {
                                                        const [hours, minutes] = e.target.value.split(':');
                                                        let h = parseInt(hours);
                                                        const m = minutes;
                                                        const ampm = h >= 12 ? 'PM' : 'AM';
                                                        if (h > 12) h -= 12;
                                                        if (h === 0) h = 12;
                                                        setGroupTime(`${h}:${m} ${ampm}`);
                                                    }}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191121] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                                                />
                                                {groupTime && (
                                                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">{groupTime}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Max Participants</label>
                                            <input
                                                type="number"
                                                value={groupMaxParticipants}
                                                onChange={(e) => setGroupMaxParticipants(Math.max(2, parseInt(e.target.value) || 2))}
                                                min={2}
                                                max={50}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191121] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                                            />
                                        </div>

                                        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 p-4 text-center">
                                            <div className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Rate per Participant</div>
                                            <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
                                                Rs. {bookingMentor.rate !== null ? Math.round(bookingMentor.rate / 2) : 0}
                                            </div>
                                            <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">50% of 1-to-1 rate</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-4 bg-slate-50 dark:bg-black/20 shrink-0">
                            <p className="text-xs font-medium text-slate-500 dark:text-gray-400 hidden sm:block">
                                {sessionTypeStep === '1-to-1' && selectedDate && selectedTime
                                    ? `Selected: ${monthNames[viewMonthIndex]} ${selectedDate}, ${viewYear} at ${selectedTime}`
                                    : sessionTypeStep === 'group' && groupTopic && groupDate && groupTime
                                        ? `Group: ${groupTopic} — ${groupDate} at ${groupTime}`
                                        : 'Select a session type to continue'}
                            </p>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button
                                    onClick={closeBookingModal}
                                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 text-sm font-bold hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>

                                {/* 1-to-1 Confirm Button */}
                                {sessionTypeStep === '1-to-1' && (
                                    <button
                                        onClick={handleConfirmBooking}
                                        disabled={!selectedDate || !selectedTime}
                                        className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all inline-flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 size={16} /> Confirm
                                    </button>
                                )}

                                {/* Group Session Submit Button */}
                                {sessionTypeStep === 'group' && (
                                    <button
                                        onClick={handleSubmitGroupRequest}
                                        disabled={!groupTopic || !groupDescription || !groupDate || !groupTime}
                                        className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all inline-flex items-center justify-center gap-2"
                                    >
                                        <Send size={16} /> Submit Request
                                    </button>
                                )}
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

            {/* ── Complete Payment Modal ── */}
            {payingSession && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white dark:bg-[#1a1225] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-black/20">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <CreditCard size={18} className="text-purple-600 dark:text-[#8c30e8]" />
                                Complete Payment
                            </h2>
                            <button
                                onClick={() => setPayingSession(null)}
                                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-1">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    {payingSession.type === '1-1'
                                        ? `1-1 Session: ${payingSession.session.topic || payingSession.session.subject}`
                                        : payingSession.session.topic}
                                </h3>
                                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                    Mentor: {payingSession.type === '1-1' ? (payingSession.session.mentor || payingSession.session.mentorName) : payingSession.session.mentorName}
                                </p>
                            </div>

                            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-gray-400">
                                <span className="flex items-center gap-1.5">
                                    <CalendarDays size={14} /> {payingSession.type === '1-1' ? payingSession.session.time : payingSession.session.dateLabel}
                                </span>
                                {payingSession.type === 'group' && (
                                    <span className="flex items-center gap-1.5">
                                        <Clock size={14} /> {payingSession.session.timeSlot}
                                    </span>
                                )}
                            </div>

                            <div className="rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4">
                                <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-2">💳 Payment Instructions</h4>
                                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed mb-3">
                                    Please send Rs. {payingSession.rate} via one of the following mentor accounts:
                                </p>
                                {payingSession.session.mentorProfile && (payingSession.session.mentorProfile.bankAccountNumber || payingSession.session.mentorProfile.easypaisaNumber) ? (
                                    <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1.5 font-bold pl-1 list-none">
                                        {payingSession.session.mentorProfile.bankAccountNumber && (
                                            <li className="flex flex-col gap-0.5">
                                                <span className="text-[10px] uppercase text-slate-400 font-bold">Bank Account</span>
                                                <span className="font-mono text-sm">{payingSession.session.mentorProfile.bankAccountNumber}</span>
                                            </li>
                                        )}
                                        {payingSession.session.mentorProfile.easypaisaNumber && (
                                            <li className="flex flex-col gap-0.5 mt-2">
                                                <span className="text-[10px] uppercase text-slate-400 font-bold">Easypaisa</span>
                                                <span className="font-mono text-sm">{payingSession.session.mentorProfile.easypaisaNumber}</span>
                                            </li>
                                        )}
                                    </ul>
                                ) : (
                                    <div className="text-xs text-amber-800 dark:text-amber-400 font-semibold italic bg-amber-100/50 dark:bg-amber-500/5 p-3 rounded-xl border border-amber-200/50">
                                        No specific payment accounts are listed by the mentor. Please ask them directly in the chat or contact admin support.
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={async () => {
                                    if (payingSession.type === '1-1') {
                                        await handleMark11PaymentSent(payingSession.session._id || payingSession.session.id);
                                    } else {
                                        await handleMarkPaymentSent(payingSession.session._id);
                                    }
                                    setPayingSession(null);
                                }}
                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={16} /> I've Sent the Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Mentorship;