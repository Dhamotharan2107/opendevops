import { createContext, useContext, useReducer, ReactNode, Dispatch } from 'react';
import type {
  User, Project, Connection, Company, Task, Bug, Chat, Message,
  Deployment, LogEntry, ErrorRecord, AITestResult, Notification, APICollection
} from './types';

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  projects: Project[];
  connections: Connection[];
  companies: Company[];
  tasks: Task[];
  bugs: Bug[];
  chats: Chat[];
  messages: Record<string, Message[]>;
  deployments: Deployment[];
  logs: LogEntry[];
  errors: ErrorRecord[];
  aiTestResults: AITestResult[];
  notifications: Notification[];
  apiCollections: APICollection[];
  theme: 'dark' | 'light';
  agentConnected: boolean;
  agentId: string | null;
  agentLastSeen: string | null;
  agentInstalled: boolean;
}

type Action =
  | { type: 'SET_USER'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_THEME'; payload: 'dark' | 'light' }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'REMOVE_PROJECT'; payload: string }
  | { type: 'SET_CONNECTIONS'; payload: Connection[] }
  | { type: 'ADD_CONNECTION'; payload: Connection }
  | { type: 'UPDATE_CONNECTION'; payload: Connection }
  | { type: 'SET_COMPANIES'; payload: Company[] }
  | { type: 'ADD_COMPANY'; payload: Company }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'SET_BUGS'; payload: Bug[] }
  | { type: 'ADD_BUG'; payload: Bug }
  | { type: 'UPDATE_BUG'; payload: Bug }
  | { type: 'SET_CHATS'; payload: Chat[] }
  | { type: 'ADD_CHAT'; payload: Chat }
  | { type: 'SET_MESSAGES'; payload: { chatId: string; messages: Message[] } }
  | { type: 'ADD_MESSAGE'; payload: { chatId: string; message: Message } }
  | { type: 'SET_DEPLOYMENTS'; payload: Deployment[] }
  | { type: 'ADD_DEPLOYMENT'; payload: Deployment }
  | { type: 'SET_LOGS'; payload: LogEntry[] }
  | { type: 'ADD_LOG'; payload: LogEntry }
  | { type: 'SET_ERRORS'; payload: ErrorRecord[] }
  | { type: 'UPDATE_ERROR'; payload: ErrorRecord }
  | { type: 'SET_AI_RESULTS'; payload: AITestResult[] }
  | { type: 'ADD_AI_RESULT'; payload: AITestResult }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'SET_API_COLLECTIONS'; payload: APICollection[] }
  | { type: 'ADD_API_COLLECTION'; payload: APICollection }
  | { type: 'SET_AGENT_STATUS'; payload: { connected: boolean; agentId?: string; lastSeen?: string } }
  | { type: 'SET_AGENT_INSTALLED'; payload: boolean };

const agentInstalledFromStorage = localStorage.getItem('opendrap_agent_installed') === 'true';

const emptyState: Omit<AppState, 'user' | 'isAuthenticated' | 'theme'> = {
  projects: [],
  connections: [],
  companies: [],
  tasks: [],
  bugs: [],
  chats: [],
  messages: {},
  deployments: [],
  logs: [],
  errors: [],
  aiTestResults: [],
  notifications: [],
  apiCollections: [],
  agentConnected: false,
  agentId: localStorage.getItem('opendrap_agent_id'),
  agentLastSeen: null,
  agentInstalled: agentInstalledFromStorage,
};

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  theme: 'dark',
  ...emptyState,
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: true };
    case 'LOGOUT':
      return { ...initialState };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'ADD_PROJECT':
      return { ...state, projects: [action.payload, ...state.projects] };
    case 'UPDATE_PROJECT':
      return { ...state, projects: state.projects.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'REMOVE_PROJECT':
      return { ...state, projects: state.projects.filter(p => p.id !== action.payload) };
    case 'SET_CONNECTIONS':
      return { ...state, connections: action.payload };
    case 'ADD_CONNECTION':
      return { ...state, connections: [action.payload, ...state.connections] };
    case 'UPDATE_CONNECTION':
      return { ...state, connections: state.connections.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'SET_COMPANIES':
      return { ...state, companies: action.payload };
    case 'ADD_COMPANY':
      return { ...state, companies: [action.payload, ...state.companies] };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'ADD_TASK':
      return { ...state, tasks: [action.payload, ...state.tasks] };
    case 'UPDATE_TASK':
      return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'SET_BUGS':
      return { ...state, bugs: action.payload };
    case 'ADD_BUG':
      return { ...state, bugs: [action.payload, ...state.bugs] };
    case 'UPDATE_BUG':
      return { ...state, bugs: state.bugs.map(b => b.id === action.payload.id ? action.payload : b) };
    case 'SET_CHATS':
      return { ...state, chats: action.payload };
    case 'ADD_CHAT':
      return { ...state, chats: [action.payload, ...state.chats] };
    case 'SET_MESSAGES':
      return { ...state, messages: { ...state.messages, [action.payload.chatId]: action.payload.messages } };
    case 'ADD_MESSAGE':
      return { ...state, messages: { ...state.messages, [action.payload.chatId]: [...(state.messages[action.payload.chatId] || []), action.payload.message] } };
    case 'SET_DEPLOYMENTS':
      return { ...state, deployments: action.payload };
    case 'ADD_DEPLOYMENT':
      return { ...state, deployments: [action.payload, ...state.deployments] };
    case 'SET_LOGS':
      return { ...state, logs: action.payload };
    case 'ADD_LOG':
      return { ...state, logs: [...state.logs, action.payload] };
    case 'SET_ERRORS':
      return { ...state, errors: action.payload };
    case 'UPDATE_ERROR':
      return { ...state, errors: state.errors.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'SET_AI_RESULTS':
      return { ...state, aiTestResults: action.payload };
    case 'ADD_AI_RESULT':
      return { ...state, aiTestResults: [action.payload, ...state.aiTestResults] };
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] };
    case 'MARK_NOTIFICATION_READ':
      return { ...state, notifications: state.notifications.map(n => n.id === action.payload ? { ...n, read: true } : n) };
    case 'SET_API_COLLECTIONS':
      return { ...state, apiCollections: action.payload };
    case 'ADD_API_COLLECTION':
      return { ...state, apiCollections: [action.payload, ...state.apiCollections] };
    case 'SET_AGENT_STATUS':
      return {
        ...state,
        agentConnected: action.payload.connected,
        agentId: action.payload.agentId ?? state.agentId,
        agentLastSeen: action.payload.lastSeen ?? state.agentLastSeen,
      };
    case 'SET_AGENT_INSTALLED':
      localStorage.setItem('opendrap_agent_installed', String(action.payload));
      return { ...state, agentInstalled: action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: Dispatch<Action>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

export function useUser() {
  const { state } = useApp();
  return state.user;
}

export function useProjects() {
  const { state } = useApp();
  return state.projects;
}

export function useProject(id: string) {
  const { state } = useApp();
  return state.projects.find(p => p.id === id);
}
