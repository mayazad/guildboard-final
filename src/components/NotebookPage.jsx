import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScrollText, Plus, Edit3, Eye, Trash2, Loader2, Check,
  ChevronRight, User, FileText, X, CheckSquare,
  Bold, Italic, Heading, List, Code, Quote
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TodoPage from './TodoPage';

const API_URL = import.meta.env.VITE_API_URL || '';

const formatDate = (ts) => {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getInitial = (name) => name?.charAt(0).toUpperCase() || '?';

const COLORS = ['bg-rpg-accent/20 text-rpg-accent', 'bg-rpg-gold/20 text-rpg-gold',
  'bg-purple-500/20 text-purple-400', 'bg-green-500/20 text-green-400',
  'bg-pink-500/20 text-pink-400'];

const authorColor = (userId) => COLORS[userId % COLORS.length];

// ─── Compact sidebar note card ────────────────────────────────────────────────
const NoteListItem = ({ note, isActive, isOwn, onClick }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ x: 2 }}
    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${
      isActive
        ? 'bg-rpg-accent/10 border-rpg-accent/40'
        : 'border-transparent hover:bg-white/5'
    }`}
  >
    <div className="flex items-start gap-2">
      <div className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center text-[10px] font-bold ${authorColor(note.user_id)}`}>
        {getInitial(note.author_name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-200 truncate">{note.title || 'Untitled'}</p>
        <p className="text-[10px] text-gray-500 mt-0.5">
          {note.author_name} · {formatDate(note.updated_at)}
        </p>
      </div>
      {isOwn && <ChevronRight size={12} className="text-gray-600 shrink-0 mt-1" />}
    </div>
  </motion.button>
);

// ─── Main NotebookPage ─────────────────────────────────────────────────────────
const NotebookPage = () => {
  const [tab, setTab]               = useState('notes'); // 'notes' | 'tasks'
  const [notes, setNotes]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeId, setActiveId]     = useState(null);
  const [mode, setMode]             = useState('preview'); // 'edit' | 'preview'
  const [saving, setSaving]         = useState(false);
  const [savedAt, setSavedAt]       = useState(null);
  const [creating, setCreating]     = useState(false);
  const [newTitle, setNewTitle]     = useState('');
  const [deleting, setDeleting]     = useState(false);
  const debounceRef                 = useRef(null);

  const token    = localStorage.getItem('token');
  const meStr    = localStorage.getItem('user');
  const me       = meStr ? JSON.parse(meStr) : null;

  // fallback: try to get user id from the notes list
  const activeNote = notes.find((n) => n.id === activeId) || null;
  const isOwn      = activeNote && me && activeNote.user_id === me?.id;

  // ── Fetch all notes ────────────────────────────────────────────────────────
  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
        if (!activeId && data.length > 0) setActiveId(data[0].id);
      }
    } catch (e) { /* silent */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  // ── Select a note ──────────────────────────────────────────────────────────
  const selectNote = (id) => {
    setActiveId(id);
    const n = notes.find((x) => x.id === id);
    // Switch to edit if it's your note, preview if it's someone else's
    const isYours = n && me && n.user_id === me?.id;
    setMode(isYours ? 'edit' : 'preview');
    setSavedAt(null);
  };

  // ── Auto-save content ──────────────────────────────────────────────────────
  const handleContentChange = (e) => {
    const val = e.target.value;
    setNotes((prev) => prev.map((n) => n.id === activeId ? { ...n, content: val } : n));
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveNote({ content: val }), 900);
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setNotes((prev) => prev.map((n) => n.id === activeId ? { ...n, title: val } : n));
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveNote({ title: val }), 900);
  };

  const saveNote = async (patch) => {
    if (!activeId) return;
    setSaving(true);
    try {
      const current = notes.find((n) => n.id === activeId);
      const body = { title: current?.title, content: current?.content, ...patch };
      const res = await fetch(`${API_URL}/api/notes/${activeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        // Crucial fix: Only update updated_at, NOT content/title.
        // If we update content here, a slow network response will overwrite whatever the user just typed!
        setNotes((prev) => prev.map((n) => n.id === activeId ? { ...n, updated_at: updated.updated_at } : n));
        setSavedAt(new Date());
      }
    } catch (e) { /* silent */ }
    finally { setSaving(false); }
  };

  // ── Markdown Formatting ────────────────────────────────────────────────────
  const insertText = (before, after = '') => {
    const textarea = document.getElementById('notebook-textarea');
    if (!textarea || !activeId) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    const selectedText = val.substring(start, end);
    const newVal = val.substring(0, start) + before + selectedText + after + val.substring(end);
    
    setNotes((prev) => prev.map((n) => n.id === activeId ? { ...n, content: newVal } : n));
    
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveNote({ content: newVal }), 900);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  // ── Create note ────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle.trim(), content: '' }),
      });
      if (res.ok) {
        const note = await res.json();
        setNotes((prev) => [note, ...prev]);
        setActiveId(note.id);
        setMode('edit');
        setCreating(false);
        setNewTitle('');
      }
    } catch (e) { /* silent */ }
  };

  // ── Delete note ────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!activeId) return;
    setDeleting(true);
    try {
      await fetch(`${API_URL}/api/notes/${activeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const remaining = notes.filter((n) => n.id !== activeId);
      setNotes(remaining);
      setActiveId(remaining[0]?.id || null);
      setMode('preview');
    } catch (e) { /* silent */ }
    finally { setDeleting(false); }
  };

  // ── Group notes by author ──────────────────────────────────────────────────
  const myNotes    = notes.filter((n) => me && n.user_id === me?.id);
  const otherNotes = notes.filter((n) => !me || n.user_id !== me?.id);

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-8rem)]">

      {/* ── Tab Bar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-black/30 border border-gray-800 rounded-2xl p-1.5 self-start relative">
        {/* Sliding pill */}
        <motion.div
          layout
          layoutId="notebook-tab-pill"
          className="absolute h-[calc(100%-12px)] rounded-xl bg-gray-700/80 border border-gray-600/50"
          style={{
            left: tab === 'notes' ? '6px' : '50%',
            width: 'calc(50% - 6px)',
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        />
        <button
          onClick={() => setTab('notes')}
          className={`relative z-10 flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'notes' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <ScrollText size={14} /> Notes
        </button>
        <button
          onClick={() => setTab('tasks')}
          className={`relative z-10 flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'tasks' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <CheckSquare size={14} /> Tasks
        </button>
      </div>

      {/* ── Tab Content ───────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {tab === 'tasks' ? (
          <motion.div key="tasks"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="flex-1 overflow-y-auto"
          >
            <TodoPage />
          </motion.div>
        ) : (
          <motion.div key="notes"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col sm:flex-row gap-4 flex-1 overflow-hidden"
          >
            {/* ── Sidebar ─────────────────────────────────────────────────── */}
            <div className="w-full sm:w-72 shrink-0 flex flex-col gap-3 overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-300">
                  <ScrollText size={16} className="text-rpg-accent" />
                  <span className="font-bold text-sm">Guild Notebook</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setCreating(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-rpg-accent/20 hover:bg-rpg-accent/30 text-rpg-accent border border-rpg-accent/30 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Plus size={12} /> New Note
                </motion.button>
              </div>

              <AnimatePresence>
                {creating && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex gap-2">
                    <input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false); }}
                      placeholder="Note title…"
                      className="flex-1 bg-black/40 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-rpg-accent/60"
                    />
                    <button onClick={handleCreate} className="px-2 py-2 bg-rpg-accent/20 text-rpg-accent rounded-lg hover:bg-rpg-accent/30 transition-colors"><Check size={14} /></button>
                    <button onClick={() => { setCreating(false); setNewTitle(''); }} className="px-2 py-2 text-gray-500 hover:text-gray-300 rounded-lg transition-colors"><X size={14} /></button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
                {loading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 size={20} className="animate-spin text-gray-500" /></div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText size={32} className="text-gray-700 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No notes yet.</p>
                    <p className="text-xs text-gray-700 mt-1">Click "New Note" to start writing!</p>
                  </div>
                ) : (
                  <>
                    {myNotes.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1 mb-1.5">My Notes</p>
                        <div className="flex flex-col gap-1">
                          {myNotes.map((n) => <NoteListItem key={n.id} note={n} isActive={n.id === activeId} isOwn onClick={() => selectNote(n.id)} />)}
                        </div>
                      </div>
                    )}
                    {otherNotes.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1 mb-1.5">Guild Members</p>
                        <div className="flex flex-col gap-1">
                          {otherNotes.map((n) => <NoteListItem key={n.id} note={n} isActive={n.id === activeId} isOwn={false} onClick={() => selectNote(n.id)} />)}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ── Editor / Viewer ─────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col bg-rpg-panel/40 border border-gray-700/50 rounded-2xl overflow-hidden">
              {!activeNote ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-600">
                  <ScrollText size={40} className="text-gray-700" />
                  <p className="text-sm">Select a note from the sidebar or create a new one.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-700/50 shrink-0">
                    <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg ${authorColor(activeNote.user_id)}`}>
                      <User size={11} />{activeNote.author_name}
                      {isOwn && <span className="opacity-60">(you)</span>}
                    </div>
                    {isOwn && (
                      <div className="flex bg-black/40 rounded-lg p-0.5 border border-gray-700/50">
                        <button onClick={() => setMode('edit')} className={`flex items-center gap-1 px-3 py-1 text-xs rounded-md transition-all ${mode === 'edit' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}><Edit3 size={11} /> Edit</button>
                        <button onClick={() => setMode('preview')} className={`flex items-center gap-1 px-3 py-1 text-xs rounded-md transition-all ${mode === 'preview' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}><Eye size={11} /> Preview</button>
                      </div>
                    )}
                    <div className="flex-1" />
                    <AnimatePresence mode="wait">
                      {saving ? (
                        <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-rpg-accent flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Saving…</motion.span>
                      ) : savedAt ? (
                        <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-gray-600 flex items-center gap-1"><Check size={10} className="text-green-400" /> Saved</motion.span>
                      ) : null}
                    </AnimatePresence>
                    {isOwn && (
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleDelete} disabled={deleting}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-rpg-danger border border-rpg-danger/30 rounded-lg hover:bg-rpg-danger/10 transition-colors">
                        {deleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />} Delete
                      </motion.button>
                    )}
                  </div>
                  <div className="px-5 pt-4 pb-2 shrink-0 border-b border-gray-700/30">
                    {isOwn && mode === 'edit' ? (
                      <input value={activeNote.title} onChange={handleTitleChange} placeholder="Note title…"
                        className="w-full text-xl font-bold text-gray-100 bg-transparent border-none outline-none placeholder-gray-600" />
                    ) : (
                      <h1 className="text-xl font-bold text-gray-100">{activeNote.title || 'Untitled'}</h1>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col px-5 py-4 overflow-hidden">
                    {isOwn && mode === 'edit' ? (
                      <div className="flex flex-col h-full bg-black/20 rounded-xl border border-gray-700/50 overflow-hidden">
                        {/* Formatting Toolbar */}
                        <div className="flex items-center gap-1.5 p-2 border-b border-gray-700/50 bg-black/30">
                          <button onClick={() => insertText('**', '**')} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Bold"><Bold size={14}/></button>
                          <button onClick={() => insertText('_', '_')} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Italic"><Italic size={14}/></button>
                          <div className="w-px h-4 bg-gray-700 mx-1" />
                          <button onClick={() => insertText('### ', '')} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Heading"><Heading size={14}/></button>
                          <button onClick={() => insertText('- ', '')} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Bullet List"><List size={14}/></button>
                          <button onClick={() => insertText('> ', '')} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Quote"><Quote size={14}/></button>
                          <button onClick={() => insertText('```\n', '\n```')} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Code Block"><Code size={14}/></button>
                        </div>
                        <textarea
                          id="notebook-textarea"
                          value={activeNote.content}
                          onChange={handleContentChange}
                          placeholder="Write your notes here in Markdown..."
                          className="w-full flex-1 bg-transparent border-none outline-none resize-none p-4 text-sm text-gray-200 placeholder-gray-600 leading-relaxed font-mono"
                        />
                      </div>
                    ) : (
                      <div className="overflow-y-auto h-full">
                        {activeNote.content?.trim() ? (
                          <ReactMarkdown className="prose prose-invert prose-sm max-w-none prose-pre:bg-black/50 prose-pre:border prose-pre:border-gray-700/50 prose-a:text-rpg-accent prose-headings:text-gray-100 prose-strong:text-gray-200" remarkPlugins={[remarkGfm]}>
                            {activeNote.content}
                          </ReactMarkdown>
                        ) : (
                          <p className="text-sm text-gray-600 italic">This note is empty.</p>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotebookPage;


