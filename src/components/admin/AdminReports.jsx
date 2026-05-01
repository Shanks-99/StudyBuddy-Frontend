import React, { useState, useEffect } from 'react';
import { CheckCircle, Eye, XCircle, Clock } from 'lucide-react';
import { getAllReports, updateReportStatus } from '../../services/adminService';

const AdminReports = () => {
    const [reports, setReports] = useState([]);
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [notes, setNotes] = useState('');

    const load = async (st = '') => {
        setLoading(true);
        try { const res = await getAllReports({ status: st || undefined }); setReports(res.reports || []); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleAction = async (reportId, status) => {
        try { await updateReportStatus(reportId, { status, adminNotes: notes }); setSelected(null); setNotes(''); load(statusFilter); }
        catch (e) { alert('Failed'); }
    };

    const statusColors = { pending: 'bg-amber-50 text-amber-600', reviewed: 'bg-blue-50 text-blue-600', resolved: 'bg-green-50 text-green-600', dismissed: 'bg-slate-100 text-slate-500' };
    const catColors = { harassment: 'bg-red-50 text-red-600', spam: 'bg-orange-50 text-orange-600', inappropriate: 'bg-pink-50 text-pink-600', fraud: 'bg-purple-50 text-purple-600', other: 'bg-slate-50 text-slate-600' };

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-3xl font-black text-slate-900 dark:text-white">Reports</h1><p className="text-slate-500 mt-1">Handle user reports ({reports.length})</p></div>
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); load(e.target.value); }} className="px-3 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm dark:text-white outline-none">
                    <option value="">All</option><option value="pending">Pending</option><option value="reviewed">Reviewed</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option>
                </select>
            </div>

            {reports.length === 0 ? (
                <div className="rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 p-12 text-center"><CheckCircle size={48} className="mx-auto text-green-500 mb-4" /><h3 className="text-lg font-bold text-slate-900 dark:text-white">No reports</h3></div>
            ) : (
                <div className="space-y-4">
                    {reports.map(r => (
                        <div key={r._id} className="rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 p-5 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white">{r.reason}</div>
                                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Clock size={12} /> {new Date(r.createdAt).toLocaleString()}</div>
                                </div>
                                <div className="flex gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${catColors[r.category] || catColors.other}`}>{r.category}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColors[r.status]}`}>{r.status}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300 mb-3">
                                <span><strong>Reporter:</strong> {r.reporter?.name || '—'} ({r.reporter?.role})</span>
                                <span>→</span>
                                <span><strong>Reported:</strong> {r.reportedUser?.name || '—'} ({r.reportedUser?.role})</span>
                            </div>
                            {r.description && <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{r.description}</p>}
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

            {selected && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
                    <div className="bg-white dark:bg-[#191121] rounded-2xl p-6 max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold dark:text-white mb-4">Review Report</h3>
                        <div className="space-y-2 text-sm mb-4">
                            <div><strong className="text-slate-500">Reason:</strong> <span className="dark:text-white">{selected.reason}</span></div>
                            <div><strong className="text-slate-500">Category:</strong> <span className="dark:text-white">{selected.category}</span></div>
                            <div><strong className="text-slate-500">Description:</strong> <p className="dark:text-slate-300">{selected.description || '—'}</p></div>
                        </div>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-sm dark:text-white mb-4" placeholder="Admin notes..." />
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
