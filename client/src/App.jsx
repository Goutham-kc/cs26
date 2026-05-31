import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import SPDashboard from './components/SPDashboard';
import LoginForm from './components/LoginForm';
import Topbar from './components/Topbar';
import HomePage from './pages/HomePage';
import TrackerPage from './pages/TrackerPage';
import ThreadsPage from './pages/ThreadsPage';
import AdminPage from './pages/AdminPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';

function TopbarWrapper() {
  const location = useLocation();
  const navigate = useNavigate();

  const getViewFromPath = (pathname) => {
    if (pathname === '/') return 'oaq';
    return pathname.slice(1);
  };

  const currentView = getViewFromPath(location.pathname);

  const handleNavigate = (view) => {
    const path = view === 'oaq' ? '/' : `/${view}`;
    localStorage.setItem('lastRoute', path);
    navigate(path);
  };

  return <Topbar view={currentView} onViewChange={handleNavigate} />;
}

function Shell() {
  const location = useLocation();
  const { user, login, loading } = useAuth();

  React.useEffect(() => {
    const path = location.pathname === '/' ? '/' : location.pathname;
    localStorage.setItem('lastRoute', path);
  }, [location.pathname]);

  if (loading) return null;
  if (!user) return <LoginForm onAuth={(nextUser) => login(nextUser)} />;

  return (
    <>
      <TopbarWrapper />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/threads" element={<ThreadsPage />} />
        <Route path="/tracker" element={<TrackerPage />} />
        <Route path="/sp" element={
          <div style={{ padding: '32px 24px', minHeight: 'calc(100vh - 52px)', background: 'var(--color-bg)' }}>
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
              <SPDashboard user={user} />
            </div>
          </div>
        } />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </>
  );
}

function PersistRoute() {
  const navigate = useNavigate();

  React.useEffect(() => {
    const saved = localStorage.getItem('lastRoute');
    if (saved && window.location.pathname === '/') {
      navigate(saved, { replace: true });
    }
  }, [navigate]);

  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <BrowserRouter>
              <PersistRoute />
              <Shell />
            </BrowserRouter>
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
