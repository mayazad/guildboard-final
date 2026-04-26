import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { Shield, Zap, Users, Star, CheckCircle, ArrowRight, TrendingUp, X, Sword } from 'lucide-react';
import AuthCard from '../components/AuthCard';

const FloatingOrbs = () => {
  const ref = useRef(null);
  useEffect(() => {
    const orbs = ref.current?.querySelectorAll('.orb');
    orbs?.forEach((orb, i) => {
      gsap.to(orb, {
        y: `${-40 - i * 10}px`,
        x: `${(i % 2 === 0 ? 1 : -1) * (15 + i * 6)}px`,
        duration: 5 + i,
        repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.4,
      });
    });
  }, []);
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none">
      {[
        { w: 400, h: 400, bg: '#6366f1', l: '10%',  t: '5%',  op: 0.12 },
        { w: 300, h: 300, bg: '#f59e0b', l: '75%',  t: '10%', op: 0.10 },
        { w: 250, h: 250, bg: '#6366f1', l: '60%',  t: '55%', op: 0.08 },
        { w: 200, h: 200, bg: '#10b981', l: '20%',  t: '65%', op: 0.08 },
        { w: 350, h: 350, bg: '#f59e0b', l: '40%',  t: '35%', op: 0.06 },
      ].map(({ w, h, bg, l, t, op }, i) => (
        <div key={i} className="orb absolute rounded-full blur-3xl" style={{ width: w, height: h, background: bg, left: l, top: t, opacity: op }} />
      ))}
    </div>
  );
};

const StatChip = ({ value, label }) => (
  <div className="text-center">
    <p className="text-3xl font-extrabold text-white">{value}</p>
    <p className="text-sm text-gray-400 mt-0.5">{label}</p>
  </div>
);

