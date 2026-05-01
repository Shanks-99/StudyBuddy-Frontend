import { memo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Moon, Sun, Bell, Sparkles, Camera, X, UserCircle2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, updateProfile } from '../services/authService';
import { getNotifications, markAsRead, clearAllNotifications, markAllAsRead } from '../services/notificationService';

const ease = [0.25, 0.46, 0.45, 0.94];

const GlobalNavbar = memo(function GlobalNavbar({ isDark, setIsDark }) {
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [user, setUser] = useState(null);

    const location = useLocation();
    const navigate = useNavigate();
    const isAuthPage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password';
    const isAdminPage = location.pathname.startsWith('/admin');

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
            fetchNotifications();

            // Poll for new notifications every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        } else {
            setUser(null);
            setNotifications([]);
        }
    }, [location.pathname]);

    const fetchNotifications = async () => {
        try {
            const data = await getNotifications();
            // Data is { notifications: [...] }
            const list = Array.isArray(data) ? data : (data?.notifications || []);
            setNotifications(list);
        } catch (error) {
            console.error("[Navbar] Failed to fetch notifications:", error);
            setNotifications([]);
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

    const unreadCount = notifications.filter(n => !n.isRead).length;


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
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setShowNotifications(!showNotifications);
                                        if (!showNotifications) fetchNotifications();
                                    }}
                                    className="relative p-2 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    aria-label="Notifications"
                                >
                                    <Bell className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <div className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                                            {unreadCount}
                                        </div>
                                    )}
                                </button>

                                {/* Notifications Dropdown */}
                                {showNotifications && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-12 right-0 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-4 z-[60]"
                                    >
                                        <div className="flex items-center justify-between mb-4 px-1">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                                            <span className="text-[10px] font-bold bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">{unreadCount} New</span>
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
                                    <span>{(user.name || '').split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase() || 'U'}</span>
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
