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
    Sparkles // Added for the logo UI
} from 'lucide-react';

const Sidebar = ({ activeTab, onTabChange }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    const sidebarItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'content-generator', icon: FileText, label: 'Content Generator', route: '/content-generator' },
        { id: 'mentorship', icon: Users, label: 'Mentorship System', route: '/mentorship' },
        { id: 'studyroom', icon: Video, label: 'Study Room', route: '/studyroom' },
        { id: 'focusrooms', icon: Headphones, label: 'Focus Rooms', route: '/focusrooms' },
        { id: 'studybuddy', icon: UserPlus, label: 'Study with Buddy', route: '/studybuddy' },
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
            navigate('/student-dashboard');
        }
    };

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
            </div>

            {/* ── Navigation ── */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar" aria-label="Main Navigation">
                {sidebarItems.map((item) => {
                    const isActive = activeTab === item.id || (item.route && location.pathname === item.route);

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavigation(item)}
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
                                    {item.label}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

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
                >
                    <LogOut size={18} className="shrink-0" aria-hidden="true" />
                    {!isCollapsed && <span className="text-sm font-medium">Logout</span>}

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
                            Logout
                        </span>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;