const FeatureCard = ({ icon: Icon, title, desc, color, delay }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay }} whileHover={{ y: -6, boxShadow: `0 20px 40px ${color}22` }} className="bg-rpg-panel/80 backdrop-blur border border-gray-700/60 rounded-2xl p-6 flex flex-col gap-4">
    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${color}22`, border: `1px solid ${color}44` }}><Icon size={22} style={{ color }} /></div>
    <div>
      <h3 className="text-white font-bold text-lg mb-1">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  </motion.div>
);

const StepCard = ({ num, title, desc, delay }) => (
  <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay }} className="flex gap-4 items-start">
    <div className="w-10 h-10 rounded-full bg-rpg-accent/20 border border-rpg-accent/40 flex items-center justify-center text-rpg-accent font-bold text-sm shrink-0 mt-1">{num}</div>
    <div>
      <h4 className="text-white font-semibold mb-1">{title}</h4>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  </motion.div>
);

const AuthModal = ({ mode, onClose, onSuccess }) => (
  <AnimatePresence>
    {mode && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="relative w-full max-w-md">
          <button onClick={onClose} className="absolute -top-10 right-0 text-gray-400 hover:text-white transition-colors z-10"><X size={22} /></button>
          <AuthCard onLoginSuccess={onSuccess} initialMode={mode} />
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const LandingPage = () => {
  const [authMode, setAuthMode] = useState(null);

  const handleSuccess = (user) => {
    if (!user.guild_id) window.location.href = '/guild-setup';
    else window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-rpg-bg text-white font-sans overflow-x-hidden">
      <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onSuccess={handleSuccess} />
      <nav className="fixed top-0 left-0 right-0 z-50 bg-rpg-bg/80 backdrop-blur-md border-b border-gray-800/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sword size={20} className="text-rpg-accent" />
            <span className="text-lg font-extrabold tracking-tight">Guild<span className="text-rpg-accent">Board</span></span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setAuthMode('login')} className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors">Log In</button>
            <button onClick={() => setAuthMode('register')} className="px-4 py-2 text-sm font-bold bg-rpg-accent hover:bg-rpg-accent/80 text-white rounded-lg transition-colors shadow-lg shadow-rpg-accent/20">Get Started</button>
          </div>
        </div>
      </nav>
      <section className="relative pt-32 pb-24 px-6 flex flex-col items-center text-center overflow-hidden">
        <FloatingOrbs />
        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rpg-accent/10 border border-rpg-accent/30 text-rpg-accent text-xs font-semibold mb-6">
            <Star size={12} className="fill-rpg-accent" /> RPG-Powered Task Management
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6">
            Turn Work into <span className="bg-gradient-to-r from-rpg-accent to-rpg-gold bg-clip-text text-transparent">Epic Quests</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            GuildBoard replaces boring task management with an RPG XP system, peer-reviewed quality scores, and a Council-based approval workflow built for serious dev teams.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => setAuthMode('register')} className="inline-flex items-center gap-2 px-6 py-3.5 bg-rpg-accent hover:bg-rpg-accent/80 text-white font-bold rounded-xl transition-colors shadow-xl shadow-rpg-accent/25 text-base">Start Your Journey <ArrowRight size={18} /></button>
            <button onClick={() => setAuthMode('login')} className="inline-flex items-center gap-2 px-6 py-3.5 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold rounded-xl transition-colors text-base">Log In</button>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="relative z-10 mt-20 flex flex-wrap gap-12 justify-center border-t border-gray-800 pt-12 w-full max-w-2xl mx-auto">
          <StatChip value="Any" label="Team Size" />
          <StatChip value="∞"   label="Quests" />
          <StatChip value="XP"  label="Real Rewards" />
          <StatChip value="⚔️"  label="Council System" />
        </motion.div>
      </section>
      <section className="py-24 px-6 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Built for <span className="text-rpg-accent">Elite Teams</span></h2>
            <p className="text-gray-400 max-w-xl mx-auto">Every feature is designed to reward quality and accountability.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard delay={0}    color="#6366f1" icon={Zap}        title="XP Math Engine"         desc="Final XP = Base × Time Multiplier × Quality Multiplier. Ship early, earn more. Overdue tasks cost you." />
            <FeatureCard delay={0.05} color="#f59e0b" icon={Shield}     title="The Council"            desc="Leader tasks require 2-of-2 team approval before they're verified. No rubber stamping." />
            <FeatureCard delay={0.1}  color="#10b981" icon={Star}       title="Quality Scoring"        desc="Reviewers award Flawless (1.2×), Standard (1.0×), or Needs Revision (0.8×) — multiplied directly into XP." />
            <FeatureCard delay={0.15} color="#6366f1" icon={TrendingUp} title="Hall of Fame"           desc="Live leaderboards for Highest Level, The Perfectionist, and The Speedster. Friendly competition, real data." />
            <FeatureCard delay={0.2}  color="#f59e0b" icon={Users}      title="Kanban + Drag & Drop"  desc="Move quests across Assigned → In Progress → Review → Verified with a single drag." />
            <FeatureCard delay={0.25} color="#10b981" icon={CheckCircle} title="Level Up System"      desc="Every 500 XP earns you a level. Your HUD tracks your progress in real time." />
          </div>
        </div>
      </section>
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">How It <span className="text-rpg-gold">Works</span></h2>
            <p className="text-gray-400">From quest creation to XP reward in 4 steps.</p>
          </motion.div>
          <div className="flex flex-col gap-8">
            <StepCard delay={0}    num="1" title="Create a Quest"             desc="Set a title, description, deadline, and assign it to a team member. The AI can even auto-generate sub-tasks for complex quests." />
            <StepCard delay={0.1}  num="2" title="Complete & Submit"          desc="The assignee works the quest and drags it to the Review column when done." />
            <StepCard delay={0.2}  num="3" title="Peer Review / The Council" desc="For members: the team leader reviews and scores quality. For the leader: both members must approve — that's the Council." />
            <StepCard delay={0.3}  num="4" title="XP Awarded, Level Up!"     desc="The math engine calculates Final XP based on quality and timing, updates your level, and fires a Discord notification." />
          </div>
        </div>
      </section>
      <section className="py-24 px-6 bg-gradient-to-b from-transparent to-black/30">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to Join the <span className="text-rpg-accent">Guild?</span></h2>
          <p className="text-gray-400 mb-8">Your team's first quest is waiting.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => setAuthMode('register')} className="inline-flex items-center gap-2 px-6 py-3.5 bg-rpg-accent hover:bg-rpg-accent/80 text-white font-bold rounded-xl transition-colors shadow-xl shadow-rpg-accent/25 text-base">Register Now <ArrowRight size={18} /></button>
            <button onClick={() => setAuthMode('login')} className="inline-flex items-center gap-2 px-6 py-3.5 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold rounded-xl transition-colors text-base">Already a member? Log In</button>
          </div>
        </motion.div>
      </section>
      <footer className="border-t border-gray-800 py-8 px-6 text-center text-gray-600 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2"><Sword size={14} className="text-gray-700" /><span className="font-semibold text-gray-500">GuildBoard</span></div>
        <p>Built for your dev guild. Every quest counts.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
