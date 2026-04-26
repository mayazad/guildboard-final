import { useState, useEffect } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import TaskCard from '../components/TaskCard';
import CreateTaskModal from '../components/CreateTaskModal';
import ReviewTaskModal from '../components/ReviewTaskModal';
import TaskDetailModal from '../components/TaskDetailModal';

const API_URL = import.meta.env.VITE_API_URL || '';

const COLUMNS = [
  { id: 'assigned', title: 'Assigned' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'in_review', title: 'Review / Council' },
  { id: 'verified', title: 'Verified' },
];

const DroppableColumn = ({ id, title, tasks, onTaskClick }) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex flex-col bg-black/40 rounded-xl border border-gray-700/50 overflow-hidden h-full">
      <div className="p-4 border-b border-gray-700/50 bg-rpg-panel/50">
        <h2 className="font-bold text-gray-200">{title} <span className="ml-2 text-xs text-gray-500 font-normal">({tasks.length})</span></h2>
      </div>
      <div ref={setNodeRef} className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[150px]">
        <SortableContext items={tasks.map(t => t.id.toString())} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>
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

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
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

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = active.id;
    const overIdStr = over.id;

    if (activeIdStr === overIdStr) return;

    const isActiveTask = tasks.some(t => t.id.toString() === activeIdStr);
    const isOverColumn = COLUMNS.some(c => c.id === overIdStr);
    const isOverTask = tasks.some(t => t.id.toString() === overIdStr);

    if (!isActiveTask) return;

    setTasks((prev) => {
      const activeItems = [...prev];
      const activeIndex = activeItems.findIndex(t => t.id.toString() === activeIdStr);
      let overIndex = -1;
      let newStatus = activeItems[activeIndex].status;

      if (isOverTask) {
        overIndex = activeItems.findIndex(t => t.id.toString() === overIdStr);
        newStatus = activeItems[overIndex].status;
      } else if (isOverColumn) {
        newStatus = overIdStr;
      }

      if (activeItems[activeIndex].status !== newStatus) {
         activeItems[activeIndex] = { ...activeItems[activeIndex], status: newStatus };
      }

      return activeItems;
    });
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeIdStr = active.id;
    const task = tasks.find(t => t.id.toString() === activeIdStr);
    if (!task) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/tasks/${task.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: task.status === 'pending_council' ? 'pending_council' : task.status })
      });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  if (loading) {
    return <div className="text-gray-400 p-8">Loading Board...</div>;
  }

  return (
    <div className="h-full flex flex-col pt-4 pb-8 px-2 overflow-hidden">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Guild Quests</h1>
          <p className="text-gray-400">Manage your active quests and council reviews.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-rpg-accent hover:bg-rpg-accent/80 text-white font-bold py-2 px-4 rounded shadow-lg transition-colors"
        >
          + New Quest
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full min-h-0">
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
              id={col.id}
              title={col.title}
              tasks={tasks.filter((t) => t.status === col.id || (col.id === 'in_review' && t.status === 'pending_council'))}
              onTaskClick={(task) => {
                if (task.status === 'in_review' || task.status === 'pending_council') {
                  setReviewTask(task);
                } else {
                  setDetailTask(task);
                }
              }}
            />
          ))}

          <DragOverlay>
            {activeId ? (
              <TaskCard task={tasks.find((t) => t.id.toString() === activeId)} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <CreateTaskModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onTaskCreated={() => fetchTasks()} 
      />

      <ReviewTaskModal 
        isOpen={!!reviewTask} 
        onClose={() => setReviewTask(null)} 
        task={reviewTask}
        onReviewSubmitted={(data) => {
          fetchTasks();
          if (data.awardedXp) {
             window.location.reload();
          }
        }}
      />

      <TaskDetailModal
        isOpen={!!detailTask}
        onClose={() => setDetailTask(null)}
        task={detailTask}
      />
    </div>
  );
};

export default Dashboard;
