import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, Trash2, Edit, Eye, Save, X, Loader2, FileText } from 'lucide-react';
import InstructorSidebar from '../components/InstructorSidebar';
import { io } from 'socket.io-client';
import { generateQuizWithAI, createQuiz, getAllQuizzes, deleteQuiz, updateQuiz } from '../services/quizService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const QuizGenerator = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showManualForm, setShowManualForm] = useState(false);
    const [editingQuiz, setEditingQuiz] = useState(null);
    const [viewingQuiz, setViewingQuiz] = useState(null);
    const [generationLogs, setGenerationLogs] = useState([]);
    const navigate = useNavigate();

    // AI Generation Form
    const [aiForm, setAiForm] = useState({
        topic: '',
        difficulty: 'medium',
        numQuestions: 5
    });

    // Manual Quiz Form
    const [manualForm, setManualForm] = useState({
        title: '',
        description: '',
        subject: '',
        difficulty: 'medium',
        questions: []
    });

    // Single Question Form
    const [questionForm, setQuestionForm] = useState({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: ''
    });

    const [generationStatus, setGenerationStatus] = useState('idle'); // idle, generating, success, error

    useEffect(() => {
        fetchQuizzes();

        // Socket.io connection
        const socket = io(process.env.REACT_APP_SOCKET_URL || 'https://studybuddy-backend-pl2i.onrender.com', {
            transports: ['websocket', 'polling'],
            withCredentials: true
        });

        socket.on('connect', () => {
            console.log('Connected to socket server with ID:', socket.id);
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from socket server');
        });

        socket.on('quiz_generation_progress', (data) => {
            console.log('Progress received:', data);
        });

        socket.on('quiz_generation_error', (data) => {
            console.error('Generation error received:', data);
            setIsGenerating(false);
            setGenerationStatus('error');
            alert(`Generation failed: ${data.error}`);
        });

        socket.on('quiz_generation_complete', () => {
            console.log('Generation complete received');
            setIsGenerating(false);
            setGenerationStatus('success');
            fetchQuizzes();
            // Clear success message after 3 seconds
            setTimeout(() => setGenerationStatus('idle'), 3000);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const fetchQuizzes = async () => {
        try {
            const data = await getAllQuizzes();
            setQuizzes(data.quizzes);
        } catch (error) {
            console.error('Failed to fetch quizzes:', error);
        }
    };

    const handleAIGenerate = async (e) => {
        e.preventDefault();
        setIsGenerating(true);
        setGenerationStatus('generating');
        try {
            // We don't need to await the result here as we'll get updates via socket
            // But we still call the API to trigger the process
            await generateQuizWithAI(aiForm.topic, aiForm.difficulty, aiForm.numQuestions);
            setAiForm({ topic: '', difficulty: 'medium', numQuestions: 5 });
        } catch (error) {
            console.error("API Call error:", error);
            // Error handling is also managed by socket, but this catches immediate API failures
            if (!isGenerating) { // Only alert if socket hasn't already handled it
                alert(error.response?.data?.msg || 'Failed to initiate generation');
                setIsGenerating(false);
                setGenerationStatus('error');
            }
        }
    };

    const addQuestion = () => {
        if (!questionForm.question || questionForm.options.some(opt => !opt)) {
            alert('Please fill all question fields');
            return;
        }
        setManualForm({
            ...manualForm,
            questions: [...manualForm.questions, { ...questionForm }]
        });
        setQuestionForm({
            question: '',
            options: ['', '', '', ''],
            correctAnswer: 0,
            explanation: ''
        });
    };

    const removeQuestion = (index) => {
        setManualForm({
            ...manualForm,
            questions: manualForm.questions.filter((_, i) => i !== index)
        });
    };

    const handleManualCreate = async (e) => {
        e.preventDefault();
        if (manualForm.questions.length === 0) {
            alert('Please add at least one question');
            return;
        }
        try {
            const data = await createQuiz(manualForm);
            setQuizzes([data.quiz, ...quizzes]);
            setManualForm({
                title: '',
                description: '',
                subject: '',
                difficulty: 'medium',
                questions: []
            });
            setShowManualForm(false);
            alert('Quiz created successfully!');
        } catch (error) {
            alert(error.response?.data?.msg || 'Failed to create quiz');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this quiz?')) return;
        try {
            await deleteQuiz(id);
            setQuizzes(quizzes.filter(q => q._id !== id));
        } catch (error) {
            alert('Failed to delete quiz');
        }
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 overflow-hidden">
            <InstructorSidebar activeTab="quiz-generator" />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 p-4">
                    <div className="flex items-center justify-between max-w-7xl mx-auto">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Quiz Generator</h1>
                                <p className="text-xs text-gray-400">Create quizzes with AI or manually</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* AI Generation Card */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="w-6 h-6 text-purple-400" />
                                <h2 className="text-2xl font-bold text-white">AI-Powered Generation</h2>
                            </div>
                            <form onSubmit={handleAIGenerate} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input
                                        label="Topic"
                                        value={aiForm.topic}
                                        onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
                                        placeholder="e.g., World War II"
                                        required
                                    />
                                    <div>
                                        <label className="block text-gray-300 text-sm font-bold mb-2">Difficulty</label>
                                        <select
                                            value={aiForm.difficulty}
                                            onChange={(e) => setAiForm({ ...aiForm, difficulty: e.target.value })}
                                            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                    <Input
                                        label="Number of Questions"
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={aiForm.numQuestions}
                                        onChange={(e) => setAiForm({ ...aiForm, numQuestions: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                                <Button type="submit" variant="primary" disabled={isGenerating}>
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 inline mr-2" />
                                            Generate Quiz with AI
                                        </>
                                    )}
                                </Button>
                            </form>

                            {/* Status Message */}
                            {(generationStatus === 'generating' || generationStatus === 'success') && (
                                <div className="mt-4 flex items-center justify-center p-4 bg-black/30 rounded-xl border border-white/10">
                                    {generationStatus === 'generating' && (
                                        <div className="flex items-center gap-3 text-purple-400">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span className="font-medium">Generating Quiz...</span>
                                        </div>
                                    )}
                                    {generationStatus === 'success' && (
                                        <div className="flex items-center gap-3 text-green-400">
                                            <Sparkles className="w-5 h-5" />
                                            <span className="font-medium">Quiz generated Successfully</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Manual Creation Toggle */}
                        <div className="flex justify-center">
                            <button
                                onClick={() => setShowManualForm(!showManualForm)}
                                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/50 transition-all"
                            >
                                <Plus className="w-5 h-5 inline mr-2" />
                                {showManualForm ? 'Hide Manual Form' : 'Create Quiz Manually'}
                            </button>
                        </div>

                        {/* Manual Creation Form */}
                        {showManualForm && (
                            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
                                <h2 className="text-2xl font-bold text-white mb-4">Manual Quiz Creation</h2>
                                <form onSubmit={handleManualCreate} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Quiz Title"
                                            value={manualForm.title}
                                            onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                                            required
                                        />
                                        <Input
                                            label="Subject"
                                            value={manualForm.subject}
                                            onChange={(e) => setManualForm({ ...manualForm, subject: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <Input
                                        label="Description"
                                        value={manualForm.description}
                                        onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                                    />
                                    <div>
                                        <label className="block text-gray-300 text-sm font-bold mb-2">Difficulty</label>
                                        <select
                                            value={manualForm.difficulty}
                                            onChange={(e) => setManualForm({ ...manualForm, difficulty: e.target.value })}
                                            className="shadow border rounded w-full py-2 px-3 text-gray-700"
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>

                                    {/* Add Question Section */}
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <h3 className="text-lg font-bold text-white mb-3">Add Question</h3>
                                        <div className="space-y-3">
                                            <Input
                                                label="Question"
                                                value={questionForm.question}
                                                onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                                                placeholder="Enter your question"
                                            />
                                            {questionForm.options.map((option, idx) => (
                                                <Input
                                                    key={idx}
                                                    label={`Option ${idx + 1}`}
                                                    value={option}
                                                    onChange={(e) => {
                                                        const newOptions = [...questionForm.options];
                                                        newOptions[idx] = e.target.value;
                                                        setQuestionForm({ ...questionForm, options: newOptions });
                                                    }}
                                                    placeholder={`Option ${idx + 1}`}
                                                />
                                            ))}
                                            <div>
                                                <label className="block text-gray-300 text-sm font-bold mb-2">Correct Answer</label>
                                                <select
                                                    value={questionForm.correctAnswer}
                                                    onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: parseInt(e.target.value) })}
                                                    className="shadow border rounded w-full py-2 px-3 text-gray-700"
                                                >
                                                    <option value={0}>Option 1</option>
                                                    <option value={1}>Option 2</option>
                                                    <option value={2}>Option 3</option>
                                                    <option value={3}>Option 4</option>
                                                </select>
                                            </div>
                                            <Input
                                                label="Explanation (Optional)"
                                                value={questionForm.explanation}
                                                onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                                                placeholder="Explain the correct answer"
                                            />
                                            <button
                                                type="button"
                                                onClick={addQuestion}
                                                className="w-full px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all border border-blue-500/30"
                                            >
                                                <Plus className="w-4 h-4 inline mr-2" />
                                                Add Question
                                            </button>
                                        </div>
                                    </div>

                                    {/* Questions List */}
                                    {manualForm.questions.length > 0 && (
                                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                            <h3 className="text-lg font-bold text-white mb-3">Questions ({manualForm.questions.length})</h3>
                                            <div className="space-y-2">
                                                {manualForm.questions.map((q, idx) => (
                                                    <div key={idx} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                                                        <span className="text-white text-sm">{idx + 1}. {q.question}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeQuestion(idx)}
                                                            className="p-1 bg-red-500/20 rounded hover:bg-red-500/30"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-400" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <Button type="submit" variant="primary">
                                            <Save className="w-4 h-4 inline mr-2" />
                                            Create Quiz
                                        </Button>
                                        <button
                                            type="button"
                                            onClick={() => setShowManualForm(false)}
                                            className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30"
                                        >
                                            <X className="w-4 h-4 inline mr-2" />
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Quizzes List */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
                            <h2 className="text-2xl font-bold text-white mb-4">My Quizzes ({quizzes.length})</h2>
                            {quizzes.length === 0 ? (
                                <p className="text-gray-400 text-center py-8">No quizzes yet. Create your first quiz!</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {quizzes.map((quiz) => (
                                        <div key={quiz._id} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all">
                                            <h3 className="text-white font-bold mb-2">{quiz.title}</h3>
                                            <p className="text-gray-400 text-sm mb-2">{quiz.description}</p>
                                            <div className="flex items-center gap-2 mb-3 text-xs">
                                                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                                                    {quiz.difficulty}
                                                </span>
                                                <span className="text-gray-400">{quiz.questions.length} questions</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setViewingQuiz(quiz)}
                                                    className="flex-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 text-sm"
                                                >
                                                    <Eye className="w-3 h-3 inline mr-1" />
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(quiz._id)}
                                                    className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 text-sm"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* View Quiz Modal */}
            {viewingQuiz && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-900 rounded-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto border border-white/20">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-white">{viewingQuiz.title}</h2>
                            <button
                                onClick={() => setViewingQuiz(null)}
                                className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30"
                            >
                                <X className="w-5 h-5 text-red-400" />
                            </button>
                        </div>
                        <p className="text-gray-400 mb-4">{viewingQuiz.description}</p>
                        <div className="space-y-4">
                            {viewingQuiz.questions.map((q, idx) => (
                                <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <p className="text-white font-bold mb-3">{idx + 1}. {q.question}</p>
                                    <div className="space-y-2 mb-3">
                                        {q.options.map((option, optIdx) => (
                                            <div
                                                key={optIdx}
                                                className={`p-2 rounded-lg ${optIdx === q.correctAnswer
                                                    ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                                                    : 'bg-white/5 text-gray-300'
                                                    }`}
                                            >
                                                {String.fromCharCode(65 + optIdx)}. {option}
                                                {optIdx === q.correctAnswer && ' ✓'}
                                            </div>
                                        ))}
                                    </div>
                                    {q.explanation && (
                                        <p className="text-sm text-gray-400 italic">
                                            <strong>Explanation:</strong> {q.explanation}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizGenerator;
