import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AppProvider, useApp } from '../lib/store';
import { apiMe, apiGetProjects, hasToken, isDemoMode, DEMO_PROJECTS, DEMO_DEPLOYMENTS, DEMO_ERRORS } from '../lib/api';
import { PlanGate } from './components/PlanGate';

// Lazy-load every route so each screen ships in its own chunk instead of one giant
// bundle. Components are named exports, so map them onto `default`.
const named = (loader: () => Promise<any>, name: string) =>
  lazy(async () => ({ default: (await loader())[name] }));

const NewLandingPage = named(() => import('./components/NewLandingPage'), 'NewLandingPage');
const DashboardLayout = named(() => import('./components/DashboardLayout'), 'DashboardLayout');
const NewDashboardHome = named(() => import('./components/NewDashboardHome'), 'NewDashboardHome');
const ProjectDetails = named(() => import('./components/ProjectDetails'), 'ProjectDetails');
const ChatPage = named(() => import('./pages/ChatPage'), 'ChatPage');
const CompaniesPage = named(() => import('./pages/CompaniesPage'), 'CompaniesPage');
const ConnectionsPage = named(() => import('./pages/ConnectionsPage'), 'ConnectionsPage');
const ProfilePage = named(() => import('./pages/ProfilePage'), 'ProfilePage');
const TasksPage = named(() => import('./pages/TasksPage'), 'TasksPage');
const BugsPage = named(() => import('./pages/BugsPage'), 'BugsPage');
const LoginPage = named(() => import('./pages/LoginPage'), 'LoginPage');
const RegisterPage = named(() => import('./pages/RegisterPage'), 'RegisterPage');
const DocsPage = named(() => import('./pages/DocsPage'), 'DocsPage');
const AuthCallbackPage = named(() => import('./pages/AuthCallbackPage'), 'AuthCallbackPage');
const SigninCallbackPage = named(() => import('./pages/SigninCallbackPage'), 'SigninCallbackPage');
const ProjectsPage = named(() => import('./pages/ProjectsPage'), 'ProjectsPage');
const DeploymentsPage = named(() => import('./pages/DeploymentsPage'), 'DeploymentsPage');
const MonitoringPage = named(() => import('./pages/MonitoringPage'), 'MonitoringPage');
const LogsPage = named(() => import('./pages/LogsPage'), 'LogsPage');
const ErrorsPage = named(() => import('./pages/ErrorsPage'), 'ErrorsPage');
const AITestingPage = named(() => import('./pages/AITestingPage'), 'AITestingPage');
const APILabPage = named(() => import('./pages/APILabPage'), 'APILabPage');
const TerminalPage = named(() => import('./pages/TerminalPage'), 'TerminalPage');
const TeamPage = named(() => import('./pages/TeamPage'), 'TeamPage');
const SettingsPage = named(() => import('./pages/SettingsPage'), 'SettingsPage');
const AdminLoginPage = named(() => import('./pages/admin/AdminLoginPage'), 'AdminLoginPage');
const AdminLayout = named(() => import('./pages/admin/AdminLayout'), 'AdminLayout');
const AdminDashboardPage = named(() => import('./pages/admin/AdminDashboardPage'), 'AdminDashboardPage');
const AdminUsersPage = named(() => import('./pages/admin/AdminUsersPage'), 'AdminUsersPage');
const AdminEnvPage = named(() => import('./pages/admin/AdminEnvPage'), 'AdminEnvPage');

function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0A0A0F]">
      <div className="w-8 h-8 rounded-full border-2 border-white/15 border-t-fuchsia-500 animate-spin" />
    </div>
  );
}

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

  // Restore user session from stored token
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

  // Pre-load projects the moment auth is confirmed so any direct URL works
  useEffect(() => {
    if (!state.isAuthenticated || isDemoMode() || state.projects.length > 0) return;
    apiGetProjects()
      .then(({ projects }) => dispatch({ type: 'SET_PROJECTS', payload: projects }))
      .catch(() => {});
  }, [state.isAuthenticated]);

  return null;
}

function AppRoutes() {
  return (
    <>
      <SessionRestorer />
      <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<NewLandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/signin/callback/auth" element={<SigninCallbackPage />} />
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
      </Suspense>
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
