import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Zap, Calendar, CheckCircle, Circle, RotateCcw, Shield, Play, Send, Trash2, AlertTriangle, MapPin, PenLine, Info } from 'lucide-react';
import DeadlineBadge from './DeadlineBadge';
import QuestJourney from './QuestJourney';
import TaskNotes from './TaskNotes';

const API_URL = import.meta.env.VITE_API_URL || '';

const STATUS_META = {
  assigned:        { label: 'Assigned',       color: 'text-gray-400',    bg: 'bg-gray-400/10',    icon: Circle },
  in_progress:     { label: 'In Progress',     color: 'text-rpg-accent',  bg: 'bg-rpg-accent/10',  icon: RotateCcw },
  in_review:       { label: 'In Review',       color: 'text-rpg-gold',    bg: 'bg-rpg-gold/10',    icon: Shield },
  pending_council: { label: 'Pending Council', color: 'text-rpg-gold',    bg: 'bg-rpg-gold/10',    icon: Shield },
  verified:        { label: 'Verified',        color: 'text-green-400',   bg: 'bg-green-400/10',   icon: CheckCircle },
};

const TABS = [
  { id: 'info',    label: 'Info',    icon: Info },
  { id: 'journey', label: 'Journey', icon: MapPin },
  { id: 'notes',   label: 'Notes',   icon: PenLine },
];

