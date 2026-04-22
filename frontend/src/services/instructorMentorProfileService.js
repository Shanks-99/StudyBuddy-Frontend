import api from './api';

export const getInstructorMentorProfile = async () => {
    const response = await api.get('/mentorship/mentor-profile/me');
    return response.data?.profile || null;
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
    ];

    const allFilled = required.every((value) => typeof value === 'string' && value.trim().length > 0);
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
    return response.data?.profile || null;
};
