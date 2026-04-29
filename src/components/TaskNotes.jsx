import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenLine, Check, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const formatSaved = (ts) => {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const TaskNotes = ({ task }) => {
  const [content, setContent]   = useState('');
  const [savedAt, setSavedAt]   = useState(null);
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const debounceRef = useRef(null);

  // Load existing note on mount
  useEffect(() => {
    if (!task?.id) return;
    const fetchNote = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res   = await fetch(`${API_URL}/api/tasks/${task.id}/notes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setContent(data.content || '');
            setSavedAt(new Date(data.updated_at));
          }
        }
      } catch (e) { /* silent */ }
      finally { setLoading(false); }
    };
    fetchNote();
  }, [task?.id]);

  const saveNote = async (text) => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/api/tasks/${task.id}/notes`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedAt(new Date(data.updated_at));
      }
    } catch (e) { /* silent */ }
    finally { setSaving(false); }
  };

  const handleChange = (e) => {
    setContent(e.target.value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveNote(e.target.value), 900);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 size={24} className="text-rpg-accent animate-spin" />
        <p className="text-xs text-gray-500">Loading your journal…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <PenLine size={12} />
          <span>Adventurer's Journal</span>
        </div>
        <AnimatePresence mode="wait">
          {saving ? (
            <motion.span key="saving"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-xs text-rpg-accent flex items-center gap-1"
            >
              <Loader2 size={10} className="animate-spin" /> Saving…
            </motion.span>
          ) : savedAt ? (
            <motion.span key="saved"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-xs text-gray-600 flex items-center gap-1"
            >
              <Check size={10} className="text-green-400" /> Saved at {formatSaved(savedAt)}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Journal textarea */}
      <textarea
        value={content}
        onChange={handleChange}
        placeholder={`Record your journey here...\n\nWrite your findings, technical notes, and discoveries as you progress through this quest.`}
        className="w-full h-52 bg-black/30 border border-gray-700/80 rounded-xl p-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-rpg-accent/60 transition-colors resize-none leading-relaxed font-mono"
      />

      {/* Hint */}
      <p className="text-[10px] text-gray-700 text-center">
        Auto-saves as you type · Private to you
      </p>
    </div>
  );
};

export default TaskNotes;
