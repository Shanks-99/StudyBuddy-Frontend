import React, { useState, useEffect } from 'react';
import { CheckCircle, Eye, XCircle, Clock, AlertOctagon, MessageSquare, Flag } from 'lucide-react';
import { getAllReports, updateReportStatus } from '../../services/adminService';
import { getCommunityReports, handleCommunityReport } from '../../services/communityService';

const AdminReports = () => {
    const [reportTab, setReportTab] = useState('system'); // 'system' or 'community'
    const [reports, setReports] = useState([]);
    const [communityReports, setCommunityReports] = useState([]);
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [notes, setNotes] = useState('');

    const loadSystemReports = async (st = '') => {
        setLoading(true);
        try {
            const res = await getAllReports({ status: st || undefined });
            setReports(res.reports || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadCommunityReports = async () => {
        setLoading(true);
        try {
            const res = await getCommunityReports();
            setCommunityReports(res || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (reportTab === 'system') {
            loadSystemReports(statusFilter);
        } else {
            loadCommunityReports();
        }
    }, [reportTab, statusFilter]);

    const handleAction = async (reportId, status) => {
        try {
            await updateReportStatus(reportId, { status, adminNotes: notes });
            setSelected(null);
            setNotes('');
            loadSystemReports(statusFilter);
        } catch (e) {
            alert('Failed to update report');
        }
    };

    const handleCommAction = async (reportId, action) => {
        try {
            await handleCommunityReport(reportId, action);
            loadCommunityReports();
        } catch (e) {
            alert('Failed to process community report');
        }
    };

    const statusColors = { 
        pending: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400', 
        reviewed: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400', 
        resolved: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400', 
        dismissed: 'bg-slate-100 text-slate-500 dark:bg-slate-500/10 dark:text-slate-400' 
    };

    const catColors = { 
        harassment: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400', 
        spam: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400', 
        inappropriate: 'bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400', 
        fraud: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400', 
        bug: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
        other: 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400' 
    };

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" /></div>;

    return (
        <div className="space-y-6">
            {/* Tab Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Reports Center</h1>
                    <p className="text-slate-500 dark:text-white/55 mt-1">Review and action flagged content and bugs</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setReportTab('system')} 
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${reportTab === 'system' ? 'bg-purple-600 text-white dark:bg-[#8c30e8]' : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10'}`}
                    >
                        System & User Reports
                    </button>
                    <button 
                        onClick={() => setReportTab('community')} 
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${reportTab === 'community' ? 'bg-purple-600 text-white dark:bg-[#8c30e8]' : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10'}`}
                    >
                        Community Post Reports
                    </button>
                </div>
            </div>

            {reportTab === 'system' ? (
                <>
                    {/* Status Filter for System Reports */}
                    <div className="flex justify-end">
                        <select 
                            value={statusFilter} 
                            onChange={e => setStatusFilter(e.target.value)} 
                            className="px-3 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm dark:text-white outline-none"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="resolved">Resolved</option>
                            <option value="dismissed">Dismissed</option>
                        </select>
                    </div>

                    {reports.length === 0 ? (
                        <div className="rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 p-12 text-center">
                            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No system or user reports found</h3>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reports.map(r => (
                                <div key={r._id} className="rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 p-5 shadow-sm">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                {r.category === 'bug' && <AlertOctagon size={16} className="text-red-500" />}
                                                {r.reason}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                <Clock size={12} /> {new Date(r.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${catColors[r.category] || catColors.other}`}>{r.category}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColors[r.status]}`}>{r.status}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300 mb-3">
                                        <span><strong>Reporter:</strong> {r.reporter?.name || '—'} ({r.reporter?.role})</span>
                                        {r.reportedUser && (
                                            <>
                                                <span>→</span>
                                                <span><strong>Reported:</strong> {r.reportedUser?.name || '—'} ({r.reportedUser?.role})</span>
                                            </>
                                        )}
                                    </div>
                                    {r.description && (
                                        <div className="bg-slate-50 dark:bg-black/20 p-3 rounded-xl text-sm text-slate-500 dark:text-slate-400 mb-3 whitespace-pre-line font-mono">
                                            {r.description}
                                        </div>
                                    )}
                                    {r.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => setSelected(r)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-sm font-bold flex items-center gap-1 dark:text-white"><Eye size={14}/> Review</button>
                                            <button onClick={() => handleAction(r._id, 'resolved')} className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-bold flex items-center gap-1"><CheckCircle size={14}/> Resolve</button>
                                            <button onClick={() => handleAction(r._id, 'dismissed')} className="px-4 py-2 rounded-xl bg-slate-500 text-white text-sm font-bold flex items-center gap-1"><XCircle size={14}/> Dismiss</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <>
                    {communityReports.length === 0 ? (
                        <div className="rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 p-12 text-center">
                            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No community post reports found</h3>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {communityReports.map(r => (
                                <div key={r._id} className="rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 p-5 shadow-sm">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                                                <Flag size={16} /> Reported Reason: {r.reason}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                <Clock size={12} /> Reported on: {new Date(r.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColors[r.status] || statusColors.pending}`}>{r.status}</span>
                                    </div>

                                    {/* Reported Post Box */}
                                    <div className="bg-slate-50 dark:bg-black/20 p-4 rounded-xl border border-slate-100 dark:border-white/5 mb-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MessageSquare size={14} className="text-slate-400" />
                                            <span className="text-xs font-bold text-slate-700 dark:text-white/80">
                                                Post by {r.postId?.author?.name || 'Deleted User'} ({r.postId?.author?.role || 'unknown'})
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-mono ml-auto">
                                                {r.postId?.category || 'General'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                                            {r.postId?.content || <span className="italic text-slate-400">Post content not available or hidden</span>}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                                        <span><strong>Flagged By:</strong> {r.reportedBy?.name || 'Anonymous'} ({r.reportedBy?.email || 'no-email'})</span>
                                    </div>

                                    {r.status === 'pending' && r.postId && (
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleCommAction(r._id, 'hide')} 
                                                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold flex items-center gap-1.5 transition-colors"
                                            >
                                                <XCircle size={14}/> Hide Post & Approve Report
                                            </button>
                                            <button 
                                                onClick={() => handleCommAction(r._id, 'dismiss')} 
                                                className="px-4 py-2 rounded-xl bg-slate-500 hover:bg-slate-600 text-white text-sm font-bold flex items-center gap-1.5 transition-colors"
                                            >
                                                <CheckCircle size={14}/> Dismiss Report
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* System Review Modal */}
            {selected && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
                    <div className="bg-white dark:bg-[#191121] rounded-2xl p-6 max-w-lg w-full shadow-2xl border dark:border-white/10" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold dark:text-white mb-4">Review Report</h3>
                        <div className="space-y-2 text-sm mb-4">
                            <div><strong className="text-slate-500">Reason:</strong> <span className="dark:text-white">{selected.reason}</span></div>
                            <div><strong className="text-slate-500">Category:</strong> <span className="dark:text-white">{selected.category}</span></div>
                            <div><strong className="text-slate-500">Description:</strong> <p className="dark:text-slate-300 mt-1 p-2.5 rounded-lg bg-slate-50 dark:bg-black/20 font-mono whitespace-pre-line">{selected.description || '—'}</p></div>
                        </div>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-sm dark:text-white mb-4 outline-none focus:border-purple-500" placeholder="Admin notes..." />
                        <div className="flex gap-2">
                            <button onClick={() => handleAction(selected._id, 'resolved')} className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold">Resolve</button>
                            <button onClick={() => handleAction(selected._id, 'dismissed')} className="flex-1 py-2.5 rounded-xl bg-slate-500 text-white text-sm font-bold">Dismiss</button>
                            <button onClick={() => setSelected(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-sm font-bold dark:text-white">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReports;
