import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Copy, Loader2, Sparkles, Square, Maximize2, Minimize2, Download, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateNotes } from '../services/notesService';
import Sidebar from '../components/Sidebar';

const ContentGenerator = () => {
    const [messages, setMessages] = useState(() => {
        const savedMessages = localStorage.getItem('contentGeneratorMessages');
        if (savedMessages) {
            try {
                return JSON.parse(savedMessages);
            } catch (error) {
                console.error('Failed to parse saved messages:', error);
            }
        }
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
    
    // Preview States
    const [isPreviewMaximized, setIsPreviewMaximized] = useState(false);
    const [copiedPreview, setCopiedPreview] = useState(false);

    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const abortControllerRef = useRef(null);
    const shouldAutoScrollRef = useRef(true);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const isNearBottom = () => {
        const container = messagesContainerRef.current;
        if (!container) return true;
        const threshold = 100;
        const position = container.scrollTop + container.clientHeight;
        const height = container.scrollHeight;
        return position >= height - threshold;
    };

    const handleScroll = () => {
        shouldAutoScrollRef.current = isNearBottom();
    };

    useEffect(() => {
        localStorage.setItem('contentGeneratorMessages', JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
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

        const newMessages = [
            ...messages,
            { role: 'user', content: userMessage },
            { role: 'assistant', content: '' } 
        ];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);
        shouldAutoScrollRef.current = true;

        abortControllerRef.current = new AbortController();

        try {
            await generateNotes(
                userMessage,
                (chunk) => {
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
                setMessages(prev => {
                    const updated = [...prev];
                    const lastMsg = updated[updated.length - 1];
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

    const handleCopyChatBubble = async (content, index) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Auto-extract latest valid AI response for the Side Preview
    const latestAssistantMessage = messages
        .slice()
        .reverse()
        .find(m => m.role === 'assistant' && !m.isError && m.content !== '👋 Hi! I\'m your AI study assistant. Ask me anything, and I\'ll generate concise study notes for you!');
    
    const previewContent = latestAssistantMessage ? latestAssistantMessage.content : "";

    const handleCopyPreview = async () => {
        if (previewContent) {
            try {
                await navigator.clipboard.writeText(previewContent);
                setCopiedPreview(true);
                setTimeout(() => setCopiedPreview(false), 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        }
    };

    const handleDownloadPreview = () => {
        if (!previewContent.trim()) return;
        const blob = new Blob([previewContent], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `StudyBuddy-Notes-${Date.now()}.txt`;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex h-screen bg-background dark:bg-[#0a0a0f] text-foreground dark:text-white font-sans relative overflow-hidden">
            {/* Background accent glow */}
            <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-60 bg-purple-500/10 dark:bg-[#8c30e8]/10 blur-[120px] rounded-full" />
            </div>

            {/* Sidebar */}
            <Sidebar />

            {/* Main Wrapper */}
            <div className="flex-1 flex flex-col overflow-hidden z-10 relative">
                
                {/* Header */}
                <div className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.06] p-4 shrink-0">
                    <div className="flex items-center gap-3 max-w-7xl mx-auto">
                        <div className="p-2.5 bg-purple-50 text-purple-600 dark:bg-[#8c30e8]/20 dark:text-[#8c30e8] rounded-xl shadow-sm">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-wide text-slate-900 dark:text-white">Content Generator</h1>
                            <p className="text-xs font-bold tracking-wider text-slate-500 dark:text-gray-400 uppercase">AI Study Buddy</p>
                        </div>
                    </div>
                </div>

                {/* 2-Column Split Area */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    
                    {/* LEFT PANEL: Chat Interface */}
                    <div className="flex-1 flex flex-col lg:w-1/2 border-r border-transparent lg:border-slate-200 lg:dark:border-white/[0.06] relative">
                        
                        {/* Messages Area */}
                        <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar bg-slate-50/50 dark:bg-transparent">
                            <div className="max-w-3xl mx-auto space-y-6">
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[85%] rounded-2xl p-5 text-sm leading-relaxed shadow-sm ${
                                                message.role === 'user'
                                                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 dark:from-[#8c30e8] dark:to-purple-500 text-white rounded-tr-sm shadow-purple-500/20'
                                                    : message.isError
                                                        ? 'bg-red-50 border border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 rounded-tl-sm'
                                                        : 'bg-white border border-slate-200 text-slate-700 dark:bg-[#191121] dark:border-[#8c30e8]/30 dark:text-gray-200 rounded-tl-sm'
                                            }`}
                                        >
                                            {message.role === 'assistant' ? (
                                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                                    <ResultRenderer content={message.content} />
                                                </div>
                                            ) : (
                                                <div className="whitespace-pre-wrap break-words">{message.content}</div>
                                            )}

                                            {message.role === 'assistant' && !message.isError && message.content && (
                                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end lg:hidden">
                                                    <button
                                                        onClick={() => handleCopyChatBubble(message.content, index)}
                                                        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-purple-600 dark:text-gray-500 dark:hover:text-[#8c30e8] transition-colors"
                                                    >
                                                        {copiedIndex === index ? (
                                                            <span className="text-green-500">✓ Copied</span>
                                                        ) : (
                                                            <><Copy className="w-3.5 h-3.5" /> Copy</>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white border border-slate-200 dark:bg-[#191121] dark:border-[#8c30e8]/30 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                                            <div className="flex items-center gap-3 text-slate-600 dark:text-gray-300 text-sm font-medium">
                                                <Loader2 className="w-4 h-4 animate-spin text-purple-600 dark:text-[#8c30e8]" />
                                                <span>Generating insight...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="bg-white dark:bg-[#0a0a0f] border-t border-slate-200 dark:border-white/[0.06] p-4 shrink-0">
                            <div className="max-w-3xl mx-auto">
                                <form onSubmit={handleSubmit} className="flex items-end gap-3">
                                    <div className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl transition-all focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 dark:focus-within:border-[#8c30e8] dark:focus-within:ring-[#8c30e8]/20 shadow-sm">
                                        <textarea
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSubmit(e);
                                                }
                                            }}
                                            placeholder="Ask a question or request notes... (Shift+Enter for new line)"
                                            className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 px-4 py-3.5 focus:outline-none resize-none text-sm"
                                            rows="1"
                                            style={{ minHeight: '52px', maxHeight: '200px' }}
                                            disabled={isLoading}
                                        />
                                    </div>

                                    {isLoading ? (
                                        <button
                                            type="button"
                                            onClick={handleStop}
                                            className="p-3.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-xl transition-all shadow-sm flex-shrink-0"
                                            title="Stop Generation"
                                        >
                                            <Square className="w-5 h-5 fill-current" />
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={!input.trim()}
                                            className="p-3.5 bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-white/10 shadow-sm shadow-purple-500/20 flex-shrink-0"
                                        >
                                            <Send className="w-5 h-5 ml-0.5" />
                                        </button>
                                    )}
                                </form>
                                <p className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-gray-500 mt-3 text-center uppercase">
                                    Press Enter to send • Shift+Enter for new line
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Result Preview (Hidden on small screens) */}
                    <div className="hidden lg:flex flex-col lg:w-1/2 bg-slate-50/30 dark:bg-black/10 relative">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/[0.06] flex justify-between items-center bg-white dark:bg-[#191121] shrink-0 shadow-sm z-10">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-wide">
                                <span className={`w-2.5 h-2.5 rounded-full ${previewContent ? "bg-green-500" : isLoading ? "bg-amber-400 animate-pulse" : "bg-slate-300 dark:bg-gray-600"}`} />
                                Result Preview
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsPreviewMaximized(true)}
                                    className="p-2 rounded-lg text-slate-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-[#8c30e8] hover:bg-purple-50 dark:hover:bg-[#8c30e8]/10 transition-colors"
                                    title="Maximize"
                                >
                                    <Maximize2 size={16} />
                                </button>
                                <button
                                    onClick={handleCopyPreview}
                                    disabled={!previewContent}
                                    className="p-2 rounded-lg text-slate-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-[#8c30e8] hover:bg-purple-50 dark:hover:bg-[#8c30e8]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    title="Copy"
                                >
                                    {copiedPreview ? <span className="text-[10px] uppercase font-bold tracking-wider text-green-500">Copied!</span> : <Copy size={16} />}
                                </button>
                                <button
                                    onClick={handleDownloadPreview}
                                    disabled={!previewContent}
                                    className="p-2 rounded-lg text-slate-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-[#8c30e8] hover:bg-purple-50 dark:hover:bg-[#8c30e8]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    title="Download"
                                >
                                    <Download size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-grow p-8 overflow-y-auto relative custom-scrollbar">
                            {isLoading && !previewContent ? (
                                <div className="space-y-5 max-w-3xl mx-auto">
                                    {[...Array(6)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="h-4 rounded-lg bg-slate-200 dark:bg-white/[0.06] animate-pulse"
                                            style={{ width: `${85 - (i % 3) * 10}%` }}
                                        />
                                    ))}
                                </div>
                            ) : previewContent ? (
                                <div className="max-w-3xl mx-auto prose prose-sm max-w-none dark:prose-invert prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-700 dark:prose-p:text-gray-300 prose-strong:text-slate-900 dark:prose-strong:text-white prose-li:text-slate-700 dark:prose-li:text-gray-300">
                                    <ResultRenderer content={previewContent} />
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-gray-500 p-8 text-center">
                                    <div className="w-16 h-16 rounded-full bg-white dark:bg-white/5 flex items-center justify-center mb-4 shadow-sm border border-slate-100 dark:border-transparent">
                                        <FileText size={32} className="opacity-40" />
                                    </div>
                                    <p className="font-bold tracking-wide text-slate-900 dark:text-white">Waiting for Input</p>
                                    <p className="text-sm mt-1">Ask a question to see the generated notes here.</p>
                                </div>
                            )}
                            
                            {/* Bottom fade for preview scroll */}
                            {previewContent && (
                                <div className="fixed bottom-0 right-0 w-1/2 h-12 bg-gradient-to-t from-slate-50/80 dark:from-[#0a0a0f]/80 to-transparent pointer-events-none" />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Maximized Modal (From 1st file) */}
            {isPreviewMaximized && (
                <div className="fixed inset-0 z-[60] bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm p-4 md:p-8 flex items-center justify-center">
                    <div className="rounded-2xl w-full h-full max-w-5xl flex flex-col overflow-hidden bg-white dark:bg-[#191121] border border-slate-200 dark:border-[#8c30e8]/50 shadow-2xl">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-black/20 shrink-0">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-wide">
                                <span className={`w-2.5 h-2.5 rounded-full ${previewContent ? "bg-green-500" : isLoading ? "bg-amber-400 animate-pulse" : "bg-slate-300 dark:bg-gray-600"}`} />
                                Result Preview
                            </h3>
                            <div className="flex gap-2">
                                {isLoading && (
                                    <button
                                        onClick={handleStop}
                                        className="px-3 py-1.5 text-xs font-bold tracking-wider uppercase rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition-colors"
                                    >
                                        Stop
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsPreviewMaximized(false)}
                                    className="p-2 rounded-lg text-slate-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-[#8c30e8] hover:bg-purple-50 dark:hover:bg-[#8c30e8]/10 transition-colors"
                                    title="Minimize"
                                >
                                    <Minimize2 size={16} />
                                </button>
                                <button
                                    onClick={handleCopyPreview}
                                    disabled={!previewContent}
                                    className="p-2 rounded-lg text-slate-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-[#8c30e8] hover:bg-purple-50 dark:hover:bg-[#8c30e8]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    {copiedPreview ? <span className="text-[10px] uppercase font-bold tracking-wider text-green-500">Copied!</span> : <Copy size={16} />}
                                </button>
                                <button
                                    onClick={handleDownloadPreview}
                                    disabled={!previewContent}
                                    className="p-2 rounded-lg text-slate-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-[#8c30e8] hover:bg-purple-50 dark:hover:bg-[#8c30e8]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Download size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-grow p-6 md:p-10 overflow-y-auto relative custom-scrollbar">
                            {isLoading && !previewContent ? (
                                <div className="space-y-4 max-w-4xl mx-auto">
                                    {[...Array(8)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="h-4 rounded-lg bg-slate-200 dark:bg-white/[0.06] animate-pulse"
                                            style={{ width: `${85 - (i % 3) * 10}%` }}
                                        />
                                    ))}
                                </div>
                            ) : previewContent ? (
                                <div className="max-w-4xl mx-auto prose prose-sm md:prose-base max-w-none dark:prose-invert prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-700 dark:prose-p:text-gray-300 prose-strong:text-slate-900 dark:prose-strong:text-white prose-li:text-slate-700 dark:prose-li:text-gray-300">
                                    <ResultRenderer content={previewContent} />
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-gray-500 p-8 text-center">
                                    <FileText size={48} className="mb-4 opacity-30" />
                                    <p className="font-bold tracking-wide text-slate-900 dark:text-white">Waiting for Input.</p>
                                    <p className="text-sm mt-1">Ask a question to generate content.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ------------------------------------------------------------------ */
/* Result Renderer (simple markdown-like)                            */
/* ------------------------------------------------------------------ */
function ResultRenderer({ content }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-6 mb-3">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-5 mb-2">{children}</h3>
        ),
        blockquote: ({ children }) => (
          <blockquote className="bg-slate-50 dark:bg-white/5 border-l-4 border-purple-500 dark:border-[#8c30e8] p-4 rounded-r-lg my-4 shadow-sm text-slate-700 dark:text-gray-300 italic">
            <div className="text-sm">{children}</div>
          </blockquote>
        ),
        p: ({ children }) => (
          <p className="text-sm leading-relaxed text-slate-700 dark:text-gray-300 mb-3">{children}</p>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-6 space-y-2 mb-4 text-slate-700 dark:text-gray-300">{children}</ol>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-6 space-y-2 mb-4 text-slate-700 dark:text-gray-300">{children}</ul>
        ),
        li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-bold text-slate-900 dark:text-white">{children}</strong>
        ),
        code: ({ inline, children }) => (
          inline 
            ? <code className="bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-gray-200 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
            : <code className="block bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-gray-200 p-3 rounded-lg my-3 overflow-x-auto font-mono text-sm shadow-inner">{children}</code>
        )
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default ContentGenerator;