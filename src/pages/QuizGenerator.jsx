import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, Trash2, Eye, Save, X, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import InstructorSidebar from '../components/InstructorSidebar';
import { io } from 'socket.io-client';
import { generateQuizWithAI, createQuiz, getAllQuizzes, deleteQuiz } from '../services/quizService';

const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_URL || (isLocalhost
    ? 'http://localhost:5000'
    : 'https://studybuddy-backend-pl2i.onrender.com');

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
        const socket = io(SOCKET_SERVER_URL, {
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
            await generateQuizWithAI(aiForm.topic, aiForm.difficulty, aiForm.numQuestions);
            setAiForm({ topic: '', difficulty: 'medium', numQuestions: 5 });
        } catch (error) {
            console.error("API Call error:", error);
            if (!isGenerating) {
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
        <div className="flex h-screen bg-slate-50 dark:bg-[#0a0a0f] text-slate-900 dark:text-white font-sans transition-colors duration-300 overflow-hidden relative">
            
            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/5 dark:bg-[#8c30e8]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 dark:bg-purple-900/10 rounded-full blur-[120px]" />
            </div>

            <InstructorSidebar activeTab="quiz-generator" />

            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                
                {/* ── Header ── */}
                <div className="bg-white/80 dark:bg-[#0f0a16]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 p-6 z-20 sticky top-0 transition-colors">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-purple-600 dark:bg-[#8c30e8] rounded-xl shadow-md flex items-center justify-center">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-serif font-bold text-slate-900 dark:text-white tracking-wide">Quiz Generator</h1>
                                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Create quizzes with AI or manually</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Main Content ── */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-8">
                        
                        {/* AI Generation Card */}
                        <div className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-sm rounded-2xl p-6 md:p-8 relative overflow-hidden">
                            {/* Decorative blur inside card */}
                            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-600/5 dark:bg-[#8c30e8]/10 rounded-bl-full pointer-events-none" />

                            <div className="flex items-center gap-2 mb-6 relative z-10">
                                <Sparkles className="w-6 h-6 text-purple-600 dark:text-[#8c30e8]" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">AI-Powered Generation</h2>
                            </div>
                            
                            <form onSubmit={handleAIGenerate} className="space-y-5 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="flex flex-col">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">Topic</label>
                                        <input
                                            type="text"
                                            value={aiForm.topic}
                                            onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
                                            placeholder="e.g., World War II"
                                            required
                                            className="w-full px-4 py-2.5 rounded-xl border transition-colors bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-slate-400 dark:bg-[#1a1524] dark:border-white/10 dark:text-white dark:placeholder-white/30 dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8] text-sm"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">Difficulty</label>
                                        <select
                                            value={aiForm.difficulty}
                                            onChange={(e) => setAiForm({ ...aiForm, difficulty: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border transition-colors bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:bg-[#1a1524] dark:border-white/10 dark:text-white dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8] text-sm"
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">Number of Questions</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={aiForm.numQuestions}
                                            onChange={(e) => setAiForm({ ...aiForm, numQuestions: parseInt(e.target.value) || 5 })}
                                            required
                                            className="w-full px-4 py-2.5 rounded-xl border transition-colors bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:bg-[#1a1524] dark:border-white/10 dark:text-white dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8] text-sm"
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isGenerating}
                                    className="w-full py-3.5 rounded-xl font-bold text-white shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] shadow-purple-500/20 flex items-center justify-center text-sm mt-2"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5 inline mr-2" />
                                            Generate Quiz with AI
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Status Message */}
                            {(generationStatus === 'generating' || generationStatus === 'success') && (
                                <div className="mt-5 flex items-center justify-center p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-100 dark:border-white/5">
                                    {generationStatus === 'generating' && (
                                        <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span className="font-bold text-sm">Generating Quiz...</span>
                                        </div>
                                    )}
                                    {generationStatus === 'success' && (
                                        <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
                                            <CheckCircle2 className="w-5 h-5" />
                                            <span className="font-bold text-sm">Quiz generated Successfully!</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Manual Creation Toggle */}
                        <div className="flex justify-center">
                            <button
                                onClick={() => setShowManualForm(!showManualForm)}
                                className="px-6 py-3 bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 dark:bg-[#8c30e8]/10 dark:text-white dark:border-[#8c30e8]/30 dark:hover:bg-[#8c30e8]/20 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center text-sm"
                            >
                                {showManualForm ? (
                                    <>Hide Manual Form</>
                                ) : (
                                    <><Plus className="w-4 h-4 inline mr-2" /> Create Quiz Manually</>
                                )}
                            </button>
                        </div>

                        {/* Manual Creation Form */}
                        {showManualForm && (
                            <div className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-sm rounded-2xl p-6 md:p-8 animate-in fade-in slide-in-from-top-4 duration-300">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Manual Quiz Creation</h2>
                                <form onSubmit={handleManualCreate} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="flex flex-col">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">Quiz Title</label>
                                            <input
                                                type="text"
                                                value={manualForm.title}
                                                onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                                                required
                                                className="w-full px-4 py-2.5 rounded-xl border transition-colors bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:bg-[#1a1524] dark:border-white/10 dark:text-white dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8] text-sm"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">Subject</label>
                                            <input
                                                type="text"
                                                value={manualForm.subject}
                                                onChange={(e) => setManualForm({ ...manualForm, subject: e.target.value })}
                                                required
                                                className="w-full px-4 py-2.5 rounded-xl border transition-colors bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:bg-[#1a1524] dark:border-white/10 dark:text-white dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8] text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">Description</label>
                                        <textarea
                                            value={manualForm.description}
                                            onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                                            rows="2"
                                            className="w-full px-4 py-2.5 rounded-xl border transition-colors bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:bg-[#1a1524] dark:border-white/10 dark:text-white dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8] text-sm resize-none"
                                        />
                                    </div>

                                    <div className="flex flex-col md:w-1/2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">Difficulty</label>
                                        <select
                                            value={manualForm.difficulty}
                                            onChange={(e) => setManualForm({ ...manualForm, difficulty: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border transition-colors bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:bg-[#1a1524] dark:border-white/10 dark:text-white dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8] text-sm"
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>

                                    {/* Add Question Section */}
                                    <div className="bg-slate-50 dark:bg-black/20 rounded-xl p-5 border border-slate-200 dark:border-white/5 mt-6">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wide">Add Question</h3>
                                        <div className="space-y-4">
                                            <div className="flex flex-col">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">Question Text</label>
                                                <input
                                                    type="text"
                                                    value={questionForm.question}
                                                    onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                                                    placeholder="Enter your question"
                                                    className="w-full px-4 py-2.5 rounded-xl border transition-colors bg-white border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:bg-[#1a1524] dark:border-white/10 dark:text-white dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8] text-sm"
                                                />
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {questionForm.options.map((option, idx) => (
                                                    <div className="flex flex-col" key={idx}>
                                                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">Option {idx + 1}</label>
                                                        <input
                                                            type="text"
                                                            value={option}
                                                            onChange={(e) => {
                                                                const newOptions = [...questionForm.options];
                                                                newOptions[idx] = e.target.value;
                                                                setQuestionForm({ ...questionForm, options: newOptions });
                                                            }}
                                                            placeholder={`Option ${idx + 1}`}
                                                            className="w-full px-4 py-2.5 rounded-xl border transition-colors bg-white border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:bg-[#1a1524] dark:border-white/10 dark:text-white dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8] text-sm"
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex flex-col">
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">Correct Answer</label>
                                                    <select
                                                        value={questionForm.correctAnswer}
                                                        onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: parseInt(e.target.value) })}
                                                        className="w-full px-4 py-2.5 rounded-xl border transition-colors bg-white border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:bg-[#1a1524] dark:border-white/10 dark:text-white dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8] text-sm"
                                                    >
                                                        <option value={0}>Option 1</option>
                                                        <option value={1}>Option 2</option>
                                                        <option value={2}>Option 3</option>
                                                        <option value={3}>Option 4</option>
                                                    </select>
                                                </div>
                                                <div className="flex flex-col">
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">Explanation (Optional)</label>
                                                    <input
                                                        type="text"
                                                        value={questionForm.explanation}
                                                        onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                                                        placeholder="Explain the correct answer"
                                                        className="w-full px-4 py-2.5 rounded-xl border transition-colors bg-white border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:bg-[#1a1524] dark:border-white/10 dark:text-white dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8] text-sm"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={addQuestion}
                                                className="w-full mt-2 px-4 py-2.5 bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 dark:bg-[#8c30e8]/10 dark:border-[#8c30e8]/30 dark:text-white dark:hover:bg-[#8c30e8]/20 rounded-xl font-bold transition-all flex items-center justify-center text-sm"
                                            >
                                                <Plus className="w-4 h-4 inline mr-2 stroke-[2.5]" />
                                                Add Question
                                            </button>
                                        </div>
                                    </div>

                                    {/* Added Questions List */}
                                    {manualForm.questions.length > 0 && (
                                        <div className="bg-slate-50 dark:bg-black/20 rounded-xl p-5 border border-slate-200 dark:border-white/5">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Questions Added ({manualForm.questions.length})</h3>
                                            <div className="space-y-2">
                                                {manualForm.questions.map((q, idx) => (
                                                    <div key={idx} className="flex items-center justify-between bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 p-3 rounded-lg">
                                                        <span className="text-slate-700 dark:text-gray-200 text-sm font-medium truncate pr-4">{idx + 1}. {q.question}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeQuestion(idx)}
                                                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 rounded-md transition-colors"
                                                            title="Remove Question"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
                                        <button
                                            type="button"
                                            onClick={() => setShowManualForm(false)}
                                            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-300 rounded-xl font-bold transition-colors text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white rounded-xl font-bold shadow-md transition-colors flex items-center justify-center text-sm"
                                        >
                                            <Save className="w-4 h-4 inline mr-2" />
                                            Save Quiz
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Quizzes List */}
                        <div className="bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/30 shadow-sm rounded-2xl p-6 md:p-8">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">My Quizzes ({quizzes.length})</h2>
                            
                            {quizzes.length === 0 ? (
                                <div className="text-slate-500 dark:text-gray-500 text-center py-10 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5 text-sm font-medium">
                                    No quizzes yet. Create your first quiz!
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {quizzes.map((quiz) => (
                                        <div key={quiz._id} className="bg-slate-50 dark:bg-white/5 rounded-2xl p-5 border border-slate-200 dark:border-white/10 hover:border-purple-300 dark:hover:border-[#8c30e8]/50 transition-all hover:-translate-y-1 group flex flex-col h-full">
                                            <h3 className="text-slate-900 dark:text-white font-bold mb-2 group-hover:text-purple-600 dark:group-hover:text-[#8c30e8] transition-colors truncate">
                                                {quiz.title}
                                            </h3>
                                            <p className="text-slate-500 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-1">
                                                {quiz.description || "No description provided."}
                                            </p>
                                            
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="px-2.5 py-1 bg-purple-100 text-purple-600 dark:bg-[#8c30e8]/20 dark:text-white text-[10px] font-bold uppercase tracking-wider rounded-md border border-purple-200 dark:border-[#8c30e8]/30">
                                                    {quiz.difficulty}
                                                </span>
                                                <span className="text-xs font-semibold text-slate-500 dark:text-gray-400">
                                                    {quiz.questions.length} questions
                                                </span>
                                            </div>

                                            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-white/10">
                                                <button
                                                    onClick={() => setViewingQuiz(quiz)}
                                                    className="flex-1 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-200 rounded-lg text-sm font-bold transition-colors flex items-center justify-center border border-transparent dark:border-white/5"
                                                >
                                                    <Eye className="w-4 h-4 inline mr-1.5" />
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(quiz._id)}
                                                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-500 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 rounded-lg transition-colors border border-transparent dark:border-red-500/20"
                                                    title="Delete Quiz"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-[#191121] rounded-3xl p-6 md:p-8 max-w-3xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar border border-slate-200 dark:border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 relative">
                        
                        {/* Decorative blur */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-purple-500/10 dark:bg-[#8c30e8]/20 rounded-full blur-[60px] pointer-events-none" />

                        <div className="flex items-start justify-between mb-2 relative z-10">
                            <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white pr-4 leading-tight">
                                {viewingQuiz.title}
                            </h2>
                            <button
                                onClick={() => setViewingQuiz(null)}
                                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 dark:bg-white/10 dark:hover:bg-white/20 dark:text-gray-300 rounded-full transition-colors shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-slate-500 dark:text-gray-400 text-sm mb-6 relative z-10 font-medium">
                            {viewingQuiz.description}
                        </p>
                        
                        <div className="space-y-4 relative z-10">
                            {viewingQuiz.questions.map((q, idx) => (
                                <div key={idx} className="bg-slate-50 dark:bg-black/20 rounded-2xl p-5 border border-slate-200 dark:border-white/5">
                                    <p className="text-slate-900 dark:text-white font-bold mb-4 text-base">
                                        <span className="text-purple-600 dark:text-[#8c30e8] mr-1">{idx + 1}.</span> {q.question}
                                    </p>
                                    <div className="space-y-2 mb-4">
                                        {q.options.map((option, optIdx) => (
                                            <div
                                                key={optIdx}
                                                className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                                                    optIdx === q.correctAnswer
                                                        ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-400'
                                                        : 'bg-white border-slate-200 text-slate-700 dark:bg-white/5 dark:border-white/5 dark:text-gray-300'
                                                }`}
                                            >
                                                <span className="font-bold mr-2 opacity-70">{String.fromCharCode(65 + optIdx)}.</span> {option}
                                                {optIdx === q.correctAnswer && ' ✓'}
                                            </div>
                                        ))}
                                    </div>
                                    {q.explanation && (
                                        <div className="bg-purple-50 dark:bg-[#8c30e8]/10 border border-purple-100 dark:border-[#8c30e8]/20 p-3 rounded-xl text-sm text-slate-700 dark:text-gray-300">
                                            <strong className="text-purple-700 dark:text-[#8c30e8]">Explanation:</strong> {q.explanation}
                                        </div>
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