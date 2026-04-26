import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Shield } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const AuthCard = ({ onLoginSuccess, initialMode }) => {
  const [isLogin, setIsLogin] = useState(initialMode !== 'register');
  const [formData, setFormData] = useState({ username: '', password: '', name: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isLogin
            ? { username: formData.username, password: formData.password }
            : { username: formData.username, password: formData.password, name: formData.name }
        ),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Something went wrong');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (onLoginSuccess) onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const flipVariants = {
    hidden:  { rotateY: 90,  opacity: 0 },
    visible: { rotateY: 0,   opacity: 1 },
    exit:    { rotateY: -90, opacity: 0 },
  };

  return (
    <div className="relative z-10 w-full max-w-md">
      <AnimatePresence mode="wait">
        <motion.div
          key={isLogin ? 'login' : 'register'}
          variants={flipVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="bg-rpg-panel/80 backdrop-blur-md border border-gray-700/50 p-8 rounded-2xl shadow-2xl"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-rpg-accent to-rpg-gold bg-clip-text text-transparent">
              {isLogin ? 'Enter the Guild' : 'Join the Guild'}
            </h2>
            <p className="text-gray-400 mt-2 text-sm">
              {isLogin ? 'Welcome back, adventurer.' : 'Begin your journey. Set up your guild after signing up.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rpg-danger/20 border border-rpg-danger/50 text-rpg-danger rounded text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Display Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text" name="name" value={formData.name} onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 bg-black/30 border border-gray-600 rounded-lg focus:outline-none focus:border-rpg-accent text-white"
                    placeholder="Gandalf the Grey" required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text" name="username" value={formData.username} onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 bg-black/30 border border-gray-600 rounded-lg focus:outline-none focus:border-rpg-accent text-white"
                  placeholder="gandalf_grey" required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="password" name="password" value={formData.password} onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 bg-black/30 border border-gray-600 rounded-lg focus:outline-none focus:border-rpg-accent text-white"
                  placeholder="••••••••" required
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3 px-4 bg-rpg-accent hover:bg-rpg-accent/80 text-white font-bold rounded-lg transition-colors duration-200 mt-2 shadow-lg shadow-rpg-accent/20"
            >
              {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {isLogin ? "Don't have an account? Register" : 'Already have an account? Log in'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AuthCard;
