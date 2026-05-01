import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../services/authService';
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    BookOpen,
    Settings,
    LogOut,
    FileText,
    Sparkles,
    ChevronLeft
} from 'lucide-react';

const InstructorSidebar = ({ activeTab, onTabChange }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const navigate = useNavigate();
    const user = getCurrentUser();

    const getInitials = (name) => {
        if (!name) return 'IN';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const sidebarItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'students', icon: Users, label: 'My Students' },
        { id: 'quiz-generator', icon: FileText, label: 'Quiz Generator', route: '/quiz-generator' },
        { id: 'mentorship', icon: Sparkles, label: 'Mentorship', route: '/instructor-mentorship' },
        { id: 'community', icon: MessageSquare, label: 'Community' },
        { id: 'resources', icon: BookOpen, label: 'Resource Hub' },
        { id: 'settings', icon: Settings, label: 'Settings' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleSidebar = () => {
        setIsExpanded(!isExpanded);
    };

    const handleNavigation = (item) => {
        if (item.route) {
            navigate(item.route);
        } else if (onTabChange) {
            onTabChange(item.id);
        } else {
            navigate('/instructor-dashboard');
        }
    };

    // 1st file ki CSS logic k sath match krne k lye isExpanded ko isCollapsed me map kr dia hai
    const isCollapsed = !isExpanded;

    return (
        <aside
            className={`
                relative flex flex-col h-screen
                bg-background dark:bg-[#0a0a0f] border-r border-border dark:border-white/[0.06]
                text-muted-foreground dark:text-slate-300 transition-all duration-300 ease-in-out
                ${isCollapsed ? "w-20" : "w-72"}
            `}
        >
            {/* ── Header ── */}
            <div
                className={`flex items-center h-16 px-4 border-b border-border dark:border-white/[0.06] ${
                    isCollapsed ? "justify-center" : "justify-between"
                }`}
            >
                <div className={`flex items-center gap-2 overflow-hidden ${isCollapsed ? "justify-center" : ""}`}>
                    <Sparkles size={22} className="text-purple-600 dark:text-purple-400 shrink-0" />
                    {!isCollapsed && (
                        <span className="font-bold text-lg tracking-wide text-foreground dark:text-white whitespace-nowrap">
                            StudyBuddy
                        </span>
                    )}
                </div>

                <button
                    onClick={toggleSidebar}
                    className={`
                        p-1.5 rounded-lg text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white
                        hover:bg-slate-100 dark:hover:bg-white/10 transition-colors
                        ${isCollapsed ? "absolute -right-3 top-5 bg-background dark:bg-[#0a0a0f] border border-border dark:border-white/10 shadow-lg z-10" : ""}
                    `}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <ChevronLeft
                        size={18}
                        className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
                    />
                </button>
            </div>

            {/* ── Navigation ── */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
                {sidebarItems.map((item) => {
                    const isActive = activeTab === item.id || (item.route && window.location.pathname === item.route);

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavigation(item)}
                            className={`
                                w-full group relative flex items-center gap-3 rounded-xl
                                transition-all duration-200 overflow-hidden
                                ${isCollapsed ? "justify-center px-0 py-3" : "px-4 py-3"}
                                ${
                                    isActive
                                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 dark:shadow-[inset_0_0_20px_rgba(140,48,232,0.08)]"
                                        : "text-muted-foreground dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white"
                                }
                            `}
                        >
                            {/* Active indicator bar */}
                            {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-purple-600 dark:bg-purple-400" />
                            )}

                            <item.icon
                                size={20}
                                className={`shrink-0 ${
                                    isActive
                                        ? "text-purple-600 dark:text-purple-400"
                                        : "group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"
                                }`}
                            />

                            {/* Label */}
                            {!isCollapsed && (
                                <span className="text-sm font-medium whitespace-nowrap">
                                    {item.label}
                                </span>
                            )}

                            {/* Tooltip (collapsed) */}
                            {isCollapsed && (
                                <span
                                    className="
                                        pointer-events-none absolute left-full ml-3
                                        whitespace-nowrap rounded-lg
                                        bg-slate-800 dark:bg-slate-900 px-3 py-1.5
                                        text-xs font-medium text-white
                                        shadow-xl border border-border dark:border-white/10
                                        opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0
                                        transition-all duration-200 z-50
                                    "
                                >
                                    {item.label}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* ── Bottom Actions (Profile & Logout) ── */}
            <div className="px-3 pb-4 border-t border-border dark:border-white/[0.06] pt-3 space-y-1">
                <button
                    onClick={() => onTabChange('settings')}
                    className={`
                        flex items-center gap-3 w-full p-2 rounded-xl
                        bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5
                        hover:bg-slate-200/50 dark:hover:bg-white/10 transition-all group/profile
                        ${isCollapsed ? "justify-center" : "px-3"}
                    `}
                >
                    <div className="w-9 h-9 rounded-lg bg-purple-600 dark:bg-[#8c30e8] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-lg shadow-purple-500/20">
                        {user?.avatar ? (
                            <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                            getInitials(user?.name)
                        )}
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 text-left overflow-hidden">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name || 'Instructor'}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">View Profile</div>
                        </div>
                    )}
                </button>

                <button
                    onClick={handleLogout}
                    className={`
                        group relative flex items-center gap-3 w-full rounded-xl
                        text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300
                        transition-colors mt-2
                        ${isCollapsed ? "justify-center px-0 py-3" : "px-4 py-3"}
                    `}
                >
                    <LogOut size={18} className="shrink-0" />
                    {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
                    
                    {isCollapsed && (
                        <span
                            className="
                                pointer-events-none absolute left-full ml-3
                                whitespace-nowrap rounded-lg
                                bg-slate-800 dark:bg-slate-900 px-3 py-1.5
                                text-xs font-medium text-white
                                shadow-xl border border-border dark:border-white/10
                                opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0
                                transition-all duration-200 z-50
                            "
                        >
                            Logout
                        </span>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default InstructorSidebar;