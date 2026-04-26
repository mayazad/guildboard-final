import { useState, useEffect } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle, Zap, Shield, CheckCircle, Plus, Sword } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import CreateTaskModal from '../components/CreateTaskModal';
import ReviewTaskModal from '../components/ReviewTaskModal';
import TaskDetailModal from '../components/TaskDetailModal';

const API_URL = import.meta.env.VITE_API_URL || '';

const COLUMNS = [
  {
    id: 'assigned',
    title: 'Assigned',
    icon: Circle,
    color: '#8b5cf6',
    emptyMsg: 'No quests assigned yet',
    emptyHint: 'Create a new quest to get started',
    gradient: 'from-purple-500/10 to-transparent',
    border: 'border-purple-500/30',
    badge: 'bg-purple-500/20 text-purple-300',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    icon: Zap,
    color: '#06b6d4',
    emptyMsg: 'No active quests',
    emptyHint: 'Drag a quest here to start it',
    gradient: 'from-cyan-500/10 to-transparent',
    border: 'border-cyan-500/30',
    badge: 'bg-cyan-500/20 text-cyan-300',
  },
  {
    id: 'in_review',
    title: 'Review / Council',
    icon: Shield,
    color: '#f59e0b',
    emptyMsg: 'Nothing pending review',
    emptyHint: 'Submit a quest for council review',
    gradient: 'from-amber-500/10 to-transparent',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-300',
  },
  {
    id: 'verified',
    title: 'Verified',
    icon: CheckCircle,
    color: '#22c55e',
    emptyMsg: 'No completed quests yet',
    emptyHint: 'Completed quests appear here ✨',
    gradient: 'from-green-500/10 to-transparent',
    border: 'border-green-500/30',
    badge: 'bg-green-500/20 text-green-300',
  },
];

const EmptyState = ({ col }) => {
  const Icon = col.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-10 px-4 text-center"
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 opacity-30" style={{ background: `${col.color}22` }}>
        <Icon size={22} style={{ color: col.color }} />
      </div>
      <p className="text-sm font-medium text-gray-500">{col.emptyMsg}</p>
      <p className="text-xs text-gray-600 mt-1">{col.emptyHint}</p>
    </motion.div>
  );
};

const DroppableColumn = ({ col, tasks, onTaskClick }) => {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  const Icon = col.icon;

  return (
    <div className={`flex flex-col rounded-xl border overflow-hidden h-full transition-all duration-200 ${col.border} ${isOver ? 'ring-2 ring-offset-1 ring-offset-transparent' : ''}`}
      style={{ background: 'rgba(15,23,42,0.7)', ringColor: col.color }}>
      {/* Top accent strip */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${col.color}, transparent)` }} />

      {/* Column header */}
      <div className={`px-4 py-3 bg-gradient-to-b ${col.gradient} border-b border-gray-700/40 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Icon size={14} style={{ color: col.color }} />
          <h2 className="font-bold text-gray-200 text-sm">{col.title}</h2>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
          {tasks.length}
        </span>
      </div>

      {/* Tasks area */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-3 overflow-y-auto space-y-3 min-h-[200px] transition-colors duration-200 ${isOver ? 'bg-white/5' : ''}`}
      >
        <SortableContext items={tasks.map(t => t.id.toString())} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {tasks.map(task => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <TaskCard task={task} onClick={onTaskClick} />
              </motion.div>
            ))}
          </AnimatePresence>
        </SortableContext>
        {tasks.length === 0 && <EmptyState col={col} />}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [reviewTask, setReviewTask] = useState(null);
  const [detailTask, setDetailTask] = useState(null);

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setTasks(await res.json());
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeIdStr = active.id;
    const overIdStr = over.id;
    const isActiveTask = tasks.some(t => t.id.toString() === activeIdStr);
    const isOverColumn = COLUMNS.some(c => c.id === overIdStr);
    const isOverTask = tasks.some(t => t.id.toString() === overIdStr);
    if (!isActiveTask) return;
    setTasks(prev => {
      const items = [...prev];
      const activeIndex = items.findIndex(t => t.id.toString() === activeIdStr);
      let newStatus = items[activeIndex].status;
      if (isOverTask) {
        const overIndex = items.findIndex(t => t.id.toString() === overIdStr);
        newStatus = items[overIndex].status;
      } else if (isOverColumn) {
        newStatus = overIdStr;
      }
      if (items[activeIndex].status !== newStatus) {
        items[activeIndex] = { ...items[activeIndex], status: newStatus };
      }
      return items;
    });
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const task = tasks.find(t => t.id.toString() === active.id);
    if (!task) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/tasks/${task.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: task.status })
      });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-gray-400 flex items-center gap-2">
          <Sword size={16} className="text-rpg-accent" /> Loading quests...
        </motion.div>
      </div>
    );
  }

  const activeTask = tasks.find(t => t.id.toString() === activeId);
  const totalActive = tasks.filter(t => t.status !== 'verified').length;
  const totalDone   = tasks.filter(t => t.status === 'verified').length;

  return (
    <div className="flex flex-col gap-6 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Sword size={26} className="text-rpg-accent" /> Guild Quests
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {totalActive} active &middot; {totalDone} verified
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-rpg-accent hover:bg-rpg-accent/80 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-rpg-accent/20 transition-colors shrink-0"
        >
          <Plus size={16} /> New Quest
        </motion.button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" style={{ minHeight: '60vh' }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {COLUMNS.map((col) => (
            <DroppableColumn
              key={col.id}
              col={col}
              tasks={tasks.filter(t => t.status === col.id || (col.id === 'in_review' && t.status === 'pending_council'))}
              onTaskClick={(task) => {
                if (task.status === 'in_review' || task.status === 'pending_council') setReviewTask(task);
                else setDetailTask(task);
              }}
            />
          ))}

          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      <CreateTaskModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onTaskCreated={fetchTasks} />
      <ReviewTaskModal
        isOpen={!!reviewTask}
        onClose={() => setReviewTask(null)}
        task={reviewTask}
        onReviewSubmitted={(data) => { fetchTasks(); if (data.awardedXp) window.location.reload(); }}
      />
      <TaskDetailModal isOpen={!!detailTask} onClose={() => setDetailTask(null)} task={detailTask} />
    </div>
  );
};

export default Dashboard;
