import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, createContext, useContext } from 'react';
import { useAuth } from './hooks/useAuth';
import socket from './socket/socket';
import { ToastContainer } from './components/shared/Toast';
import { ConfirmModal } from './components/shared/ConfirmModal';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Workspace } from './pages/Workspace';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import AnalyticsPage from './pages/AnalyticsPage';
import WorkHistoryPage from './pages/WorkHistoryPage';
import { LoadingSpinner } from './components/shared/LoadingStates';
import CinematicLoader from './components/shared/CinematicLoader';
import { useWorkspaceStore } from './store/workspaceStore';
import { useUIStore } from './store/uiStore';
import { CINEMATIC } from './constants/cinematicAtmosphere';

// Global store exposure for Phaser scene bridge
if (typeof window !== 'undefined') {
  window.workspaceStore = useWorkspaceStore;
  window.uiStore = useUIStore;
}

const SocketContext = createContext(null);

export const useSocketReady = () => useContext(SocketContext);

const ProtectedRoute = ({ children }) => {
  const { isInitialized, user, token: storeToken } = useAuth();
  const localStorageToken = localStorage.getItem('token');

  // If not initialized, we show a cinematic loader to prevent premature redirects
  if (!isInitialized) {
    console.log('🔐 ProtectedRoute: AUTH INITIALIZING');
    return <CinematicLoader text="Initializing Workspace..." />;
  }

  // If initialized but no user AND no token in either store or localStorage, redirect
  // We check both store and localStorage to be safe during the transition
  if (!user && !storeToken && !localStorageToken) {
    console.log("🚪 ProtectedRoute: NO AUTH - REDIRECTING TO LOGIN");
    return <Navigate to="/login" replace />;
  }

  console.log('🔓 ProtectedRoute: AUTH OK - RENDERING CHILDREN');
  return children;
};

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { isInitialized, user } = useAuth();

  if (!isInitialized) {
    return <CinematicLoader text="Verifying Permissions..." />;
  }

  const role = user?.role || localStorage.getItem('role');

  if (!user || !allowedRoles.includes(role)) {
    console.log("🚫 RoleProtectedRoute: ACCESS DENIED - REDIRECTING");
    return <Navigate to="/workspace" replace />;
  }

  return children;
};

// AppContent component that handles routing
const AppContent = () => {
  console.log('🌐 App: ROUTER MOUNTED - ROUTING ACTIVE');
  
  // Always render app - loader handled inside workspace route only
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/workspace"
          element={
            <ProtectedRoute>
              <Workspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/work-history"
          element={
            <ProtectedRoute>
              <WorkHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>

      {/* Global UI Components */}
      <ToastContainer />
      <ConfirmModal />
    </Router>
  );
};

function App() {
  const [socketReady, setSocketReady] = useState(false);

  useEffect(() => {
    const onConnect = () => {
      console.log('✅ Socket connected');
      setSocketReady(true);
    };

    const onDisconnect = () => {
      console.log('❌ Socket disconnected');
      setSocketReady(false);
    };

    const onUsersUpdate = (users) => {
      useWorkspaceStore.getState().setUsers(users);
    };

    if (socket && socket.connected) {
      onConnect();
    }

    if (socket) {
      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('users:update', onUsersUpdate);
    }

    return () => {
      if (socket) {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('users:update', onUsersUpdate);
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={socketReady}>
      <AppContent />
    </SocketContext.Provider>
  );
}

export default App;
