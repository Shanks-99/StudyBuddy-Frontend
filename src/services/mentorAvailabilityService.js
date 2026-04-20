import api from './api';

export const WEEK_DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const formatHour = (hour24) => {
    const meridiem = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    return `${hour12}:00 ${meridiem}`;
};

export const HOURLY_SLOT_OPTIONS = Array.from({ length: 24 }, (_, index) => formatHour(index));
export const MORNING_SLOT_OPTIONS = HOURLY_SLOT_OPTIONS.filter((slot) => slot.endsWith('AM'));
export const AFTERNOON_SLOT_OPTIONS = HOURLY_SLOT_OPTIONS.filter((slot) => slot.endsWith('PM'));

const defaultAvailability = {
    sun: [],
    mon: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
    tue: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
    wed: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
    thu: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
    fri: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM'],
    sat: [],
};

export const DEFAULT_WEEKLY_AVAILABILITY = defaultAvailability;

export const sortSlotsByHour = (slots = []) => {
    const ranking = new Map(HOURLY_SLOT_OPTIONS.map((slot, index) => [slot, index]));
    return [...slots].sort((a, b) => (ranking.get(a) ?? 999) - (ranking.get(b) ?? 999));
};

export const getMentorWeeklyAvailability = async () => {
    const response = await api.get('/mentorship/availability/me');
    return {
        ...defaultAvailability,
        ...(response.data?.availability || {}),
    };
};

export const getMentorAvailabilityByName = async (mentorName) => {
    if (!mentorName) return { ...defaultAvailability };
    const response = await api.get('/mentorship/availability/by-mentor', {
        params: { mentorName },
    });
    return {
        ...defaultAvailability,
        ...(response.data?.availability || {}),
    };
};

export const saveMentorWeeklyAvailability = async (availability) => {
    const response = await api.put('/mentorship/availability/me', availability);
    return {
        ...defaultAvailability,
        ...(response.data?.availability || {}),
    };
};

export const getSlotsForDateFromAvailability = (availability, dayOfMonth, year = 2026, monthIndex = 3) => {
    if (!dayOfMonth) return [];

    const weekdayIndex = new Date(year, monthIndex, dayOfMonth).getDay();
    const key = WEEK_DAYS[weekdayIndex];
    const resolved = {
        ...defaultAvailability,
        ...(availability || {}),
    };

    return Array.isArray(resolved[key]) ? resolved[key] : [];
};

export const getSlotsForDate = async (dayOfMonth, year = 2026, monthIndex = 3) => {
    const availability = await getMentorWeeklyAvailability();
    return getSlotsForDateFromAvailability(availability, dayOfMonth, year, monthIndex);
};

export const getWeekdayKeyFromDate = (dayOfMonth, year = 2026, monthIndex = 3) => {
    if (!dayOfMonth) return null;
    const weekdayIndex = new Date(year, monthIndex, dayOfMonth).getDay();
    return WEEK_DAYS[weekdayIndex] || null;
};
