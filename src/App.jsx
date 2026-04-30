import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage        from './pages/LandingPage';
import GuildSetupPage     from './pages/GuildSetupPage';
import DashboardLayout    from './components/DashboardLayout';
import Dashboard          from './pages/Dashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import ProfilePage        from './pages/ProfilePage';
import QuestLogPage       from './pages/QuestLogPage';
import NotebookPage       from './components/NotebookPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/"            element={<LandingPage />} />
        <Route path="/guild-setup" element={<GuildSetupPage />} />

        {/* Protected — wrapped in DashboardLayout (handles auth + guild guard) */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard"  element={<Dashboard />} />
          <Route path="/analytics"  element={<AnalyticsDashboard />} />
          <Route path="/profile"    element={<ProfilePage />} />
          <Route path="/quest-log"  element={<QuestLogPage />} />
          <Route path="/notebook"   element={<NotebookPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
