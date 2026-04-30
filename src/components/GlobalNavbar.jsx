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
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [profileForm, setProfileForm] = useState({
        name: '',
        email: '',
        avatar: '',
        grade: '',
        field: '',
        bio: ''
    });

    const location = useLocation();
    const navigate = useNavigate();
    const isAuthPage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password';

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
            setProfileForm({
                name: currentUser.name || '',
                email: currentUser.email || '',
                avatar: currentUser.avatar || '',
                grade: currentUser.grade || '',
                field: currentUser.field || '',
                bio: currentUser.bio || ''
            });
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

    const handleProfileInputChange = (e) => {
        const { name, value } = e.target;
        setProfileForm(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('File size too large. Please choose an image under 2MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileForm(prev => ({ ...prev, avatar: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const response = await updateProfile(profileForm);
            setUser(response.user);
            setShowProfileModal(false);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Update failed:', error);
            alert(error.response?.data?.msg || 'Failed to update profile');
        } finally {
            setIsUpdating(false);
        }
    };


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

                        {/* Profile Avatar */}
                        {!isAuthPage && user && (
                            <button
                                onClick={() => setShowProfileModal(true)}
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

            {/* ── Profile Modal ── */}
            {showProfileModal && (
                <div className="fixed inset-0 z-[9999] bg-slate-900/60 dark:bg-black/80 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto animate-in fade-in duration-200">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="w-full max-w-lg bg-white dark:bg-[#191121] border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] flex flex-col max-h-[90vh]"
                    >
                        <div className="px-8 py-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-black/20">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Profile Settings</h3>
                                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 font-medium">Manage your personal information</p>
                            </div>
                            <button
                                onClick={() => setShowProfileModal(false)}
                                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-gray-400 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleProfileSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                            <div className="flex flex-col items-center gap-4 mb-4">
                                <div
                                    onClick={() => document.getElementById('navbar-avatar-upload').click()}
                                    className="relative group cursor-pointer"
                                >
                                    <div className="w-28 h-28 rounded-full border-4 border-purple-500/20 overflow-hidden bg-slate-100 dark:bg-white/5 flex items-center justify-center transition-all group-hover:border-purple-500/40">
                                        {profileForm.avatar ? (
                                            <img src={profileForm.avatar} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <UserCircle2 className="w-14 h-14 text-slate-400" />
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                                        <Camera className="text-white w-7 h-7" />
                                    </div>
                                    <input
                                        id="navbar-avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.name}</p>
                                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium cursor-pointer hover:underline" onClick={() => document.getElementById('navbar-avatar-upload').click()}>
                                        Change Profile Picture
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">Full Name</label>
                                    <input
                                        name="name"
                                        value={profileForm.name}
                                        onChange={handleProfileInputChange}
                                        className="w-full rounded-xl bg-slate-50 dark:bg-[#1a1524] border border-slate-200 dark:border-white/10 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:focus:border-[#8c30e8] transition-all text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={profileForm.email}
                                        onChange={handleProfileInputChange}
                                        className="w-full rounded-xl bg-slate-50 dark:bg-[#1a1524] border border-slate-200 dark:border-white/10 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:focus:border-[#8c30e8] transition-all text-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">Grade / Standard</label>
                                    <input
                                        name="grade"
                                        value={profileForm.grade}
                                        onChange={handleProfileInputChange}
                                        placeholder="e.g. 10th, Undergraduate"
                                        className="w-full rounded-xl bg-slate-50 dark:bg-[#1a1524] border border-slate-200 dark:border-white/10 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:focus:border-[#8c30e8] transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">Field</label>
                                    <input
                                        name="field"
                                        value={profileForm.field}
                                        onChange={handleProfileInputChange}
                                        placeholder="e.g. Computer Science"
                                        className="w-full rounded-xl bg-slate-50 dark:bg-[#1a1524] border border-slate-200 dark:border-white/10 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:focus:border-[#8c30e8] transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">Bio</label>
                                <textarea
                                    name="bio"
                                    value={profileForm.bio}
                                    onChange={handleProfileInputChange}
                                    placeholder="Tell us a bit about yourself..."
                                    rows="3"
                                    className="w-full rounded-xl bg-slate-50 dark:bg-[#1a1524] border border-slate-200 dark:border-white/10 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:focus:border-[#8c30e8] transition-all text-sm resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setShowProfileModal(false)}
                                    className="px-6 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-bold shadow-[0_8px_16px_-4px_rgba(140,48,232,0.4)] transition-all text-sm disabled:opacity-50"
                                >
                                    {isUpdating ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </>
    );
});

export default GlobalNavbar;
