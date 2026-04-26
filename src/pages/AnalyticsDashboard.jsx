import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Trophy, Zap, Star, Clock, TrendingUp, Users, ArrowLeft, ChevronLeft, ChevronRight, Target, CheckCircle, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '';
const LINE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ── Ambient background ──────────────────────────────────────────
const BackgroundOrbs = () => {
  const ref = useRef(null);
  useEffect(() => {
    const orbs = ref.current?.querySelectorAll('.orb');
    if (!orbs) return;
    orbs.forEach((orb, i) => {
      gsap.to(orb, { y: `${-30 - i * 12}px`, x: `${(i % 2 === 0 ? 1 : -1) * (10 + i * 5)}px`, duration: 4 + i * 0.8, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.3 });
    });
  }, []);
  return (
    <div ref={ref} className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="orb absolute rounded-full opacity-10 blur-3xl" style={{ width: `${120 + i * 60}px`, height: `${120 + i * 60}px`, background: i % 2 === 0 ? '#6366f1' : '#f59e0b', left: `${10 + i * 18}%`, top: `${15 + i * 14}%` }} />
      ))}
    </div>
  );
};

// ── All-time leaderboard card ────────────────────────────────────
const LeaderboardCard = ({ icon: Icon, title, subtitle, data, valueKey, label, delay, iconColor }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }} className="bg-rpg-panel border border-gray-700/50 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden">
    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20" style={{ background: iconColor }} />
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

// ── Monthly member card ──────────────────────────────────────────
const MonthlyMemberCard = ({ member, rank, isTopPerformer }) => {
  const scoreColor =
    member.performance_score >= 75 ? 'text-green-400' :
    member.performance_score >= 40 ? 'text-amber-400' :
    'text-gray-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.08 }}
      className={`bg-rpg-panel border rounded-2xl p-5 relative overflow-hidden ${isTopPerformer ? 'border-rpg-gold/50' : 'border-gray-700/50'}`}
    >
      {isTopPerformer && (
        <div className="absolute top-3 right-3 flex items-center gap-1 text-xs font-bold text-rpg-gold bg-rpg-gold/10 border border-rpg-gold/30 px-2 py-0.5 rounded-full">
          <Flame size={10} /> Top Performer
        </div>
      )}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-extrabold border ${member.role === 'leader' ? 'bg-rpg-gold/10 border-rpg-gold/40 text-rpg-gold' : 'bg-rpg-accent/10 border-rpg-accent/40 text-rpg-accent'}`}>
          {member.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-white">{member.name}</p>
          <p className={`text-xs capitalize ${member.role === 'leader' ? 'text-rpg-gold' : 'text-rpg-accent'}`}>{member.role}</p>
        </div>
      </div>

      {/* Performance score bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400 flex items-center gap-1"><Target size={10} /> Performance Score</span>
          <span className={`text-sm font-extrabold ${scoreColor}`}>{member.performance_score}%</span>
        </div>
        <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-gray-700">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${member.performance_score}%` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: rank * 0.08 + 0.3 }}
            className={`h-full rounded-full ${
              member.performance_score >= 75 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
              member.performance_score >= 40 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
              'bg-gray-600'
            }`}
          />
        </div>
        <p className="text-[10px] text-gray-500 mt-1">Of maximum possible XP for quests assigned</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-black/30 rounded-lg p-2 text-center">
          <p className="font-bold text-white">{member.quests_completed}<span className="text-gray-500">/{member.quests_assigned}</span></p>
          <p className="text-gray-400">Done/Assigned</p>
        </div>
        <div className="bg-black/30 rounded-lg p-2 text-center">
          <p className="font-bold text-rpg-gold">+{member.xp_earned}</p>
          <p className="text-gray-400">XP Earned</p>
        </div>
        <div className="bg-black/30 rounded-lg p-2 text-center">
          <p className="font-bold text-rpg-accent">{member.completion_rate}%</p>
          <p className="text-gray-400">Completion</p>
        </div>
        <div className="bg-black/30 rounded-lg p-2 text-center">
          <p className="font-bold text-green-400">{member.early_count}</p>
          <p className="text-gray-400">Early ⚡</p>
        </div>
        <div className="bg-black/30 rounded-lg p-2 text-center">
          <p className="font-bold text-purple-400">{member.avg_xp_per_quest}</p>
          <p className="text-gray-400">Avg XP/Quest</p>
        </div>
        <div className="bg-black/30 rounded-lg p-2 text-center">
          <p className="font-bold text-rpg-gold">{member.flawless_given}</p>
          <p className="text-gray-400">Flawless ⭐</p>
        </div>
      </div>
    </motion.div>
  );
};

