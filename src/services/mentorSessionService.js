import api from './api';

export const createSessionRequest = async (payload) => {
    const response = await api.post('/mentorship/requests', payload);
    return response.data?.session || null;
};

export const getSessionRequestsForMentor = async (mentorName) => {
    const response = await api.get('/mentorship/requests/mentor', {
        params: mentorName ? { mentorName } : {},
    });
    return Array.isArray(response.data?.requests) ? response.data.requests : [];
};

export const acceptSessionRequest = async (requestId, mentorName) => {
    const response = await api.patch(`/mentorship/requests/${requestId}/accept`, {
        mentorName,
    });
    return response.data?.session || null;
};

export const declineSessionRequest = async (requestId, mentorName) => {
    const response = await api.patch(`/mentorship/requests/${requestId}/decline`, {
        mentorName,
    });
    return Boolean(response.data?.session);
};

export const getUpcomingSessionsForMentor = async (mentorName) => {
    const response = await api.get('/mentorship/sessions/upcoming/mentor', {
        params: mentorName ? { mentorName } : {},
    });
    return Array.isArray(response.data?.sessions) ? response.data.sessions : [];
};

export const getUpcomingSessionsForStudent = async () => {
    const response = await api.get('/mentorship/sessions/upcoming/student');
    return Array.isArray(response.data?.sessions) ? response.data.sessions : [];
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
    const base = session?.requestId || session?.id || session?._id;
    if (!base) return null;
    return `mentorship-${base}`;
};

export const isMentorBusyAt = (mentorName, dateLabel, timeSlot) => {
    if (!mentorName || !dateLabel || !timeSlot) return Promise.resolve(false);

    return api
        .get('/mentorship/busy', {
            params: { mentorName, dateLabel, timeSlot },
        })
        .then((response) => Boolean(response.data?.busy));
};
