import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../../contexts/FixieAppContext';
import { useToast } from '../../../hooks/useFixieToast';
import { apiGet, apiPatch, apiDelete } from '../../../lib/fixie/api';
import { Button } from '../ui/Button';
import { InviteModal } from '../modals/InviteModal';
import type { OrgUser } from '../../../types/fixie';

// Pastel avatar colors derived from name — makes the team feel personal
const AVATAR_PALETTE = [
  { bg: '#dbeafe', text: '#1d4ed8' },
  { bg: '#dcfce7', text: '#15803d' },
  { bg: '#fae8ff', text: '#7e22ce' },
  { bg: '#ffedd5', text: '#c2410c' },
  { bg: '#fce7f3', text: '#be185d' },
  { bg: '#e0f2fe', text: '#0369a1' },
  { bg: '#fef3c7', text: '#92400e' },
  { bg: '#f0fdf4', text: '#166534' },
];

function avatarColor(name: string) {
  const code = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  return AVATAR_PALETTE[code % AVATAR_PALETTE.length];
}

function UserCardSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 flex flex-col gap-3 border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-start gap-3">
        <div className="skeleton w-11 h-11 rounded-full shrink-0" />
        <div className="flex-1 flex flex-col gap-2 pt-1">
          <div className="skeleton h-3.5 w-32 rounded" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
      </div>
      <div className="skeleton h-3 w-40 rounded" />
      <div className="skeleton h-8 w-full rounded-lg" />
    </div>
  );
}

export function UsersView() {
  const { appUser } = useApp();
  const { toast } = useToast();
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<OrgUser[]>('/api/admin/users');
      setUsers(data);
    } catch {
      toast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const toggleRole = async (id: string, currentlyAdmin: boolean) => {
    if (!window.confirm(`${currentlyAdmin ? 'Demote to member' : 'Promote to admin'}?`)) return;
    try {
      await apiPatch(`/api/admin/users/${id}`, { is_admin: !currentlyAdmin });
      toast('Role updated');
      load();
    } catch { toast('Failed to update role', 'error'); }
  };

  const removeUser = async (id: string, name: string) => {
    if (!window.confirm(`Remove ${name} from your organisation?`)) return;
    try {
      await apiDelete(`/api/admin/users/${id}`);
      toast(`${name} removed`);
      load();
    } catch { toast('Failed to remove user', 'error'); }
  };

  const isMe = (id: string) => id === appUser?.id;

  const q = search.toLowerCase().trim();
  const filteredUsers = q
    ? users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.email_domain ?? '').toLowerCase().includes(q)
    )
    : users;

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="px-6 md:px-8 py-5 shrink-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[17px] font-bold text-zinc-900 dark:text-zinc-100">Team</h1>
            <p className="text-[13px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              {loading ? 'Loading…' : `${users.length} member${users.length !== 1 ? 's' : ''} in your organisation`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search members…"
                aria-label="Search team members"
                className="pl-8 pr-3 py-1.5 text-[12.5px] rounded-lg outline-none w-44 transition-all border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-400 dark:focus:border-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:shadow-sm"
              />
            </div>
            <Button onClick={() => setInviteOpen(true)}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add member
            </Button>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-zinc-50 dark:bg-zinc-950">

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(n => <UserCardSkeleton key={n} />)}
          </div>
        ) : users.length === 0 ? (
          /* ── Empty state ───────────────────────────────────────────────────── */
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center fade-in">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
              aria-hidden="true"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="text-[15px] font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Your team is empty</h3>
            <p className="text-[13px] text-zinc-400 dark:text-zinc-500 max-w-xs leading-relaxed mb-6">
              Add team members so they can use Fixie with your organisation's integrations.
            </p>
            <Button onClick={() => setInviteOpen(true)}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add first member
            </Button>
          </div>
        ) : (
          /* ── User cards ──────────────────────────────────────────────────── */
          filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center fade-in">
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <p className="text-[13.5px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">No results for "{search}"</p>
              <p className="text-[12px] text-zinc-400 dark:text-zinc-500">Try a different name, email, or domain.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 fade-in">
              {filteredUsers.map(u => {
                const colors = avatarColor(u.name);
                const me = isMe(u.id);
                return (
                  <div
                    key={u.id}
                    className="bg-white rounded-xl flex flex-col transition-shadow"
                    style={{
                      border: '1px solid #e4e4e7',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)')}
                  >
                    {/* Card top */}
                    <div className="p-4 flex flex-col gap-3 flex-1">
                      {/* Avatar row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          {u.photo_url ? (
                            <img src={u.photo_url} alt={u.name} className="w-11 h-11 rounded-full object-cover shrink-0" />
                          ) : (
                            <div
                              className="w-11 h-11 rounded-full flex items-center justify-center text-[16px] font-bold shrink-0"
                              style={{ background: colors.bg, color: colors.text }}
                            >
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[13.5px] font-semibold text-zinc-900 truncate">{u.name}</span>
                              {me && (
                                <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-100 px-1.5 py-px rounded-full">You</span>
                              )}
                            </div>
                            {/* Role badge */}
                            <span
                              className={`inline-block text-[10.5px] font-semibold px-1.5 py-px rounded-full mt-0.5 ${u.is_admin
                                  ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60'
                                  : 'bg-zinc-100 text-zinc-500'
                                }`}
                            >
                              {u.is_admin ? 'Admin' : 'Member'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                          <span className="text-[12px] text-zinc-500 truncate">{u.email}</span>
                        </div>
                        {u.email_domain && (
                          <div className="flex items-center gap-1.5">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="2" y1="12" x2="22" y2="12" />
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                            <span className="text-[11.5px] text-zinc-400 font-mono">{u.email_domain}</span>
                          </div>
                        )}
                        {u.created_at && (
                          <div className="flex items-center gap-1.5">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span className="text-[11.5px] text-zinc-400">
                              Joined {new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card actions */}
                    {!me && (
                      <div className="px-4 pb-4 flex gap-2" style={{ borderTop: '1px solid #f4f4f5', paddingTop: 12 }}>
                        <button
                          onClick={() => toggleRole(u.id, u.is_admin)}
                          className="flex-1 py-1.5 text-[11.5px] font-medium text-zinc-600 rounded-md border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 transition-colors text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900"
                        >
                          {u.is_admin ? 'Demote' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => removeUser(u.id, u.name)}
                          className="py-1.5 px-2.5 text-[11.5px] font-medium text-red-600 rounded-md border border-red-100 hover:bg-red-50 hover:border-red-200 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
                          aria-label={`Remove ${u.name}`}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    {me && (
                      <div className="px-4 pb-4 pt-3" style={{ borderTop: '1px solid #f4f4f5' }}>
                        <span className="text-[11.5px] text-zinc-300">That's you</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Invite card — only shown when not filtering */}
              {!q && (
                <button
                  onClick={() => setInviteOpen(true)}
                  className="bg-white rounded-xl p-4 flex flex-col items-center justify-center gap-3 min-h-[160px] border-dashed transition-colors hover:bg-zinc-50 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900"
                  style={{ border: '1.5px dashed #d4d4d8' }}
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-100 group-hover:bg-zinc-200 flex items-center justify-center transition-colors" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                  <span className="text-[12.5px] font-medium text-zinc-500 group-hover:text-zinc-700 transition-colors">Add member</span>
                </button>
              )}
            </div>
          )
        )}
      </div>

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} onSuccess={load} />
    </div>
  );
}
