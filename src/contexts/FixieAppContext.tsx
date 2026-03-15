import React, { createContext, useContext, useState, useCallback } from 'react';
import type { AppUser, AppOrg, View, Toast } from '../types/fixie';

interface AppContextValue {
  appUser: AppUser | null;
  appOrg:  AppOrg  | null;
  setAppUser: (u: AppUser) => void;
  setAppOrg:  (o: AppOrg)  => void;

  currentView: View;
  setCurrentView: (v: View) => void;

  currentConvId: string | null;
  setCurrentConvId: (id: string | null) => void;

  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;

  pendingApprovalCount: number;
  setPendingApprovalCount: (n: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [appOrg,  setAppOrg]  = useState<AppOrg  | null>(null);
  const [currentView, setCurrentView] = useState<View>('chat');
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);

  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{
      appUser, setAppUser,
      appOrg,  setAppOrg,
      currentView, setCurrentView,
      currentConvId, setCurrentConvId,
      toasts, addToast, removeToast,
      pendingApprovalCount, setPendingApprovalCount,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
