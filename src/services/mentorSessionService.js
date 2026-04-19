const STORAGE_KEY = 'mentorshipSessionData';

const defaultData = {
    requests: [],
    upcoming: [],
    past: [],
};

const readData = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...defaultData };
        const parsed = JSON.parse(raw);
        return {
            ...defaultData,
            ...parsed,
            requests: Array.isArray(parsed?.requests) ? parsed.requests : [],
            upcoming: Array.isArray(parsed?.upcoming) ? parsed.upcoming : [],
            past: Array.isArray(parsed?.past) ? parsed.past : [],
        };
    } catch (error) {
        return { ...defaultData };
    }
};

const writeData = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
};

export const createSessionRequest = (payload) => {
    const data = readData();
    const request = {
        id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
        ...payload,
    };

    data.requests = [request, ...data.requests];
    writeData(data);
    return request;
};

export const getSessionRequestsForMentor = (mentorName) => {
    const data = readData();
    return data.requests.filter((request) => request.mentorName === mentorName && request.status === 'pending');
};

export const acceptSessionRequest = (requestId, mentorName) => {
    const data = readData();
    const request = data.requests.find((item) => item.id === requestId && item.mentorName === mentorName);
    if (!request) return null;

    request.status = 'accepted';
    request.updatedAt = new Date().toISOString();

    const upcomingItem = {
        id: `up-${request.id}`,
        requestId: request.id,
        mentorName: request.mentorName,
        studentName: request.studentName,
        studentId: request.studentId,
        subject: request.subject,
        dateLabel: request.dateLabel,
        timeSlot: request.timeSlot,
        mode: 'Video',
        status: 'Upcoming',
        createdAt: new Date().toISOString(),
    };

    const alreadyExists = data.upcoming.some((session) => session.requestId === request.id);
    if (!alreadyExists) {
        data.upcoming = [upcomingItem, ...data.upcoming];
    }

    writeData(data);
    return upcomingItem;
};

export const declineSessionRequest = (requestId, mentorName) => {
    const data = readData();
    const request = data.requests.find((item) => item.id === requestId && item.mentorName === mentorName);
    if (!request) return false;

    request.status = 'declined';
    request.updatedAt = new Date().toISOString();
    writeData(data);
    return true;
};

export const getUpcomingSessionsForMentor = (mentorName) => {
    const data = readData();
    return data.upcoming.filter((item) => item.mentorName === mentorName);
};

export const getUpcomingSessionsForStudent = (studentId, studentName) => {
    const data = readData();
    return data.upcoming.filter((item) => item.studentId === studentId || item.studentName === studentName);
};

const parseTimeSlot = (timeSlot) => {
    if (!timeSlot || typeof timeSlot !== 'string') return null;
    const match = timeSlot.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;

    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const meridiem = match[3].toUpperCase();

    if (meridiem === 'PM' && hour !== 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;

    return { hour, minute };
};

export const getSessionStartDateTime = (dateLabel, timeSlot) => {
    if (!dateLabel || !timeSlot) return null;

    const date = new Date(dateLabel);
    const time = parseTimeSlot(timeSlot);
    if (Number.isNaN(date.getTime()) || !time) return null;

    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        time.hour,
        time.minute,
        0,
        0
    );
};

export const isSessionJoinableNow = (session, now = new Date()) => {
    const start = getSessionStartDateTime(session?.dateLabel, session?.timeSlot);
    if (!start) return false;

    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return now >= start && now <= end;
};

export const getMentorshipCallRoomId = (session) => {
    const base = session?.requestId || session?.id;
    if (!base) return null;
    return `mentorship-${base}`;
};

export const isMentorBusyAt = (mentorName, dateLabel, timeSlot) => {
    if (!mentorName || !dateLabel || !timeSlot) return false;

    const data = readData();
    const hasPendingRequest = data.requests.some(
        (item) =>
            item.mentorName === mentorName &&
            item.dateLabel === dateLabel &&
            item.timeSlot === timeSlot &&
            item.status === 'pending'
    );

    if (hasPendingRequest) return true;

    return data.upcoming.some(
        (item) =>
            item.mentorName === mentorName &&
            item.dateLabel === dateLabel &&
            item.timeSlot === timeSlot
    );
};
