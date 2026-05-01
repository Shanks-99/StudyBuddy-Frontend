import React, { useState, useEffect } from 'react';
import { Search, Ban, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllStudents, toggleUserBan, deleteUser } from '../../services/adminService';

const AdminStudents = () => {
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const load = async (p = 1, q = '') => {
        setLoading(true);
        try {
            const res = await getAllStudents({ page: p, search: q });
            setStudents(res.students); setTotal(res.total); setPages(res.pages); setPage(res.page);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleSearch = (e) => { e.preventDefault(); load(1, search); };

    const handleBan = async (id) => {
        if (!window.confirm('Toggle ban status for this user?')) return;
        try { await toggleUserBan(id); load(page, search); } catch (e) { alert(e.response?.data?.msg || 'Failed'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Permanently delete this user? This cannot be undone.')) return;
        try { await deleteUser(id); load(page, search); } catch (e) { alert(e.response?.data?.msg || 'Failed'); }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-3xl font-black text-slate-900 dark:text-white">Students</h1><p className="text-slate-500 mt-1">Manage student accounts ({total} total)</p></div>
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." className="pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-red-500/20 dark:text-white w-64" /></div>
                    <button type="submit" className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors">Search</button>
                </form>
            </div>

            {loading ? <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" /></div> : (
                <div className="rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead><tr className="bg-slate-50 dark:bg-black/20 border-b border-slate-200 dark:border-white/10">
                            {['Name','Email','Verified','Joined','Actions'].map(h => <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">{h}</th>)}
                        </tr></thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {students.map(s => (
                                <tr key={s._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">{s.name?.charAt(0)?.toUpperCase()}</div><span className="text-sm font-semibold text-slate-900 dark:text-white">{s.name}</span></div></td>
                                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{s.email}</td>
                                    <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.isVerified ? 'bg-green-50 text-green-600 dark:bg-green-500/20 dark:text-green-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'}`}>{s.isVerified ? 'Yes' : 'No'}</span></td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4"><div className="flex gap-2">
                                        <button onClick={() => handleBan(s._id)} className="p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10 text-amber-500 transition-colors" title="Toggle Ban"><Ban size={16} /></button>
                                        <button onClick={() => handleDelete(s._id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors" title="Delete"><Trash2 size={16} /></button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {students.length === 0 && <div className="text-center py-12 text-slate-400">No students found.</div>}
                    {pages > 1 && <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-white/10">
                        <button onClick={() => load(page - 1, search)} disabled={page <= 1} className="flex items-center gap-1 text-sm text-slate-500 disabled:opacity-40"><ChevronLeft size={16} /> Previous</button>
                        <span className="text-sm text-slate-500">Page {page} of {pages}</span>
                        <button onClick={() => load(page + 1, search)} disabled={page >= pages} className="flex items-center gap-1 text-sm text-slate-500 disabled:opacity-40">Next <ChevronRight size={16} /></button>
                    </div>}
                </div>
            )}
        </div>
    );
};

export default AdminStudents;
