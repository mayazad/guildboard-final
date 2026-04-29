import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Calendar, Zap } from 'lucide-react';
import DeadlineBadge from './DeadlineBadge';

const TaskCard = ({ task, onClick, accentColor = '#6366f1' }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id.toString(), data: { ...task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.4 : 1,
  };

  const isPendingCouncil =
    task.status === 'pending_council' ||
    (task.status === 'in_review' && (task.creator_role === 'leader' || task.assignee_role === 'leader'));

  const initials = task.assignee_name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={() => onClick?.(task)} className="touch-none">
      <motion.div
        whileHover={{ y: -3, boxShadow: `0 8px 28px ${accentColor}30` }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="relative bg-rpg-bg border border-gray-700/80 hover:border-gray-600 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing"
      >
        {/* Left accent strip */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl" style={{ background: accentColor }} />

        {/* Pending Council badge */}
        {isPendingCouncil && (
          <div className="absolute top-2 right-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded-lg z-10">
            ⚖️ Council {task.approval_count || 0}/2
          </div>
        )}

        <div className="pl-4 pr-3 pt-3 pb-3">
          {/* Title */}
          <h3 className="font-bold text-white leading-snug text-sm mb-1 pr-10">
            {task.title}
          </h3>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Footer row */}
          <div className="flex items-center justify-between gap-2 mt-2">
            {/* Assignee avatar + name */}
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold shrink-0"
                style={{ background: `${accentColor}25`, color: accentColor, border: `1px solid ${accentColor}50` }}
              >
                {initials}
              </div>
              <span className="text-xs text-gray-500 truncate max-w-[80px]">
                {task.assignee_name || 'Unassigned'}
              </span>
            </div>

            {/* XP badge */}
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-0.5"
              style={{ background: `${accentColor}18`, color: accentColor }}
            >
              <Zap size={9} />+{task.base_xp}
            </span>
          </div>

          {/* Deadline */}
          {task.deadline && (
            <div className="mt-2 pt-2 border-t border-gray-700/40">
              <DeadlineBadge deadline={task.deadline} />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TaskCard;
