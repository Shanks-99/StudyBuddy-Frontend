import React from 'react';
import { Shield, Info } from 'lucide-react';

const AdminSettings = ({ user }) => {
    return (
        <div className="space-y-8">
            <div><h1 className="text-3xl font-black text-slate-900 dark:text-white">Settings</h1><p className="text-slate-500 mt-1">Admin panel configuration</p></div>

            <div className="rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Shield size={16} /> Admin Account</h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center text-2xl font-bold">{user?.name?.charAt(0)?.toUpperCase()}</div>
                        <div>
                            <div className="text-lg font-bold text-slate-900 dark:text-white">{user?.name}</div>
                            <div className="text-sm text-slate-500">{user?.email}</div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400 mt-1 inline-block">Admin</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Info size={16} /> Platform Info</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-black/20"><div className="text-xs font-bold text-slate-400 uppercase">Platform</div><div className="text-slate-900 dark:text-white font-bold mt-1">StudyBuddy</div></div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-black/20"><div className="text-xs font-bold text-slate-400 uppercase">Version</div><div className="text-slate-900 dark:text-white font-bold mt-1">1.0.0</div></div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-black/20"><div className="text-xs font-bold text-slate-400 uppercase">Backend</div><div className="text-slate-900 dark:text-white font-bold mt-1">Express + MongoDB</div></div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-black/20"><div className="text-xs font-bold text-slate-400 uppercase">Frontend</div><div className="text-slate-900 dark:text-white font-bold mt-1">React</div></div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
