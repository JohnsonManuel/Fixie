import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../../contexts/FixieAppContext';
import { useToast } from '../../../hooks/useFixieToast';
import { apiGet, apiPatch, apiDelete } from '../../../lib/fixie/api';
import { Pill } from '../ui/Pill';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { TableSkeleton } from '../ui/Skeleton';
import { InviteModal } from '../modals/InviteModal';
import type { OrgUser } from '../../../types/fixie';

export function UsersView() {
  const { appUser } = useApp();
  const { toast } = useToast();
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="px-7 py-5 flex items-center justify-between shrink-0 bg-white"
        style={{ borderBottom: '1px solid #e8edf3' }}
      >
        <div>
          <h1 className="text-lg font-bold text-neutral-900">Users</h1>
          <p className="text-[13px] text-neutral-400 mt-0.5">Manage who has access to your organisation</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>＋ Add User</Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-7" style={{ background: '#f8fafc' }}>
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid #e8edf3', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
        >
          {loading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : users.length === 0 ? (
            <EmptyState icon="👥" title="No users yet" body="Add team members with the button above." />
          ) : (
            <div className="overflow-x-auto fade-in">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {['User', 'Email', 'Domain', 'Role', 'Joined', ''].map(h => (
                      <th
                        key={h}
                        className="text-left text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr
                      key={u.id}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid #f8fafc' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafbfc')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {u.photo_url ? (
                            <img
                              src={u.photo_url}
                              className="w-7 h-7 rounded-full object-cover"
                              alt={u.name}
                              style={{ boxShadow: '0 0 0 2px rgba(24,119,242,0.1)' }}
                            />
                          ) : (
                            <div
                              className="w-7 h-7 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0"
                              style={{ background: 'linear-gradient(135deg, #1877F2 0%, #0E4F99 100%)' }}
                            >
                              {u.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-[13.5px] font-semibold text-neutral-900">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-neutral-500">{u.email}</td>
                      <td className="px-4 py-3">
                        {u.email_domain
                          ? <Pill variant="mono">{u.email_domain}</Pill>
                          : <span className="text-neutral-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Pill variant={u.is_admin ? 'blue' : 'gray'}>{u.is_admin ? 'Admin' : 'Member'}</Pill>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-neutral-400 whitespace-nowrap">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 justify-end">
                          <Button size="sm" variant="outline" onClick={() => toggleRole(u.id, u.is_admin)}>
                            {u.is_admin ? 'Demote' : 'Make Admin'}
                          </Button>
                          {u.id !== appUser?.id && (
                            <Button size="sm" variant="danger" onClick={() => removeUser(u.id, u.name)}>Remove</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} onSuccess={load} />
    </div>
  );
}
