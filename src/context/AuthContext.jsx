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
    
    // 1. Check predefined in-memory demo accounts first
    const existsInPredefined = USERS.some(u => u.username.toLowerCase() === trimmed);
    if (existsInPredefined) return true;

    // 2. Check Supabase database
    try {
      const res = await fetch(`${API_BASE}/api/users/check?username=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        return !!data.exists;
      }
    } catch (e) {
      console.error("Failed to check username availability from Supabase", e);
    }
    return false;
  };

  const login = async (username, password) => {
    const trimmedUsername = username.trim().toLowerCase();

    // 1. Check Supabase database first for custom registered users
    try {
      const res = await fetch(`${API_BASE}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUsername, password })
      });

      if (res.ok) {
        const safeUser = await res.json();
        setCurrentUser(safeUser);
        saveCurrentUser(safeUser);
        return { success: true, user: safeUser };
      }
    } catch (e) {
      console.error("Supabase login request failed, trying predefined demo...", e);
    }

    // 2. Fallback: check predefined in-memory demo users
    const demoUser = USERS.find(
      u => u.username.toLowerCase() === trimmedUsername && u.password === password
    );

    if (demoUser) {
      const { password: _pw, ...safeUser } = demoUser;
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

    // 1. Register in Supabase database
    try {
      const res = await fetch(`${API_BASE}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trimmedUsername,
          password,
          displayName: displayName.trim() || trimmedUsername,
          role: role || 'waiter',
          phone: phone || '',
          address: address || ''
        })
      });

      if (res.ok) {
        const safeUser = await res.json();
        setCurrentUser(safeUser);
        saveCurrentUser(safeUser);
        return { success: true, user: safeUser };
      } else {
        const errBody = await res.json().catch(() => ({}));
        return { success: false, error: errBody.error || `HTTP ${res.status}: Registration failed.` };
      }
    } catch (e) {
      console.error("Supabase registration failed", e);
      return { success: false, error: 'Failed to reach registration server. Please try again.' };
    }
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
