const STORAGE_KEY = 'mentorWeeklyAvailability';

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

export const sortSlotsByHour = (slots = []) => {
    const ranking = new Map(HOURLY_SLOT_OPTIONS.map((slot, index) => [slot, index]));
    return [...slots].sort((a, b) => (ranking.get(a) ?? 999) - (ranking.get(b) ?? 999));
};

export const getMentorWeeklyAvailability = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return defaultAvailability;

        const parsed = JSON.parse(raw);
        return {
            ...defaultAvailability,
            ...parsed,
        };
    } catch (error) {
        return defaultAvailability;
    }
};

export const saveMentorWeeklyAvailability = (availability) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(availability));
    return availability;
};

export const getSlotsForDate = (dayOfMonth, year = 2026, monthIndex = 3) => {
    if (!dayOfMonth) return [];

    const weekdayIndex = new Date(year, monthIndex, dayOfMonth).getDay();
    const key = WEEK_DAYS[weekdayIndex];
    const availability = getMentorWeeklyAvailability();

    return Array.isArray(availability[key]) ? availability[key] : [];
};

export const getWeekdayKeyFromDate = (dayOfMonth, year = 2026, monthIndex = 3) => {
    if (!dayOfMonth) return null;
    const weekdayIndex = new Date(year, monthIndex, dayOfMonth).getDay();
    return WEEK_DAYS[weekdayIndex] || null;
};
