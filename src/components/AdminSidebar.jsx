import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/authService';
import {
    LayoutDashboard, Users, GraduationCap, ShieldCheck, Flag,
    BarChart3, Settings, LogOut, ChevronLeft, Shield
} from 'lucide-react';

const AdminSidebar = ({ activeTab, onTabChange }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const navigate = useNavigate();

    const items = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'mentors', icon: GraduationCap, label: 'Mentors' },
        { id: 'students', icon: Users, label: 'Students' },
        { id: 'approvals', icon: ShieldCheck, label: 'Approvals' },
        { id: 'reports', icon: Flag, label: 'Reports' },
        { id: 'analytics', icon: BarChart3, label: 'Analytics' },
        { id: 'settings', icon: Settings, label: 'Settings' },
    ];

    const handleLogout = () => { logout(); navigate('/login'); };
    const isCollapsed = !isExpanded;

    return (
        <aside className={`relative flex flex-col h-screen bg-background dark:bg-[#0a0a0f] border-r border-border dark:border-white/[0.06] text-muted-foreground dark:text-slate-300 transition-all duration-300 ${isCollapsed ? "w-20" : "w-72"}`}>
            <div className={`flex items-center h-16 px-4 border-b border-border dark:border-white/[0.06] ${isCollapsed ? "justify-center" : "justify-between"}`}>
                <div className={`flex items-center gap-2 overflow-hidden ${isCollapsed ? "justify-center" : ""}`}>
                    <Shield size={22} className="text-red-500 dark:text-red-400 shrink-0" />
                    {!isCollapsed && <span className="font-bold text-lg tracking-wide text-foreground dark:text-white whitespace-nowrap">Admin Panel</span>}
                </div>
                <button onClick={() => setIsExpanded(!isExpanded)} className={`p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/10 transition-colors ${isCollapsed ? "absolute -right-3 top-5 bg-background dark:bg-[#0a0a0f] border border-border dark:border-white/10 shadow-lg z-10" : ""}`}>
                    <ChevronLeft size={18} className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {items.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button key={item.id} onClick={() => onTabChange(item.id)}
                            className={`w-full group relative flex items-center gap-3 rounded-xl transition-all duration-200 ${isCollapsed ? "justify-center px-0 py-3" : "px-4 py-3"} ${isActive ? "bg-red-500/10 text-red-600 dark:text-red-400" : "text-muted-foreground dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04]"}`}>
                            {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-red-600 dark:bg-red-400" />}
                            <item.icon size={20} className={`shrink-0 ${isActive ? "text-red-600 dark:text-red-400" : "group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors"}`} />
                            {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
                            {isCollapsed && <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white shadow-xl opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50">{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

            <div className="px-3 pb-4 border-t border-border dark:border-white/[0.06] pt-3">
                <button onClick={handleLogout} className={`group relative flex items-center gap-3 w-full rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors ${isCollapsed ? "justify-center px-0 py-3" : "px-4 py-3"}`}>
                    <LogOut size={18} className="shrink-0" />
                    {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
