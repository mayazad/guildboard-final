import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare, Plus, Trash2, Calendar, Flag, Circle,
  CheckCircle2, ChevronDown, ChevronRight, Loader2, X,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

// ─── Priority config ──────────────────────────────────────────────────────────
const PRIORITIES = {
  urgent: { label: 'Urgent', color: 'text-red-400',    ring: 'border-red-500/70',   bg: 'bg-red-500/10',   dot: 'bg-red-400'    },
  high:   { label: 'High',   color: 'text-orange-400', ring: 'border-orange-500/70',bg: 'bg-orange-500/10',dot: 'bg-orange-400'  },
  medium: { label: 'Medium', color: 'text-yellow-400', ring: 'border-yellow-500/70',bg: 'bg-yellow-500/10',dot: 'bg-yellow-400'  },
  normal: { label: 'Normal', color: 'text-gray-400',   ring: 'border-gray-600',     bg: 'bg-gray-500/10',  dot: 'bg-gray-500'   },
};

// ─── Date helpers ─────────────────────────────────────────────────────────────
const today   = () => new Date().toISOString().split('T')[0];
const isToday = (d) => d === today();
const isPast  = (d) => d && d < today();
const formatDue = (d) => {
  if (!d) return null;
  if (isToday(d)) return { label: 'Today', cls: 'text-rpg-accent bg-rpg-accent/10 border-rpg-accent/30' };
  if (isPast(d))  return { label: 'Overdue', cls: 'text-red-400 bg-red-500/10 border-red-500/30' };
  const dt = new Date(d + 'T00:00:00');
  return { label: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), cls: 'text-gray-400 bg-white/5 border-gray-700' };
};

// ─── Group todos by date bucket ───────────────────────────────────────────────
const groupTodos = (todos) => {
  const active = todos.filter(t => !t.completed);
  const done   = todos.filter(t =>  t.completed);
  const todayItems     = active.filter(t => t.due_date && (isToday(t.due_date) || isPast(t.due_date)));
  const upcomingItems  = active.filter(t => t.due_date && !isToday(t.due_date) && !isPast(t.due_date));
  const undatedItems   = active.filter(t => !t.due_date);
  return { todayItems, upcomingItems, undatedItems, done };
};

