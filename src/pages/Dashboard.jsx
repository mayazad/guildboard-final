import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle, Zap, Shield, CheckCircle, Plus, Sword, Activity, Star } from 'lucide-react';
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
    gradient: 'from-purple-500/8 to-transparent',
    border: 'border-purple-500/25',
    badge: 'bg-purple-500/15 text-purple-300',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    icon: Zap,
    color: '#06b6d4',
    emptyMsg: 'No active quests',
    emptyHint: 'Drag a quest here to start it',
    gradient: 'from-cyan-500/8 to-transparent',
    border: 'border-cyan-500/25',
    badge: 'bg-cyan-500/15 text-cyan-300',
  },
  {
    id: 'in_review',
    title: 'Review / Council',
    icon: Shield,
    color: '#f59e0b',
    emptyMsg: 'Nothing pending review',
    emptyHint: 'Submit a quest for council review',
    gradient: 'from-amber-500/8 to-transparent',
    border: 'border-amber-500/25',
    badge: 'bg-amber-500/15 text-amber-300',
  },
  {
    id: 'verified',
    title: 'Verified',
    icon: CheckCircle,
    color: '#22c55e',
    emptyMsg: 'No completed quests yet',
    emptyHint: 'Completed quests appear here ✨',
    gradient: 'from-green-500/8 to-transparent',
    border: 'border-green-500/25',
    badge: 'bg-green-500/15 text-green-300',
  },
];

// ─── Animated Stat Card ────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: 'spring', stiffness: 260, damping: 22 }}
    className="relative bg-rpg-panel border border-gray-700/60 rounded-xl px-4 py-3 overflow-hidden flex items-center gap-3"
  >
    {/* Subtle background glow */}
    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ background: `radial-gradient(circle at 20% 50%, ${color}, transparent 70%)` }} />
    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
      <Icon size={16} style={{ color }} />
    </div>
    <div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.1 }}
        className="text-xl font-extrabold text-white leading-none"
      >
        {value}
      </motion.p>
      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  </motion.div>
);

// ─── Animated Empty State ──────────────────────────────────────────────────────
const EmptyState = ({ col }) => {
  const Icon = col.icon;
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center gap-3">
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: `${col.color}15`, border: `1px dashed ${col.color}40` }}
      >
        <Icon size={22} style={{ color: col.color, opacity: 0.5 }} />
      </motion.div>
      <div>
        <p className="text-xs font-semibold text-gray-500">{col.emptyMsg}</p>
        <p className="text-[11px] text-gray-700 mt-0.5 hidden sm:block">{col.emptyHint}</p>
      </div>
    </div>
  );
};

// ─── Droppable Column ──────────────────────────────────────────────────────────
const DroppableColumn = ({ col, tasks, onTaskClick }) => {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  const Icon = col.icon;

  return (
    <div
      className={`flex flex-col rounded-xl border overflow-hidden h-full transition-all duration-200 ${col.border} ${isOver ? 'ring-1' : ''}`}
      style={{
        background: 'rgba(10,15,30,0.75)',
        ringColor: col.color,
        boxShadow: isOver ? `0 0 20px ${col.color}20` : 'none',
      }}
    >
      {/* Top accent line */}
      <div className="h-[2px] w-full shrink-0" style={{ background: `linear-gradient(90deg, ${col.color}, transparent 70%)` }} />

      {/* Column header */}
      <div className={`px-3 py-3 bg-gradient-to-b ${col.gradient} border-b border-gray-700/30 flex items-center justify-between shrink-0`}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${col.color}18` }}>
            <Icon size={13} style={{ color: col.color }} />
          </div>
          <h2 className="font-bold text-gray-200 text-sm">{col.title}</h2>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
          {tasks.length}
        </span>
      </div>

      {/* Tasks drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-2 sm:p-3 overflow-y-auto space-y-2.5 min-h-[140px] transition-colors duration-200 ${isOver ? 'bg-white/[0.03]' : ''}`}
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
                <TaskCard task={task} onClick={onTaskClick} accentColor={col.color} />
              </motion.div>
            ))}
          </AnimatePresence>
        </SortableContext>
        {tasks.length === 0 && <EmptyState col={col} />}
      </div>
    </div>
  );
};

