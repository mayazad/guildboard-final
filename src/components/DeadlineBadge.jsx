import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

const getDeadlineInfo = (deadline) => {
  if (!deadline) return null;
  const now  = Date.now();
  const diff = new Date(deadline).getTime() - now;
  const totalMins = Math.floor(diff / 60000);

  if (diff < 0) return { label: 'OVERDUE', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/40', icon: AlertTriangle, pulse: true };

  const days  = Math.floor(totalMins / 1440);
  const hours = Math.floor((totalMins % 1440) / 60);
  const mins  = totalMins % 60;

  if (days > 3)  return { label: `${days}d ${hours}h left`,  color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30',  icon: Clock, pulse: false };
  if (days >= 1) return { label: `${days}d ${hours}h left`,  color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/30',  icon: Clock, pulse: false };
  if (hours >= 1)return { label: `${hours}h ${mins}m left`,  color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', icon: Clock, pulse: true  };
  return         { label: `${mins}m left`,                    color: 'text-red-400',    bg: 'bg-red-500/15 border-red-500/40',      icon: AlertTriangle, pulse: true };
};

const DeadlineBadge = ({ deadline, className = '' }) => {
  const [info, setInfo] = useState(() => getDeadlineInfo(deadline));

  useEffect(() => {
    setInfo(getDeadlineInfo(deadline));
    const timer = setInterval(() => setInfo(getDeadlineInfo(deadline)), 60000);
    return () => clearInterval(timer);
  }, [deadline]);

  if (!info) return null;
  const Icon = info.icon;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${info.bg} ${info.color} ${info.pulse ? 'animate-pulse' : ''} ${className}`}>
      <Icon size={10} />
      {info.label}
    </span>
  );
};

export default DeadlineBadge;
