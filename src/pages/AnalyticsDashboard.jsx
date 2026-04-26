import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Trophy, Zap, Star, Clock, TrendingUp, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '';
const LINE_COLORS = ['#6366f1', '#f59e0b', '#10b981'];

const BackgroundOrbs = () => {
  const containerRef = useRef(null);
  useEffect(() => {
    const orbs = containerRef.current?.querySelectorAll('.orb');
    if (!orbs) return;
    orbs.forEach((orb, i) => {
      gsap.to(orb, { y: `${-30 - i * 12}px`, x: `${(i % 2 === 0 ? 1 : -1) * (10 + i * 5)}px`, duration: 4 + i * 0.8, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.3 });
    });
  }, []);
  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="orb absolute rounded-full opacity-10 blur-3xl" style={{ width: `${120 + i * 60}px`, height: `${120 + i * 60}px`, background: i % 2 === 0 ? '#6366f1' : '#f59e0b', left: `${10 + i * 18}%`, top: `${15 + i * 14}%` }} />
      ))}
    </div>
  );
};

const LeaderboardCard = ({ icon: Icon, title, subtitle, data, valueKey, label, delay, iconColor }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }} className="bg-rpg-panel border border-gray-700/50 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden">
    <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20`} style={{ background: iconColor }} />
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl" style={{ background: `${iconColor}22` }}><Icon size={20} style={{ color: iconColor }} /></div>
      <div>
        <h3 className="font-bold text-white text-sm">{title}</h3>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
    </div>
    <div className="space-y-2">
      {data.slice(0, 3).map((row, idx) => (
        <div key={row.id || idx} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold w-5 text-center ${idx === 0 ? 'text-rpg-gold' : 'text-gray-500'}`}>#{idx + 1}</span>
            <span className="text-sm text-gray-200">{row.name}</span>
            {row.role && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${row.role === 'leader' ? 'bg-rpg-gold/20 text-rpg-gold' : 'bg-rpg-accent/20 text-rpg-accent'}`}>{row.role}</span>}
          </div>
          <span className="text-sm font-semibold" style={{ color: iconColor }}>{row[valueKey]} {label}</span>
        </div>
      ))}
      {data.length === 0 && <p className="text-xs text-gray-500 text-center py-2">No data yet. Complete some quests!</p>}
    </div>
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-1 font-medium">{label}</p>
      {payload.map((p) => <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-bold text-white">{p.value} XP</span></p>)}
    </div>
  );
};

const pivotXpData = (rows) => {
  const map = {};
  const names = new Set();
  rows.forEach(({ name, date, xp_earned }) => {
    const d = date?.substring(0, 10) || 'Unknown';
    names.add(name);
    if (!map[d]) map[d] = { date: d };
    map[d][name] = (map[d][name] || 0) + Number(xp_earned || 0);
  });
  return { chartData: Object.values(map).sort((a, b) => a.date.localeCompare(b.date)), names: [...names] };
};

const StatCard = ({ user, rank }) => {
  const xpIntoLevel = user.total_xp % 500;
  const pct = Math.min((xpIntoLevel / 500) * 100, 100);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: rank * 0.1 }} className="bg-rpg-panel border border-gray-700/50 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-bold text-white">{user.name}</p>
          <p className={`text-xs capitalize ${user.role === 'leader' ? 'text-rpg-gold' : 'text-rpg-accent'}`}>{user.role}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-rpg-gold">Lv. {user.current_level}</p>
          <p className="text-xs text-gray-400">{user.total_xp} total XP</p>
        </div>
      </div>
      <div className="h-1.5 bg-black/40 rounded-full overflow-hidden mb-3 border border-gray-700">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: 'easeOut', delay: rank * 0.15 + 0.3 }} className="h-full bg-gradient-to-r from-rpg-accent to-rpg-gold" />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-black/30 rounded-lg p-2 text-center">
          <p className="text-rpg-success font-bold text-base">{user.tasks_completed}</p>
          <p className="text-gray-400">Completed</p>
        </div>
        <div className="bg-black/30 rounded-lg p-2 text-center">
          <p className="text-rpg-accent font-bold text-base">{user.tasks_active}</p>
          <p className="text-gray-400">Active</p>
        </div>
      </div>
    </motion.div>
  );
};

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/analytics`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to load analytics');
        setData(await res.json());
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-400"><motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}>Loading analytics...</motion.div></div>;
  if (error) return <div className="flex-1 flex items-center justify-center text-rpg-danger">{error}</div>;

  const { leaderboards, xpOverTime, userStats } = data;
  const { chartData, names } = pivotXpData(xpOverTime);

  return (
    <div className="relative min-h-full pb-12 z-10">
      <BackgroundOrbs />
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-8 pt-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2"><TrendingUp className="text-rpg-accent" size={28} /> Hall of Fame</h1>
            <p className="text-gray-400 text-sm mt-0.5">Guild performance analytics & leaderboards</p>
          </div>
        </div>
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2"><Users size={16} className="text-rpg-accent" /> Guild Members</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userStats.map((u, i) => <StatCard key={u.id} user={u} rank={i} />)}
          </div>
        </section>
        <section className="mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="bg-rpg-panel border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2"><Zap size={16} className="text-rpg-gold" /> XP Over Time</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#d1d5db' }} />
                  {names.map((name, i) => <Line key={name} type="monotone" dataKey={name} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2.5} dot={{ r: 4, fill: LINE_COLORS[i % LINE_COLORS.length] }} activeDot={{ r: 6 }} />)}
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="h-[280px] flex items-center justify-center text-gray-500 text-sm">Complete some quests to see your XP progress here!</div>}
          </motion.div>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2"><Trophy size={16} className="text-rpg-gold" /> Leaderboards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LeaderboardCard icon={Trophy} title="Highest Level" subtitle="Total XP earned" data={leaderboards.highestLevel} valueKey="total_xp" label="XP" delay={0.3} iconColor="#f59e0b" />
            <LeaderboardCard icon={Star} title="The Perfectionist" subtitle="Most Flawless (1.2×) reviews" data={leaderboards.perfectionist} valueKey="flawless_count" label="⭐" delay={0.4} iconColor="#6366f1" />
            <LeaderboardCard icon={Clock} title="The Speedster" subtitle="Tasks completed 24h+ early" data={leaderboards.speedster} valueKey="early_count" label="⚡" delay={0.5} iconColor="#10b981" />
          </div>
        </section>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
