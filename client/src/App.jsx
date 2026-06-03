import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import SPDashboard from './components/SPDashboard';
import LoginForm from './components/LoginForm';
import Topbar from './components/Topbar';
import HomePage from './pages/HomePage';
import TrackerPage from './pages/TrackerPage';
import ThreadsPage from './pages/ThreadsPage';
import AdminPage from './pages/AdminPage';
import UserProfileModal from './components/UserProfileModal';
import RAGChatWidget from './components/RAGChatWidget';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider, useToast } from './context/ToastContext';
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

function SessionExpiryHandler() {
  const { addToast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    const handler = () => {
      login(null, null);
      addToast('Session expired — please sign in again', { type: 'error' });
      navigate('/', { replace: true });
    };
    window.addEventListener('oaq:session-expired', handler);
    return () => window.removeEventListener('oaq:session-expired', handler);
  }, [login, addToast, navigate]);

  return null;
}

function KeyboardShortcuts() {
  React.useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
      if (e.key === '/') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('oaq:focus-search'));
      } else if (e.key === 'Escape') {
        window.dispatchEvent(new CustomEvent('oaq:close-modals'));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return null;
}

function Shell() {
  const location = useLocation();
  const { user, login, loading } = useAuth();
  const [profileUserId, setProfileUserId] = React.useState(null);

  React.useEffect(() => {
    const handler = (e) => setProfileUserId(e.detail);
    window.addEventListener('oaq:show-user-profile', handler);
    return () => window.removeEventListener('oaq:show-user-profile', handler);
  }, []);

  React.useEffect(() => {
    const handler = () => { setProfileUserId(null); setShowRaise(false); };
    window.addEventListener('oaq:close-modals', handler);
    return () => window.removeEventListener('oaq:close-modals', handler);
  }, []);

  React.useEffect(() => {
    const path = location.pathname === '/' ? '/' : location.pathname;
    localStorage.setItem('lastRoute', path);
  }, [location.pathname]);

  if (loading) return null;
  if (!user) return <LoginForm onAuth={(nextUser) => login(nextUser)} />;

  return (
    <>
      <SessionExpiryHandler />
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
      {profileUserId && (
        <UserProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
      )}
      <RAGChatWidget />
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
              <KeyboardShortcuts />
              <Shell />
            </BrowserRouter>
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}