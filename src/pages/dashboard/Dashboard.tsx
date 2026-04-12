import { useEffect, useState } from 'react';
import type { User as FbUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import fixieLogo from '../../images/image.png';
import { AppProvider, useApp } from '../../contexts/FixieAppContext';
import { initAuth, signOutAndRedirect } from '../../lib/fixie/auth';
import { setSessionToken, apiGet } from '../../lib/fixie/api';
import { LoadingScreen } from '../../components/fixie/screens/LoadingScreen';
import { NoAccountScreen } from '../../components/fixie/screens/NoAccountScreen';
import { Sidebar } from '../../components/fixie/layout/Sidebar';
import { ChatView } from '../../components/fixie/views/ChatView';
import { UsersView } from '../../components/fixie/views/UsersView';
import { IntegrationsView } from '../../components/fixie/views/McpView';
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

  async function loadAppUser(fbUser: FbUser) {
    setScreen('loading');
    try {
      const db = getFirestore();

      // Get user data from Firestore
      const userRef = doc(db, "users", fbUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setScreen('no-account');
        return;
      }

      const userData = userSnap.data();
      const email = fbUser.email || '';
      const domain = email.split('@')[1]?.toLowerCase();

      // Get org data
      let orgData: AppOrg | null = null;

      if (domain) {
        const orgQuery = query(
          collection(db, "organizations"),
          where("domain", "==", domain)
        );
        const orgSnap = await getDocs(orgQuery);

        if (!orgSnap.empty) {
          const orgDoc = orgSnap.docs[0];
          const org = orgDoc.data();

          orgData = {
            id: orgDoc.id,
            name: org.organizationKey || domain.split('.')[0],
            slug: org.organizationKey || domain.split('.')[0],
            integrations: [],
          };
        }
      }

      // If no org found, create a default personal org
      if (!orgData) {
        orgData = {
          id: fbUser.uid,
          name: userData.name || email.split('@')[0],
          slug: `user-${fbUser.uid.slice(0, 8)}`,
          integrations: [],
        };
      }

      // Set app user
      const appUserData: AppUser = {
        id: fbUser.uid,
        email: email,
        name: userData.name || fbUser.displayName || email.split('@')[0],
        is_admin: userData.role === 'admin',
        photo_url: fbUser.photoURL || null,
      };

      setAppUser(appUserData);
      setAppOrg(orgData);
      setScreen('app');

      if (appUserData.is_admin) {
        // Try to load approval count from API, but don't fail if it doesn't work
        loadApprovalCount(true, setPendingApprovalCount);
      }
    } catch (err: unknown) {
      console.error('Error loading user data:', err);
      addToast('Failed to load user data', 'error');
      signOutAndRedirect();
    }
  }

  useEffect(() => {
    const unsub = initAuth(
      (fbUser: FbUser) => {
        fbUser.getIdToken().then(token => {
          setSessionToken(token);
          loadAppUser(fbUser);
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

  if (screen === 'loading') return <LoadingScreen />;
  if (screen === 'no-account') return <NoAccountScreen />;

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
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

          {currentView === 'chat' && <ChatView onOpenNav={() => setNavOpen(true)} />}
          {currentView === 'users' && <UsersView />}
          {currentView === 'integrations' && <IntegrationsView />}
          {currentView === 'tickets' && <TicketsView />}
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
      className="md:hidden flex items-center px-4 shrink-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800"
      style={{ minHeight: 52 }}
    >
      <div className="flex items-center gap-2 flex-1">
        <img src={fixieLogo} alt="Fixie" className="w-6 h-6 rounded-md object-cover" />
        <span className="text-[14px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Fixie</span>
      </div>
      <button
        onClick={onOpenNav}
        aria-label="Open navigation menu"
        className="w-8 h-8 flex items-center justify-center rounded-md shrink-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600 dark:focus-visible:outline-violet-500"
      >
        <div className="w-7 h-7 rounded-full bg-violet-600 dark:bg-violet-500 text-white text-[11px] font-bold flex items-center justify-center">
          {(appUser?.name ?? 'U').charAt(0).toUpperCase()}
        </div>
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
          className={`toast-enter pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13.5px] font-medium shadow-lg max-w-sm cursor-pointer select-none ${t.type === 'error' ? 'bg-red-500 text-white' : 'bg-violet-700 dark:bg-violet-600 text-white'
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