const TaskDetailModal = ({ isOpen, onClose, task, currentUser, onStatusChanged, onDeleted }) => {
  const [activeTab, setActiveTab]         = useState('info');
  const [loading, setLoading]             = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError]                 = useState('');

  if (!task) return null;

  const meta           = STATUS_META[task.status] || STATUS_META.assigned;
  const StatusIcon     = meta.icon;
  const isAssignee     = currentUser && task.assigned_to && Number(task.assigned_to) === Number(currentUser.id);
  const canDelete      = currentUser && (
    currentUser.role === 'leader' ||
    (Number(task?.created_by) === Number(currentUser.id) && task?.status === 'assigned')
  );

  const updateStatus = async (newStatus) => {
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/api/tasks/${task.id}/status`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
      onStatusChanged?.();
      onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    setDeleting(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/api/tasks/${task.id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete quest');
      onDeleted?.();
      onClose();
    } catch (err) { setError(err.message); setConfirmDelete(false); }
    finally { setDeleting(false); }
  };

  const handleClose = () => {
    setActiveTab('info');
    setConfirmDelete(false);
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-rpg-panel border border-gray-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* ── Header ───────────────────────────────────── */}
            <div className="p-5 border-b border-gray-700/50 flex justify-between items-start gap-4 shrink-0">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-white leading-snug truncate">{task.title}</h2>
                <div className={`inline-flex items-center gap-1.5 mt-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.bg} ${meta.color}`}>
                  <StatusIcon size={11} />{meta.label}
                </div>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors shrink-0 mt-0.5">
                <X size={20} />
              </button>
            </div>

            {/* ── Tab Bar ──────────────────────────────────── */}
            <div className="flex border-b border-gray-700/50 shrink-0 bg-black/20">
              {TABS.map((tab) => {
                const TabIcon = tab.icon;
                const active  = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-all relative ${
                      active ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <TabIcon size={13} />
                    {tab.label}
                    {active && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-rpg-accent rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Tab Content ──────────────────────────────── */}
            <div className="overflow-y-auto flex-1">
              <AnimatePresence mode="wait">
                {/* INFO TAB */}
                {activeTab === 'info' && (
                  <motion.div
                    key="info"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="p-5 space-y-4"
                  >
                    {task.description
                      ? <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</p>
                          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{task.description}</p>
                        </div>
                      : <p className="text-gray-600 text-sm italic">No description provided.</p>}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black/30 rounded-xl p-3.5">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><User size={11} /> Assigned To</p>
                        <p className="text-sm font-semibold text-gray-200">{task.assignee_name || '—'}</p>
                        {task.assignee_role && <span className={`text-xs capitalize ${task.assignee_role === 'leader' ? 'text-rpg-gold' : 'text-rpg-accent'}`}>{task.assignee_role}</span>}
                      </div>
                      <div className="bg-black/30 rounded-xl p-3.5">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Calendar size={11} /> Created By</p>
                        <p className="text-sm font-semibold text-gray-200">{task.creator_name || '—'}</p>
                        {task.creator_role && <span className={`text-xs capitalize ${task.creator_role === 'leader' ? 'text-rpg-gold' : 'text-rpg-accent'}`}>{task.creator_role}</span>}
                      </div>
                      <div className="bg-black/30 rounded-xl p-3.5">
                        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5"><Calendar size={11} /> Deadline</p>
                        {task.deadline ? <DeadlineBadge deadline={task.deadline} /> : <p className="text-sm text-gray-500">No deadline</p>}
                      </div>
                      <div className="bg-black/30 rounded-xl p-3.5">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Zap size={11} /> Base XP</p>
                        <p className="text-xl font-bold text-rpg-gold">+{task.base_xp}</p>
                      </div>
                    </div>

                    {error && <p className="text-rpg-danger text-sm text-center">{error}</p>}

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 pt-1">
                      {isAssignee && task.status === 'assigned' && (
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={() => updateStatus('in_progress')} disabled={loading}
                          className="w-full py-3 rounded-xl bg-rpg-accent hover:bg-rpg-accent/80 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-rpg-accent/20"
                        >
                          <Play size={15} /> {loading ? 'Starting…' : 'Start Quest'}
                        </motion.button>
                      )}
                      {isAssignee && task.status === 'in_progress' && (
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={() => updateStatus('in_review')} disabled={loading}
                          className="w-full py-3 rounded-xl bg-rpg-gold hover:bg-rpg-gold/80 text-rpg-bg font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-rpg-gold/20"
                        >
                          <Send size={15} /> {loading ? 'Submitting…' : 'Submit for Review'}
                        </motion.button>
                      )}
                      {(task.status === 'in_review' || task.status === 'pending_council') && (
                        <div className="w-full py-3 rounded-xl bg-rpg-gold/10 border border-rpg-gold/30 text-rpg-gold text-sm font-semibold text-center">
                          🛡️ Awaiting council review ({task.approval_count || 0} approval{task.approval_count !== 1 ? 's' : ''} so far)
                        </div>
                      )}
                      {task.status === 'verified' && (
                        <div className="w-full py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-semibold text-center">
                          ✅ Quest Verified — XP Awarded!
                        </div>
                      )}

                      <button onClick={handleClose} className="w-full py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:bg-white/5 hover:text-white text-sm font-medium transition-colors">
                        Close
                      </button>

                      {/* Delete zone */}
                      {canDelete && (
                        <div>
                          {!confirmDelete ? (
                            <button onClick={() => setConfirmDelete(true)}
                              className="w-full py-2.5 rounded-xl border border-red-900/40 text-red-400/70 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50 text-sm font-medium transition-all flex items-center justify-center gap-2"
                            >
                              <Trash2 size={13} /> Delete Quest
                            </button>
                          ) : (
                            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                              className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"
                            >
                              <div className="flex items-center gap-2 text-red-400 font-bold text-sm mb-2">
                                <AlertTriangle size={14} /> Are you sure?
                              </div>
                              <p className="text-gray-400 text-xs mb-3">
                                Permanently delete <span className="text-white font-semibold">&ldquo;{task.title}&rdquo;</span>. This cannot be undone.
                              </p>
                              <div className="flex gap-2">
                                <button onClick={() => setConfirmDelete(false)}
                                  className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white text-sm transition-colors"
                                >Cancel</button>
                                <motion.button whileTap={{ scale: 0.97 }} onClick={handleDelete} disabled={deleting}
                                  className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                                >
                                  <Trash2 size={13} /> {deleting ? 'Deleting…' : 'Yes, Delete'}
                                </motion.button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* JOURNEY TAB */}
                {activeTab === 'journey' && (
                  <motion.div
                    key="journey"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="p-5"
                  >
                    <QuestJourney task={task} />
                  </motion.div>
                )}

                {/* NOTES TAB */}
                {activeTab === 'notes' && (
                  <motion.div
                    key="notes"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="p-5"
                  >
                    <TaskNotes task={task} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TaskDetailModal;
