import React, { useState, useEffect } from 'react';
import { Search, Ban, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllMentors, toggleUserBan, deleteUser } from '../../services/adminService';

const AdminMentors = () => {
    const [mentors, setMentors] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [selectedMentor, setSelectedMentor] = useState(null);

    const load = async (p = 1, q = '', st = '') => {
        setLoading(true);
        try {
            const res = await getAllMentors({ page: p, search: q, status: st || undefined });
            setMentors(res.mentors); setTotal(res.total); setPages(res.pages); setPage(res.page);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleSearch = (e) => { e.preventDefault(); load(1, search, statusFilter); };
    const handleBan = async (id) => { if (!window.confirm('Toggle ban?')) return; try { await toggleUserBan(id); load(page, search, statusFilter); } catch (e) { alert('Failed'); } };
    const handleDelete = async (id) => { if (!window.confirm('Delete this mentor permanently?')) return; try { await deleteUser(id); load(page, search, statusFilter); } catch (e) { alert('Failed'); } };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div><h1 className="text-3xl font-black text-slate-900 dark:text-white">Mentors</h1><p className="text-slate-500 mt-1">Manage mentor accounts ({total} total)</p></div>
                <form onSubmit={handleSearch} className="flex gap-2 items-center">
                    <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); load(1, search, e.target.value); }} className="px-3 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm dark:text-white outline-none">
                        <option value="">All Status</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
                    </select>
                    <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm outline-none dark:text-white w-52" /></div>
                    <button type="submit" className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold">Search</button>
                </form>
            </div>

            {loading ? <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" /></div> : (
                <div className="rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead><tr className="bg-slate-50 dark:bg-black/20 border-b border-slate-200 dark:border-white/10">
                            {['Mentor','Email','Qualification','Status','Rate','Actions'].map(h => <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">{h}</th>)}
                        </tr></thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {mentors.map(m => {
                                const p = m.mentorProfile;
                                const statusColors = { approved: 'bg-green-50 text-green-600 dark:bg-green-500/20 dark:text-green-400', pending: 'bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400', rejected: 'bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400' };
                                return (
                                    <tr key={m._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                                        <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">{m.name?.charAt(0)?.toUpperCase()}</div><span className="text-sm font-semibold text-slate-900 dark:text-white">{m.name}</span></div></td>
                                        <td className="px-5 py-4 text-sm text-slate-500">{m.email}</td>
                                        <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{p?.qualification || '—'}</td>
                                        <td className="px-5 py-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColors[p?.status] || 'bg-slate-100 text-slate-500'}`}>{p?.status || 'No profile'}</span></td>
                                        <td className="px-5 py-4 text-sm font-bold text-slate-900 dark:text-white">{p?.hourlyRate || 0}</td>
                                        <td className="px-5 py-4"><div className="flex gap-2">
                                            {p && <button onClick={() => setSelectedMentor(m)} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-500" title="View Profile"><Eye size={16} /></button>}
                                            <button onClick={() => handleBan(m._id)} className="p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10 text-amber-500" title="Toggle Ban"><Ban size={16} /></button>
                                            <button onClick={() => handleDelete(m._id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500" title="Delete"><Trash2 size={16} /></button>
                                        </div></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {mentors.length === 0 && <div className="text-center py-12 text-slate-400">No mentors found.</div>}
                    {pages > 1 && <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-white/10"><button onClick={() => load(page-1,search,statusFilter)} disabled={page<=1} className="text-sm text-slate-500 disabled:opacity-40 flex items-center gap-1"><ChevronLeft size={16}/>Prev</button><span className="text-sm text-slate-500">Page {page}/{pages}</span><button onClick={() => load(page+1,search,statusFilter)} disabled={page>=pages} className="text-sm text-slate-500 disabled:opacity-40 flex items-center gap-1">Next<ChevronRight size={16}/></button></div>}
                </div>
            )}

            {selectedMentor && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedMentor(null)}>
                    <div className="bg-white dark:bg-[#191121] rounded-2xl border border-slate-200 dark:border-white/10 p-6 max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Mentor Profile</h3>
                        {(() => { const p = selectedMentor.mentorProfile; return p ? (
                            <div className="space-y-3 text-sm">
                                <div><span className="font-bold text-slate-500">Name:</span> <span className="text-slate-900 dark:text-white">{p.name}</span></div>
                                <div><span className="font-bold text-slate-500">Email:</span> <span className="text-slate-900 dark:text-white">{p.email}</span></div>
                                <div><span className="font-bold text-slate-500">Qualification:</span> <span className="text-slate-900 dark:text-white">{p.qualification || '—'}</span></div>
                                <div><span className="font-bold text-slate-500">Subjects:</span> <span className="text-slate-900 dark:text-white">{p.specializedCourses}</span></div>
                                <div><span className="font-bold text-slate-500">Skill Level:</span> <span className="text-slate-900 dark:text-white">{p.skillLevel}</span></div>
                                <div><span className="font-bold text-slate-500">Rate:</span> <span className="text-slate-900 dark:text-white">{p.hourlyRate}/session</span></div>
                                <div><span className="font-bold text-slate-500">Tags:</span> <span className="text-slate-900 dark:text-white">{(p.tags||[]).join(', ') || '—'}</span></div>
                                <div><span className="font-bold text-slate-500">Documents:</span> <span className="text-slate-900 dark:text-white">{(p.degreeFiles||[]).length} file(s)</span></div>
                                <div><span className="font-bold text-slate-500">Description:</span> <p className="text-slate-700 dark:text-slate-300 mt-1">{p.description}</p></div>
                            </div>
                        ) : <p className="text-slate-400">No profile submitted.</p>; })()}
                        <button onClick={() => setSelectedMentor(null)} className="mt-6 w-full py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white text-sm font-bold hover:bg-slate-200 dark:hover:bg-white/20 transition-colors">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminMentors;
