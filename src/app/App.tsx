import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AppProvider, useApp } from '../lib/store';
import { NewLandingPage } from './components/NewLandingPage';
import { DashboardLayout } from './components/DashboardLayout';
import { NewDashboardHome } from './components/NewDashboardHome';
import { ProjectDetails } from './components/ProjectDetails';
import { ChatPage } from './pages/ChatPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { ProfilePage } from './pages/ProfilePage';
import { TasksPage } from './pages/TasksPage';
import { BugsPage } from './pages/BugsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DocsPage } from './pages/DocsPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { DeploymentsPage } from './pages/DeploymentsPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { LogsPage } from './pages/LogsPage';
import { ErrorsPage } from './pages/ErrorsPage';
import { AITestingPage } from './pages/AITestingPage';
import { APILabPage } from './pages/APILabPage';
import { TerminalPage } from './pages/TerminalPage';
import { TeamPage } from './pages/TeamPage';
import { SettingsPage } from './pages/SettingsPage';
import { apiMe, hasToken, isDemoMode, DEMO_PROJECTS, DEMO_DEPLOYMENTS, DEMO_ERRORS } from '../lib/api';
import { PlanGate } from './components/PlanGate';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminEnvPage } from './pages/admin/AdminEnvPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  if (!state.isAuthenticated && !hasToken()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const session = localStorage.getItem('opendrap_admin_session');
  if (session !== 'true') return <Navigate to="/admin-prd" replace />;
  return <>{children}</>;
}

function SessionRestorer() {
  const { state, dispatch } = useApp();

  useEffect(() => {
    if (!state.isAuthenticated && hasToken()) {
      apiMe()
        .then(({ user }) => {
          dispatch({ type: 'SET_USER', payload: user });
          if (isDemoMode()) {
            dispatch({ type: 'SET_PROJECTS', payload: DEMO_PROJECTS as any });
            dispatch({ type: 'SET_DEPLOYMENTS', payload: DEMO_DEPLOYMENTS as any });
            dispatch({ type: 'SET_ERRORS', payload: DEMO_ERRORS as any });
          }
        })
        .catch(() => {
          if (!isDemoMode()) localStorage.removeItem('token');
        });
    }
  }, []);

  return null;
}

function AppRoutes() {
  return (
    <>
      <SessionRestorer />
      <Routes>
        <Route path="/" element={<NewLandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<NewDashboardHome />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="project/:id" element={<ProjectDetails />} />
          <Route path="deployments" element={<DeploymentsPage />} />
          <Route path="tasks" element={<PlanGate featureName="Tasks"><TasksPage /></PlanGate>} />
          <Route path="bugs" element={<PlanGate featureName="Bug Tracker"><BugsPage /></PlanGate>} />
          <Route path="chat" element={<PlanGate featureName="Team Chat"><ChatPage /></PlanGate>} />
          <Route path="chat/:chatId" element={<PlanGate featureName="Team Chat"><ChatPage /></PlanGate>} />
          <Route path="team" element={<PlanGate featureName="Team Management"><TeamPage /></PlanGate>} />
          <Route path="ai-testing" element={<PlanGate featureName="AI Testing"><AITestingPage /></PlanGate>} />
          <Route path="api-lab" element={<PlanGate featureName="API Lab"><APILabPage /></PlanGate>} />
          <Route path="terminal" element={<PlanGate featureName="Terminal"><TerminalPage /></PlanGate>} />
          <Route path="monitoring" element={<PlanGate featureName="Monitoring"><MonitoringPage /></PlanGate>} />
          <Route path="logs" element={<PlanGate featureName="Logs"><LogsPage /></PlanGate>} />
          <Route path="errors" element={<PlanGate featureName="Error Tracking"><ErrorsPage /></PlanGate>} />
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="connections" element={<ConnectionsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        {/* Admin panel — login is a leaf route, layout only handles sub-paths */}
        <Route path="/admin-prd" element={<AdminLoginPage />} />
        <Route
          path="/admin-prd"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="env" element={<AdminEnvPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <div className="size-full dark">
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </div>
  );
}
