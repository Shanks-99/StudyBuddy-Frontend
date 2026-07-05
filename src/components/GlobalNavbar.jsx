import { memo, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Moon, 
    Sun, 
    Bell, 
    Sparkles, 
    X, 
    MessageSquare, 
    ArrowLeft, 
    Send, 
    MessageSquareDashed 
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import { getNotifications, markAsRead, clearAllNotifications, markAllAsRead } from '../services/notificationService';
import { getConversations, getMessagesWithPartner, sendDirectMessage } from '../services/directMessageService';

const ease = [0.25, 0.46, 0.45, 0.94];

const GlobalNavbar = memo(function GlobalNavbar({ isDark, setIsDark }) {
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [user, setUser] = useState(null);

    // Direct Messaging States
    const [conversations, setConversations] = useState([]);
    const [showInbox, setShowInbox] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessageText, setNewMessageText] = useState('');
    const chatEndRef = useRef(null);

    const location = useLocation();
    const navigate = useNavigate();
    const isAuthPage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password';
    const isAdminPage = location.pathname.startsWith('/admin');

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
            fetchNotifications();
            fetchConversations();

            // Poll for alerts and new message connections
            const notificationInterval = setInterval(fetchNotifications, 30000);
            const conversationsInterval = setInterval(fetchConversations, 15000);
            
            return () => {
                clearInterval(notificationInterval);
                clearInterval(conversationsInterval);
            };
        } else {
            setUser(null);
            setNotifications([]);
            setConversations([]);
        }
    }, [location.pathname]);

    // Poll current chat messages when chat is open
    useEffect(() => {
        if (!selectedPartner || !showInbox) return;

        const fetchChatMessages = async () => {
            try {
                const msgs = await getMessagesWithPartner(selectedPartner._id);
                setChatMessages(msgs);
            } catch (err) {
                console.error("[Navbar] Failed to load messages:", err);
            }
        };

        fetchChatMessages();
        const chatInterval = setInterval(fetchChatMessages, 5000);
        return () => clearInterval(chatInterval);
    }, [selectedPartner, showInbox]);

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, selectedPartner]);

    const fetchNotifications = async () => {
        try {
            const data = await getNotifications();
            const list = Array.isArray(data) ? data : (data?.notifications || []);
            setNotifications(list);
        } catch (error) {
            console.error("[Navbar] Failed to fetch notifications:", error);
            setNotifications([]);
        }
    };

    const fetchConversations = async () => {
        try {
            const data = await getConversations();
            setConversations(data || []);
        } catch (error) {
            console.error("[Navbar] Failed to fetch conversations:", error);
        }
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.isRead) {
            await markAsRead(notif._id);
            setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
        }
        if (notif.link) {
            navigate(notif.link);
            setShowNotifications(false);
        }
    };

    const handleClearAll = async () => {
        await clearAllNotifications();
        setNotifications([]);
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const handleConversationClick = async (partner) => {
        setSelectedPartner(partner);
        try {
            const msgs = await getMessagesWithPartner(partner._id);
            setChatMessages(msgs);
            fetchConversations();
        } catch (error) {
            console.error("[Navbar] Failed to retrieve message thread:", error);
        }
    };

    const handleSendDirectMessage = async () => {
        if (!newMessageText.trim() || !selectedPartner) return;
        try {
            const sent = await sendDirectMessage(selectedPartner._id, newMessageText.trim());
            setChatMessages(prev => [...prev, sent]);
            setNewMessageText('');
            fetchConversations();
        } catch (err) {
            console.error("[Navbar] Direct message delivery error:", err);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendDirectMessage();
        }
    };

    const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;
    const totalUnreadMessages = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatMessageTime = (timeString) => {
        if (!timeString) return '';
        const date = new Date(timeString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (isAdminPage) return null;

    return (
        <>
            <motion.nav
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease }}
                className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors duration-300"
            >
                <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 font-bold text-xl text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        StudyBuddy
                    </Link>

                    {/* Right Group */}
                    <div className="flex items-center gap-6">
                        {!isAuthPage && (
                            <div className="flex items-center gap-4">
                                {/* Message Inbox Button */}
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setShowInbox(!showInbox);
                                            setShowNotifications(false);
                                            setSelectedPartner(null);
                                            if (!showInbox) fetchConversations();
                                        }}
                                        className={`relative p-2 rounded-full transition-colors ${showInbox ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-[#8c30e8]' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                        aria-label="Direct Messages"
                                        title="Direct Messages"
                                    >
                                        <MessageSquare className="w-5 h-5" />
                                        {totalUnreadMessages > 0 && (
                                            <div className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-purple-600 text-white text-[10px] font-bold">
                                                {totalUnreadMessages}
                                            </div>
                                        )}
                                    </button>

                                    {/* Inbox Dropdown Drawer */}
                                    {showInbox && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute top-12 right-[-60px] sm:right-0 w-[90vw] sm:w-96 bg-white dark:bg-[#1a1225] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#8c30e8]/30 p-4 z-[60] flex flex-col h-[480px] overflow-hidden"
                                        >
                                            {/* Chat Conversation Thread View */}
                                            {selectedPartner ? (
                                                <div className="flex flex-col h-full min-h-0">
                                                    {/* Chat Header */}
                                                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-white/5 shrink-0">
                                                        <button 
                                                            onClick={() => setSelectedPartner(null)}
                                                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 rounded-lg transition-all"
                                                        >
                                                            <ArrowLeft className="w-4 h-4" />
                                                        </button>
                                                        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-[#8c30e8]/10 text-purple-600 dark:text-[#8c30e8] flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                                                            {selectedPartner.avatar ? (
                                                                <img src={selectedPartner.avatar} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                getInitials(selectedPartner.name)
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{selectedPartner.name}</div>
                                                            <div className="text-[10px] text-purple-600 dark:text-[#a760eb] font-bold uppercase tracking-wider">{selectedPartner.role}</div>
                                                        </div>
                                                    </div>

                                                    {/* Chat Messages List */}
                                                    <div className="flex-1 overflow-y-auto py-3 space-y-2.5 custom-scrollbar min-h-0">
                                                        {chatMessages.length > 0 ? (
                                                            chatMessages.map((msg, index) => {
                                                                const isSelf = msg.sender === user?.id || msg.sender === user?._id;
                                                                return (
                                                                    <div key={index} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                                                                        <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm ${
                                                                            isSelf 
                                                                                ? 'bg-purple-600 text-white rounded-tr-none' 
                                                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                                                                        }`}>
                                                                            <div>{msg.text}</div>
                                                                            <div className={`text-[8px] mt-1 text-right ${isSelf ? 'text-purple-200' : 'text-slate-400'}`}>
                                                                                {formatMessageTime(msg.createdAt)}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 py-10">
                                                                <MessageSquareDashed className="w-8 h-8 opacity-40 mb-2" />
                                                                <p className="text-[11px] font-medium">No messages yet. Send a note to connect!</p>
                                                            </div>
                                                        )}
                                                        <div ref={chatEndRef} />
                                                    </div>

                                                    {/* Chat Footer Input */}
                                                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/5 shrink-0">
                                                        <input
                                                            type="text"
                                                            placeholder="Type message here..."
                                                            value={newMessageText}
                                                            onChange={(e) => setNewMessageText(e.target.value)}
                                                            onKeyDown={handleKeyPress}
                                                            className="flex-1 bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white outline-none focus:border-purple-500 transition-colors"
                                                        />
                                                        <button 
                                                            onClick={handleSendDirectMessage}
                                                            className="p-2 bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8] dark:hover:bg-[#a760eb] text-white rounded-xl transition-all"
                                                        >
                                                            <Send className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Conversations List View */
                                                <div className="flex flex-col h-full min-h-0">
                                                    <div className="flex items-center justify-between mb-3 px-1 shrink-0">
                                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Direct Messages</h3>
                                                        <span className="text-[10px] font-bold bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">{totalUnreadMessages} Unread</span>
                                                    </div>

                                                    <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar min-h-0">
                                                        {conversations.length > 0 ? (
                                                            conversations.map((c) => (
                                                                <div
                                                                    key={c.partner._id}
                                                                    onClick={() => handleConversationClick(c.partner)}
                                                                    className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.03] border border-transparent hover:border-slate-100 dark:hover:border-white/5 transition-all"
                                                                >
                                                                    {/* Partner Initials Avatar */}
                                                                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-[#8c30e8]/10 text-purple-600 dark:text-[#8c30e8] flex items-center justify-center font-bold text-sm uppercase overflow-hidden shrink-0 shadow-inner">
                                                                        {c.partner.avatar ? (
                                                                            <img src={c.partner.avatar} alt="" className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            getInitials(c.partner.name)
                                                                        )}
                                                                    </div>

                                                                    {/* Details Preview */}
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="text-xs font-bold text-slate-950 dark:text-white truncate pr-1">
                                                                                {c.partner.name}
                                                                            </div>
                                                                            {c.lastMessage && (
                                                                                <span className="text-[8px] font-medium text-slate-400 shrink-0">
                                                                                    {formatMessageTime(c.lastMessage.createdAt)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-[9px] text-purple-500 dark:text-[#a760eb] font-bold uppercase tracking-wider mt-0.5">{c.partner.role}</div>
                                                                        <div className="text-[10px] text-slate-500 dark:text-gray-400 truncate mt-1">
                                                                            {c.lastMessage ? c.lastMessage.text : 'No messages exchanged'}
                                                                        </div>
                                                                    </div>

                                                                    {/* Unread Message Count Badge */}
                                                                    {c.unreadCount > 0 && (
                                                                        <div className="w-5 h-5 rounded-full bg-purple-600 text-white text-[9px] font-black flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                                                                            {c.unreadCount}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-16">
                                                                <MessageSquareDashed className="w-10 h-10 opacity-30 mb-2" />
                                                                <p className="text-xs font-bold">No active conversations</p>
                                                                <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto">Booked mentorship sessions will automatically generate chats here!</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </div>

                                {/* Notifications Button */}
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setShowNotifications(!showNotifications);
                                            setShowInbox(false);
                                            if (!showNotifications) fetchNotifications();
                                        }}
                                        className={`relative p-2 rounded-full transition-colors ${showNotifications ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-[#8c30e8]' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                        aria-label="Notifications"
                                    >
                                        <Bell className="w-5 h-5" />
                                        {unreadNotificationsCount > 0 && (
                                            <div className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                                                {unreadNotificationsCount}
                                            </div>
                                        )}
                                    </button>

                                    {/* Notifications Dropdown */}
                                    {showNotifications && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-12 right-[-20px] sm:right-0 w-80 bg-white dark:bg-[#1a1225] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#8c30e8]/30 p-4 z-[60]"
                                        >
                                            <div className="flex items-center justify-between mb-4 px-1">
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                                                <span className="text-[10px] font-bold bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">{unreadNotificationsCount} New</span>
                                            </div>
                                            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                                                {notifications.length > 0 ? (
                                                    notifications.map(n => (
                                                        <div
                                                            key={n._id}
                                                            onClick={() => handleNotificationClick(n)}
                                                            className={`p-3 rounded-xl cursor-pointer transition-all border ${n.isRead ? 'bg-transparent border-transparent opacity-60' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10'}`}
                                                        >
                                                            <div className="flex justify-between items-start gap-2">
                                                                <div className="text-xs font-bold text-slate-900 dark:text-white">{n.title}</div>
                                                                {!n.isRead && <div className="w-2 h-2 rounded-full bg-purple-600 shrink-0 mt-1"></div>}
                                                            </div>
                                                            <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-1 line-clamp-2">{n.message}</div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="py-8 text-center">
                                                        <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2 opacity-50" />
                                                        <p className="text-xs text-slate-500 dark:text-gray-500 font-medium">No notifications yet</p>
                                                    </div>
                                                )}
                                            </div>
                                            {notifications.length > 0 && (
                                                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 dark:border-white/5 pt-3">
                                                    <button
                                                        onClick={handleMarkAllRead}
                                                        className="flex-1 py-2 text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-colors"
                                                    >
                                                        Mark all as read
                                                    </button>
                                                    <button
                                                        onClick={handleClearAll}
                                                        className="flex-1 py-2 text-[10px] font-bold text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                                                    >
                                                        Clear all
                                                    </button>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Dark Mode Toggle */}
                        <button
                            onClick={() => setIsDark(!isDark)}
                            className="p-2 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            aria-label="Toggle dark mode"
                        >
                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {/* Profile Avatar - Redirects to settings tab */}
                        {!isAuthPage && user && (
                            <button
                                onClick={() => {
                                    if (user.role === 'teacher') {
                                        navigate('/instructor-dashboard?tab=settings');
                                    } else {
                                        navigate('/student-dashboard?tab=settings');
                                    }
                                }}
                                className="w-10 h-10 rounded-full border-2 border-purple-500/20 bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center text-white font-bold text-sm hover:shadow-lg hover:shadow-purple-600/30 transition-all overflow-hidden shrink-0"
                                title="Profile Settings"
                            >
                                {user.avatar ? (
                                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span>{getInitials(user.name)}</span>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </motion.nav>
        </>
    );
});

export default GlobalNavbar;
