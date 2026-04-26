import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Zap, CheckCircle, Star, Clock, Copy, Check, ArrowLeft, TrendingUp, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '';
const XP_PER_LEVEL = 500;

const StatBox = ({ icon: Icon, value, label, color }) => (
  <div className="bg-black/30 rounded-xl p-4 text-center">
    <Icon size={18} className="mx-auto mb-1" style={{ color }} />
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="text-xs text-gray-400 mt-0.5">{label}</p>
  </div>
);

const ProfilePage = () => {
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [copied, setCopied]     = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res   = await fetch(`${API_URL}/api/users/profile`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to load profile');
        setProfile(await res.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  const copyCode = () => {
    if (!profile?.invite_code) return;
    navigator.clipboard.writeText(profile.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-400"><motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}>Loading profile...</motion.div></div>;
  if (!profile) return <div className="flex-1 flex items-center justify-center text-rpg-danger">Failed to load profile.</div>;

  const xpIntoLevel  = profile.total_xp % XP_PER_LEVEL;
  const xpPct        = Math.min((xpIntoLevel / XP_PER_LEVEL) * 100, 100);
  const xpToNextLevel = XP_PER_LEVEL - xpIntoLevel;

  return (
    <div className="max-w-2xl mx-auto pb-12 pt-4">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Board
      </button>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-rpg-panel border border-gray-700/50 rounded-2xl overflow-hidden mb-4">
        <div className="h-20 bg-gradient-to-r from-rpg-accent/30 to-rpg-gold/20 relative">
          <div className="absolute -bottom-8 left-6">
            <div className="w-16 h-16 rounded-2xl bg-rpg-panel border-2 border-gray-700 flex items-center justify-center text-2xl font-extrabold text-white shadow-xl">{profile.name?.charAt(0).toUpperCase()}</div>
          </div>
        </div>
        <div className="pt-10 px-6 pb-6">
          <div className="flex items-start justify-between flex-wrap gap-2 mb-1">
            <div>
              <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
              <p className="text-gray-400 text-sm">@{profile.username}</p>
            </div>
            <div className="flex items-center gap-2">
              {profile.role && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${profile.role === 'leader' ? 'bg-rpg-gold/15 text-rpg-gold border-rpg-gold/30' : 'bg-rpg-accent/15 text-rpg-accent border-rpg-accent/30'}`}>
                  <Shield size={10} className="inline mr-1" />{profile.role === 'leader' ? 'Guild Leader' : 'Member'}
                </span>
              )}
              {profile.rank && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-rpg-gold/10 text-rpg-gold border border-rpg-gold/20">
                  <Trophy size={10} className="inline mr-1" />#{profile.rank} in Guild
                </span>
              )}
            </div>
          </div>
          <div className="mt-5 p-4 bg-black/30 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-300 flex items-center gap-1.5"><TrendingUp size={14} className="text-rpg-gold" /> Level {profile.current_level}</span>
              <span className="text-xs text-gray-500">{xpIntoLevel} / {XP_PER_LEVEL} XP · {xpToNextLevel} to next level</span>
            </div>
            <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-gray-700">
              <motion.div initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-rpg-accent to-rpg-gold" />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">{profile.total_xp} total XP earned</p>
          </div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <StatBox icon={CheckCircle} value={profile.tasks_completed}   label="Quests Completed" color="#22c55e" />
        <StatBox icon={Zap}         value={profile.tasks_active}      label="Active Quests"    color="#6366f1" />
        <StatBox icon={Clock}       value={profile.early_completions} label="Early Finishes"   color="#f59e0b" />
        <StatBox icon={Star}        value={profile.reviews_given}     label="Reviews Given"    color="#6366f1" />
        <StatBox icon={Star}        value={profile.flawless_given}    label="Flawless Awards"  color="#f59e0b" />
        <StatBox icon={TrendingUp}  value={`Lv. ${profile.current_level}`} label="Current Level" color="#22c55e" />
      </motion.div>
      {profile.guild && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-rpg-panel border border-gray-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Shield size={16} className="text-rpg-accent" /> Guild</h2>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white font-semibold">{profile.guild.name}</p>
              <p className="text-xs text-gray-400">{profile.guild.member_count} member{profile.guild.member_count !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {profile.invite_code && (
            <div className="mt-4 p-4 bg-black/30 rounded-xl border border-rpg-gold/20">
              <p className="text-xs text-rpg-gold font-semibold mb-2 flex items-center gap-1.5"><Star size={11} /> Your Guild Invite Code</p>
              <div className="flex items-center justify-between gap-3">
                <span className="text-2xl font-mono font-extrabold tracking-[0.3em] text-white">{profile.invite_code}</span>
                <button onClick={copyCode} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-rpg-gold/10 text-rpg-gold border border-rpg-gold/30 hover:bg-rpg-gold/20 transition-colors">
                  {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Share this code with teammates so they can join your guild.</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default ProfilePage;
