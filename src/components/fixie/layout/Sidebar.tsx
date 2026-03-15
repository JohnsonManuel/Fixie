import React from 'react';
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
    <aside className="w-[260px] shrink-0 flex flex-col bg-white border-r border-neutral-200 overflow-hidden">
      {/* Logo + Org badge */}
      <div className="px-4 py-4 border-b border-neutral-200">
        <div className="text-lg font-bold text-indigo-500 tracking-tight">⚡ Fixie</div>
        <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-500 bg-neutral-50 border border-neutral-200 px-2 py-1 rounded-full">
          🏢 {appOrg?.name ?? 'Loading…'}
        </div>
      </div>

      {/* Workspace nav */}
      <div className="px-2 pt-3">
        <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest px-2 mb-1">Workspace</div>
        <NavBtn view="chat" icon="💬" label="Chat" active={currentView === 'chat'} onClick={() => onViewChange('chat')} />
      </div>

      {/* Admin nav */}
      {appUser?.is_admin && (
        <div className="px-2 mt-2 border-t border-neutral-200 pt-3">
          <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest px-2 mb-1">Admin</div>
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
      <div className="px-4 py-3 border-t border-neutral-200 flex items-center gap-2.5">
        <Avatar name={appUser?.name ?? '?'} photoUrl={appUser?.photo_url ?? null} />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-neutral-900 truncate">{appUser?.name}</div>
          <div className="text-[11px] text-neutral-400">{appUser?.is_admin ? 'Admin' : 'Member'}</div>
        </div>
        <button
          onClick={signOutAndRedirect}
          title="Sign out"
          className="text-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
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
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] font-medium transition-all duration-100 text-left mb-0.5 ${
        active
          ? 'bg-indigo-50 text-indigo-600 font-semibold'
          : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
      }`}
    >
      <span className="text-base w-5 text-center shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {!!badge && badge > 0 && (
        <span className="min-w-[18px] h-[18px] px-1.5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

function Avatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  if (photoUrl) {
    return <img src={photoUrl} alt={name} className="w-8 h-8 rounded-full object-cover shrink-0" />;
  }
  return (
    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-[13px] font-bold flex items-center justify-center shrink-0">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
