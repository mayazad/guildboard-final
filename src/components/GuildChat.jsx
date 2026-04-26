import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Users } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';
const POLL_INTERVAL = 3000;

const formatTime = (ts) => {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const GuildChat = ({ currentUser, guildName }) => {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [sending, setSending]   = useState(false);
  const [unread, setUnread]     = useState(0);
  const bottomRef  = useRef(null);
  const pollRef    = useRef(null);
  const lastIdRef  = useRef(0);

  const fetchMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/api/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data);
      if (data.length > 0) {
        const newest = data[data.length - 1].id;
        if (!open && newest > lastIdRef.current && lastIdRef.current !== 0) {
          setUnread(u => u + 1);
        }
        lastIdRef.current = newest;
      }
    } catch (e) { /* silent */ }
  }, [open]);

  // Poll when open, stop when closed
  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  // Scroll to bottom when messages update and panel is open
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // Clear unread on open
  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/messages`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ content: input.trim() }),
      });
      setInput('');
      fetchMessages();
    } catch (e) { /* silent */ }
    finally { setSending(false); }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col items-end gap-3">
      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-80 h-[480px] bg-rpg-panel/95 backdrop-blur-xl border border-gray-700/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-700/50 bg-gradient-to-r from-rpg-accent/20 to-transparent flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <div>
                  <p className="text-sm font-bold text-white">{guildName || 'Guild Chat'}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1"><Users size={10} /> Guild Channel</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare size={28} className="text-gray-600 mb-2" />
                  <p className="text-xs text-gray-500">No messages yet.<br />Say something to your guild!</p>
                </div>
              )}
              {messages.map((msg, i) => {
                const isMe = msg.user_id === currentUser?.id;
                const showName = i === 0 || messages[i - 1].user_id !== msg.user_id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {showName && !isMe && (
                      <span className="text-xs text-gray-500 mb-1 ml-1">{msg.name}</span>
                    )}
                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-snug break-words ${
                      isMe
                        ? 'bg-rpg-accent text-white rounded-br-sm'
                        : 'bg-gray-800/80 text-gray-200 rounded-bl-sm border border-gray-700/50'
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-gray-600 mt-0.5 mx-1">{formatTime(msg.created_at)}</span>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-gray-700/50 flex gap-2 shrink-0">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message your guild..."
                maxLength={1000}
                className="flex-1 bg-black/40 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-rpg-accent transition-colors"
              />
              <motion.button
                type="submit"
                disabled={!input.trim() || sending}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-9 h-9 rounded-xl bg-rpg-accent flex items-center justify-center text-white disabled:opacity-40 shrink-0"
              >
                <Send size={14} />
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(o => !o)}
        className="w-14 h-14 rounded-full bg-rpg-accent shadow-lg shadow-rpg-accent/40 flex items-center justify-center text-white relative"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.span key="x"  initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X size={22} /></motion.span>
            : <motion.span key="msg" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><MessageSquare size={22} /></motion.span>
          }
        </AnimatePresence>
        {unread > 0 && !open && (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          >
            {unread > 9 ? '9+' : unread}
          </motion.div>
        )}
      </motion.button>
    </div>
  );
};

export default GuildChat;
