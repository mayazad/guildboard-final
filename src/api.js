// Central API base URL
// In production on Vercel: same origin, so base is ''
// In local dev: point to the old Express backend, or use 'vercel dev'
const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Authenticated fetch wrapper.
 * Usage: apiFetch('/api/tasks') — returns Response
 */
export const apiFetch = (path, options = {}) => {
  const token = localStorage.getItem('token');
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
};

export default API_URL;
