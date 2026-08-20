import { createContext, useContext, useState } from 'react';

// Relative URLs on Vercel (website), full URL in Capacitor (APK)
const isCapacitor = typeof window !== 'undefined' && window.Capacitor !== undefined;
const API_BASE = isCapacitor ? 'https://nehaskitchen.vercel.app' : '';

// ─────────────────────────────────────────────────────
//  Predefined Users (Demo accounts kept in memory)
// ─────────────────────────────────────────────────────
const USERS = [
  {
    id: 'demo-1',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    displayName: 'Admin',
    avatar: 'AD',
  },
  {
    id: 'demo-2',
    username: 'accounts',
    password: 'acc123',
    role: 'account_manager',
    displayName: 'Accounts',
    avatar: 'AC',
  },
  {
    id: 'demo-3',
    username: 'waiter1',
    password: 'wait123',
    role: 'waiter',
    displayName: 'Waiter 1',
    avatar: 'W1',
  },
  {
    id: 'demo-4',
    username: 'waiter2',
    password: 'wait456',
    role: 'waiter',
    displayName: 'Waiter 2',
    avatar: 'W2',
  },
  {
    id: 'demo-5',
    username: 'table1',
    password: 'cust123',
    role: 'customer',
    displayName: 'Table 1',
    avatar: 'T1',
  },
  {
    id: 'demo-6',
    username: 'table2',
    password: 'cust456',
    role: 'customer',
    displayName: 'Table 2',
    avatar: 'T2',
  },
  {
    id: 'demo-7',
    username: 'store_manager',
    password: 'store123',
    role: 'store_manager',
    displayName: 'Store Manager',
    avatar: 'SM',
  },
];

// ─────────────────────────────────────────────────────
//  Role-based allowed nav paths
// ─────────────────────────────────────────────────────
export const ROLE_NAV = {
  admin: ['/', '/pos', '/orders', '/tables', '/menu', '/grocery', '/history', '/pay-later', '/expenses', '/catering', '/analytics', '/store/pos', '/store/inventory', '/store/suppliers', '/store/history', '/store/analytics'],
  account_manager: ['/', '/pos', '/orders', '/tables', '/menu', '/history', '/pay-later', '/expenses', '/analytics', '/store/pos', '/store/inventory', '/store/suppliers', '/store/history', '/store/analytics'],
  waiter: ['/pos', '/orders', '/tables', '/grocery', '/store/pos'],
  store_manager: ['/store/pos', '/store/inventory', '/store/suppliers', '/store/history', '/store/analytics'],
  customer: ['/customer-menu'],
};

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = 'rc_user';

function saveCurrentUser(user) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.warn("localStorage failed", e);
  }
}

function clearCurrentUser() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (e) {
    console.warn("auth storage clear failed", e);
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const checkUsernameExists = async (uname) => {
    const trimmed = uname.trim().toLowerCase();
    
    // 1. Check predefined in-memory demo accounts
    const existsInPredefined = USERS.some(u => u.username.toLowerCase() === trimmed);
    return existsInPredefined;
  };

  const login = async (username, password) => {
    const trimmedUsername = username.trim().toLowerCase();

    // Check predefined in-memory demo users
    const demoUser = USERS.find(
      u => u.username.toLowerCase() === trimmedUsername && u.password === password
    );

    if (demoUser) {
      const { id, username, role, displayName, avatar } = demoUser;
      const safeUser = { id, username, role, displayName, avatar };
      setCurrentUser(safeUser);
      saveCurrentUser(safeUser);
      return { success: true, user: safeUser };
    }

    return { success: false, error: 'Invalid username or password.' };
  };

  const register = async (username, password, displayName, role, phone, address) => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      return { success: false, error: 'Username and password are required.' };
    }

    // Demo Mode: Local registration is not persisted in memory in this version,
    // so we just return an error since the backend is disconnected.
    return { success: false, error: 'Registration is disabled in local demo mode. Please use predefined accounts.' };

  };

  const logout = () => {
    setCurrentUser(null);
    clearCurrentUser();
  };

  const hasAccess = (path) => {
    if (!currentUser) return false;
    const allowed = ROLE_NAV[currentUser.role] || [];
    return allowed.includes(path);
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      login, 
      register, 
      logout, 
      hasAccess, 
      checkUsernameExists,
      employees: USERS 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
