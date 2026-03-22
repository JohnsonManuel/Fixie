import React, { useState, useEffect, useCallback, useRef } from 'react';
import fixieLogo from '../../../images/image.png';
import { useApp } from '../../../contexts/FixieAppContext';
import { signOutAndRedirect } from '../../../lib/fixie/auth';
import { apiGet, apiDelete } from '../../../lib/fixie/api';
import { useToast } from '../../../hooks/useFixieToast';
import { ConvListSkeleton } from '../ui/Skeleton';
import type { View, Conversation } from '../../../types/fixie';

interface NavItem {
  view: View;
  icon: string;
  label: string;
  badge?: number;
}

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
    { view: 'users',     icon: '👥', label: 'Users' },
    { view: 'mcp',       icon: '🔌', label: 'MCP Servers' },
    { view: 'tickets',   icon: '🎫', label: 'Tickets' },
    { view: 'approvals', icon: '✅', label: 'Approvals', badge: pendingApprovalCount },
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

  // Fetch conversations when the mobile sidebar opens in chat view
  useEffect(() => {
    if (mobileOpen && currentView === 'chat') loadConvs();
  }, [mobileOpen, currentView, loadConvs]);

  // Re-fetch when a new conversation is created (null → id)
  useEffect(() => {
    if (currentView !== 'chat') return;
    if (prevConvIdRef.current === null && currentConvId !== null) {
      loadConvs();
    }
    prevConvIdRef.current = currentConvId;
  }, [currentConvId, currentView, loadConvs]);

  const handleNav = (v: View) => {
    onViewChange(v);
    onMobileClose();
  };

  const handleNewChat = () => {
    setCurrentConvId(null);
    onMobileClose();
  };

  const handleSelectConv = (id: string) => {
    setCurrentConvId(id);
    onMobileClose();
  };

  const deleteConv = async (e: React.MouseEvent, id: string, title: string) => {
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
        className={`fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      <aside
        className={[
          'flex flex-col bg-white overflow-hidden',
          // Mobile: fixed left drawer
          'fixed top-0 left-0 h-full w-[280px] z-30',
          'transition-transform duration-300 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: static left sidebar
          'md:relative md:left-auto md:w-[260px] md:h-auto md:z-auto md:translate-x-0 md:shrink-0',
        ].join(' ')}
        style={{ borderRight: '1px solid #e8edf3', boxShadow: '4px 0 24px rgba(0,0,0,0.06)' }}
        aria-label="Application navigation"
      >
        {/* ── Logo header ─────────────────────────────────────────── */}
        <div
          className="shrink-0 flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #e8edf3' }}
        >
          <div className="flex items-center gap-2.5">
            <img
              src={fixieLogo}
              alt="Fixie"
              className="w-8 h-8 rounded-xl object-cover shrink-0"
              style={{ boxShadow: '0 2px 8px rgba(24,119,242,0.2)' }}
            />
            <span
              className="text-[17px] font-bold tracking-tight"
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

          {/* Close button — mobile only */}
          <button
            onClick={onMobileClose}
            aria-label="Close navigation"
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1877F2]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Scrollable middle ────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">

          {/* Org badge */}
          {appOrg && !appOrg.slug.startsWith('user-') && (
            <div className="px-5 py-2.5 shrink-0" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <div
                className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-neutral-500 px-2.5 py-1 rounded-full"
                style={{ background: '#f8fafc', border: '1px solid #e8edf3' }}
              >
                🏢 {appOrg.name}
              </div>
            </div>
          )}

          {/* ── Conversation list — mobile only ──────────────────── */}
          {currentView === 'chat' && (
            <div className="md:hidden flex flex-col shrink-0" style={{ borderBottom: '1px solid #e8edf3' }}>
              {/* New Chat button */}
              <div className="p-3 shrink-0" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <button
                  onClick={handleNewChat}
                  aria-label="Start a new chat"
                  className="w-full py-2 px-3 text-white text-[13px] font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all btn-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1877F2]"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  New Chat
                </button>
              </div>

              {/* Conversation items */}
              <div className="max-h-52 overflow-y-auto py-2 px-2">
                {convsLoading ? (
                  <ConvListSkeleton />
                ) : convs.length === 0 ? (
                  <p className="text-[12.5px] text-neutral-400 px-2 py-3 leading-relaxed">
                    No conversations yet
                  </p>
                ) : (
                  <div className="fade-in flex flex-col">
                    {convs.map(c => {
                      const active = c.id === currentConvId;
                      const date = new Date(c.last_message_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                      return (
                        <div key={c.id} className="group relative mb-0.5">
                          <button
                            onClick={() => handleSelectConv(c.id)}
                            aria-label={`Open conversation: ${c.title}`}
                            aria-current={active ? 'true' : undefined}
                            className="w-full flex items-center px-2.5 py-2 rounded-xl cursor-pointer transition-colors text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1877F2]"
                            style={
                              active
                                ? { background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid rgba(24,119,242,0.12)' }
                                : { border: '1px solid transparent' }
                            }
                            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = ''; }}
                          >
                            <div className="flex-1 min-w-0 pr-6">
                              <div className="text-[13px] truncate" style={{ color: active ? '#1877F2' : '#111827', fontWeight: active ? 600 : 500 }}>
                                {c.title}
                              </div>
                              <div className="text-[11px] text-neutral-400 mt-0.5">{date} · {c.message_count} msg{c.message_count !== 1 ? 's' : ''}</div>
                            </div>
                          </button>
                          <button
                            onClick={e => deleteConv(e, c.id, c.title)}
                            aria-label={`Delete conversation: ${c.title}`}
                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus:opacity-100 w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
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

          {/* ── Workspace nav ────────────────────────────────────── */}
          <div className="px-3 pt-4 shrink-0">
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-2 mb-2">
              Workspace
            </div>
            <NavBtn
              view="chat"
              icon="💬"
              label="Chat"
              active={currentView === 'chat'}
              onClick={() => handleNav('chat')}
            />
          </div>

          {/* ── Admin nav ────────────────────────────────────────── */}
          {appUser?.is_admin && (
            <div className="px-3 mt-3 pt-3 shrink-0" style={{ borderTop: '1px solid #e8edf3' }}>
              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-2 mb-2">
                Admin
              </div>
              {adminItems.map(item => (
                <NavBtn
                  key={item.view}
                  view={item.view}
                  icon={item.icon}
                  label={item.label}
                  badge={item.badge}
                  active={currentView === item.view}
                  onClick={() => handleNav(item.view)}
                />
              ))}
            </div>
          )}

          {/* Spacer — pushes footer to bottom on desktop */}
          <div className="flex-1" />
        </div>

        {/* ── User footer ──────────────────────────────────────────── */}
        <div
          className="shrink-0 px-4 py-3.5 flex items-center gap-2.5"
          style={{ borderTop: '1px solid #e8edf3', background: '#fafbfc' }}
        >
          <Avatar name={appUser?.name ?? '?'} photoUrl={appUser?.photo_url ?? null} />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-neutral-900 truncate">{appUser?.name}</div>
            <div className="text-[11px] text-neutral-400 font-medium">
              {appUser?.is_admin ? 'Admin' : 'Member'}
            </div>
          </div>
          <button
            onClick={signOutAndRedirect}
            aria-label="Sign out"
            title="Sign out"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
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

function NavBtn({
  icon, label, active, onClick, badge,
}: {
  view: View; icon: string; label: string; active: boolean; onClick: () => void; badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 text-left mb-0.5 relative overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1877F2]"
      style={
        active
          ? {
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              color: '#1877F2',
              fontWeight: 600,
              boxShadow: 'inset 0 0 0 1px rgba(24,119,242,0.15)',
            }
          : { color: '#6b7280' }
      }
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = ''; }}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
          style={{ background: 'linear-gradient(180deg, #1877F2 0%, #0E4F99 100%)' }}
        />
      )}
      <span className="text-base w-5 text-center shrink-0 pl-1" aria-hidden="true">{icon}</span>
      <span className="flex-1">{label}</span>
      {!!badge && badge > 0 && (
        <span
          className="min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
          style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function Avatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className="w-8 h-8 rounded-full object-cover shrink-0"
        style={{ boxShadow: '0 0 0 2px rgba(24,119,242,0.15)' }}
      />
    );
  }
  return (
    <div
      className="w-8 h-8 rounded-full text-white text-[13px] font-bold flex items-center justify-center shrink-0"
      style={{ background: 'linear-gradient(135deg, #1877F2 0%, #0E4F99 100%)' }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
