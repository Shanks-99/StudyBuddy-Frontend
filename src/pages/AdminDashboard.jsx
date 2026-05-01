import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import AdminSidebar from '../components/AdminSidebar';
import AdminOverview from '../components/admin/AdminOverview';
import AdminStudents from '../components/admin/AdminStudents';
import AdminMentors from '../components/admin/AdminMentors';
import AdminApprovals from '../components/admin/AdminApprovals';
import AdminReports from '../components/admin/AdminReports';
import AdminAnalytics from '../components/admin/AdminAnalytics';
import AdminSettings from '../components/admin/AdminSettings';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const u = getCurrentUser();
        if (!u || u.role !== 'admin') { navigate('/login'); return; }
        setUser(u);
    }, [navigate]);

    if (!user) return <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0f]"><div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" /></div>;

    const renderTab = () => {
        switch (activeTab) {
            case 'dashboard': return <AdminOverview />;
            case 'students': return <AdminStudents />;
            case 'mentors': return <AdminMentors />;
            case 'approvals': return <AdminApprovals />;
            case 'reports': return <AdminReports />;
            case 'analytics': return <AdminAnalytics />;
            case 'settings': return <AdminSettings user={user} />;
            default: return <AdminOverview />;
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-[#0a0a0f]">
            <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
            <main className="flex-1 overflow-y-auto">
                <div className="p-8">{renderTab()}</div>
            </main>
        </div>
    );
};

export default AdminDashboard;
