import React, { useMemo, useState } from 'react';
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
    Clock3,
    Video,
    MessageSquare,
    Sparkles,
} from 'lucide-react';
import {
    getSlotsForDate,
    getWeekdayKeyFromDate,
    getMentorWeeklyAvailability,
    HOURLY_SLOT_OPTIONS,
    sortSlotsByHour,
} from '../services/mentorAvailabilityService';
import { getInstructorMentorProfile } from '../services/instructorMentorProfileService';
import { getCurrentUser } from '../services/authService';
import {
    createSessionRequest,
    getMentorshipCallRoomId,
    isSessionJoinableNow,
    getUpcomingSessionsForStudent,
    isMentorBusyAt,
} from '../services/mentorSessionService';

const mentorData = [
    {
        id: 1,
        name: 'Sarah Jenkins',
        initials: 'SJ',
        title: 'PhD Candidate, Stanford',
        bio: 'Specializing in Calculus, Linear Algebra, and exam prep strategy for undergrads.',
        category: 'Mathematics',
        tags: ['Math', 'Calculus', 'SAT Prep'],
        rating: 4.9,
        sessions: 124,
        rate: 45,
        active: true,
    },
    {
        id: 2,
        name: 'David Chen',
        initials: 'DC',
        title: 'MSc Computer Science, MIT',
        bio: 'Expert in Python, data structures, and algorithms with interview coaching focus.',
        category: 'Computer Science',
        tags: ['Coding', 'Python', 'Algorithms'],
        rating: 5.0,
        sessions: 89,
        rate: 60,
        active: false,
    },
    {
        id: 3,
        name: 'Elena Rodriguez',
        initials: 'ER',
        title: 'BA English Lit, Yale',
        bio: 'Creative writing coach and essay editor helping students craft standout essays.',
        category: 'Literature',
        tags: ['English', 'Writing', 'Essay'],
        rating: 4.8,
        sessions: 210,
        rate: 40,
        active: true,
    },
    {
        id: 4,
        name: 'Aamir Qureshi',
        initials: 'AQ',
        title: 'Finance Mentor, LUMS',
        bio: 'Business strategy, startup financial models, and case interview practice.',
        category: 'Business',
        tags: ['Business', 'Finance', 'Case Study'],
        rating: 4.7,
        sessions: 97,
        rate: 50,
        active: true,
    },
    {
        id: 5,
        name: 'Noah Brooks',
        initials: 'NB',
        title: 'Research Fellow, Oxford',
        bio: 'Physics and chemistry concept clarity for A-level and university foundation.',
        category: 'Science',
        tags: ['Physics', 'Chemistry', 'Lab Skills'],
        rating: 4.9,
        sessions: 175,
        rate: 55,
        active: false,
    },
    {
        id: 6,
        name: 'Hafsa Malik',
        initials: 'HM',
        title: 'Historian, NUST',
        bio: 'History timelines, source analysis, and high-scoring answer structure.',
        category: 'History',
        tags: ['History', 'Analysis', 'Essay'],
        rating: 4.6,
        sessions: 68,
        rate: 35,
        active: true,
    },
];

