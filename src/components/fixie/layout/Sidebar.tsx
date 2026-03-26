import React, { useState, useEffect, useCallback, useRef } from 'react';
import fixieLogo from '../../../images/image.png';
import { useApp } from '../../../contexts/FixieAppContext';
import { signOutAndRedirect } from '../../../lib/fixie/auth';
import { apiGet, apiDelete } from '../../../lib/fixie/api';
import { useToast } from '../../../hooks/useFixieToast';
import { ConvListSkeleton } from '../ui/Skeleton';
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
  mcp: (
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
    { view: 'users',     label: 'Users' },
    { view: 'mcp',       label: 'Integrations' },
    { view: 'tickets',   label: 'Tickets' },
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
    if (mobileOpen && currentView === 'chat') loadConvs();
  }, [mobileOpen, currentView, loadConvs]);

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

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 z-20 md:hidden transition-opacity duration-200 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      <aside
        className={[
          'flex flex-col bg-white overflow-hidden',
          'fixed top-0 left-0 h-full w-[256px] z-30',
          'transition-transform duration-200 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:relative md:left-auto md:w-[220px] md:h-auto md:z-auto md:translate-x-0 md:shrink-0',
        ].join(' ')}
        style={{ borderRight: '1px solid #e4e4e7' }}
        aria-label="Application navigation"
      >
        {/* ── Logo ──────────────────────────────────────────────────────────── */}
        <div
          className="shrink-0 flex items-center justify-between px-4 h-[52px]"
          style={{ borderBottom: '1px solid #e4e4e7' }}
        >
          <div className="flex items-center gap-2">
            <img src={fixieLogo} alt="Fixie" className="w-6 h-6 rounded-md object-cover shrink-0" />
            <span className="text-[14px] font-bold text-zinc-900 tracking-tight">Fixie</span>
          </div>
          <button
            onClick={onMobileClose}
            aria-label="Close navigation"
            className="md:hidden w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Scrollable body ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">

          {/* Org badge */}
          {appOrg && !appOrg.slug.startsWith('user-') && (
            <div className="px-3 pt-3 pb-1 shrink-0">
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 px-2 py-1 rounded-md"
                style={{ background: '#f4f4f5' }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                {appOrg.name}
              </span>
            </div>
          )}

          {/* Mobile: conversation list (chat view only) */}
          {currentView === 'chat' && (
            <div className="md:hidden flex flex-col shrink-0" style={{ borderBottom: '1px solid #e4e4e7' }}>
              <div className="px-3 pt-3 pb-2">
                <button
                  onClick={handleNewChat}
                  className="w-full py-1.5 px-3 text-[12.5px] font-semibold rounded-md flex items-center justify-center gap-1.5 btn-brand"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  New Chat
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto pb-2 px-2">
                {convsLoading ? (
                  <ConvListSkeleton />
                ) : convs.length === 0 ? (
                  <p className="text-[11.5px] text-zinc-400 px-2 py-2">No conversations yet</p>
                ) : (
                  <div className="fade-in flex flex-col gap-px">
                    {convs.map(c => {
                      const active = c.id === currentConvId;
                      return (
                        <div key={c.id} className="group relative">
                          <button
                            onClick={() => handleSelectConv(c.id)}
                            aria-label={`Open conversation: ${c.title}`}
                            aria-current={active ? 'true' : undefined}
                            className="w-full flex items-center px-2.5 py-1.5 rounded-md text-left transition-colors"
                            style={active ? { background: '#f4f4f5' } : {}}
                            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#fafafa'; }}
                            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = ''; }}
                          >
                            <div className="flex-1 min-w-0 pr-5">
                              <div className="text-[12px] truncate text-zinc-800 font-medium">{c.title}</div>
                              <div className="text-[10.5px] text-zinc-400 mt-0.5">{c.message_count} msg{c.message_count !== 1 ? 's' : ''}</div>
                            </div>
                          </button>
                          <button
                            onClick={e => deleteConv(e, c.id)}
                            aria-label={`Delete conversation: ${c.title}`}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                          >
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Workspace section */}
          <div className="px-3 pt-4 pb-1 shrink-0">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest px-1.5 mb-1">Workspace</p>
            <NavBtn view="chat" label="Chat" active={currentView === 'chat'} onClick={() => handleNav('chat')} />
          </div>

          {/* Admin section */}
          {appUser?.is_admin && (
            <div className="px-3 pt-3 mt-1 shrink-0" style={{ borderTop: '1px solid #f4f4f5' }}>
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest px-1.5 mb-1">Admin</p>
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

        {/* ── User footer ────────────────────────────────────────────────────── */}
        <div
          className="shrink-0 px-3 py-3 flex items-center gap-2.5"
          style={{ borderTop: '1px solid #e4e4e7' }}
        >
          <UserAvatar name={appUser?.name ?? '?'} photoUrl={appUser?.photo_url ?? null} />
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-semibold text-zinc-900 truncate">{appUser?.name}</div>
            <div className="text-[11px] text-zinc-400">{appUser?.is_admin ? 'Admin' : 'Member'}</div>
          </div>
          <button
            onClick={signOutAndRedirect}
            aria-label="Sign out"
            title="Sign out"
            className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
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
  view, label, active, onClick, badge,
}: {
  view: View; label: string; active: boolean; onClick: () => void; badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-2.5 py-[7px] rounded-md text-[13px] font-medium transition-colors text-left mb-px relative focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600"
      style={active ? { background: '#f5f3ff', color: '#5b21b6', fontWeight: 600 } : { color: '#71717a' }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#fafafa'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = ''; }}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full bg-violet-600" />
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
function UserAvatar({ name }: { name: string; photoUrl?: string | null }) {
  return (
    <div className="w-7 h-7 rounded-full bg-violet-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
