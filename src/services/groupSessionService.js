import api from './api';

// ── Student: Create a group session request ──
export const createGroupSessionRequest = async (payload) => {
    const response = await api.post('/group-sessions', payload);
    return response.data?.session || null;
};

// ── Student: Get their group sessions ──
export const getGroupSessionsForStudent = async () => {
    const response = await api.get('/group-sessions/student');
    return Array.isArray(response.data?.sessions) ? response.data.sessions : [];
};

// ── Student: Mark payment as sent (creator) ──
export const markPaymentSent = async (sessionId) => {
    const response = await api.patch(`/group-sessions/${sessionId}/payment-sent`);
    return response.data?.session || null;
};

// ── Student: Join a group session from community ──
export const joinGroupSession = async (sessionId) => {
    const response = await api.post(`/group-sessions/${sessionId}/join`);
    return response.data?.session || null;
};

// ── Student (joiner): Mark join payment as sent ──
export const joinPaymentSent = async (sessionId) => {
    const response = await api.patch(`/group-sessions/${sessionId}/join-payment-sent`);
    return response.data?.session || null;
};

// ── Mentor: Get group session requests ──
export const getGroupRequestsForMentor = async () => {
    const response = await api.get('/group-sessions/mentor');
    return Array.isArray(response.data?.sessions) ? response.data.sessions : [];
};

// ── Mentor: Get all group sessions ──
export const getAllGroupSessionsForMentor = async () => {
    const response = await api.get('/group-sessions/mentor/all');
    return Array.isArray(response.data?.sessions) ? response.data.sessions : [];
};

// ── Mentor: Accept a group request ──
export const acceptGroupRequest = async (sessionId) => {
    const response = await api.patch(`/group-sessions/${sessionId}/accept`);
    return response.data?.session || null;
};

// ── Mentor: Decline a group request ──
export const declineGroupRequest = async (sessionId) => {
    const response = await api.patch(`/group-sessions/${sessionId}/decline`);
    return response.data?.session || null;
};

// ── Mentor: Verify a participant's payment ──
export const verifyPayment = async (sessionId, studentId) => {
    const response = await api.patch(`/group-sessions/${sessionId}/verify-payment`, { studentId });
    return response.data?.session || null;
};

// ── Mentor: Reject a participant's payment ──
export const rejectPayment = async (sessionId, studentId) => {
    const response = await api.patch(`/group-sessions/${sessionId}/reject-payment`, { studentId });
    return response.data?.session || null;
};

// ── Mentor: Verify a joiner's payment ──
export const verifyJoinPayment = async (sessionId, studentId) => {
    const response = await api.patch(`/group-sessions/${sessionId}/verify-join-payment`, { studentId });
    return response.data?.session || null;
};

// ── Mentor: Reject a joiner's payment ──
export const rejectJoinPayment = async (sessionId, studentId) => {
    const response = await api.patch(`/group-sessions/${sessionId}/reject-join-payment`, { studentId });
    return response.data?.session || null;
};

// ── Mentor: Get pending payment verifications ──
export const getPendingPayments = async () => {
    const response = await api.get('/group-sessions/mentor/payments');
    return Array.isArray(response.data?.payments) ? response.data.payments : [];
};

// ── Get a single group session by ID ──
export const getGroupSessionById = async (sessionId) => {
    const response = await api.get(`/group-sessions/${sessionId}`);
    return response.data?.session || null;
};

// ── Mentor: Accept a student's join request ──
export const acceptJoinRequest = async (sessionId, studentId) => {
    const response = await api.patch(`/group-sessions/${sessionId}/accept-join-request`, { studentId });
    return response.data?.session || null;
};

// ── Mentor: Decline a student's join request ──
export const declineJoinRequest = async (sessionId, studentId) => {
    const response = await api.patch(`/group-sessions/${sessionId}/decline-join-request`, { studentId });
    return response.data?.session || null;
};