const categories = ['All Mentors', 'Mathematics', 'Computer Science', 'Literature', 'Business', 'Science', 'History'];

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

    const currentUser = useMemo(() => getCurrentUser(), []);

    const mentorsForListing = useMemo(() => {
        const instructorProfile = getInstructorMentorProfile();
        if (!instructorProfile?.name) return mentorData;

        const weeklyAvailability = getMentorWeeklyAvailability();
        const hasAvailability = Object.values(weeklyAvailability).some(
            (slots) => Array.isArray(slots) && slots.length > 0
        );

        const derivedTags = (instructorProfile.specializedCourses || '')
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
            .slice(0, 3);

        const instructorMentor = {
            id: 999,
            name: instructorProfile.name,
            initials: instructorProfile.name
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'IM',
            title: 'Instructor Mentor',
            bio: instructorProfile.description || 'Experienced mentor available for one-on-one sessions.',
            category: 'Computer Science',
            tags: derivedTags.length > 0 ? derivedTags : ['Mentorship'],
            rating: 5.0,
            sessions: 0,
            rate: 50,
            active: hasAvailability,
        };

        const withoutDuplicate = mentorData.filter((mentor) => mentor.name !== instructorMentor.name);
        return [instructorMentor, ...withoutDuplicate];
    }, []);

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

    const featuredSessions = useMemo(() => {
        const sessions = getUpcomingSessionsForStudent(currentUser?.id, currentUser?.name);
        return sessions.map((session) => ({
            id: session.id,
            requestId: session.requestId,
            mentor: session.mentorName,
            topic: session.subject,
            dateLabel: session.dateLabel,
            timeSlot: session.timeSlot,
            time: `${session.dateLabel}, ${session.timeSlot}`,
            canJoinNow: isSessionJoinableNow(session),
        }));
    }, [currentUser, sessionVersion]);

    const nowContext = useMemo(() => {
        const now = new Date();
        const currentSlot = HOURLY_SLOT_OPTIONS[now.getHours()];
        const dateLabel = `${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
        const weekdayKey = getWeekdayKeyFromDate(now.getDate(), now.getFullYear(), now.getMonth());

        return {
            now,
            currentSlot,
            dateLabel,
            weekdayKey,
        };
    }, [sessionVersion]);

    const instantAvailableMentors = useMemo(() => {
        return mentorsForListing.filter((mentor) => {
            const isInstructorMentor = mentor.id === 999;

            const isAvailableNow = isInstructorMentor
                ? getSlotsForDate(nowContext.now.getDate(), nowContext.now.getFullYear(), nowContext.now.getMonth()).includes(nowContext.currentSlot)
                : mentor.active;

            const isBusyNow = isMentorBusyAt(mentor.name, nowContext.dateLabel, nowContext.currentSlot);

            return isAvailableNow && !isBusyNow;
        });
    }, [mentorsForListing, nowContext, sessionVersion]);

    const closeBookingModal = () => {
        setBookingMentor(null);
        setSelectedDate(null);
        setSelectedTime('');
    };

    const openBookingModal = (mentor) => {
        setBookingMentor(mentor);
        const now = new Date();
        setViewMonthIndex(now.getMonth());
        setViewYear(now.getFullYear());
        setSelectedDate(null);
        setSelectedTime('');
    };

    const handleOpenInstantModal = () => {
        setShowInstantModal(true);
    };

    const handleCloseInstantModal = () => {
        setShowInstantModal(false);
    };

    const handleRequestInstantSession = (mentor) => {
        createSessionRequest({
            mentorName: mentor.name,
            mentorId: mentor.id,
            studentName: currentUser?.name || 'Student',
            studentId: currentUser?.id || 'student-id',
            subject: mentor.category,
            dateLabel: nowContext.dateLabel,
            timeSlot: nowContext.currentSlot,
            message: `Instant session request for ${mentor.category}`,
        });

        alert(`Instant request sent to ${mentor.name} for ${nowContext.currentSlot}.`);
        setSessionVersion((prev) => prev + 1);
    };

    const handleJoinSession = (session) => {
        const callRoomId = getMentorshipCallRoomId(session);
        if (!callRoomId) {
            alert('Unable to join this session right now.');
            return;
        }

        navigate(`/mentorship-call/${encodeURIComponent(callRoomId)}`);
    };

    const handleConfirmBooking = () => {
        if (!bookingMentor || !selectedDate || !selectedTime) return;

        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const selectedDateObj = new Date(viewYear, viewMonthIndex, selectedDate);
        if (selectedDateObj < todayStart) {
            alert('Past dates cannot be booked. Please select today or a future date.');
            return;
        }

        createSessionRequest({
            mentorName: bookingMentor.name,
            mentorId: bookingMentor.id,
            studentName: currentUser?.name || 'Student',
            studentId: currentUser?.id || 'student-id',
            subject: bookingMentor.category,
            dateLabel: `${monthNames[viewMonthIndex]} ${selectedDate}, ${viewYear}`,
            timeSlot: selectedTime,
            message: `Session request for ${bookingMentor.category}`,
        });

        alert(`Session request sent to ${bookingMentor.name}.`);
        closeBookingModal();
        setSessionVersion((prev) => prev + 1);
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

    const availableSlots = useMemo(
        () => getSlotsForDate(selectedDate, viewYear, viewMonthIndex),
        [selectedDate, viewYear, viewMonthIndex]
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
                                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] grid place-items-center border border-gray-900">
                                    2
                                </span>
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

                                            <div className="px-3 py-1.5 rounded-xl bg-yellow-500/20 border border-yellow-400/30 text-yellow-200 font-semibold flex items-center gap-1 text-sm">
                                                <Star className="w-4 h-4 fill-current" /> {mentor.rating}
                                            </div>
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
                                                <div className="text-2xl font-bold text-white">
                                                    ${mentor.rate}
                                                    <span className="text-base text-gray-400 font-medium">/hr</span>
                                                </div>
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
                                        {featuredSessions.map((item) => (
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
                                                    <span className="px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                                                        Scheduled
                                                    </span>
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
                                        {featuredSessions.length === 0 && (
                                            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
                                                No upcoming sessions yet. Book a session and wait for mentor acceptance.
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
                                        <button className="w-full rounded-xl bg-white/10 border border-white/10 text-gray-200 py-3 flex items-center justify-center gap-2 hover:bg-white/20 transition-colors">
                                            <Clock3 className="w-4 h-4" /> View Session History
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
                                        Available Now
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
                                        <div className="text-gray-500 text-base">Rating</div>
                                        <div className="text-4xl font-bold text-gray-800 flex items-center gap-2 mt-1">
                                            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" /> {bookingMentor.rating}
                                        </div>
                                        <div className="text-gray-500 text-lg">({bookingMentor.sessions})</div>
                                    </div>
                                    <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
                                        <div className="text-gray-500 text-base">Rate</div>
                                        <div className="text-4xl font-bold text-gray-800 mt-1">${bookingMentor.rate}/hr</div>
                                    </div>
                                    <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
                                        <div className="text-gray-500 text-base">Sessions</div>
                                        <div className="text-4xl font-bold text-gray-800 mt-1">779+</div>
                                    </div>
                                    <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
                                        <div className="text-gray-500 text-base">Response</div>
                                        <div className="text-4xl font-bold text-gray-800 mt-1">&lt; 2 hrs</div>
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
                                            const daySlots = getSlotsForDate(day, viewYear, viewMonthIndex);
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
