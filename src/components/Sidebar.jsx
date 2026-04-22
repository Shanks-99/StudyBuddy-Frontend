import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../services/authService';
import {
    LayoutDashboard,
    FileText,
    Users,
    Video,
    MessageSquare,
    BookOpen,
    Settings,
    LogOut,
    UserPlus,
    Headphones,
    ChevronLeft,
<<<<<<< HEAD
    Sparkles // Added for the logo UI
=======
    ChevronRight
>>>>>>> 2847710994b1259fcef4f688b7892cf24fcdf658
} from 'lucide-react';

const Sidebar = () => {
    const [isExpanded, setIsExpanded] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    const sidebarItems = [
        { id: '/student-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: '/content-generator', icon: FileText, label: 'Content Generator' },
        { id: '/mentorship', icon: Users, label: 'Mentorship System' },
        { id: '/studyroom', icon: Video, label: 'Study Room' },
        { id: '/focusrooms', icon: Headphones, label: 'Focus Rooms' },
        { id: '/studybuddy', icon: UserPlus, label: 'Study with Buddy' },
        { id: '/community', icon: MessageSquare, label: 'Community' },
        { id: '/resources', icon: BookOpen, label: 'Resource Hub' },
        { id: '/settings', icon: Settings, label: 'Settings' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleSidebar = () => {
        setIsExpanded(!isExpanded);
    };

<<<<<<< HEAD
    // Styling logic ko match karne ke liye isExpanded ko isCollapsed mein map kiya hai
    const isCollapsed = !isExpanded;

    return (
        <aside
            aria-label="Student Sidebar Navigation"
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
                    <Sparkles size={22} className="text-purple-600 dark:text-purple-400 shrink-0" aria-hidden="true" />
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
                    aria-expanded={!isCollapsed}
                >
                    <ChevronLeft
                        size={18}
                        className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
                        aria-hidden="true"
                    />
                </button>
=======
    const isRouteActive = (route) => {
        if (route === '/studyroom') {
            return location.pathname === route || location.pathname.startsWith('/studyroom/');
        }
        return location.pathname === route;
    };

    return (
        <aside
            className={`${isExpanded ? 'w-64' : 'w-20'
                } sidebar-shell sticky top-0 h-screen flex flex-col transition-all duration-300 ease-in-out relative`}
        >
            {/* Toggle Button */}
            <button
                onClick={toggleSidebar}
                className="absolute -right-3 top-8 bg-[var(--accent-primary)] rounded-full p-1 text-white shadow-lg hover:brightness-95 transition-colors z-50 border border-white"
            >
                {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>

            {/* Logo */}
            <div className={`p-6 border-b border-[var(--border)] flex items-center ${isExpanded ? 'justify-between' : 'justify-center'}`}>
                {isExpanded ? (
                    <h1 className="text-2xl font-heading font-bold bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent whitespace-nowrap overflow-hidden">
                        StudyBuddy
                    </h1>
                ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white font-bold">
                        SB
                    </div>
                )}
>>>>>>> 2847710994b1259fcef4f688b7892cf24fcdf658
            </div>

            {/* ── Navigation ── */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar" aria-label="Main Navigation">
                {sidebarItems.map((item) => {
<<<<<<< HEAD
                    const isActive = location.pathname === item.id;

=======
                    const isActive = isRouteActive(item.id);
>>>>>>> 2847710994b1259fcef4f688b7892cf24fcdf658
                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.id)}
<<<<<<< HEAD
                            aria-current={isActive ? 'page' : undefined}
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
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-purple-600 dark:bg-purple-400" aria-hidden="true" />
                            )}
=======
                            className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm group relative ${isActive
                                    ? 'active'
                                    : ''
                                } ${!isExpanded && 'justify-center'}`}
                            title={!isExpanded ? item.label : ''}
                        >
                            <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive
                                    ? 'text-[var(--accent-primary)]'
                                    : 'text-[var(--text-muted)] group-hover:text-[var(--accent-primary)]'
                                }`} />
>>>>>>> 2847710994b1259fcef4f688b7892cf24fcdf658

                            <item.icon
                                size={20}
                                className={`shrink-0 ${
                                    isActive
                                        ? "text-purple-600 dark:text-purple-400"
                                        : "group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"
                                }`}
                                aria-hidden="true"
                            />

                            {/* Label */}
                            {!isCollapsed && (
                                <span className="text-sm font-medium whitespace-nowrap">
                                    {item.label}
                                </span>
                            )}

<<<<<<< HEAD
                            {/* Tooltip (collapsed) */}
                            {isCollapsed && (
                                <span
                                    role="tooltip"
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
=======
                            {/* Tooltip for collapsed state */}
                            {!isExpanded && (
                                <div className="absolute left-full ml-2 px-2 py-1 bg-white text-[var(--text-primary)] text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-[var(--border)] shadow-lg">
>>>>>>> 2847710994b1259fcef4f688b7892cf24fcdf658
                                    {item.label}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

<<<<<<< HEAD
            {/* ── Bottom Actions (Logout) ── */}
            <div className="px-3 pb-4 border-t border-border dark:border-white/[0.06] pt-3 space-y-1">
                <button
                    onClick={handleLogout}
                    aria-label="Logout from account"
                    className={`
                        group relative flex items-center gap-3 w-full rounded-xl
                        text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300
                        transition-colors
                        ${isCollapsed ? "justify-center px-0 py-3" : "px-4 py-3"}
                    `}
=======
            {/* Logout */}
            <div className="p-3 border-t border-[var(--border)]">
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-200 text-sm group relative ${!isExpanded && 'justify-center'}`}
                    title={!isExpanded ? 'Logout' : ''}
>>>>>>> 2847710994b1259fcef4f688b7892cf24fcdf658
                >
                    <LogOut size={18} className="shrink-0" aria-hidden="true" />
                    {!isCollapsed && <span className="text-sm font-medium">Logout</span>}

<<<<<<< HEAD
                    {isCollapsed && (
                        <span
                            role="tooltip"
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
=======
                    {!isExpanded && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-white text-[var(--text-primary)] text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-[var(--border)] shadow-lg">
>>>>>>> 2847710994b1259fcef4f688b7892cf24fcdf658
                            Logout
                        </span>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;