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
    ChevronRight
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
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar" aria-label="Main Navigation">
                {sidebarItems.map((item) => {
                    const isActive = isRouteActive(item.id);
                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.id)}
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

                            {/* Label */}
                            {isExpanded && (
                                <span className="text-sm font-medium whitespace-nowrap">
                                    {item.label}
                                </span>
                            )}

                            {/* Tooltip for collapsed state */}
                            {!isExpanded && (
                                <div className="absolute left-full ml-2 px-2 py-1 bg-white text-[var(--text-primary)] text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-[var(--border)] shadow-lg">
                                    {item.label}
                                </div>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-[var(--border)]">
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-200 text-sm group relative ${!isExpanded && 'justify-center'}`}
                    title={!isExpanded ? 'Logout' : ''}
                >
                    <LogOut size={18} className="shrink-0" aria-hidden="true" />
                    {isExpanded && <span className="text-sm font-medium">Logout</span>}

                    {!isExpanded && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-white text-[var(--text-primary)] text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-[var(--border)] shadow-lg">
                            Logout
                        </div>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;