import api from './api';

let cachedProfile = null;

export const getInstructorMentorProfile = async (forceRefresh = false) => {
    if (cachedProfile && !forceRefresh) return cachedProfile;
    try {
        const response = await api.get('/mentorship/mentor-profile/me');
        cachedProfile = response.data?.profile || null;
        return cachedProfile;
    } catch (error) {
        console.error("Error fetching mentor profile:", error);
        return null;
    }
};

export const clearMentorProfileCache = () => {
    cachedProfile = null;
};

export const getMentorsForStudents = async () => {
    const response = await api.get('/mentorship/mentors');
    return Array.isArray(response.data?.mentors) ? response.data.mentors : [];
};

export const isInstructorMentorProfileComplete = (profile) => {
    if (!profile) return false;

    const required = [
        profile.name,
        profile.email,
        profile.specializedCourses,
        profile.description,
        profile.qualification,
        profile.skillLevel,
        profile.hourlyRate
    ];

    const allFilled = required.every((value) => {
        if (typeof value === 'number') return value > 0;
        return typeof value === 'string' && value.trim().length > 0;
    });

    const hasDegreeFiles = Array.isArray(profile.degreeFiles) && profile.degreeFiles.length > 0;

    return allFilled && hasDegreeFiles;
};

export const saveInstructorMentorProfile = async (profileInput) => {
    const payload = {
        ...profileInput,
        status: 'pending',
        submittedAt: new Date().toISOString(),
    };

    const response = await api.put('/mentorship/mentor-profile/me', payload);
    clearMentorProfileCache();
    return response.data?.profile || null;
};