// ── Main page ────────────────────────────────────────────────────
const AnalyticsDashboard = () => {
  const [tab,         setTab]         = useState('alltime'); // 'alltime' | 'monthly'
  const [allTimeData, setAllTimeData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [loadingAT,   setLoadingAT]   = useState(true);
  const [loadingM,    setLoadingM]    = useState(false);
  const [errorAT,     setErrorAT]     = useState('');
  const [errorM,      setErrorM]      = useState('');
  const navigate = useNavigate();

  const today = new Date();
  const [selYear,  setSelYear]  = useState(today.getFullYear());
  const [selMonth, setSelMonth] = useState(today.getMonth() + 1);

  // Fetch all-time data once
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/analytics`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to load analytics');
        setAllTimeData(await res.json());
      } catch (err) { setErrorAT(err.message); }
      finally { setLoadingAT(false); }
    })();
  }, []);

  // Fetch monthly data whenever year/month changes and tab is monthly
  const fetchMonthly = useCallback(async (y, m) => {
    setLoadingM(true); setErrorM('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/analytics/monthly?year=${y}&month=${m}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to load monthly analytics');
      setMonthlyData(await res.json());
    } catch (err) { setErrorM(err.message); }
    finally { setLoadingM(false); }
  }, []);

  useEffect(() => {
    if (tab === 'monthly') fetchMonthly(selYear, selMonth);
  }, [tab, selYear, selMonth, fetchMonthly]);

  const prevMonth = () => {
    if (selMonth === 1) { setSelMonth(12); setSelYear(y => y - 1); }
    else setSelMonth(m => m - 1);
  };
  const nextMonth = () => {
    const now = new Date();
    if (selYear === now.getFullYear() && selMonth === now.getMonth() + 1) return;
    if (selMonth === 12) { setSelMonth(1); setSelYear(y => y + 1); }
    else setSelMonth(m => m + 1);
  };
  const isCurrentMonth = selYear === today.getFullYear() && selMonth === today.getMonth() + 1;

  // All-time derived data
  let chartData = [], names = [], leaderboards = {}, userStats = [];
  if (allTimeData) {
    ({ leaderboards, userStats } = allTimeData);
    ({ chartData, names } = pivotXpData(allTimeData.xpOverTime));
  }

  // Monthly derived data
  let sortedMembers = [];
  if (monthlyData?.members) {
    sortedMembers = [...monthlyData.members].sort((a, b) => b.performance_score - a.performance_score);
  }
  const topPerformerId = sortedMembers[0]?.id;
  const barChartData = sortedMembers.map(m => ({ name: m.name, score: m.performance_score, xp: m.xp_earned }));

  return (
    <div className="relative min-h-full pb-12 z-10">
      <BackgroundOrbs />
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 pt-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2"><TrendingUp className="text-rpg-accent" size={28} /> Hall of Fame</h1>
            <p className="text-gray-400 text-sm mt-0.5">Guild performance analytics & leaderboards</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-6 p-1 bg-rpg-panel border border-gray-700/50 rounded-xl w-fit">
          {[{ id: 'alltime', label: '🏆 All Time' }, { id: 'monthly', label: '📅 Monthly Report' }].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.id ? 'bg-rpg-accent text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── ALL TIME TAB ───────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {tab === 'alltime' && (
            <motion.div key="alltime" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {loadingAT
                ? <div className="text-gray-400 text-center py-12">Loading analytics...</div>
                : errorAT
                  ? <div className="text-rpg-danger text-center py-12">{errorAT}</div>
                  : <>
                      <section className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2"><Users size={16} className="text-rpg-accent" /> Guild Members</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {userStats.map((u, i) => <StatCard key={u.id} user={u} rank={i} />)}
                        </div>
                      </section>
                      <section className="mb-8">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="bg-rpg-panel border border-gray-700/50 rounded-2xl p-6">
                          <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2"><Zap size={16} className="text-rpg-gold" /> XP Over Time</h2>
                          {chartData.length > 0
                            ? <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                  <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                  <Tooltip content={<CustomTooltip />} />
                                  <Legend wrapperStyle={{ fontSize: '12px', color: '#d1d5db' }} />
                                  {names.map((name, i) => <Line key={name} type="monotone" dataKey={name} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2.5} dot={{ r: 4, fill: LINE_COLORS[i % LINE_COLORS.length] }} activeDot={{ r: 6 }} />)}
                                </LineChart>
                              </ResponsiveContainer>
                            : <div className="h-[280px] flex items-center justify-center text-gray-500 text-sm">Complete some quests to see your XP progress here!</div>}
                        </motion.div>
                      </section>
                      <section>
                        <h2 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2"><Trophy size={16} className="text-rpg-gold" /> Leaderboards</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <LeaderboardCard icon={Trophy} title="Highest Level" subtitle="Total XP earned" data={leaderboards.highestLevel || []} valueKey="total_xp" label="XP" delay={0.3} iconColor="#f59e0b" />
                          <LeaderboardCard icon={Star} title="The Perfectionist" subtitle="Most Flawless (1.2×) reviews" data={leaderboards.perfectionist || []} valueKey="flawless_count" label="⭐" delay={0.4} iconColor="#6366f1" />
                          <LeaderboardCard icon={Clock} title="The Speedster" subtitle="Tasks completed 24h+ early" data={leaderboards.speedster || []} valueKey="early_count" label="⚡" delay={0.5} iconColor="#10b981" />
                        </div>
                      </section>
                    </>}
            </motion.div>
          )}

          {/* ── MONTHLY TAB ─────────────────────────────────── */}
          {tab === 'monthly' && (
            <motion.div key="monthly" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {/* Month picker */}
              <div className="flex items-center gap-3 mb-6 bg-rpg-panel border border-gray-700/50 rounded-xl px-4 py-3 w-fit">
                <button onClick={prevMonth} className="text-gray-400 hover:text-white transition-colors"><ChevronLeft size={18} /></button>
                <span className="text-white font-bold min-w-[140px] text-center">{MONTHS[selMonth - 1]} {selYear}</span>
                <button onClick={nextMonth} disabled={isCurrentMonth} className="text-gray-400 hover:text-white disabled:opacity-30 transition-colors"><ChevronRight size={18} /></button>
              </div>

              {loadingM
                ? <div className="text-gray-400 text-center py-12">Loading monthly report...</div>
                : errorM
                  ? <div className="text-rpg-danger text-center py-12">{errorM}</div>
                  : <>
                      {/* Guild summary bar */}
                      {monthlyData && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                          {[
                            { label: 'Quests Completed', value: sortedMembers.reduce((s, m) => s + m.quests_completed, 0), color: 'text-green-400', icon: CheckCircle },
                            { label: 'Total XP Earned', value: sortedMembers.reduce((s, m) => s + m.xp_earned, 0) + ' XP', color: 'text-rpg-gold', icon: Zap },
                            { label: 'Early Finishes', value: sortedMembers.reduce((s, m) => s + m.early_count, 0), color: 'text-rpg-accent', icon: Clock },
                            { label: 'Best Score', value: (sortedMembers[0]?.performance_score || 0) + '%', color: 'text-rpg-gold', icon: Trophy },
                          ].map((stat, i) => {
                            const Icon = stat.icon;
                            return (
                              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="bg-rpg-panel border border-gray-700/50 rounded-xl p-4 text-center">
                                <Icon size={16} className={`mx-auto mb-1 ${stat.color}`} />
                                <p className={`text-xl font-extrabold ${stat.color}`}>{stat.value}</p>
                                <p className="text-xs text-gray-400">{stat.label}</p>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}

                      {/* Normalized bar chart */}
                      {barChartData.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-rpg-panel border border-gray-700/50 rounded-2xl p-6 mb-6">
                          <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2"><Target size={16} className="text-rpg-accent" /> Normalized Performance Score</h2>
                          <p className="text-xs text-gray-400 mb-4">Fair comparison: how much of your maximum possible XP did you earn?</p>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={barChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                              <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 11 }} unit="%" />
                              <Tooltip formatter={(v) => [`${v}%`, 'Score']} contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
                              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                                {barChartData.map((entry, i) => (
                                  <Cell key={i} fill={
                                    entry.score >= 75 ? '#22c55e' :
                                    entry.score >= 40 ? '#f59e0b' :
                                    '#6b7280'
                                  } />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </motion.div>
                      )}

                      {/* Per-member cards */}
                      <h2 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2"><Users size={16} className="text-rpg-accent" /> Member Reports</h2>
                      {sortedMembers.length === 0
                        ? <div className="text-center py-12 text-gray-500">No quest activity in {MONTHS[selMonth - 1]} {selYear}.</div>
                        : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sortedMembers.map((member, i) => (
                              <MonthlyMemberCard key={member.id} member={member} rank={i} isTopPerformer={member.id === topPerformerId && member.performance_score > 0} />
                            ))}
                          </div>}
                    </>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
