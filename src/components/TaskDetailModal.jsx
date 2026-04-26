import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Clock, Zap, Calendar, CheckCircle, Circle, RotateCcw, Shield } from 'lucide-react';

const STATUS_META = {
  assigned:        { label: 'Assigned',       color: 'text-gray-400',    bg: 'bg-gray-400/10',    icon: Circle },
  in_progress:     { label: 'In Progress',     color: 'text-rpg-accent',  bg: 'bg-rpg-accent/10',  icon: RotateCcw },
  in_review:       { label: 'In Review',       color: 'text-rpg-gold',    bg: 'bg-rpg-gold/10',    icon: Shield },
  pending_council: { label: 'Pending Council', color: 'text-rpg-gold',    bg: 'bg-rpg-gold/10',    icon: Shield },
  verified:        { label: 'Verified',        color: 'text-rpg-success', bg: 'bg-rpg-success/10', icon: CheckCircle },
};

const TaskDetailModal = ({ isOpen, onClose, task }) => {
  if (!task) return null;
  const meta = STATUS_META[task.status] || STATUS_META.assigned;
  const StatusIcon = meta.icon;
  const isPastDeadline = task.deadline && new Date(task.deadline) < new Date();
  const isCouncil = task.status === 'pending_council' || (task.status === 'in_review' && (task.creator_role === 'leader' || task.assignee_role === 'leader'));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="bg-rpg-panel border border-gray-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-700/50 flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white leading-snug">{task.title}</h2>
                <div className={`inline-flex items-center gap-1.5 mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.bg} ${meta.color}`}>
                  <StatusIcon size={12} />{meta.label}
                  {isCouncil && <span className="ml-1 text-rpg-gold">— {task.approval_count || 0}/2 approvals</span>}
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors shrink-0"><X size={22} /></button>
            </div>
            <div className="p-6 space-y-5">
              {task.description ? (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</p>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{task.description}</p>
                </div>
              ) : <p className="text-gray-600 text-sm italic">No description provided.</p>}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><User size={11} /> Assigned To</p>
                  <p className="text-sm font-semibold text-gray-200">{task.assignee_name || '—'}</p>
                  {task.assignee_role && <span className={`text-xs capitalize ${task.assignee_role === 'leader' ? 'text-rpg-gold' : 'text-rpg-accent'}`}>{task.assignee_role}</span>}
                </div>
                <div className="bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Calendar size={11} /> Created By</p>
                  <p className="text-sm font-semibold text-gray-200">{task.creator_name || '—'}</p>
                  {task.creator_role && <span className={`text-xs capitalize ${task.creator_role === 'leader' ? 'text-rpg-gold' : 'text-rpg-accent'}`}>{task.creator_role}</span>}
                </div>
                <div className="bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Clock size={11} /> Deadline</p>
                  {task.deadline ? (
                    <p className={`text-sm font-semibold ${isPastDeadline ? 'text-rpg-danger' : 'text-gray-200'}`}>
                      {new Date(task.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {isPastDeadline && <span className="ml-1 text-xs">(overdue)</span>}
                    </p>
                  ) : <p className="text-sm text-gray-500">No deadline</p>}
                </div>
                <div className="bg-black/30 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Zap size={11} /> Base XP</p>
                  <p className="text-lg font-bold text-rpg-gold">+{task.base_xp}</p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6">
              <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:bg-white/5 hover:text-white text-sm font-medium transition-colors">Close</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TaskDetailModal;
