import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Clock, User } from 'lucide-react';

const TaskCard = ({ task, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id.toString(), data: { ...task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  const isPendingCouncil = task.status === 'pending_council' || (task.status === 'in_review' && (task.creator_role === 'leader' || task.assignee_role === 'leader'));
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={() => onClick && onClick(task)} className="touch-none">
      <motion.div
        whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(59, 130, 246, 0.3)" }}
        className="bg-rpg-panel border border-gray-700 rounded-lg p-4 cursor-grab active:cursor-grabbing relative overflow-hidden"
      >
        {isPendingCouncil && (
          <div className="absolute top-0 right-0 bg-rpg-danger/90 text-white text-xs font-bold px-2 py-1 rounded-bl-lg shadow-md z-10">
            Pending Council ({task.approval_count || 0}/2)
          </div>
        )}

        <div className="mb-2 pr-12">
          <h3 className="font-semibold text-white leading-tight">{task.title}</h3>
        </div>
        
        {task.description && (
          <p className="text-sm text-gray-400 mb-4 line-clamp-2">{task.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400 mt-auto">
          <div className="flex items-center gap-1">
            <User size={12} />
            <span className="truncate max-w-[100px]">{task.assignee_name || 'Unassigned'}</span>
          </div>
          
          {task.deadline && (
            <div className={`flex items-center gap-1 ${new Date(task.deadline) < new Date() ? 'text-rpg-danger' : 'text-rpg-accent'}`}>
              <Clock size={12} />
              <span>{new Date(task.deadline).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        
        <div className="mt-3 flex items-center justify-between border-t border-gray-700/50 pt-2">
           <span className="text-xs font-medium text-rpg-gold">+{task.base_xp} XP</span>
        </div>
      </motion.div>
    </div>
  );
};

export default TaskCard;
