import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, ShieldCheck, Flag, BookOpen, BarChart3, TrendingUp, Clock } from 'lucide-react';
import { getAdminDashboard } from '../../services/adminService';

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
    <div className="rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}><Icon size={22} className="text-white" /></div>
            {sub && <span className="text-xs font-bold text-green-500 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-lg">{sub}</span>}
        </div>
        <div className="text-3xl font-black text-slate-900 dark:text-white">{value}</div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">{label}</div>
    </div>
);

const AdminOverview = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await getAdminDashboard();
                setData(res);
            } catch (e) { console.error('Dashboard load error:', e); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" /></div>;
    if (!data) return <div className="text-center text-slate-500 py-20">Failed to load dashboard data.</div>;

    const s = data.stats;
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white">Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Overview of your platform</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard icon={Users} label="Total Users" value={s.totalUsers} color="bg-blue-600" />
                <StatCard icon={GraduationCap} label="Mentors" value={s.totalTeachers} color="bg-purple-600" />
                <StatCard icon={Users} label="Students" value={s.totalStudents} color="bg-emerald-600" />
                <StatCard icon={ShieldCheck} label="Pending Approvals" value={s.pendingApprovals} color="bg-amber-500" sub={s.pendingApprovals > 0 ? 'Action needed' : null} />
                <StatCard icon={Flag} label="Open Reports" value={s.pendingReports} color="bg-red-500" sub={s.pendingReports > 0 ? 'Needs review' : null} />
                <StatCard icon={BookOpen} label="Total Sessions" value={s.totalSessions} color="bg-indigo-600" />
                <StatCard icon={BarChart3} label="Study Rooms" value={s.totalRooms} color="bg-teal-600" />
                <StatCard icon={TrendingUp} label="Admins" value={s.totalAdmins} color="bg-slate-700" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider mb-4">Recent Users</h3>
                    <div className="space-y-3">
                        {(data.recentUsers || []).map(u => (
                            <div key={u._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">{u.name?.charAt(0)?.toUpperCase()}</div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white">{u.name}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">{u.email}</div>
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.role === 'teacher' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'}`}>{u.role}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider mb-4">Recent Reports</h3>
                    <div className="space-y-3">
                        {(data.recentReports || []).length === 0 && <div className="text-sm text-slate-400 text-center py-8">No reports yet</div>}
                        {(data.recentReports || []).map(r => (
                            <div key={r._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5">
                                <div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">{r.reason}</div>
                                    <div className="text-xs text-slate-500">{r.reporter?.name} → {r.reportedUser?.name}</div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>{r.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;
