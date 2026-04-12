import React, { useState, useEffect, useCallback, useRef } from 'react';
import fixieLogo from '../../../images/image.png';
import { useApp } from '../../../contexts/FixieAppContext';
import { signOutAndRedirect } from '../../../lib/fixie/auth';
import { apiGet, apiDelete } from '../../../lib/fixie/api';
import { useToast } from '../../../hooks/useFixieToast';
import { ConvListSkeleton } from '../ui/Skeleton';
import ThemeToggle from '../../layout/ThemeToggle';
import type { View, Conversation } from '../../../types/fixie';

// ── SVG nav icons ──────────────────────────────────────────────────────────────
const NAV_ICONS: Record<string, React.ReactNode> = {
  chat: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  users: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  integrations: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  tickets: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" />
    </svg>
  ),
  approvals: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
};

// ── Date grouping helpers ──────────────────────────────────────────────────────
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function groupConvsByDate(convs: Conversation[]): { label: string; items: Conversation[] }[] {
  const now = new Date();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);

  const groups = [
    { label: 'Today', items: [] as Conversation[] },
    { label: 'Yesterday', items: [] as Conversation[] },
    { label: 'Previous 7 days', items: [] as Conversation[] },
    { label: 'Earlier', items: [] as Conversation[] },
  ];

  for (const c of convs) {
    const d = new Date(c.last_message_at);
    if (isSameDay(d, now)) groups[0].items.push(c);
    else if (isSameDay(d, yesterday)) groups[1].items.push(c);
    else if (d >= weekAgo) groups[2].items.push(c);
    else groups[3].items.push(c);
  }

  return groups.filter(g => g.items.length > 0);
}

