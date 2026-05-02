import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, FileText, Tags } from 'lucide-react';
import { getPendingApprovals, updateMentorStatus } from '../../services/adminService';

const AdminApprovals = () => {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [notes, setNotes] = useState('');

    const load = async () => {
        setLoading(true);
        try { const res = await getPendingApprovals(); setProfiles(res.profiles || []); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleAction = async (profileId, status) => {
        try {
            await updateMentorStatus(profileId, { status, adminNotes: notes });
            setSelected(null); setNotes('');
            load();
        } catch (e) { alert(e.response?.data?.msg || 'Failed'); }
    };

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" /></div>;

    return (
        <div className="space-y-6">
            <div><h1 className="text-3xl font-black text-slate-900 dark:text-white">Approvals</h1><p className="text-slate-500 mt-1">Review and approve mentor profiles ({profiles.length} pending)</p></div>

            {profiles.length === 0 ? (
                <div className="rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 p-12 text-center shadow-sm">
                    <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">All caught up!</h3>
                    <p className="text-slate-500 mt-1">No pending mentor approvals.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {profiles.map(p => (
                        <div key={p._id} className="rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center text-lg font-bold">{p.name?.charAt(0)?.toUpperCase()}</div>
                                    <div><div className="font-bold text-slate-900 dark:text-white">{p.name}</div><div className="text-xs text-slate-500">{p.email}</div></div>
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">Pending</span>
                            </div>
                            <div className="space-y-2 text-sm mb-4">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><FileText size={14} className="text-slate-400" /> {p.qualification || 'No qualification'}</div>
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Tags size={14} className="text-slate-400" /> {p.specializedCourses || '—'}</div>
                                <div className="text-xs text-slate-500">Skill: {p.skillLevel} · Rate: {p.hourlyRate}/session · Docs: {(p.degreeFiles||[]).length}</div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setSelected(p)} className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white text-sm font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-1"><Eye size={14} /> Review</button>
                                <button onClick={() => handleAction(p._id, 'approved')} className="flex-1 py-2 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-1"><CheckCircle size={14} /> Approve</button>
                                <button onClick={() => handleAction(p._id, 'rejected')} className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-1"><XCircle size={14} /> Reject</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selected && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
                    <div className="bg-white dark:bg-[#191121] rounded-2xl border border-slate-200 dark:border-white/10 p-6 max-w-lg w-full shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Review: {selected.name}</h3>
                        <div className="space-y-3 text-sm">
                            <div><span className="font-bold text-slate-500">Email:</span> <span className="dark:text-white">{selected.email}</span></div>
                            <div><span className="font-bold text-slate-500">Qualification:</span> <span className="dark:text-white">{selected.qualification || '—'}</span></div>
                            <div><span className="font-bold text-slate-500">Subjects:</span> <span className="dark:text-white">{selected.specializedCourses}</span></div>
                            <div><span className="font-bold text-slate-500">Skill Level:</span> <span className="dark:text-white">{selected.skillLevel}</span></div>
                            <div><span className="font-bold text-slate-500">Rate:</span> <span className="dark:text-white">{selected.hourlyRate}/session</span></div>
                            <div><span className="font-bold text-slate-500">Tags:</span> <span className="dark:text-white">{(selected.tags||[]).join(', ')}</span></div>
                            <div className="flex flex-col gap-1">
                                <div><span className="font-bold text-slate-500">Documents:</span> <span className="dark:text-white">{(selected.degreeFiles||[]).length} file(s) uploaded</span></div>
                                {selected.degreeFiles && selected.degreeFiles.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {selected.degreeFiles.map((file, idx) => {
                                            const hasData = file.includes('|DATA|');
                                            const displayUrl = hasData ? file.split('|DATA|')[1] : file;
                                            const displayName = hasData ? file.split('|DATA|')[0] : file;
                                            const isUrl = displayUrl.startsWith('http') || displayUrl.startsWith('data:');
                                            return (
                                                <a key={idx} href={isUrl ? displayUrl : '#'} download={isUrl ? displayName : undefined} target={isUrl ? "_blank" : undefined} rel="noreferrer" onClick={(e) => { if (!isUrl) { e.preventDefault(); alert(`Document content is not available. Only the filename (${displayName}) was uploaded.`); } }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors truncate max-w-full">
                                                    <FileText size={14} className="shrink-0" /> <span className="truncate">{hasData ? displayName : `Download Document ${idx + 1}`}</span>
                                                </a>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <div><span className="font-bold text-slate-500">Description:</span><p className="dark:text-slate-300 mt-1">{selected.description}</p></div>
                        </div>
                        <div className="mt-4"><label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Admin Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-sm outline-none dark:text-white" placeholder="Optional notes..." /></div>
                        <div className="flex gap-2 mt-4">
                            <button onClick={() => handleAction(selected._id, 'approved')} className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold">Approve</button>
                            <button onClick={() => handleAction(selected._id, 'rejected')} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold">Reject</button>
                            <button onClick={() => setSelected(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white text-sm font-bold">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminApprovals;
