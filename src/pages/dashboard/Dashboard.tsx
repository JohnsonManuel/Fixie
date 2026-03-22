import { useEffect, useState } from 'react';
import type { User as FbUser } from 'firebase/auth';
import fixieLogo from '../../images/image.png';
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
  const [navOpen, setNavOpen] = useState(false);

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
        fbUser.getIdToken().then(token => {
          setSessionToken(token);
          loadAppUser();
        });
      },
      () => {
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
      <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
        <Sidebar
          onViewChange={(v: View) => setCurrentView(v)}
          mobileOpen={navOpen}
          onMobileClose={() => setNavOpen(false)}
        />
        <main className="flex-1 overflow-hidden flex flex-col min-w-0">
          {/* Mobile top bar — shown for every view except chat (chat has its own header) */}
          {currentView !== 'chat' && (
            <MobileTopBar
              appUser={appUser}
              onOpenNav={() => setNavOpen(true)}
            />
          )}

          {currentView === 'chat'      && <ChatView onOpenNav={() => setNavOpen(true)} />}
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

/** Mobile-only top bar shown above non-chat views so users can always open the nav sidebar. */
function MobileTopBar({ appUser, onOpenNav }: { appUser: AppUser | null; onOpenNav: () => void }) {
  return (
    <div
      className="md:hidden flex items-center px-4 shrink-0 bg-white"
      style={{ minHeight: 56, borderBottom: '1px solid #e8edf3' }}
    >
      {/* Fixie brand */}
      <div className="flex items-center gap-2.5 flex-1">
        <img
          src={fixieLogo}
          alt="Fixie"
          className="w-7 h-7 rounded-xl object-cover"
          style={{ boxShadow: '0 2px 10px rgba(24,119,242,0.22)' }}
        />
        <span
          className="text-[18px] font-bold tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #1877F2 0%, #0E4F99 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Fixie
        </span>
      </div>

      {/* User avatar — tapping opens nav sidebar */}
      <button
        onClick={onOpenNav}
        aria-label="Open navigation menu"
        className="w-9 h-9 flex items-center justify-center rounded-xl shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1877F2]"
      >
        {appUser?.photo_url ? (
          <img
            src={appUser.photo_url}
            alt={appUser.name}
            className="w-8 h-8 rounded-full object-cover"
            style={{ boxShadow: '0 0 0 2px rgba(24,119,242,0.2)' }}
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #1877F2 0%, #0E4F99 100%)' }}
          >
            {(appUser?.name ?? 'U').charAt(0).toUpperCase()}
          </div>
        )}
      </button>
    </div>
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
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map(t => (
        <div
          key={t.id}
          role={t.type === 'error' ? 'alert' : 'status'}
          onClick={() => removeToast(t.id)}
          className={`toast-enter pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13.5px] font-medium shadow-lg max-w-sm cursor-pointer select-none ${
            t.type === 'error' ? 'bg-red-500 text-white' : 'bg-neutral-900 text-white'
          }`}
        >
          <span className="shrink-0 text-[15px]" aria-hidden="true">
            {t.type === 'error' ? '✕' : '✓'}
          </span>
          <span className="flex-1">{t.message}</span>
          <span className="shrink-0 ml-1 opacity-50 text-[12px] font-normal" aria-hidden="true">✕</span>
        </div>
      ))}
    </div>
  );
}
