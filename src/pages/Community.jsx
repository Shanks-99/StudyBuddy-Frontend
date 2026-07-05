import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import InstructorSidebar from '../components/InstructorSidebar';
import AdminSidebar from '../components/AdminSidebar';
import { getCurrentUser } from '../services/authService';
import {
    getCommunityPosts,
    createCommunityPost,
    deleteCommunityPost,
    togglePostLike,
    getPostComments,
    addPostComment,
    deletePostComment,
    reportCommunityPost,
    getTrendingPosts,
} from '../services/communityService';
import {
    MessageSquare,
    Heart,
    Send,
    Plus,
    X,
    Trash2,
    HelpCircle,
    Lightbulb,
    Trophy,
    Share2,
    MessagesSquare,
    TrendingUp,
    Clock,
    ThumbsUp,
    Loader2,
    ChevronDown,
    ChevronUp,
    Flag,
    AlertTriangle,
    CheckCircle2,
    Flame,
    BookOpen,
    Sparkles,
    Search,
    Users,
    CalendarDays,
    CreditCard,
    DollarSign,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    joinGroupSession,
    joinPaymentSent,
} from '../services/groupSessionService';

/* ────────────────── Constants ────────────────── */

const CATEGORIES = [
    { id: 'all', label: 'All Posts', icon: Sparkles, color: 'purple' },
    { id: 'question', label: 'Questions', icon: HelpCircle, color: 'blue' },
    { id: 'discussion', label: 'Discussions', icon: MessagesSquare, color: 'emerald' },
    { id: 'study-tips', label: 'Study Tips', icon: Lightbulb, color: 'amber' },
    { id: 'resource', label: 'Resources', icon: BookOpen, color: 'pink' },
    { id: 'achievement', label: 'Achievements', icon: Trophy, color: 'orange' },
    { id: 'group-session', label: 'Group Sessions', icon: Users, color: 'emerald' },
];

const SORT_OPTIONS = [
    { id: 'latest', label: 'Latest', icon: Clock },
    { id: 'likes', label: 'Most Liked', icon: ThumbsUp },
    { id: 'comments', label: 'Most Discussed', icon: MessageSquare },
];

const REPORT_REASONS = [
    'Spam or misleading',
    'Inappropriate content',
    'Harassment or bullying',
    'Hate speech',
    'Off-topic or irrelevant',
    'Other',
];

const getCategoryMeta = (cat) => {
    const map = {
        question: { icon: HelpCircle, label: 'Question', bg: 'bg-blue-500/10', text: 'text-blue-500 dark:text-blue-400', border: 'border-blue-500/30' },
        discussion: { icon: MessagesSquare, label: 'Discussion', bg: 'bg-emerald-500/10', text: 'text-emerald-500 dark:text-emerald-400', border: 'border-emerald-500/30' },
        'study-tips': { icon: Lightbulb, label: 'Study Tip', bg: 'bg-amber-500/10', text: 'text-amber-500 dark:text-amber-400', border: 'border-amber-500/30' },
        resource: { icon: BookOpen, label: 'Resource', bg: 'bg-pink-500/10', text: 'text-pink-500 dark:text-pink-400', border: 'border-pink-500/30' },
        achievement: { icon: Trophy, label: 'Achievement', bg: 'bg-orange-500/10', text: 'text-orange-500 dark:text-orange-400', border: 'border-orange-500/30' },
        'group-session': { icon: Users, label: 'Group Session', bg: 'bg-emerald-500/10', text: 'text-emerald-500 dark:text-emerald-400', border: 'border-emerald-500/30' },
    };
    return map[cat] || map.discussion;
};

const colorMap = {
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30', ring: 'ring-purple-500/20' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30', ring: 'ring-blue-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', ring: 'ring-emerald-500/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', ring: 'ring-amber-500/20' },
    pink: { bg: 'bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-500/30', ring: 'ring-pink-500/20' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30', ring: 'ring-orange-500/20' },
};

const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
};

const AVATAR_GRADIENTS = [
    'from-purple-500 to-indigo-600',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-pink-500 to-rose-500',
    'from-violet-500 to-fuchsia-500',
    'from-sky-500 to-blue-600',
    'from-lime-500 to-emerald-500',
];

