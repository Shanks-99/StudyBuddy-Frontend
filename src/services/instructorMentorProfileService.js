const STORAGE_KEY = 'instructorMentorProfile';

export const getInstructorMentorProfile = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
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

export const saveInstructorMentorProfile = (profileInput) => {
    const payload = {
        ...profileInput,
        status: 'pending',
        submittedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return payload;
};
