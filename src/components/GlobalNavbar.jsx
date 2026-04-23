import { memo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Moon, Sun, Bell, Sparkles } from 'lucide-react';

const ease = [0.25, 0.46, 0.45, 0.94];

const GlobalNavbar = memo(function GlobalNavbar({ isDark, setIsDark }) {
    const [notificationCount, setNotificationCount] = useState(2);
    const [showNotifications, setShowNotifications] = useState(false);

    return (
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

                {/* Right Section */}
                <div className="flex items-center gap-6">
                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            aria-label="Notifications"
                        >
                            <Bell className="w-5 h-5" />
                            {notificationCount > 0 && (
                                <div className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
                                    {notificationCount}
                                </div>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-12 right-0 w-80 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-4"
                            >
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Notifications</h3>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    <div className="p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
                                        New study room invitation
                                    </div>
                                    <div className="p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
                                        Your quiz is ready
                                    </div>
                                </div>
                                <button
                                    onClick={() => setNotificationCount(0)}
                                    className="mt-3 w-full text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                                >
                                    Clear all
                                </button>
                            </motion.div>
                        )}
                    </div>

                    {/* Dark Mode Toggle */}
                    <button
                        onClick={() => setIsDark(!isDark)}
                        className="p-2 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Toggle dark mode"
                    >
                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    {/* Profile Avatar */}
                    <Link
                        to="/student-dashboard"
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center text-white font-bold text-sm hover:shadow-lg hover:shadow-purple-600/30 transition-all"
                        title="Profile"
                    >
                        SS
                    </Link>
                </div>
            </div>
        </motion.nav>
    );
});

export default GlobalNavbar;
