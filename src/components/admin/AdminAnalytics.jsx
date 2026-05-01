import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, BookOpen, BarChart3 } from 'lucide-react';
import { getAnalytics } from '../../services/adminService';

const AdminAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try { setData(await getAnalytics()); } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" /></div>;
    if (!data) return <div className="text-center py-20 text-slate-400">Failed to load analytics.</div>;

    const maxDaily = Math.max(...(data.dailyRegistrations || []).map(d => d.count), 1);

    return (
        <div className="space-y-8">
            <div><h1 className="text-3xl font-black text-slate-900 dark:text-white">Analytics</h1><p className="text-slate-500 mt-1">Platform performance metrics</p></div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2"><TrendingUp size={20} className="text-green-500" /><span className="text-xs font-bold uppercase text-slate-500">New Users (30d)</span></div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{data.newUsersThisMonth}</div>
                    <div className="text-xs text-slate-400 mt-1">{data.newUsersThisWeek} this week</div>
                </div>
                <div className="rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2"><BookOpen size={20} className="text-blue-500" /><span className="text-xs font-bold uppercase text-slate-500">Sessions (30d)</span></div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{data.sessionsThisMonth}</div>
                </div>
                <div className="rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2"><Users size={20} className="text-purple-500" /><span className="text-xs font-bold uppercase text-slate-500">Role Distribution</span></div>
                    <div className="flex gap-3 mt-2">{(data.roleDistribution||[]).map(r => <span key={r._id} className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-300">{r._id}: {r.count}</span>)}</div>
                </div>
            </div>

            <div className="rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2"><BarChart3 size={16} /> Daily Registrations (30 days)</h3>
                <div className="flex items-end gap-1 h-40">
                    {(data.dailyRegistrations || []).map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                            <div className="w-full bg-red-500/80 dark:bg-red-400/80 rounded-t-md transition-all hover:bg-red-600" style={{ height: `${(d.count / maxDaily) * 100}%`, minHeight: d.count > 0 ? '4px' : '0' }} />
                            <span className="pointer-events-none absolute -top-8 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{d._id}: {d.count}</span>
                        </div>
                    ))}
                </div>
                {(data.dailyRegistrations || []).length === 0 && <div className="text-center text-slate-400 py-8">No registration data for the past 30 days.</div>}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Mentor Status Breakdown</h3>
                    <div className="space-y-3">
                        {(data.mentorStatusDistribution || []).map(s => {
                            const colors = { approved: 'bg-green-500', pending: 'bg-amber-500', rejected: 'bg-red-500', missing: 'bg-slate-400' };
                            const total = (data.mentorStatusDistribution || []).reduce((a, b) => a + b.count, 0) || 1;
                            return (
                                <div key={s._id} className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-20 capitalize">{s._id}</span>
                                    <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden"><div className={`h-full rounded-full ${colors[s._id] || 'bg-slate-400'}`} style={{ width: `${(s.count / total) * 100}%` }} /></div>
                                    <span className="text-xs font-bold text-slate-500">{s.count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;
