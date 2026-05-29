import { useState } from 'react';
import SPDashboard from './components/SPDashboard';
import LoginForm from './components/LoginForm';
import Topbar from './components/Topbar';
import HomePage from './pages/HomePage';
import TrackerPage from './pages/TrackerPage';
import AdminPage from './pages/AdminPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function Shell() {
  const [view, setView] = useState('oaq');
  const { user, login, loading } = useAuth();

  if (loading) return null;
  if (!user) return <LoginForm onAuth={(nextUser) => login(nextUser)} />;

  return (
    <>
      <Topbar view={view} onViewChange={setView} />
      {view === 'oaq' && <HomePage />}
      {view === 'tracker' && <TrackerPage />}
      {view === 'sp' && (
        <div style={{ padding: '32px 24px', minHeight: 'calc(100vh - 52px)', background: '#FFF' }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <SPDashboard user={user} />
          </div>
        </div>
      )}
      {view === 'admin' && <AdminPage />}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <Shell />
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
