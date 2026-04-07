import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Users, MessageSquare, AlertTriangle, Lock, LogOut, RefreshCw, Trash2 } from 'lucide-react';
import { api } from '../services/api';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [stats, setStats] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'chats' | 'users' | 'emergencies'>('stats');

  useEffect(() => {
    if (token && isOpen) {
      fetchData();
    }
  }, [token, isOpen, activeTab]);

  const fetchData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      if (activeTab === 'stats') setStats(await api.getAdminStats(token));
      if (activeTab === 'chats') setChats(await api.getAdminChats(token));
      if (activeTab === 'users') setUsers(await api.getAdminUsers(token));
      if (activeTab === 'emergencies') setEmergencies(await api.getAdminEmergencies(token));
    } catch (e) {
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccess = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Simple access without password
      const newToken = 'admin_access_granted';
      setToken(newToken);
      localStorage.setItem('admin_token', newToken);
    } catch (e) {
      setError('Failed to access system');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('admin_token');
  };

  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string | number; name?: string } | null>(null);

  const handleDelete = async () => {
    if (!confirmDelete || !token) return;
    
    try {
      if (confirmDelete.type === 'user') await api.deleteAdminUser(token, confirmDelete.id as string);
      if (confirmDelete.type === 'chat') await api.deleteAdminChat(token, String(confirmDelete.id));
      if (confirmDelete.type === 'emergency') await api.deleteAdminEmergency(token, confirmDelete.id as string);
      fetchData();
    } catch (e) {
      setError('Failed to delete record');
    } finally {
      setConfirmDelete(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <AnimatePresence>
        {confirmDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#1a1025] border border-red-500/20 rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500 mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Are you sure?</h3>
              <p className="text-sm text-gray-400 mb-8">
                This action cannot be undone. You are about to delete this {confirmDelete.type} record.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-600/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-4xl bg-[#0a0a0f] border border-cyan-500/20 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.1)] flex flex-col max-h-[90vh] relative"
      >
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyan-500/10 flex items-center justify-between bg-cyan-500/5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <h2 className="font-mono font-bold text-lg tracking-widest text-cyan-400 uppercase">Security_Console_v2.0</h2>
            {token && (
              <span className="text-[9px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30 uppercase tracking-[0.2em] font-bold">
                ACCESS_GRANTED
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-cyan-400">
            <X size={20} />
          </button>
        </div>

        {!token ? (
          /* Login Form */
          <div className="p-8 flex flex-col items-center justify-center flex-1">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20">
              <Lock className="text-indigo-400" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Tarik Bhai Admin</h3>
            <p className="text-white/40 text-sm mb-8 text-center max-w-xs">
              Click below to access the control panel and records.
            </p>
            
            {error && <p className="text-red-400 text-xs text-center font-medium mb-4">{error}</p>}
            
            <button 
              onClick={handleAccess}
              disabled={isLoading}
              className="w-full max-w-sm bg-indigo-600 hover:bg-indigo-700 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              {isLoading ? 'Accessing...' : 'Access System'}
            </button>
          </div>
        ) : (
          /* Dashboard Content */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Tabs - Scrollable on mobile */}
            <div className="flex overflow-x-auto no-scrollbar px-2 py-2 border-b border-white/5 bg-white/2">
              <button 
                onClick={() => setActiveTab('stats')}
                className={`flex-none sm:flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all ${activeTab === 'stats' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
              >
                <Shield size={14} className="sm:w-4 sm:h-4" /> Stats
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={`flex-none sm:flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
              >
                <Users size={14} className="sm:w-4 sm:h-4" /> Users
              </button>
              <button 
                onClick={() => setActiveTab('chats')}
                className={`flex-none sm:flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all ${activeTab === 'chats' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
              >
                <MessageSquare size={14} className="sm:w-4 sm:h-4" /> Chats
              </button>
              <button 
                onClick={() => setActiveTab('emergencies')}
                className={`flex-none sm:flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all ${activeTab === 'emergencies' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
              >
                <AlertTriangle size={14} className="sm:w-4 sm:h-4" /> Alerts
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-white/40">
                  <RefreshCw className="animate-spin" size={32} />
                  <p className="text-sm font-medium">Fetching records...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeTab === 'stats' && stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="glass-card p-6 rounded-3xl border-white/10">
                        <Users className="text-indigo-400 mb-4" size={24} />
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <div className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">Total Sisters</div>
                      </div>
                      <div className="glass-card p-6 rounded-3xl border-white/10">
                        <MessageSquare className="text-purple-400 mb-4" size={24} />
                        <div className="text-2xl font-bold">{stats.totalChats}</div>
                        <div className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">Total Messages</div>
                      </div>
                      <div className="glass-card p-6 rounded-3xl border-white/10">
                        <AlertTriangle className="text-red-400 mb-4" size={24} />
                        <div className="text-2xl font-bold">{stats.totalEmergencies}</div>
                        <div className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">Panic Alerts</div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'users' && (
                    <div className="space-y-3">
                      {users.map((u) => (
                        <div key={u.id} className="glass-card p-4 rounded-2xl border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold">
                              {u.name[0]}
                            </div>
                            <div>
                              <div className="font-bold text-sm">{u.name}</div>
                              <div className="text-[10px] text-white/40 font-mono">{u.id}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                              <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Joined</div>
                              <div className="text-xs">{new Date(u.createdAt).toLocaleDateString()}</div>
                            </div>
                            <button 
                              onClick={() => setConfirmDelete({ type: 'user', id: u.id, name: u.name })}
                              className="p-2 text-red-400/40 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'chats' && (
                    <div className="space-y-4">
                      {chats.map((c, i) => (
                        <div key={i} className="glass-card p-4 rounded-2xl border-white/5 space-y-3">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-indigo-400">{c.name}</span>
                              <span className="text-[10px] text-white/20">•</span>
                              <span className="text-[10px] text-white/40">{new Date(c.timestamp).toLocaleString()}</span>
                            </div>
                            <button 
                              onClick={() => setConfirmDelete({ type: 'chat', id: c.timestamp })}
                              className="p-1 text-red-400/40 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="space-y-2">
                            <div className="text-xs bg-white/5 p-2 rounded-lg border border-white/5">
                              <span className="text-indigo-300/60 font-bold mr-2">Sister:</span>
                              {c.message}
                            </div>
                            <div className="text-xs bg-indigo-500/5 p-2 rounded-lg border border-indigo-500/10">
                              <span className="text-indigo-400 font-bold mr-2">Bhai:</span>
                              {c.reply}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'emergencies' && (
                    <div className="space-y-3">
                      {emergencies.map((e) => (
                        <div key={e.id} className="glass-card p-4 rounded-2xl border-red-500/20 bg-red-500/5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400">
                              <AlertTriangle size={20} />
                            </div>
                            <div>
                              <div className="font-bold text-sm text-red-400">Emergency Alert</div>
                              <div className="text-xs text-white/60">{e.location}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                              <div className="text-[10px] text-red-400 font-bold uppercase tracking-widest">{e.status}</div>
                              <div className="text-xs">{new Date(e.timestamp).toLocaleTimeString()}</div>
                            </div>
                            <button 
                              onClick={() => setConfirmDelete({ type: 'emergency', id: e.id })}
                              className="p-2 text-red-400/40 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-white/2">
              <button 
                onClick={fetchData}
                className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-colors"
              >
                <RefreshCw size={14} /> Refresh Data
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