interface NavItem { view: View; label: string; badge?: number; }
interface SidebarProps {
  onViewChange: (v: View) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ onViewChange, mobileOpen, onMobileClose }: SidebarProps) {
  const { appUser, appOrg, currentView, currentConvId, setCurrentConvId, pendingApprovalCount } = useApp();
  const { toast } = useToast();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [convsLoading, setConvsLoading] = useState(false);
  const prevConvIdRef = useRef<string | null>(null);

  const adminItems: NavItem[] = [
    { view: 'users', label: 'Users' },
    { view: 'integrations', label: 'Integrations' },
    { view: 'tickets', label: 'Tickets' },
    { view: 'approvals', label: 'Approvals', badge: pendingApprovalCount },
  ];

  const loadConvs = useCallback(async () => {
    setConvsLoading(true);
    try {
      const data = await apiGet<Conversation[]>('/api/conversations');
      setConvs(data);
    } catch { /* silent */ } finally {
      setConvsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentView === 'chat') loadConvs();
  }, [currentView, loadConvs]);

  useEffect(() => {
    if (currentView !== 'chat') return;
    if (prevConvIdRef.current === null && currentConvId !== null) loadConvs();
    prevConvIdRef.current = currentConvId;
  }, [currentConvId, currentView, loadConvs]);

  const handleNav = (v: View) => { onViewChange(v); onMobileClose(); };
  const handleNewChat = () => { setCurrentConvId(null); onMobileClose(); };
  const handleSelectConv = (id: string) => { setCurrentConvId(id); onMobileClose(); };

  const deleteConv = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await apiDelete(`/api/conversations/${id}`);
      if (currentConvId === id) setCurrentConvId(null);
      await loadConvs();
      toast('Conversation deleted');
    } catch {
      toast('Failed to delete conversation', 'error');
    }
  };

  const convGroups = groupConvsByDate(convs);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 z-20 md:hidden transition-opacity duration-200 ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      <aside
        className={[
          'flex flex-col bg-white dark:bg-zinc-900 overflow-hidden border-r border-zinc-200 dark:border-zinc-800',
          'fixed top-0 left-0 h-full w-[260px] z-30',
          'transition-transform duration-200 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:relative md:left-auto md:w-[248px] md:h-auto md:z-auto md:translate-x-0 md:shrink-0',
        ].join(' ')}
        aria-label="Application navigation"
      >

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div
          className="shrink-0 flex items-center justify-between px-4 h-[52px] border-b border-zinc-200 dark:border-zinc-800"
        >
          <div className="flex items-center gap-2.5">
            <img src={fixieLogo} alt="Fixie" className="w-6 h-6 rounded-md object-cover shrink-0" />
            <span className="text-[14px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Fixie</span>
            {appOrg && !appOrg.slug.startsWith('user-') && (
              <span className="text-[10.5px] font-medium text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md truncate max-w-[80px]">
                {appOrg.name}
              </span>
            )}
          </div>
          <button
            onClick={onMobileClose}
            aria-label="Close navigation"
            className="md:hidden w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────────── */}
        {currentView === 'chat' ? (

          /* ── CHAT VIEW: New Chat → conversations → admin pinned bottom ── */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

            {/* New Chat CTA */}
            <div className="px-3 pt-3 pb-2 shrink-0">
              <button
                onClick={handleNewChat}
                className="w-full py-2 px-3 text-[13px] font-semibold rounded-lg flex items-center justify-center gap-2 transition-all btn-brand"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New Chat
              </button>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto px-2 pb-1">
              {convsLoading ? (
                <div className="px-1 pt-1"><ConvListSkeleton /></div>
              ) : convs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <p className="text-[12px] text-zinc-400 dark:text-zinc-500 leading-relaxed">No conversations yet.<br />Start one above.</p>
                </div>
              ) : (
                <div className="fade-in">
                  {convGroups.map(group => (
                    <div key={group.label} className="mb-2">
                      <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-2.5 py-1.5">
                        {group.label}
                      </p>
                      <div className="flex flex-col gap-px">
                        {group.items.map(c => {
                          const active = c.id === currentConvId;
                          return (
                            <div key={c.id} className="group relative">
                              <button
                                onClick={() => handleSelectConv(c.id)}
                                aria-label={`Open conversation: ${c.title}`}
                                aria-current={active ? 'true' : undefined}
                                className={[
                                  'w-full flex items-center px-2.5 py-2 rounded-lg text-left transition-colors',
                                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600 dark:focus-visible:outline-violet-500',
                                  active
                                    ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800',
                                ].join(' ')}
                              >
                                {active && (
                                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-violet-500 dark:bg-violet-400" />
                                )}
                                <div className="flex-1 min-w-0 pr-5">
                                  <div className={`text-[12.5px] truncate ${active ? 'font-semibold' : 'font-normal'}`}>
                                    {c.title}
                                  </div>
                                  {c.status === 'pending_approval' && (
                                    <span className="text-[9.5px] font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-1.5 py-px rounded-full ring-1 ring-amber-200/60 dark:ring-amber-500/30 mt-0.5 inline-block">
                                      Pending approval
                                    </span>
                                  )}
                                </div>
                              </button>
                              <button
                                onClick={e => deleteConv(e, c.id)}
                                aria-label={`Delete conversation: ${c.title}`}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus:opacity-100 w-5 h-5 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
                              >
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Admin nav — pinned above footer when in chat */}
            {appUser?.is_admin && (
              <div className="shrink-0 px-3 pt-2 pb-1 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-[9.5px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1.5 mb-1">Admin</p>
                {adminItems.map(item => (
                  <NavBtn
                    key={item.view}
                    view={item.view}
                    label={item.label}
                    badge={item.badge}
                    active={false}
                    onClick={() => handleNav(item.view)}
                    compact
                  />
                ))}
              </div>
            )}
          </div>

        ) : (

          /* ── OTHER VIEWS: full nav list ── */
          <div className="flex-1 flex flex-col overflow-y-auto">

            {/* Back to chat */}
            <div className="px-3 pt-3 pb-1 shrink-0">
              <button
                onClick={() => handleNav('chat')}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Chat
              </button>
            </div>

            {/* Admin section */}
            {appUser?.is_admin && (
              <div className="px-3 pt-3 shrink-0 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-[9.5px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1.5 mb-1">Admin</p>
                {adminItems.map(item => (
                  <NavBtn
                    key={item.view}
                    view={item.view}
                    label={item.label}
                    badge={item.badge}
                    active={currentView === item.view}
                    onClick={() => handleNav(item.view)}
                  />
                ))}
              </div>
            )}

            <div className="flex-1" />
          </div>
        )}

        {/* ── User footer ────────────────────────────────────────────────────── */}
        <div
          className="shrink-0 px-3 py-3 flex items-center gap-2 border-t border-zinc-200 dark:border-zinc-800"
        >
          <UserAvatar name={appUser?.name ?? '?'} />
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">{appUser?.name}</div>
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500">{appUser?.is_admin ? 'Admin' : 'Member'}</div>
          </div>
          <ThemeToggle className="w-7 h-7 p-1.5" />
          <button
            onClick={signOutAndRedirect}
            aria-label="Sign out"
            title="Sign out"
            className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 dark:text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
}

// ── NavBtn ─────────────────────────────────────────────────────────────────────
function NavBtn({
  view, label, active, onClick, badge, compact,
}: {
  view: View; label: string; active: boolean; onClick: () => void; badge?: number; compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center gap-2 px-2.5 rounded-lg text-[13px] font-medium transition-colors text-left mb-px relative',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600 dark:focus-visible:outline-violet-500',
        compact ? 'py-1.5' : 'py-[7px]',
        active
          ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 font-semibold'
          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800',
      ].join(' ')}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full bg-violet-600 dark:bg-violet-500" />
      )}
      <span className="w-[18px] flex items-center justify-center shrink-0 pl-px opacity-70">
        {NAV_ICONS[view]}
      </span>
      <span className="flex-1">{label}</span>
      {!!badge && badge > 0 && (
        <span className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center bg-red-500 text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

// ── UserAvatar ─────────────────────────────────────────────────────────────────
function UserAvatar({ name }: { name: string }) {
  return (
    <div className="w-7 h-7 rounded-full bg-violet-600 dark:bg-violet-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
