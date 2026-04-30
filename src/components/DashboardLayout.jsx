import { useEffect, useState, useRef } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Trophy, LayoutDashboard, User, LogOut, ChevronDown, Palette, BookOpen, ScrollText } from 'lucide-react';
import GuildChat from './GuildChat';

const API_URL = import.meta.env.VITE_API_URL || '';
const XP_PER_LEVEL = 500;

const DashboardLayout = () => {
  const [userData, setUserData]       = useState(null);
  const [guildData, setGuildData]     = useState(null);
  const [loading, setLoading]         = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [theme, setTheme]             = useState(() => localStorage.getItem('guild-theme') || 'rpg');
  const profileRef = useRef(null);
  const navigate   = useNavigate();
  const location   = useLocation();

  // Apply theme on mount + change
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('guild-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'rpg' ? 'bw' : 'rpg');

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/'); return; }
      try {
        const res = await fetch(`${API_URL}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) { navigate('/'); return; }
        const user = await res.json();
        if (!user.guild_id) { navigate('/guild-setup'); return; }
        setUserData(user);
        const guildRes = await fetch(`${API_URL}/api/guilds/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (guildRes.ok) setGuildData(await guildRes.json());
      } catch { navigate('/'); }
      finally { setLoading(false); }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/'); };

  if (loading) {
    return (
      <div className="min-h-screen bg-rpg-bg flex items-center justify-center">
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-gray-400">
          Loading guild...
        </motion.div>
      </div>
    );
  }

  const xpInLevel = userData ? userData.total_xp % XP_PER_LEVEL : 0;
  const xpPct     = Math.min((xpInLevel / XP_PER_LEVEL) * 100, 100);
  const isActive  = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-rpg-bg flex flex-col">

      {/* ── Top Navigation ───────────────────────────────────── */}
      <nav className="bg-rpg-panel/90 backdrop-blur-md border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
            <Sword size={18} className="text-rpg-accent" />
            <span className="text-base font-extrabold tracking-tight text-white">
              Guild<span className="text-rpg-accent">Board</span>
            </span>
          </Link>


          {/* ── Desktop Nav with sliding pill ─────────────────────── */}
          {(() => {
            const NAV = [
              { to: '/dashboard', icon: LayoutDashboard, label: 'Board'      },
              { to: '/analytics', icon: Trophy,          label: 'Hall of Fame'},
              { to: '/quest-log', icon: BookOpen,        label: 'Quest Log'  },
              { to: '/notebook',  icon: ScrollText,      label: 'Notebook'   },
            ];
            const activeIdx = NAV.findIndex(n => n.to === location.pathname);
            return (
              <div className="hidden sm:flex items-center relative bg-black/30 rounded-xl border border-gray-800 p-1 gap-0">
                {/* Sliding background pill */}
                {activeIdx >= 0 && (
                  <motion.div
                    className="absolute top-1 bottom-1 rounded-lg bg-white/10 border border-white/10"
                    layoutId="nav-active-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    style={{ left: `calc(${activeIdx} * (100% / ${NAV.length}) + 4px)`, width: `calc(100% / ${NAV.length} - 8px)` }}
                  />
                )}
                {NAV.map(({ to, icon: Icon, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors rounded-lg ${
                      isActive(to) ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <Icon size={14} /> {label}
                  </Link>
                ))}
              </div>
            );
          })()}

          <div className="flex-1" />

          {/* Theme toggle — always visible */}
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            title={theme === 'rpg' ? 'Switch to B&W' : 'Switch to RPG'}
            className="w-8 h-8 rounded-lg border border-gray-700 hover:border-gray-500 flex items-center justify-center text-gray-400 hover:text-white transition-all"
          >
            <Palette size={15} />
          </motion.button>

          {/* XP bar — desktop only */}
          {userData && (
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-400 font-semibold">LVL <span className="text-rpg-gold">{userData.current_level}</span></span>
              <div className="w-28 h-1.5 bg-black/40 rounded-full overflow-hidden border border-gray-700">
                <motion.div initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-rpg-accent to-rpg-gold" />
              </div>
              <span className="text-xs text-gray-500">{xpInLevel} / {XP_PER_LEVEL}</span>
            </div>
          )}

          {/* Profile dropdown — always visible */}
          {userData && (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(p => !p)}
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-black/30 border border-gray-700 hover:border-gray-500 transition-colors"
              >
                <div className="w-6 h-6 rounded-lg bg-rpg-accent/20 border border-rpg-accent/40 flex items-center justify-center text-[10px] font-bold text-rpg-accent">
                  {userData.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-gray-200 hidden sm:block truncate max-w-[100px]">{userData.name}</span>
                {userData.role && (
                  <span className={`text-xs px-1.5 py-0.5 rounded font-semibold hidden lg:block ${userData.role === 'leader' ? 'bg-rpg-gold/20 text-rpg-gold' : 'bg-rpg-accent/20 text-rpg-accent'}`}>
                    {userData.role}
                  </span>
                )}
                <ChevronDown size={13} className="text-gray-400" />
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-44 bg-rpg-panel border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-[100]"
                  >
                    <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                      <User size={14} /> Profile
                    </Link>
                    <div className="border-t border-gray-700/50" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-rpg-danger hover:bg-rpg-danger/10 transition-colors">
                      <LogOut size={14} /> Log Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </nav>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-20 sm:pb-6">
        <Outlet context={{ guildData, userData }} />
      </main>

      {/* ── Mobile Bottom Navigation (2 items only) ──────────── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-rpg-panel/95 backdrop-blur-lg border-t border-gray-700/60 flex justify-around items-center h-14 z-[60]">
        <Link
          to="/dashboard"
          className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-all ${isActive('/dashboard') ? 'text-rpg-accent' : 'text-gray-500'}`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-bold">Board</span>
        </Link>
        <Link
          to="/analytics"
          className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-all ${isActive('/analytics') ? 'text-rpg-accent' : 'text-gray-500'}`}
        >
          <Trophy size={20} />
          <span className="text-[10px] font-bold">Fame</span>
        </Link>
        <Link
          to="/quest-log"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-all ${isActive('/quest-log') ? 'text-rpg-accent' : 'text-gray-500'}`}
        >
          <BookOpen size={20} />
          <span className="text-[10px] font-bold">Log</span>
        </Link>
        <Link
          to="/notebook"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-all ${isActive('/notebook') ? 'text-rpg-accent' : 'text-gray-500'}`}
        >
          <ScrollText size={20} />
          <span className="text-[10px] font-bold">Notebook</span>
        </Link>
      </div>

      {/* ── Floating Guild Chat (above bottom nav on mobile) ─── */}
      {userData && (
        <GuildChat currentUser={userData} guildName={guildData?.guild?.name} bottomClass="bottom-20 sm:bottom-6" />
      )}
    </div>
  );
};

export default DashboardLayout;
