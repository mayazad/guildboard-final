import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, CheckCircle, PenTool } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const ReviewTaskModal = ({ isOpen, onClose, task, onReviewSubmitted }) => {
  const [quality, setQuality] = useState(1.0);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!task) return null;

  const handleSubmit = async (approved) => {
    setError(''); setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/tasks/${task.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quality_multiplier: quality, approved, comments })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');
      onReviewSubmitted(data); onClose();
      setQuality(1.0); setComments('');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const multipliers = [
    { value: 1.2, label: 'Flawless Execution', icon: Star, color: 'text-rpg-gold', bg: 'bg-rpg-gold/10', border: 'border-rpg-gold' },
    { value: 1.0, label: 'Standard', icon: CheckCircle, color: 'text-rpg-accent', bg: 'bg-rpg-accent/10', border: 'border-rpg-accent' },
    { value: 0.8, label: 'Needs Revision', icon: PenTool, color: 'text-rpg-danger', bg: 'bg-rpg-danger/10', border: 'border-rpg-danger' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="bg-rpg-panel border border-gray-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative">
            <div className="p-6 border-b border-gray-700/50 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Council Review</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-black/30 p-4 rounded-lg border border-gray-700/50">
                <h3 className="text-lg font-semibold text-gray-200 mb-1">{task.title}</h3>
                <p className="text-sm text-gray-400">Assigned to: <span className="text-gray-300">{task.assignee_name}</span></p>
              </div>
              {error && <div className="p-3 bg-rpg-danger/20 border border-rpg-danger/50 text-rpg-danger rounded text-sm text-center">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Quality Multiplier</label>
                <div className="space-y-3">
                  {multipliers.map((m) => {
                    const Icon = m.icon;
                    const isSelected = quality === m.value;
                    return (
                      <motion.div key={m.value} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setQuality(m.value)}
                        className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center justify-between ${isSelected ? `${m.bg} ${m.border}` : 'bg-black/30 border-gray-700 hover:border-gray-500'}`}>
                        <div className="flex items-center gap-3">
                          <Icon className={isSelected ? m.color : 'text-gray-500'} size={20} />
                          <span className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-400'}`}>{m.label}</span>
                        </div>
                        <span className={`font-bold ${isSelected ? m.color : 'text-gray-500'}`}>{m.value}x</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Council Comments (Optional)</label>
                <textarea rows="3" value={comments} onChange={(e) => setComments(e.target.value)} className="w-full px-3 py-2 bg-black/30 border border-gray-600 rounded-lg focus:outline-none focus:border-rpg-accent text-white resize-none" placeholder="Leave feedback for the adventurer..." />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => handleSubmit(false)} disabled={loading} className="flex-1 py-3 px-4 bg-transparent border border-rpg-danger text-rpg-danger hover:bg-rpg-danger/10 font-bold rounded-lg transition-colors">Reject &amp; Return</button>
                <button onClick={() => handleSubmit(true)} disabled={loading} className="flex-1 py-3 px-4 bg-rpg-success hover:bg-rpg-success/80 text-white font-bold rounded-lg transition-colors shadow-lg shadow-rpg-success/20">
                  {loading ? 'Processing...' : 'Approve & Score'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReviewTaskModal;
