import React from 'react';
import fixieLogo from '../../../images/image.png';
import { useApp } from '../../../contexts/FixieAppContext';
import { signOutAndRedirect } from '../../../lib/fixie/auth';
import type { View } from '../../../types/fixie';

interface NavItem {
  view: View;
  icon: string;
  label: string;
  badge?: number;
}

export function Sidebar({ onViewChange }: { onViewChange: (v: View) => void }) {
  const { appUser, appOrg, currentView, pendingApprovalCount } = useApp();

  const adminItems: NavItem[] = [
    { view: 'users',     icon: '👥', label: 'Users' },
    { view: 'mcp',       icon: '🔌', label: 'MCP Servers' },
    { view: 'tickets',   icon: '🎫', label: 'Tickets' },
    { view: 'approvals', icon: '✅', label: 'Approvals', badge: pendingApprovalCount },
  ];

  return (
    <aside
      className="w-[260px] shrink-0 flex flex-col bg-white overflow-hidden"
      style={{ borderRight: '1px solid #e8edf3', boxShadow: '2px 0 12px rgba(0,0,0,0.04)' }}
    >
      {/* Logo + Org */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #e8edf3' }}>
        <div className="flex items-center gap-2.5 mb-3">
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
        <div
          className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-neutral-500 px-2.5 py-1 rounded-full"
          style={{ background: '#f8fafc', border: '1px solid #e8edf3' }}
        >
          🏢 {appOrg?.name ?? 'Loading…'}
        </div>
      </div>

      {/* Workspace nav */}
      <div className="px-3 pt-4">
        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-2 mb-2">
          Workspace
        </div>
        <NavBtn
          view="chat"
          icon="💬"
          label="Chat"
          active={currentView === 'chat'}
          onClick={() => onViewChange('chat')}
        />
      </div>

      {/* Admin nav */}
      {appUser?.is_admin && (
        <div className="px-3 mt-3 pt-3" style={{ borderTop: '1px solid #e8edf3' }}>
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
              onClick={() => onViewChange(item.view)}
            />
          ))}
        </div>
      )}

      <div className="flex-1" />

      {/* User footer */}
      <div
        className="px-4 py-3.5 flex items-center gap-2.5"
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
          title="Sign out"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all text-sm"
        >
          ↩
        </button>
      </div>
    </aside>
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
      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 text-left mb-0.5 relative overflow-hidden"
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
      onMouseEnter={e => {
        if (!active) (e.currentTarget as HTMLElement).style.background = '#f8fafc';
      }}
      onMouseLeave={e => {
        if (!active) (e.currentTarget as HTMLElement).style.background = '';
      }}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
          style={{ background: 'linear-gradient(180deg, #1877F2 0%, #0E4F99 100%)' }}
        />
      )}
      <span className="text-base w-5 text-center shrink-0 pl-1">{icon}</span>
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
