import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Sword, Shield, Trophy, RefreshCw, Scale, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const EVENT_CONFIG = {
  created:        { icon: Sparkles, label: 'Quest Forged',           color: 'text-rpg-gold',   border: 'border-rpg-gold/50',   bg: 'bg-rpg-gold/10'   },
  started:        { icon: Sword,    label: 'Adventure Begun',         color: 'text-rpg-accent', border: 'border-rpg-accent/50', bg: 'bg-rpg-accent/10' },
  submitted:      { icon: Shield,   label: 'Submitted to Council',    color: 'text-blue-400',   border: 'border-blue-400/50',   bg: 'bg-blue-400/10'   },
  pending_council:{ icon: Scale,    label: 'Awaiting Council Vote',   color: 'text-rpg-gold',   border: 'border-rpg-gold/50',   bg: 'bg-rpg-gold/10'   },
  verified:       { icon: Trophy,   label: 'Legend Verified!',        color: 'text-green-400',  border: 'border-green-400/50',  bg: 'bg-green-400/10'  },
  rejected:       { icon: RefreshCw,label: 'Returned to the Forge',   color: 'text-orange-400', border: 'border-orange-400/50', bg: 'bg-orange-400/10' },
  returned:       { icon: RefreshCw,label: 'Returned to Assigned',    color: 'text-gray-400',   border: 'border-gray-400/50',   bg: 'bg-gray-400/10'   },
};

const formatDateTime = (ts) => {
  const d = new Date(ts);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const QuestJourney = ({ task }) => {
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!task?.id) return;
    const fetchJourney = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res   = await fetch(`${API_URL}/api/tasks/${task.id}/journey`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setEvents(await res.json());
      } catch (e) { /* silent */ }
      finally { setLoading(false); }
    };
    fetchJourney();
  }, [task?.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 size={24} className="text-rpg-accent animate-spin" />
        <p className="text-xs text-gray-500">Reading the chronicles…</p>
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <Sparkles size={28} className="text-gray-600" />
        <p className="text-sm text-gray-500">No journey recorded yet.<br />The story begins when the quest is acted upon.</p>
      </div>
    );
  }

  return (
    <div className="relative py-2">
      {/* Vertical connecting line */}
      <div className="absolute left-5 top-6 bottom-6 w-px bg-gradient-to-b from-rpg-accent/40 via-gray-700/40 to-transparent" />

      <div className="space-y-1">
        {events.map((event, i) => {
          const config   = EVENT_CONFIG[event.action_type] || EVENT_CONFIG.created;
          const Icon     = config.icon;
          const isLatest = i === events.length - 1;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 260, damping: 22 }}
              className="relative flex gap-4 items-start pb-5"
            >
              {/* Node dot */}
              <div className={`relative z-10 shrink-0 w-10 h-10 rounded-xl border-2 ${config.border} ${config.bg} flex items-center justify-center`}>
                <Icon size={16} className={config.color} />
                {/* Pulse ring on the latest event */}
                {isLatest && (
                  <motion.div
                    animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={`absolute inset-0 rounded-xl border-2 ${config.border}`}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={`text-sm font-bold ${config.color}`}>{config.label}</span>
                  <span className="text-[10px] text-gray-600 shrink-0">{formatDateTime(event.created_at)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{event.details}</p>
                {event.actor_name && (
                  <span className={`text-[10px] mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${config.bg} ${config.color} font-semibold`}>
                    {event.actor_name} · {event.actor_role}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default QuestJourney;
