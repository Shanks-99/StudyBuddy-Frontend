import api from './api';

export const generateQuizWithAI = async (topic, difficulty, numQuestions) => {
    const response = await api.post('/quiz/generate', {
        topic,
        difficulty,
        numQuestions: numQuestions || 5
    }, {
        timeout: 300000 // 5 minute timeout for AI generation
    });
    return response.data;
};

export const createQuiz = async (quizData) => {
    const response = await api.post('/quiz/create', quizData);
    return response.data;
};

export const getAllQuizzes = async () => {
    const response = await api.get('/quiz/all');
    return response.data;
};

export const getQuizById = async (id) => {
    const response = await api.get(`/quiz/${id}`);
    return response.data;
};

export const updateQuiz = async (id, quizData) => {
    const response = await api.put(`/quiz/${id}`, quizData);
    return response.data;
};

export const deleteQuiz = async (id) => {
    const response = await api.delete(`/quiz/${id}`);
    return response.data;
};