// ─── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { guildData, userData } = useOutletContext() || {};
  const guildName = guildData?.guild?.name;

  const [tasks, setTasks]                         = useState([]);
  const [activeId, setActiveId]                   = useState(null);
  const [loading, setLoading]                     = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [reviewTask, setReviewTask]               = useState(null);
  const [detailTask, setDetailTask]               = useState(null);

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/api/tasks`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setTasks(await res.json());
    } catch (e) { console.error('Error fetching tasks:', e); }
    finally { setLoading(false); }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeIdStr  = active.id;
    const overIdStr    = over.id;
    const isActiveTask = tasks.some(t => t.id.toString() === activeIdStr);
    const isOverColumn = COLUMNS.some(c => c.id === overIdStr);
    const isOverTask   = tasks.some(t => t.id.toString() === overIdStr);
    if (!isActiveTask) return;
    setTasks(prev => {
      const items       = [...prev];
      const activeIndex = items.findIndex(t => t.id.toString() === activeIdStr);
      let newStatus     = items[activeIndex].status;
      if (isOverTask)        { const oi = items.findIndex(t => t.id.toString() === overIdStr); newStatus = items[oi].status; }
      else if (isOverColumn) { newStatus = overIdStr; }
      if (items[activeIndex].status !== newStatus) items[activeIndex] = { ...items[activeIndex], status: newStatus };
      return items;
    });
  };

  const handleDragEnd = async (event) => {
    const { active } = event;
    setActiveId(null);
    const task = tasks.find(t => t.id.toString() === active.id);
    if (!task) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/tasks/${task.id}/status`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ status: task.status }),
      });
      fetchTasks();
    } catch (e) { console.error('Error updating task status:', e); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-gray-400 flex items-center gap-2">
        <Sword size={16} className="text-rpg-accent" /> Loading quests...
      </motion.div>
    </div>
  );

  const activeTask  = tasks.find(t => t.id.toString() === activeId);
  const totalXpPool = tasks.reduce((acc, t) => acc + (t.base_xp || 0), 0);
  const statCards   = [
    { label: 'Total Quests',  value: tasks.length,                                                                  icon: Sword,        color: '#8b5cf6', delay: 0    },
    { label: 'In Progress',   value: tasks.filter(t => t.status === 'in_progress').length,                          icon: Activity,     color: '#06b6d4', delay: 0.06 },
    { label: 'Under Review',  value: tasks.filter(t => t.status === 'in_review' || t.status === 'pending_council').length, icon: Shield, color: '#f59e0b', delay: 0.12 },
    { label: 'Verified',      value: tasks.filter(t => t.status === 'verified').length,                             icon: CheckCircle,  color: '#22c55e', delay: 0.18 },
    { label: 'Total XP Pool', value: `${totalXpPool}`,                                                             icon: Star,         color: '#f59e0b', delay: 0.24 },
  ];

  return (
    <div className="flex flex-col gap-5 pt-4 pb-8">

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2 tracking-tight">
            <Sword size={22} className="text-rpg-accent shrink-0" /> Guild Quests
          </h1>
          {guildName && (
            <p className="text-xs text-gray-500 mt-1">
              ⚔️ <span className="text-rpg-gold font-semibold">{guildName}</span>
            </p>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-rpg-accent hover:bg-rpg-accent/80 text-white font-bold py-2 px-4 sm:py-2.5 sm:px-5 rounded-xl shadow-lg shadow-rpg-accent/25 transition-colors shrink-0"
        >
          <Plus size={16} /> New Quest
        </motion.button>
      </div>

      {/* ── Stats Row ──────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* ── Kanban Board ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3" style={{ minHeight: '55vh' }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {COLUMNS.map(col => (
            <DroppableColumn
              key={col.id}
              col={col}
              tasks={tasks.filter(t => t.status === col.id || (col.id === 'in_review' && t.status === 'pending_council'))}
              onTaskClick={(task) => {
                const isReviewable = task.status === 'in_review' || task.status === 'pending_council';
                const isAssignee   = userData && Number(task.assigned_to) === Number(userData.id);
                if (isReviewable && !isAssignee) setReviewTask(task);
                else setDetailTask(task);
              }}
            />
          ))}

          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} accentColor={COLUMNS.find(c => c.id === activeTask.status)?.color} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* ── Modals ─────────────────────────────────── */}
      <CreateTaskModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onTaskCreated={fetchTasks} currentUser={userData} />
      <ReviewTaskModal
        isOpen={!!reviewTask}
        onClose={() => setReviewTask(null)}
        task={reviewTask}
        onReviewSubmitted={(data) => { fetchTasks(); if (data.awardedXp) window.location.reload(); }}
      />
      <TaskDetailModal
        isOpen={!!detailTask}
        onClose={() => setDetailTask(null)}
        task={detailTask}
        currentUser={userData}
        onStatusChanged={fetchTasks}
        onDeleted={fetchTasks}
      />
    </div>
  );
};

export default Dashboard;
