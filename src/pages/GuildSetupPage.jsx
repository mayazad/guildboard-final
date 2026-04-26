import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Users, ArrowRight, Hash, Sparkles, ChevronLeft, Copy, Check, PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '';

const GuildSetupPage = () => {
  const [mode, setMode]           = useState(null);
  const [guildName, setGuildName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [successData, setSuccessData] = useState(null); // { guildName, inviteCode }
  const [copied, setCopied]       = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!guildName.trim()) return setError('Guild name is required');
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/api/guilds`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ name: guildName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create guild');
      localStorage.setItem('user', JSON.stringify(data.user));
      setSuccessData({ guildName: data.guild.name, inviteCode: data.inviteCode });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return setError('Invite code is required');
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/api/guilds/join`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ invite_code: inviteCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join guild');
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rpg-bg flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rpg-accent opacity-5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-rpg-gold opacity-5 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-lg">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rpg-accent/10 border border-rpg-accent/30 mb-4">
            <Sword size={28} className="text-rpg-accent" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Set Up Your Guild</h1>
          <p className="text-gray-400 mt-2 text-sm">Create a new guild or join one with an invite code.</p>
        </motion.div>
        <AnimatePresence mode="wait">
          {successData && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-rpg-panel border border-rpg-accent/40 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-rpg-accent/10 border border-rpg-accent/30 flex items-center justify-center mx-auto mb-4">
                <PartyPopper size={28} className="text-rpg-accent" />
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-1">Guild Created! 🎉</h2>
              <p className="text-gray-400 text-sm mb-6">
                <span className="text-white font-semibold">{successData.guildName}</span> is ready. Share your invite code with teammates so they can join.
              </p>
              <div className="bg-black/40 border border-rpg-gold/30 rounded-2xl p-6 mb-6">
                <p className="text-xs text-rpg-gold font-semibold uppercase tracking-widest mb-3">Your Guild Invite Code</p>
                <p className="text-5xl font-mono font-extrabold tracking-[0.3em] text-white mb-4">{successData.inviteCode}</p>
                <button onClick={() => { navigator.clipboard.writeText(successData.inviteCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rpg-gold/10 text-rpg-gold border border-rpg-gold/30 hover:bg-rpg-gold/20 transition-colors text-sm font-semibold">
                  {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Code</>}
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-6">
                Teammates register → choose "Join a Guild" → enter this code → they're in.<br />You can also find this code anytime on your <span className="text-gray-300">Profile</span> page.
              </p>
              <button onClick={() => navigate('/dashboard')} className="w-full py-3 bg-rpg-accent hover:bg-rpg-accent/80 text-white font-bold rounded-xl transition-colors shadow-lg shadow-rpg-accent/20 flex items-center justify-center gap-2">
                Enter the Guild <ArrowRight size={16} />
              </button>
            </motion.div>
          )}
          {!successData && !mode && (
            <motion.div key="selection" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.button whileHover={{ y: -4, boxShadow: '0 16px 32px rgba(99,102,241,0.2)' }} onClick={() => setMode('create')} className="bg-rpg-panel border border-gray-700 rounded-2xl p-6 text-left group hover:border-rpg-accent/50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-rpg-accent/10 border border-rpg-accent/30 flex items-center justify-center mb-4 group-hover:bg-rpg-accent/20 transition-colors">
                  <Sparkles size={22} className="text-rpg-accent" />
                </div>
                <h3 className="text-white font-bold text-lg mb-1">Create a Guild</h3>
                <p className="text-gray-400 text-sm">Start a new guild and become the Leader. Share your invite code with teammates.</p>
                <div className="flex items-center gap-1 mt-4 text-rpg-accent text-sm font-semibold">Create <ArrowRight size={14} /></div>
              </motion.button>
              <motion.button whileHover={{ y: -4, boxShadow: '0 16px 32px rgba(251,191,36,0.15)' }} onClick={() => setMode('join')} className="bg-rpg-panel border border-gray-700 rounded-2xl p-6 text-left group hover:border-rpg-gold/50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-rpg-gold/10 border border-rpg-gold/30 flex items-center justify-center mb-4 group-hover:bg-rpg-gold/20 transition-colors">
                  <Users size={22} className="text-rpg-gold" />
                </div>
                <h3 className="text-white font-bold text-lg mb-1">Join a Guild</h3>
                <p className="text-gray-400 text-sm">Have an invite code? Enter it to join your team's existing guild as a Member.</p>
                <div className="flex items-center gap-1 mt-4 text-rpg-gold text-sm font-semibold">Join <ArrowRight size={14} /></div>
              </motion.button>
            </motion.div>
          )}
          {!successData && mode === 'create' && (
            <motion.div key="create" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="bg-rpg-panel border border-gray-700 rounded-2xl p-8">
              <button onClick={() => { setMode(null); setError(''); }} className="flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-6 transition-colors"><ChevronLeft size={16} /> Back</button>
              <h2 className="text-xl font-bold text-white mb-1">Create Your Guild</h2>
              <p className="text-gray-400 text-sm mb-6">You'll become the Leader and receive an invite code to share.</p>
              {error && <div className="mb-4 p-3 bg-rpg-danger/20 border border-rpg-danger/50 text-rpg-danger rounded text-sm">{error}</div>}
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Guild Name</label>
                  <input type="text" value={guildName} onChange={(e) => setGuildName(e.target.value)} className="w-full px-4 py-2.5 bg-black/30 border border-gray-600 rounded-lg focus:outline-none focus:border-rpg-accent text-white" placeholder="The Midnight Coders" required />
                </div>
                <button type="submit" disabled={loading} className="w-full py-3 bg-rpg-accent hover:bg-rpg-accent/80 text-white font-bold rounded-lg transition-colors shadow-lg shadow-rpg-accent/20">
                  {loading ? 'Creating...' : '⚔️ Create Guild & Become Leader'}
                </button>
              </form>
            </motion.div>
          )}
          {!successData && mode === 'join' && (
            <motion.div key="join" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="bg-rpg-panel border border-gray-700 rounded-2xl p-8">
              <button onClick={() => { setMode(null); setError(''); }} className="flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-6 transition-colors"><ChevronLeft size={16} /> Back</button>
              <h2 className="text-xl font-bold text-white mb-1">Join a Guild</h2>
              <p className="text-gray-400 text-sm mb-6">Ask your Guild Leader for the 6-character invite code.</p>
              {error && <div className="mb-4 p-3 bg-rpg-danger/20 border border-rpg-danger/50 text-rpg-danger rounded text-sm">{error}</div>}
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Invite Code</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Hash size={16} className="text-gray-500" /></div>
                    <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} className="w-full pl-9 pr-4 py-2.5 bg-black/30 border border-gray-600 rounded-lg focus:outline-none focus:border-rpg-gold text-white tracking-widest uppercase font-mono" placeholder="ABC123" maxLength={6} required />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full py-3 bg-rpg-gold hover:bg-rpg-gold/80 text-rpg-bg font-bold rounded-lg transition-colors shadow-lg shadow-rpg-gold/20">
                  {loading ? 'Joining...' : '🛡️ Join Guild'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GuildSetupPage;