// ─── Animated Checkbox ────────────────────────────────────────────────────────
const TodoCheckbox = ({ checked, onChange, priority }) => (
  <motion.button
    onClick={onChange}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.85 }}
    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
      checked ? 'border-rpg-accent bg-rpg-accent' : PRIORITIES[priority]?.ring || 'border-gray-600'
    }`}
  >
    <AnimatePresence>
      {checked && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
          <CheckCircle2 size={14} className="text-white fill-rpg-accent" />
        </motion.div>
      )}
    </AnimatePresence>
  </motion.button>
);

// ─── Priority Selector ────────────────────────────────────────────────────────
const PriorityPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const p = PRIORITIES[value];
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold transition-all ${p.bg} ${p.ring} ${p.color}`}>
        <Flag size={10} /> {p.label}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }} transition={{ duration: 0.12 }}
            className="absolute top-full mt-1 left-0 z-50 bg-rpg-panel border border-gray-700 rounded-xl shadow-xl overflow-hidden w-32">
            {Object.entries(PRIORITIES).map(([k, v]) => (
              <button key={k} onClick={() => { onChange(k); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors hover:bg-white/5 ${v.color} ${value === k ? 'bg-white/5' : ''}`}>
                <span className={`w-2 h-2 rounded-full ${v.dot}`} /> {v.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Single Todo Row ──────────────────────────────────────────────────────────
const TodoItem = ({ todo, onToggle, onDelete, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle]     = useState(todo.title);
  const due = formatDue(todo.due_date);
  const p   = PRIORITIES[todo.priority];

  const commitEdit = () => {
    if (title.trim() && title !== todo.title) onUpdate(todo.id, { title: title.trim() });
    setEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all
        ${todo.completed ? 'border-transparent opacity-50' : `border-gray-800 hover:border-gray-700 bg-black/20 hover:bg-black/30`}
        border-l-2 ${p.ring}`}
    >
      <TodoCheckbox checked={todo.completed} onChange={() => onToggle(todo.id, !todo.completed)} priority={todo.priority} />

      <div className="flex-1 min-w-0">
        {editing ? (
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
            onBlur={commitEdit} onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') { setTitle(todo.title); setEditing(false); } }}
            className="w-full bg-transparent text-sm text-gray-200 border-b border-rpg-accent/50 outline-none pb-0.5"
          />
        ) : (
          <span onClick={() => !todo.completed && setEditing(true)}
            className={`text-sm cursor-pointer select-none transition-all ${todo.completed ? 'line-through text-gray-600' : 'text-gray-200 hover:text-white'}`}>
            {todo.title}
          </span>
        )}
      </div>

      {due && !todo.completed && (
        <span className={`hidden sm:flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${due.cls}`}>
          <Calendar size={9} /> {due.label}
        </span>
      )}

      <div className="hidden group-hover:flex items-center gap-1">
        <PriorityPicker value={todo.priority} onChange={p => onUpdate(todo.id, { priority: p })} />
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => onDelete(todo.id)}
          className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
          <Trash2 size={13} />
        </motion.button>
      </div>
    </motion.div>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────
const Section = ({ label, count, children, defaultOpen = true, accent = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  if (count === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 py-1 group">
        {open ? <ChevronDown size={13} className="text-gray-600" /> : <ChevronRight size={13} className="text-gray-600" />}
        <span className={`text-xs font-bold uppercase tracking-widest ${accent ? 'text-rpg-accent' : 'text-gray-500'}`}>{label}</span>
        <span className="text-[10px] text-gray-700 font-semibold bg-gray-800 rounded-full px-1.5 py-0.5">{count}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-1.5 pl-4">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main TodoPage ────────────────────────────────────────────────────────────
const TodoPage = () => {
  const [todos, setTodos]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [input, setInput]       = useState('');
  const [priority, setPriority] = useState('normal');
  const [dueDate, setDueDate]   = useState('');
  const [filter, setFilter]     = useState('all');
  const [adding, setAdding]     = useState(false);
  const inputRef = useRef(null);
  const token    = localStorage.getItem('token');

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchTodos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/todos`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setTodos(await res.json());
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  // ── Quick Add ────────────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`${API_URL}/api/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: input.trim(), priority, due_date: dueDate || null }),
      });
      if (res.ok) {
        const newTodo = await res.json();
        setTodos(prev => [newTodo, ...prev]);
        setInput('');
        setPriority('normal');
        setDueDate('');
        inputRef.current?.focus();
      }
    } finally { setAdding(false); }
  };

  // ── Toggle complete ──────────────────────────────────────────────────────
  const handleToggle = async (id, completed) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed } : t));
    await fetch(`${API_URL}/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ completed }),
    });
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    await fetch(`${API_URL}/api/todos/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  };

  // ── Update (inline edit / priority) ─────────────────────────────────────
  const handleUpdate = async (id, patch) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
    await fetch(`${API_URL}/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    });
  };

  // ── Filter & group ───────────────────────────────────────────────────────
  const filtered = filter === 'completed'
    ? todos.filter(t => t.completed)
    : filter === 'today'
      ? todos.filter(t => !t.completed && t.due_date && (isToday(t.due_date) || isPast(t.due_date)))
      : todos;

  const { todayItems, upcomingItems, undatedItems, done } = groupTodos(filtered);
  const totalActive = todos.filter(t => !t.completed).length;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 pb-10">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rpg-accent/10 border border-rpg-accent/30 flex items-center justify-center">
            <CheckSquare size={18} className="text-rpg-accent" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">My Tasks</h1>
            <p className="text-xs text-gray-500">{totalActive} remaining</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex bg-black/40 rounded-xl p-1 border border-gray-800 gap-0.5">
          {[['all','All'],['today','Today'],['completed','Done']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${filter === val ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Quick Add Bar ────────────────────────────────────────────────── */}
      <form onSubmit={handleAdd} className="flex flex-col gap-2 bg-black/30 border border-gray-700/80 rounded-2xl p-3 focus-within:border-rpg-accent/40 transition-colors">
        <div className="flex items-center gap-3">
          <Circle size={16} className="text-gray-600 shrink-0" />
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Add a task… (press Enter to save)"
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none"
          />
          {adding
            ? <Loader2 size={16} className="animate-spin text-gray-600 shrink-0" />
            : input.trim()
              ? <motion.button type="submit" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="px-3 py-1.5 bg-rpg-accent/20 hover:bg-rpg-accent/30 text-rpg-accent border border-rpg-accent/30 rounded-lg text-xs font-semibold">
                  <Plus size={14} />
                </motion.button>
              : null
          }
        </div>

        {/* Inline options — only shown when typing */}
        <AnimatePresence>
          {input.trim() && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2 pl-7 overflow-hidden">
              <PriorityPicker value={priority} onChange={setPriority} />
              <div className="flex items-center gap-1.5 text-gray-600">
                <Calendar size={12} />
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} min={today()}
                  className="bg-transparent text-xs text-gray-400 outline-none border-b border-gray-700 focus:border-rpg-accent/50 pb-0.5 cursor-pointer"
                />
                {dueDate && <button type="button" onClick={() => setDueDate('')} className="text-gray-600 hover:text-gray-400"><X size={10} /></button>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* ── Task List ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-600" />
        </div>
      ) : filtered.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-700">
          <CheckSquare size={40} />
          <p className="text-sm">
            {filter === 'today' ? 'Nothing due today! Enjoy the calm.' : filter === 'completed' ? 'No completed tasks yet.' : 'No tasks yet. Add one above!'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {filter !== 'completed' && (
              <>
                <Section label="Today & Overdue" count={todayItems.length} defaultOpen accent>
                  {todayItems.map(t => <TodoItem key={t.id} todo={t} onToggle={handleToggle} onDelete={handleDelete} onUpdate={handleUpdate} />)}
                </Section>
                <Section label="Upcoming" count={upcomingItems.length} defaultOpen>
                  {upcomingItems.map(t => <TodoItem key={t.id} todo={t} onToggle={handleToggle} onDelete={handleDelete} onUpdate={handleUpdate} />)}
                </Section>
                <Section label="No Date" count={undatedItems.length} defaultOpen>
                  {undatedItems.map(t => <TodoItem key={t.id} todo={t} onToggle={handleToggle} onDelete={handleDelete} onUpdate={handleUpdate} />)}
                </Section>
              </>
            )}
            <Section label="Completed" count={filter === 'completed' ? done.length : done.length} defaultOpen={filter === 'completed'}>
              {(filter === 'completed' ? todos.filter(t => t.completed) : done).map(t => (
                <TodoItem key={t.id} todo={t} onToggle={handleToggle} onDelete={handleDelete} onUpdate={handleUpdate} />
              ))}
            </Section>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default TodoPage;
