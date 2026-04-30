import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, CheckSquare } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const CreateTaskModal = ({ isOpen, onClose, onTaskCreated, currentUser }) => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '', deadline: '', assigned_to: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLoadingText, setAiLoadingText] = useState('');
  const [aiError, setAiError] = useState('');
  const [subquests, setSubquests] = useState([]);
  const [originalAiSubquests, setOriginalAiSubquests] = useState([]);

  useEffect(() => { if (isOpen) fetchUsers(); }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        // Members can only self-assign; leaders can assign to anyone
        const isMember = currentUser?.role === 'member';
        const defaultId = isMember ? currentUser?.id : data[0]?.id;
        if (defaultId) setFormData(prev => ({ ...prev, assigned_to: defaultId }));
      }
    } catch (err) { console.error('Failed to fetch users:', err); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create task');
      
      // Log AI feedback if the user edited the generated subquests
      if (originalAiSubquests.length > 0 && formData.description) {
        const originalDescription = originalAiSubquests.map((s, i) => `${i + 1}. ${s}`).join('\n');
        if (formData.description !== originalDescription) {
          fetch(`${API_URL}/api/ai/logs/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              instruction_type: 'STRUCTURAL_OUTPUT',
              prompt_input: `Break down this task into 3-5 actionable sub-tasks. Output a raw JSON array of strings only. Title: "${formData.title.trim()}"`,
              ai_output: JSON.stringify(originalAiSubquests),
              user_corrected_output: formData.description
            })
          }).catch(err => console.error('Feedback log failed:', err));
        }
      }

      onTaskCreated(data); onClose();
      setFormData({ title: '', description: '', deadline: '', assigned_to: users[0]?.id || '' });
      setSubquests([]); setOriginalAiSubquests([]); setAiError('');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleGenerateSubquests = async () => {
    if (!formData.title.trim()) { setAiError('Please enter a quest title first.'); return; }
    setAiError(''); setAiLoading(true); setSubquests([]);
    setAiLoadingText('Summoning the Dungeon Master...');

    const timeoutId = setTimeout(() => {
      setAiLoadingText('Waking the Dungeon Master from a deep slumber... this may take a moment!');
    }, 10000);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/tasks/generate-subquests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: formData.title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI generation failed');
      setSubquests(data.subquests || []);
      setOriginalAiSubquests(data.subquests || []);
    } catch (err) { setAiError(err.message); }
    finally {
      clearTimeout(timeoutId);
      setAiLoading(false);
      setAiLoadingText('');
    }
  };

  const handleUseSubquests = () => {
    setFormData(prev => ({ ...prev, description: subquests.map((s, i) => `${i + 1}. ${s}`).join('\n') }));
    setSubquests([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="bg-rpg-panel border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative">
            <div className="p-6 border-b border-gray-700/50 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">New Quest</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 bg-rpg-danger/20 border border-rpg-danger/50 text-rpg-danger rounded text-sm text-center">{error}</div>}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-300">Quest Title</label>
                  <button type="button" onClick={handleGenerateSubquests} disabled={aiLoading} className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-rpg-gold/15 text-rpg-gold hover:bg-rpg-gold/25 border border-rpg-gold/30 transition-colors disabled:opacity-50">
                    {aiLoading ? <Loader2 size={12} className="animate-spin shrink-0" /> : <Sparkles size={12} className="shrink-0" />}
                    <span className="truncate max-w-[300px]">
                      {aiLoading ? aiLoadingText : '✨ Auto-Generate Sub-Quests'}
                    </span>
                  </button>
                </div>
                <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full px-3 py-2 bg-black/30 border border-gray-600 rounded-lg focus:outline-none focus:border-rpg-accent text-white" placeholder="Defeat the Dragon..." />
                {aiError && <p className="text-rpg-danger text-xs mt-1">{aiError}</p>}
              </div>
              <AnimatePresence>
                {subquests.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="bg-rpg-gold/5 border border-rpg-gold/20 rounded-xl p-4">
                      <p className="text-xs font-semibold text-rpg-gold mb-2 flex items-center gap-1.5"><Sparkles size={12} /> AI Generated Sub-Quests</p>
                      <ul className="space-y-1.5 mb-3">
                        {subquests.map((sq, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                            <CheckSquare size={13} className="text-rpg-gold mt-0.5 shrink-0" />{sq}
                          </li>
                        ))}
                      </ul>
                      <button type="button" onClick={handleUseSubquests} className="w-full py-1.5 text-xs font-bold text-rpg-gold border border-rpg-gold/40 rounded-lg hover:bg-rpg-gold/10 transition-colors">Use as Description</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea name="description" rows="3" value={formData.description} onChange={handleChange} className="w-full px-3 py-2 bg-black/30 border border-gray-600 rounded-lg focus:outline-none focus:border-rpg-accent text-white resize-none" placeholder="Details of the epic journey..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Assignee {currentUser?.role === 'member' && <span className="text-xs text-gray-500">(self-assign only)</span>}
                  </label>
                  {currentUser?.role === 'member' ? (
                    <div className="w-full px-3 py-2 bg-black/20 border border-gray-700 rounded-lg text-gray-300 text-sm">
                      {currentUser.name} <span className="text-xs text-rpg-accent">(you)</span>
                    </div>
                  ) : (
                    <select name="assigned_to" required value={formData.assigned_to} onChange={handleChange} className="w-full px-3 py-2 bg-black/30 border border-gray-600 rounded-lg focus:outline-none focus:border-rpg-accent text-white appearance-none">
                      {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Deadline</label>
                  <input type="datetime-local" name="deadline" required value={formData.deadline} onChange={handleChange} className="w-full px-3 py-2 bg-black/30 border border-gray-600 rounded-lg focus:outline-none focus:border-rpg-accent text-white [color-scheme:dark]" />
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-rpg-accent hover:bg-rpg-accent/80 text-white font-bold rounded-lg transition-colors shadow-lg shadow-rpg-accent/20">
                  {loading ? 'Forging Quest...' : 'Create Quest'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateTaskModal;
