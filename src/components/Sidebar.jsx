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
    ChevronRight,
    Menu
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

    return (
        <div
            className={`${isExpanded ? 'w-64' : 'w-20'
                } bg-black/30 backdrop-blur-xl border-r border-white/10 flex flex-col transition-all duration-300 ease-in-out relative`}
        >
            {/* Toggle Button */}
            <button
                onClick={toggleSidebar}
                className="absolute -right-3 top-8 bg-purple-600 rounded-full p-1 text-white shadow-lg hover:bg-purple-700 transition-colors z-50 border border-white/20"
            >
                {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>

            {/* Logo */}
            <div className={`p-6 border-b border-white/10 flex items-center ${isExpanded ? 'justify-between' : 'justify-center'}`}>
                {isExpanded ? (
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent whitespace-nowrap overflow-hidden">
                        StudyBuddy
                    </h1>
                ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                        SB
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-hide">
                {sidebarItems.map((item) => {
                    const isActive = location.pathname === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm group relative ${isActive
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-purple-500/50'
                                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                } ${!isExpanded && 'justify-center'}`}
                            title={!isExpanded ? item.label : ''}
                        >
                            <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />

                            {isExpanded && (
                                <span className="font-medium whitespace-nowrap overflow-hidden transition-opacity duration-200">
                                    {item.label}
                                </span>
                            )}

                            {/* Tooltip for collapsed state */}
                            {!isExpanded && (
                                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-white/10">
                                    {item.label}
                                </div>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-white/10">
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/20 transition-all duration-200 text-sm group relative ${!isExpanded && 'justify-center'}`}
                    title={!isExpanded ? 'Logout' : ''}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {isExpanded && <span className="font-medium whitespace-nowrap">Logout</span>}

                    {!isExpanded && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-white/10">
                            Logout
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
