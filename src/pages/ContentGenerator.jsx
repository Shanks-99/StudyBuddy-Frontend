import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Copy, Loader2, Sparkles, Square } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateNotes } from '../services/notesService';
import Sidebar from '../components/Sidebar';

const ContentGenerator = () => {
    const [messages, setMessages] = useState(() => {
        // Load messages from localStorage on initial render
        const savedMessages = localStorage.getItem('contentGeneratorMessages');
        if (savedMessages) {
            try {
                return JSON.parse(savedMessages);
            } catch (error) {
                console.error('Failed to parse saved messages:', error);
            }
        }
        // Default welcome message
        return [
            {
                role: 'assistant',
                content: '👋 Hi! I\'m your AI study assistant. Ask me anything, and I\'ll generate concise study notes for you!',
            }
        ];
    });
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);

    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const abortControllerRef = useRef(null);
    const shouldAutoScrollRef = useRef(true);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Check if user is near the bottom of the scroll container
    const isNearBottom = () => {
        const container = messagesContainerRef.current;
        if (!container) return true;

        const threshold = 100; // pixels from bottom
        const position = container.scrollTop + container.clientHeight;
        const height = container.scrollHeight;

        return position >= height - threshold;
    };

    // Handle scroll event to track if user manually scrolled up
    const handleScroll = () => {
        shouldAutoScrollRef.current = isNearBottom();
    };

    // Save messages to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('contentGeneratorMessages', JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        // Only auto-scroll if user is at the bottom
        if (shouldAutoScrollRef.current) {
            scrollToBottom();
        }
    }, [messages]);

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!input.trim()) return;

        const userMessage = input;

        // Add user message and empty assistant message
        const newMessages = [
            ...messages,
            { role: 'user', content: userMessage },
            { role: 'assistant', content: '' } // Placeholder for streaming response
        ];
        setMessages(newMessages);

        setInput('');
        setIsLoading(true);
        shouldAutoScrollRef.current = true; // Reset to auto-scroll for new messages


        // Create new AbortController
        abortControllerRef.current = new AbortController();

        try {
            await generateNotes(
                userMessage,
                (chunk) => {
                    // Update the last message (assistant's response) with the new chunk
                    setMessages(prev => {
                        const updated = [...prev];
                        updated[updated.length - 1] = {
                            ...updated[updated.length - 1],
                            content: chunk
                        };
                        return updated;
                    });
                },
                abortControllerRef.current.signal
            );
        } catch (error) {
            if (error.name === 'AbortError') {
                // Handle stop gracefully
                setMessages(prev => {
                    const updated = [...prev];
                    const lastMsg = updated[updated.length - 1];
                    // If content is empty when stopped, show a message
                    if (!lastMsg.content) {
                        updated[updated.length - 1] = {
                            role: 'assistant',
                            content: '🛑 Generation stopped.',
                        };
                    }
                    return updated;
                });
            } else {
                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                        role: 'assistant',
                        content: `❌ Error: ${error.message}`,
                        isError: true,
                    };
                    return updated;
                });
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    const handleCopy = async (content, index) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 overflow-hidden">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Chat Container */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 p-4">
                    <div className="flex items-center justify-between max-w-4xl mx-auto">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">Content Generator</h1>
                                    <p className="text-xs text-gray-400">Study Buddy</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4">
                    <div className="max-w-4xl mx-auto space-y-4">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl p-4 ${message.role === 'user'
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                        : message.isError
                                            ? 'bg-red-500/20 border border-red-500/30 text-red-200'
                                            : 'bg-white/10 backdrop-blur-lg border border-white/20 text-white'
                                        }`}
                                >
                                    {message.role === 'assistant' ? (
                                        <div className="prose prose-invert max-w-none">
                                            <ReactMarkdown
                                                components={{
                                                    h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-3 mt-4" {...props} />,
                                                    h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-2 mt-3" {...props} />,
                                                    h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-2 mt-3" {...props} />,
                                                    p: ({ node, ...props }) => <p className="mb-3 leading-relaxed" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="mb-3 ml-4 space-y-1" {...props} />,
                                                    ol: ({ node, ...props }) => <ol className="mb-3 ml-4 space-y-1" {...props} />,
                                                    li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                                                    strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
                                                    code: ({ node, inline, ...props }) =>
                                                        inline ?
                                                            <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm" {...props} /> :
                                                            <code className="block bg-white/10 p-3 rounded-lg my-2 overflow-x-auto" {...props} />,
                                                }}
                                            >
                                                {message.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</div>
                                    )}

                                    {message.role === 'assistant' && !message.isError && message.content && (
                                        <button
                                            onClick={() => handleCopy(message.content, index)}
                                            className="mt-3 flex items-center gap-2 text-xs text-gray-300 hover:text-white transition-colors"
                                        >
                                            {copiedIndex === index ? (
                                                <>✓ Copied</>
                                            ) : (
                                                <>
                                                    <Copy className="w-3 h-3" />
                                                    Copy
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 text-white">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Generating notes...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="bg-black/20 backdrop-blur-xl border-t border-white/10 p-4">
                    <div className="max-w-4xl mx-auto">
                        <form onSubmit={handleSubmit} className="flex items-end gap-2">
                            <div className="flex-1 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSubmit(e);
                                        }
                                    }}
                                    placeholder="Type your message... (Shift+Enter for new line)"
                                    className="w-full bg-transparent text-white placeholder-gray-400 px-4 py-3 focus:outline-none resize-none"
                                    rows="1"
                                    style={{ minHeight: '48px', maxHeight: '200px' }}
                                    disabled={isLoading}
                                />
                            </div>

                            {isLoading ? (
                                <button
                                    type="button"
                                    onClick={handleStop}
                                    className="p-3 bg-red-500 hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/50 rounded-xl transition-all"
                                    title="Stop Generation"
                                >
                                    <Square className="w-5 h-5 text-white fill-current" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:shadow-purple-500/50 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-5 h-5 text-white" />
                                </button>
                            )}
                        </form>

                        <p className="text-xs text-gray-400 mt-2 text-center">
                            Press Enter to send • Shift+Enter for new line
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContentGenerator;
