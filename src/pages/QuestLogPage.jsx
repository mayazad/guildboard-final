import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, Sword, Shield, Trophy, RefreshCw, Scale, PenLine, Loader2, ScrollText } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

// ─── Config ──────────────────────────────────────────────────────────────────
const EVENT_CONFIG = {
  created:        { icon: Sparkles,  label: 'Quest Forged',         color: 'text-rpg-gold',   bg: 'bg-rpg-gold/10',   border: 'border-rpg-gold/30'   },
  started:        { icon: Sword,     label: 'Adventure Begun',       color: 'text-rpg-accent', bg: 'bg-rpg-accent/10', border: 'border-rpg-accent/30' },
  submitted:      { icon: Shield,    label: 'Submitted to Council',  color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/30'   },
  pending_council:{ icon: Scale,     label: 'Council Voting',        color: 'text-rpg-gold',   bg: 'bg-rpg-gold/10',   border: 'border-rpg-gold/30'   },
  verified:       { icon: Trophy,    label: 'Legend Verified',       color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/30'  },
  rejected:       { icon: RefreshCw, label: 'Returned to Forge',     color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30' },
  returned:       { icon: RefreshCw, label: 'Returned to Assigned',  color: 'text-gray-400',   bg: 'bg-gray-400/10',   border: 'border-gray-400/30'   },
};

const STATUS_COLORS = {
  assigned:        'text-gray-400 bg-gray-400/10',
  in_progress:     'text-rpg-accent bg-rpg-accent/10',
  in_review:       'text-rpg-gold bg-rpg-gold/10',
  pending_council: 'text-rpg-gold bg-rpg-gold/10',
  verified:        'text-green-400 bg-green-400/10',
};

const formatRelative = (ts) => {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatDateTime = (ts) =>
  new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// ─── Guild Chronicles Tab ─────────────────────────────────────────────────────
const GuildChronicles = () => {
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const token = localStorage.getItem('token');
        const res   = await fetch(`${API_URL}/api/quest-log/activities`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setEvents(await res.json());
      } catch (e) { /* silent */ }
      finally { setLoading(false); }
    };
    fetch_();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 size={28} className="text-rpg-accent animate-spin" />
      <p className="text-sm text-gray-500">Reading the chronicles…</p>
    </div>
  );

  if (!events.length) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <ScrollText size={40} className="text-gray-700" />
      <p className="text-gray-500 text-sm">No chronicles yet.<br />The guild's story begins when the first quest is acted upon.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {events.map((event, i) => {
        const cfg  = EVENT_CONFIG[event.action_type] || EVENT_CONFIG.created;
        const Icon = cfg.icon;
        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, type: 'spring', stiffness: 280, damping: 24 }}
            className={`flex gap-3 items-start p-4 rounded-xl border ${cfg.border} ${cfg.bg}`}
          >
            <div className={`shrink-0 w-9 h-9 rounded-xl bg-black/30 border ${cfg.border} flex items-center justify-center`}>
              <Icon size={15} className={cfg.color} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                  {event.actor_name && (
                    <span className="text-gray-500 text-xs ml-1.5">
                      by <span className="text-gray-300 font-semibold">{event.actor_name}</span>
                      {event.actor_role && <span className={`ml-1 text-[10px] capitalize ${event.actor_role === 'leader' ? 'text-rpg-gold' : 'text-rpg-accent'}`}>({event.actor_role})</span>}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-600 shrink-0">{formatRelative(event.created_at)}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{event.details}</p>
              {event.task_title && (
                <p className="text-[11px] text-gray-600 mt-1 flex items-center gap-1">
                  <Sword size={9} className="text-gray-700" />
                  {event.task_title}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// ─── Personal Journal Tab ─────────────────────────────────────────────────────
const PersonalJournal = () => {
  const [notes, setNotes]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const token = localStorage.getItem('token');
        const res   = await fetch(`${API_URL}/api/quest-log/notes/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setNotes(await res.json());
      } catch (e) { /* silent */ }
      finally { setLoading(false); }
    };
    fetch_();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 size={28} className="text-rpg-accent animate-spin" />
      <p className="text-sm text-gray-500">Loading your journal…</p>
    </div>
  );

  if (!notes.length) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <PenLine size={40} className="text-gray-700" />
      <p className="text-gray-500 text-sm">Your journal is empty.<br />Open any quest and write your first entry.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {notes.map((note, i) => {
        const statusCls = STATUS_COLORS[note.task_status] || STATUS_COLORS.assigned;
        return (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 280, damping: 24 }}
            className="bg-black/30 border border-gray-700/60 rounded-xl p-4 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <Sword size={12} className="text-rpg-accent shrink-0" />
                <p className="text-sm font-bold text-white truncate">{note.task_title}</p>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize shrink-0 ${statusCls}`}>
                  {note.task_status?.replace('_', ' ')}
                </span>
              </div>
              <span className="text-[10px] text-gray-600 shrink-0">{formatDateTime(note.updated_at)}</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-line line-clamp-4 font-mono">{note.content}</p>
          </motion.div>
        );
      })}
    </div>
  );
};

// ─── Main Quest Log Page ──────────────────────────────────────────────────────
const TABS = [
  { id: 'chronicles', label: 'Guild Chronicles', icon: ScrollText },
  { id: 'journal',    label: 'My Journal',        icon: PenLine   },
];

const QuestLogPage = () => {
  const [activeTab, setActiveTab] = useState('chronicles');

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-rpg-accent/15 border border-rpg-accent/30 flex items-center justify-center">
            <BookOpen size={18} className="text-rpg-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Quest Log</h1>
            <p className="text-xs text-gray-500">The Great Book of the Guild</p>
          </div>
        </div>
      </motion.div>

      {/* Tab Bar */}
      <div className="flex bg-black/30 rounded-xl p-1 mb-6 border border-gray-700/50">
        {TABS.map((tab) => {
          const Icon   = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                active ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {active && (
                <motion.div layoutId="qlog-tab" className="absolute inset-0 bg-rpg-accent/15 border border-rpg-accent/30 rounded-lg" />
              )}
              <span className="relative flex items-center gap-1.5">
                <Icon size={14} /> {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'chronicles' && <GuildChronicles />}
          {activeTab === 'journal'    && <PersonalJournal />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default QuestLogPage;