const getGradient = (name) => {
    if (!name) return AVATAR_GRADIENTS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
};

const renderPostContent = (text) => {
    if (!text) return null;
    const parts = text.split('**');
    return parts.map((part, i) => {
        if (i % 2 === 1) {
            return <strong key={i} className="font-bold text-slate-900 dark:text-white">{part}</strong>;
        }
        return part;
    });
};

/* ────────────────── Component ────────────────── */

const Community = () => {
    const navigate = useNavigate();
    const user = getCurrentUser();
    const userId = user?.id;

    // Feed state
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [activeSort, setActiveSort] = useState('latest');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPosts, setTotalPosts] = useState(0);

    // Search
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Trending
    const [trending, setTrending] = useState([]);
    const topTrendingPosts = React.useMemo(() => {
        return [...trending]
            .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
            .slice(0, 3);
    }, [trending]);

    // Create modal
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newContent, setNewContent] = useState('');
    const [newCategory, setNewCategory] = useState('discussion');
    const [isCreating, setIsCreating] = useState(false);

    // Comments
    const [expandedComments, setExpandedComments] = useState({});
    const [commentTexts, setCommentTexts] = useState({});
    const [postComments, setPostComments] = useState({});
    const [loadingComments, setLoadingComments] = useState({});

    // Report modal
    const [reportModal, setReportModal] = useState({ open: false, postId: null });
    const [reportReason, setReportReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [isReporting, setIsReporting] = useState(false);
    const [reportSuccess, setReportSuccess] = useState(false);

    // Like animation
    const [likeAnimations, setLikeAnimations] = useState({});

    // Expanded posts (for "read more")
    const [expandedPosts, setExpandedPosts] = useState({});

    // Group Session Join State
    const [joiningSession, setJoiningSession] = useState(null);
    const [isJoining, setIsJoining] = useState(false);

    /* ── Debounce Search ── */
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    /* ── Fetch Posts ── */
    const fetchPosts = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getCommunityPosts(activeSort, activeCategory, page, debouncedSearch);
            setPosts(data.posts || []);
            setTotalPages(data.totalPages || 1);
            setTotalPosts(data.total || 0);
        } catch (err) {
            console.error('Failed to fetch posts:', err);
        } finally {
            setIsLoading(false);
        }
    }, [activeSort, activeCategory, page, debouncedSearch]);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    const handleJoinGroupSession = async (gsId) => {
        setIsJoining(true);
        try {
            const updatedSession = await joinGroupSession(gsId);
            setJoiningSession(updatedSession);
            fetchPosts();
            alert("Successfully requested to join group session! Please complete the payment process.");
        } catch (error) {
            alert(error?.response?.data?.msg || "Failed to join group session.");
        } finally {
            setIsJoining(false);
        }
    };

    const handleGrabYourSeat = async (gsId) => {
        setIsJoining(true);
        try {
            await joinGroupSession(gsId);
            fetchPosts();
            alert("Session request sent.");
        } catch (error) {
            alert(error?.response?.data?.msg || "Failed to submit request.");
        } finally {
            setIsJoining(false);
        }
    };

    const handleConfirmJoinPayment = async (gsId) => {
        setIsJoining(true);
        try {
            const updatedSession = await joinPaymentSent(gsId);
            setJoiningSession(updatedSession);
            fetchPosts();
            alert("Payment marked sent! Mentor will verify and approve your entry shortly.");
        } catch (error) {
            alert(error?.response?.data?.msg || "Failed to mark payment as sent.");
        } finally {
            setIsJoining(false);
        }
    };

    /* ── Fetch Trending ── */
    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const data = await getTrendingPosts();
                setTrending(data || []);
            } catch (err) {
                console.error('Failed to fetch trending:', err);
            }
        };
        fetchTrending();
    }, []);

    /* ── Create Post ── */
    const handleCreatePost = async () => {
        if (!newContent.trim()) return;
        setIsCreating(true);
        try {
            await createCommunityPost({ userId, content: newContent.trim(), category: newCategory });
            setNewContent('');
            setNewCategory('discussion');
            setIsCreateOpen(false);
            setPage(1);
            setActiveSort('latest');
            fetchPosts();
        } catch (err) {
            alert(err.message || 'Failed to create post');
        } finally {
            setIsCreating(false);
        }
    };

    /* ── Delete Post ── */
    const handleDeletePost = async (postId) => {
        if (!window.confirm('Delete this post? This action cannot be undone.')) return;
        try {
            await deleteCommunityPost(postId, userId);
            setPosts(prev => prev.filter(p => p._id !== postId));
        } catch (err) {
            alert(err.message || 'Failed to delete post');
        }
    };

    /* ── Toggle Like ── */
    const handleToggleLike = async (postId) => {
        // Trigger animation
        setLikeAnimations(prev => ({ ...prev, [postId]: true }));
        setTimeout(() => setLikeAnimations(prev => ({ ...prev, [postId]: false })), 600);

        try {
            const updated = await togglePostLike(postId, userId);
            setPosts(prev => prev.map(p => p._id === postId ? updated : p));
        } catch (err) {
            console.error('Like toggle failed:', err);
        }
    };

    /* ── Comments ── */
    const toggleComments = async (postId) => {
        const isExpanded = expandedComments[postId];
        setExpandedComments(prev => ({ ...prev, [postId]: !isExpanded }));

        if (!isExpanded && !postComments[postId]) {
            setLoadingComments(prev => ({ ...prev, [postId]: true }));
            try {
                const comments = await getPostComments(postId);
                setPostComments(prev => ({ ...prev, [postId]: comments }));
            } catch (err) {
                console.error('Failed to load comments:', err);
            } finally {
                setLoadingComments(prev => ({ ...prev, [postId]: false }));
            }
        }
    };

    const handleAddComment = async (postId) => {
        const text = commentTexts[postId]?.trim();
        if (!text) return;
        try {
            const comment = await addPostComment(postId, { userId, text });
            setPostComments(prev => ({
                ...prev,
                [postId]: [...(prev[postId] || []), comment],
            }));
            setCommentTexts(prev => ({ ...prev, [postId]: '' }));
            // Update comment count in feed
            setPosts(prev => prev.map(p => p._id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p));
        } catch (err) {
            alert(err.message || 'Failed to add comment');
        }
    };

    const handleDeleteComment = async (commentId, postId) => {
        try {
            await deletePostComment(commentId, userId);
            setPostComments(prev => ({
                ...prev,
                [postId]: (prev[postId] || []).filter(c => c._id !== commentId),
            }));
            setPosts(prev => prev.map(p => p._id === postId ? { ...p, commentCount: Math.max(0, (p.commentCount || 1) - 1) } : p));
        } catch (err) {
            alert(err.message || 'Failed to delete comment');
        }
    };

    /* ── Report ── */
    const handleReport = async () => {
        const reason = reportReason === 'Other' ? customReason.trim() : reportReason;
        if (!reason) return;
        setIsReporting(true);
        try {
            await reportCommunityPost(reportModal.postId, userId, reason);
            setReportSuccess(true);
            setTimeout(() => {
                setReportModal({ open: false, postId: null });
                setReportReason('');
                setCustomReason('');
                setReportSuccess(false);
            }, 2000);
        } catch (err) {
            alert(err.message || 'Failed to report post');
        } finally {
            setIsReporting(false);
        }
    };

    /* ── Render ── */
    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 dark:bg-[#0f0a16] dark:text-white font-sans transition-colors duration-300 overflow-hidden relative">

            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 dark:bg-[#8c30e8]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 dark:bg-purple-900/10 rounded-full blur-[120px]" />
                <div className="absolute top-[40%] right-[20%] w-[400px] h-[400px] bg-pink-500/5 dark:bg-fuchsia-900/10 rounded-full blur-[100px]" />
            </div>

            {user?.role === 'admin' ? (
                <AdminSidebar activeTab="community" onTabChange={(tabId) => navigate(`/admin/dashboard?tab=${tabId}`)} />
            ) : user?.role === 'teacher' ? (
                <InstructorSidebar activeTab="community" onTabChange={(tabId) => navigate(`/instructor-dashboard?tab=${tabId}`)} />
            ) : (
                <Sidebar activeTab="community" onTabChange={(tabId) => navigate(`/student-dashboard?tab=${tabId}`)} />
            )}

            <div className="flex-1 flex flex-col overflow-y-auto w-full relative z-10 custom-scrollbar">

                {/* ── Header ── */}
                <div className="px-8 pt-8 pb-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                        <MessageSquare className="w-5 h-5 text-white" />
                                    </div>
                                    Community
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1.5">Share ideas, ask questions, and grow together</p>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap md:flex-nowrap">
                                {/* Search Bar */}
                                <div className="relative w-full md:w-64">
                                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search posts..."
                                        className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-sm text-slate-700 dark:text-white placeholder-slate-400 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 transition-all"
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsCreateOpen(true)}
                                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] w-full md:w-auto shrink-0"
                                >
                                    <Plus size={18} />
                                    Create Post
                                </button>
                            </div>
                        </div>

                        {/* Category Filter Tabs */}
                        <div className="flex gap-2 flex-wrap mb-4">
                            {CATEGORIES.map((cat) => {
                                const isActive = activeCategory === cat.id;
                                const c = colorMap[cat.color];
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => { setActiveCategory(cat.id); setPage(1); }}
                                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                                            isActive
                                                ? `${c.bg} ${c.text} ${c.border} ring-2 ${c.ring}`
                                                : 'bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.06]'
                                        }`}
                                    >
                                        <cat.icon size={14} />
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Sort Tabs */}
                        <div className="flex gap-1 p-1 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-xl w-fit">
                            {SORT_OPTIONS.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => { setActiveSort(opt.id); setPage(1); }}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                        activeSort === opt.id
                                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                                    }`}
                                >
                                    <opt.icon size={13} />
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Main Content Area ── */}
                <div className="px-8 pb-8 flex-1">
                    <div className="max-w-6xl mx-auto flex gap-6">

                        {/* ── Feed Column ── */}
                        <div className="flex-1 space-y-4 min-w-0">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-3" />
                                    <p className="text-slate-400 text-sm">Loading community feed...</p>
                                </div>
                            ) : posts.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="w-20 h-20 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                        <MessageSquare className="w-10 h-10 text-purple-500" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No posts yet</h3>
                                    <p className="text-slate-400 text-sm mb-6">Be the first to share something with the community!</p>
                                    <button
                                        onClick={() => setIsCreateOpen(true)}
                                        className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 transition-all"
                                    >
                                        Create First Post
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <AnimatePresence mode="popLayout">
                                        {posts.map((post, idx) => {
                                            const catMeta = getCategoryMeta(post.category);
                                            const CatIcon = catMeta.icon;
                                            const isLiked = post.likes?.includes(userId);
                                            const isAuthor = String(post.author?._id) === String(userId);
                                            const isExpanded = expandedPosts[post._id];
                                            const isLong = post.content?.length > 280;
                                            const commentsOpen = expandedComments[post._id];

                                            return (
                                                <motion.div
                                                    key={post._id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ duration: 0.3, delay: idx * 0.04 }}
                                                    className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden hover:border-purple-300 dark:hover:border-purple-500/20 transition-all duration-300 group"
                                                >
                                                    <div className="p-5">
                                                        {/* Author Header */}
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getGradient(post.author?.name)} flex items-center justify-center text-white text-sm font-bold shadow-md overflow-hidden`}>
                                                                     {post.author?.avatar ? (
                                                                         <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
                                                                     ) : (
                                                                         getInitials(post.author?.name)
                                                                     )}
                                                                 </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-semibold text-sm text-slate-900 dark:text-white">{post.author?.name || 'Unknown'}</span>
                                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                                                            post.author?.role === 'teacher'
                                                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                                                                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                                                        }`}>
                                                                            {post.author?.role === 'teacher' ? 'Mentor' : 'Student'}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs text-slate-400">{timeAgo(post.createdAt)}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                {/* Category Badge */}
                                                                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${catMeta.bg} ${catMeta.text} ${catMeta.border}`}>
                                                                    <CatIcon size={12} />
                                                                    {catMeta.label}
                                                                </span>
                                                                {/* Report button (not on own posts) */}
                                                                {!isAuthor && (
                                                                    <button
                                                                        onClick={() => setReportModal({ open: true, postId: post._id })}
                                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                                                        title="Report post"
                                                                    >
                                                                        <Flag size={14} />
                                                                    </button>
                                                                )}
                                                                {/* Delete button (own posts) */}
                                                                {isAuthor && (
                                                                    <button
                                                                        onClick={() => handleDeletePost(post._id)}
                                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                                                        title="Delete post"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Post Content */}
                                                        <div className="mb-4">
                                                            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                                                {renderPostContent(isLong && !isExpanded ? post.content.slice(0, 280) + '...' : post.content)}
                                                            </div>
                                                            {isLong && (
                                                                <button
                                                                    onClick={() => setExpandedPosts(prev => ({ ...prev, [post._id]: !isExpanded }))}
                                                                    className="text-purple-500 hover:text-purple-400 text-xs font-semibold mt-1 transition-colors"
                                                                >
                                                                    {isExpanded ? 'Show less' : 'Read more'}
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Group Session Details Card */}
                                                        {post.category === 'group-session' && post.groupSessionRef && (
                                                            <div className="mb-4 p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-black/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                                <div className="space-y-2">
                                                                    <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                                        <Users className="text-purple-500 w-5 h-5" />
                                                                        {post.groupSessionRef.topic}
                                                                    </h4>
                                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                                        {post.groupSessionRef.description}
                                                                    </p>
                                                                </div>
                                                                
                                                                {/* Action Button */}
                                                                <div className="shrink-0">
                                                                    {(() => {
                                                                        const gs = post.groupSessionRef;
                                                                        const isMentor = String(gs.mentor) === String(userId);
                                                                        
                                                                        if (isMentor) {
                                                                            return (
                                                                                <span className="px-4 py-2 text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-500/20">
                                                                                    You are the Mentor
                                                                                </span>
                                                                            );
                                                                        }
                                                                        
                                                                        if (user?.role && user.role !== 'student') {
                                                                            return (
                                                                                <span className="px-4 py-2 text-xs font-bold bg-slate-500/10 text-slate-500 rounded-xl border border-slate-500/20">
                                                                                    {user.role === 'admin' ? 'Admin View' : 'Instructor View'}
                                                                                </span>
                                                                            );
                                                                        }

                                                                        const participant = gs.participants?.find(p => String(p.student?._id || p.student) === String(userId));
                                                                        
                                                                        if (participant) {
                                                                            if (participant.paymentStatus === 'verified') {
                                                                                return (
                                                                                    <span className="px-4 py-2 text-xs font-bold bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl border border-green-500/20 flex items-center gap-1.5">
                                                                                        <CheckCircle2 size={14} /> Joined
                                                                                    </span>
                                                                                );
                                                                            }
                                                                            if (participant.paymentStatus === 'sent') {
                                                                                return (
                                                                                    <span className="px-4 py-2 text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/20 flex items-center gap-1.5">
                                                                                        <Clock size={14} /> Awaiting Verification
                                                                                    </span>
                                                                                );
                                                                            }
                                                                            if (participant.paymentStatus === 'pending') {
                                                                                return (
                                                                                    <span className="px-4 py-2 text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20 flex items-center gap-1.5">
                                                                                        <Clock size={14} /> Session Request Sent
                                                                                    </span>
                                                                                );
                                                                            }
                                                                            // accepted or rejected
                                                                            return (
                                                                                <button
                                                                                    onClick={() => setJoiningSession(gs)}
                                                                                    className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition-colors shadow-md"
                                                                                >
                                                                                    Complete Payment
                                                                                </button>
                                                                            );
                                                                        }
                                                                        
                                                                        const verifiedCount = gs.participants?.filter(p => p.paymentStatus === 'verified').length || 0;
                                                                        if (verifiedCount >= gs.maxParticipants) {
                                                                            return (
                                                                                <span className="px-4 py-2 text-xs font-bold bg-slate-500/10 text-slate-500 rounded-xl border border-slate-500/20">
                                                                                    Session Full
                                                                                </span>
                                                                            );
                                                                        }
                                                                        
                                                                        return (
                                                                            <button
                                                                                onClick={() => handleGrabYourSeat(gs._id)}
                                                                                disabled={isJoining}
                                                                                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all shadow-md hover:shadow-purple-600/25"
                                                                            >
                                                                                {isJoining ? "Processing..." : "Grab your seat"}
                                                                            </button>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Action Bar */}
                                                        <div className="flex items-center gap-1 pt-3 border-t border-slate-100 dark:border-white/[0.04]">
                                                            {/* Like Button */}
                                                            <button
                                                                onClick={() => handleToggleLike(post._id)}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                                                    isLiked
                                                                        ? 'bg-red-500/10 text-red-500 dark:text-red-400'
                                                                        : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-red-500'
                                                                }`}
                                                            >
                                                                <motion.div
                                                                    animate={likeAnimations[post._id] ? { scale: [1, 1.4, 0.9, 1.1, 1] } : {}}
                                                                    transition={{ duration: 0.5 }}
                                                                >
                                                                    <Heart size={15} className={isLiked ? 'fill-current' : ''} />
                                                                </motion.div>
                                                                {post.likes?.length || 0}
                                                            </button>

                                                            {/* Comment Button */}
                                                            <button
                                                                onClick={() => toggleComments(post._id)}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                                                    commentsOpen
                                                                        ? 'bg-purple-500/10 text-purple-500 dark:text-purple-400'
                                                                        : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-purple-500'
                                                                }`}
                                                            >
                                                                <MessageSquare size={15} />
                                                                {post.commentCount || 0}
                                                                {commentsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* ── Inline Comments Section ── */}
                                                    <AnimatePresence>
                                                        {commentsOpen && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.25 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="px-5 pb-4 pt-1 border-t border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.01]">
                                                                    {loadingComments[post._id] ? (
                                                                        <div className="flex items-center justify-center py-4">
                                                                            <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            {(postComments[post._id] || []).length === 0 && (
                                                                                <p className="text-xs text-slate-400 text-center py-3">No comments yet. Be the first!</p>
                                                                            )}
                                                                            <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                                                                                {(postComments[post._id] || []).map((comment) => (
                                                                                    <div key={comment._id} className="flex items-start gap-2.5 group/comment">
                                                                                        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getGradient(comment.author?.name)} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5`}>
                                                                                            {getInitials(comment.author?.name)}
                                                                                        </div>
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{comment.author?.name}</span>
                                                                                                <span className="text-[10px] text-slate-400">{timeAgo(comment.createdAt)}</span>
                                                                                                {String(comment.author?._id) === String(userId) && (
                                                                                                    <button
                                                                                                        onClick={() => handleDeleteComment(comment._id, post._id)}
                                                                                                        className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover/comment:opacity-100"
                                                                                                    >
                                                                                                        <Trash2 size={11} />
                                                                                                    </button>
                                                                                                )}
                                                                                            </div>
                                                                                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 break-words">{comment.text}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>

                                                                            {/* Add Comment Input */}
                                                                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200/50 dark:border-white/[0.04]">
                                                                                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getGradient(user?.name)} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                                                                                    {getInitials(user?.name)}
                                                                                </div>
                                                                                <input
                                                                                    type="text"
                                                                                    value={commentTexts[post._id] || ''}
                                                                                    onChange={(e) => setCommentTexts(prev => ({ ...prev, [post._id]: e.target.value }))}
                                                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post._id)}
                                                                                    placeholder="Write a comment..."
                                                                                    className="flex-1 bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-white placeholder-slate-400 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                                                                                />
                                                                                <button
                                                                                    onClick={() => handleAddComment(post._id)}
                                                                                    disabled={!commentTexts[post._id]?.trim()}
                                                                                    className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                                                >
                                                                                    <Send size={13} />
                                                                                </button>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-2 pt-4">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                                <button
                                                    key={p}
                                                    onClick={() => setPage(p)}
                                                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                                                        page === p
                                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                                                            : 'bg-white dark:bg-white/[0.04] text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06]'
                                                    }`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* ── Trending Sidebar ── */}
                        <div className="w-72 flex-shrink-0 hidden lg:block space-y-4">
                            {/* Trending Posts */}
                            <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md">
                                        <Flame size={16} className="text-white" />
                                    </div>
                                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Trending Posts</h3>
                                </div>
                                {topTrendingPosts.length === 0 ? (
                                    <p className="text-xs text-slate-400 text-center py-4">No trending posts yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {topTrendingPosts.map((tp, idx) => (
                                            <div key={tp._id} className="flex items-start gap-2.5 group/trend">
                                                <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-b from-purple-400 to-purple-600 w-6 text-center flex-shrink-0">
                                                    {idx + 1}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">{tp.content}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] text-slate-400">{tp.author?.name}</span>
                                                        <span className="flex items-center gap-0.5 text-[10px] text-red-400">
                                                            <Heart size={10} className="fill-current" /> {tp.likes?.length || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Community Guidelines Card */}
                            <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                                        <CheckCircle2 size={16} className="text-white" />
                                    </div>
                                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Guidelines</h3>
                                </div>
                                <ul className="space-y-2">
                                    {['Be respectful & supportive', 'Share knowledge freely', 'Stay on topic', 'Report inappropriate content'].map((g) => (
                                        <li key={g} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                            <div className="w-1 h-1 rounded-full bg-purple-500 flex-shrink-0" />
                                            {g}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════════════ Create Post Modal ════════════════ */}
            <AnimatePresence>
                {isCreateOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setIsCreateOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.25 }}
                            className="bg-white dark:bg-[#1a1225] border border-slate-200 dark:border-purple-500/20 rounded-2xl w-full max-w-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/[0.06]">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Sparkles size={18} className="text-purple-500" />
                                    Create Post
                                </h2>
                                <button onClick={() => setIsCreateOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-5 space-y-4">
                                {/* Category Selector */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">Category</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {CATEGORIES.filter(c => c.id !== 'all').map((cat) => {
                                            const isActive = newCategory === cat.id;
                                            const c = colorMap[cat.color];
                                            return (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => setNewCategory(cat.id)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                                        isActive
                                                            ? `${c.bg} ${c.text} ${c.border} ring-2 ${c.ring}`
                                                            : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                                                    }`}
                                                >
                                                    <cat.icon size={13} />
                                                    {cat.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Content */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">What's on your mind?</label>
                                    <textarea
                                        value={newContent}
                                        onChange={(e) => setNewContent(e.target.value)}
                                        placeholder="Share your thoughts, questions, or discoveries..."
                                        rows={5}
                                        className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl px-4 py-3 text-sm text-slate-700 dark:text-white placeholder-slate-400 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 transition-all resize-none"
                                    />
                                    <p className="text-xs text-slate-400 mt-1 text-right">{newContent.length} characters</p>
                                </div>

                                {/* Submit */}
                                <button
                                    onClick={handleCreatePost}
                                    disabled={!newContent.trim() || isCreating}
                                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isCreating ? (
                                        <><Loader2 size={16} className="animate-spin" /> Posting...</>
                                    ) : (
                                        <><Send size={16} /> Publish Post</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ════════════════ Report Modal ════════════════ */}
            <AnimatePresence>
                {reportModal.open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => { setReportModal({ open: false, postId: null }); setReportReason(''); setCustomReason(''); setReportSuccess(false); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.25 }}
                            className="bg-white dark:bg-[#1a1225] border border-slate-200 dark:border-red-500/20 rounded-2xl w-full max-w-md shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/[0.06]">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <AlertTriangle size={18} className="text-red-500" />
                                    Report Post
                                </h2>
                                <button onClick={() => { setReportModal({ open: false, postId: null }); setReportReason(''); setCustomReason(''); setReportSuccess(false); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-5">
                                {reportSuccess ? (
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-center py-6"
                                    >
                                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Report Submitted</h3>
                                        <p className="text-sm text-slate-400">Our admin team will review this post. Thank you!</p>
                                    </motion.div>
                                ) : (
                                    <>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Why are you reporting this post?</p>
                                        <div className="space-y-2 mb-4">
                                            {REPORT_REASONS.map((reason) => (
                                                <button
                                                    key={reason}
                                                    onClick={() => setReportReason(reason)}
                                                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border transition-all ${
                                                        reportReason === reason
                                                            ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 font-semibold'
                                                            : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                                                    }`}
                                                >
                                                    {reason}
                                                </button>
                                            ))}
                                        </div>

                                        {reportReason === 'Other' && (
                                            <textarea
                                                value={customReason}
                                                onChange={(e) => setCustomReason(e.target.value)}
                                                placeholder="Please describe the issue..."
                                                rows={3}
                                                className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl px-4 py-3 text-sm text-slate-700 dark:text-white placeholder-slate-400 outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10 transition-all resize-none mb-4"
                                            />
                                        )}

                                        <button
                                            onClick={handleReport}
                                            disabled={!reportReason || (reportReason === 'Other' && !customReason.trim()) || isReporting}
                                            className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/25 hover:shadow-red-600/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isReporting ? (
                                                <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                                            ) : (
                                                <><Flag size={16} /> Submit Report</>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* ════════════════ Join Group Session Modal ════════════════ */}
            <AnimatePresence>
                {joiningSession && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setJoiningSession(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.25 }}
                            className="bg-white dark:bg-[#1a1225] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-black/20">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <CreditCard size={18} className="text-purple-600 dark:text-[#8c30e8]" />
                                    Join Group Session
                                </h2>
                                <button onClick={() => setJoiningSession(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{joiningSession.topic}</h3>
                                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Mentor: {joiningSession.mentorName}</p>
                                </div>

                                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-gray-400">
                                    <span className="flex items-center gap-1.5"><CalendarDays size={14} /> {joiningSession.dateLabel}</span>
                                    <span className="flex items-center gap-1.5"><Clock size={14} /> {joiningSession.timeSlot}</span>
                                </div>

                                <div className="rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4">
                                    <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-2">💳 Payment Instructions</h4>
                                    <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed mb-3">
                                        Please send Rs. {joiningSession.rate} via one of the following mentor accounts:
                                    </p>
                                    {joiningSession.mentorProfile && (joiningSession.mentorProfile.bankAccountNumber || joiningSession.mentorProfile.easypaisaNumber) ? (
                                        <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1.5 font-bold pl-1 list-none">
                                            {joiningSession.mentorProfile.bankAccountNumber && (
                                                <li className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] uppercase text-slate-400 font-bold">Bank Account</span>
                                                    <span className="font-mono text-sm">{joiningSession.mentorProfile.bankAccountNumber}</span>
                                                </li>
                                            )}
                                            {joiningSession.mentorProfile.easypaisaNumber && (
                                                <li className="flex flex-col gap-0.5 mt-2">
                                                    <span className="text-[10px] uppercase text-slate-400 font-bold">Easypaisa</span>
                                                    <span className="font-mono text-sm">{joiningSession.mentorProfile.easypaisaNumber}</span>
                                                </li>
                                            )}
                                        </ul>
                                    ) : (
                                        <div className="text-xs text-amber-800 dark:text-amber-400 font-semibold italic bg-amber-100/50 dark:bg-amber-500/5 p-3 rounded-xl border border-amber-200/50">
                                            No specific payment accounts are listed by the mentor. Please ask them directly in the chat or contact admin support.
                                        </div>
                                    )}
                                </div>

                                {(() => {
                                    const participant = joiningSession.participants?.find(p => String(p.student?._id || p.student) === String(userId));
                                    
                                    if (participant?.paymentStatus === 'sent') {
                                        return (
                                            <p className="text-center text-sm font-semibold text-blue-600 dark:text-blue-400 py-2">
                                                ⏳ Payment marked sent! Awaiting verification...
                                            </p>
                                        );
                                    }
                                    
                                    return (
                                        <button
                                            onClick={() => handleConfirmJoinPayment(joiningSession._id)}
                                            disabled={isJoining}
                                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isJoining ? (
                                                <><Loader2 size={16} className="animate-spin" /> Processing...</>
                                            ) : (
                                                <><CheckCircle2 size={16} /> I've Sent the Payment</>
                                            )}
                                        </button>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Community;
