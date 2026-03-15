import { useEffect, useState } from 'react';
import type { User as FbUser } from 'firebase/auth';
import { AppProvider, useApp } from '../../contexts/FixieAppContext';
import { initAuth, signOutAndRedirect } from '../../lib/fixie/auth';
import { setSessionToken, apiGet } from '../../lib/fixie/api';
import { LoadingScreen } from '../../components/fixie/screens/LoadingScreen';
import { NoAccountScreen } from '../../components/fixie/screens/NoAccountScreen';
import { Sidebar } from '../../components/fixie/layout/Sidebar';
import { ChatView } from '../../components/fixie/views/ChatView';
import { UsersView } from '../../components/fixie/views/UsersView';
import { McpView } from '../../components/fixie/views/McpView';
import { TicketsView } from '../../components/fixie/views/TicketsView';
import { ApprovalsView } from '../../components/fixie/views/ApprovalsView';
import type { AppUser, AppOrg, View } from '../../types/fixie';

type ScreenState = 'loading' | 'no-account' | 'app';

export function Dashboard() {
  return (
    <AppProvider>
      <Inner />
    </AppProvider>
  );
}

function Inner() {
  const { appUser, setAppUser, setAppOrg, currentView, setCurrentView, addToast, setPendingApprovalCount } = useApp();
  const [screen, setScreen] = useState<ScreenState>('loading');

  async function loadAppUser() {
    setScreen('loading');
    try {
      const data = await apiGet<{ user: AppUser; org: AppOrg }>('/api/auth/me');
      setAppUser(data.user);
      setAppOrg(data.org);
      setScreen('app');
      if (data.user.is_admin) {
        loadApprovalCount(data.user.is_admin, setPendingApprovalCount);
      }
    } catch (err: unknown) {
      const e = err as { status?: number; detail?: { code?: string } };
      if (e.status === 404) {
        setScreen('no-account');
      } else {
        addToast('Failed to load user data', 'error');
        signOutAndRedirect();
      }
    }
  }

  useEffect(() => {
    const unsub = initAuth(
      (fbUser: FbUser) => {
        // Get the token directly from the user object to avoid any race with auth.currentUser
        fbUser.getIdToken().then(token => {
          setSessionToken(token);
          loadAppUser();
        });
      },
      () => {
        // Just redirect — do NOT call fbSignOut here.
        // Signing out prematurely (e.g. during Firebase's async init) destroys the session
        // and causes an infinite redirect loop.
        window.location.href = '/login';
      },
    );
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!appUser?.is_admin) return;
    return loadApprovalCount(true, setPendingApprovalCount);
  }, [appUser?.is_admin, setPendingApprovalCount]);

  if (screen === 'loading')    return <LoadingScreen />;
  if (screen === 'no-account') return <NoAccountScreen />;

  return (
    <>
      <div className="flex h-screen overflow-hidden" style={{ background: '#f8fafc' }}>
        <Sidebar onViewChange={(v: View) => setCurrentView(v)} />
        <main className="flex-1 overflow-hidden flex flex-col">
          {currentView === 'chat'      && <ChatView />}
          {currentView === 'users'     && <UsersView />}
          {currentView === 'mcp'       && <McpView />}
          {currentView === 'tickets'   && <TicketsView />}
          {currentView === 'approvals' && <ApprovalsView />}
        </main>
      </div>
      <ToastLayer />
    </>
  );
}

function loadApprovalCount(isAdmin: boolean, setter: (n: number) => void) {
  if (!isAdmin) return;
  const fetchCount = async () => {
    try {
      const pending = await apiGet<unknown[]>('/api/approvals/pending');
      setter(pending.length);
    } catch { /* silent */ }
  };
  fetchCount();
  const id = setInterval(fetchCount, 60_000);
  return () => clearInterval(id);
}

function ToastLayer() {
  const { toasts, removeToast } = useApp();
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          onClick={() => removeToast(t.id)}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13.5px] font-medium shadow-lg max-w-sm cursor-pointer ${
            t.type === 'error' ? 'bg-red-500 text-white' : 'bg-[#1a1a2e] text-white'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}