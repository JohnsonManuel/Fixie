import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../hooks/useFixieToast';
import { apiGet, apiPatch, apiDelete } from '../../../lib/fixie/api';
import { Pill } from '../ui/Pill';
import { Button } from '../ui/Button';
import { CardSkeleton } from '../ui/Skeleton';
import { FreshdeskModal } from '../modals/FreshdeskModal';
import { ZohoDeskModal } from '../modals/ZohoDeskModal';
import { McpModal } from '../modals/McpModal';
import type { McpServer } from '../../../types/fixie';

const GUIDED_TYPES = ['freshdesk', 'zohodesk'] as const;
type GuidedType = typeof GUIDED_TYPES[number];

const GUIDED_META: Record<GuidedType, { label: string; icon: string; description: string }> = {
  freshdesk: {
    label:       'Freshdesk',
    icon:        '🎧',
    description: 'AI-powered ticket creation and management via Freshdesk.',
  },
  zohodesk: {
    label:       'Zoho Desk',
    icon:        '🗂️',
    description: 'AI-powered ticket creation and management via Zoho Desk.',
  },
};

export function McpView() {
  const { toast } = useToast();
  const [servers, setServers]             = useState<McpServer[]>([]);
  const [loading, setLoading]             = useState(true);
  const [mcpModalOpen, setMcpModalOpen]   = useState(false);
  const [editingMcpId, setEditingMcpId]   = useState<string | null>(null);
  const [guidedModal, setGuidedModal]     = useState<{ type: GuidedType; editingId: string | null } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<McpServer[]>('/api/admin/mcp-servers');
      setServers(data);
    } catch {
      toast('Failed to load MCP servers', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const toggleServer = async (id: string, active: boolean) => {
    try {
      await apiPatch(`/api/admin/mcp-servers/${id}`, { is_active: !active });
      toast(`Server ${active ? 'disabled' : 'enabled'}`);
      load();
    } catch { toast('Failed to update server', 'error'); }
  };

  const deleteServer = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await apiDelete(`/api/admin/mcp-servers/${id}`);
      toast(`"${name}" deleted`);
      load();
    } catch { toast('Failed to delete server', 'error'); }
  };

  const openGuided = (type: GuidedType, editingId: string | null = null) =>
    setGuidedModal({ type, editingId });

  const advanced = servers.filter(s => !(GUIDED_TYPES as readonly string[]).includes(s.server_type));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="px-7 py-5 shrink-0 bg-white"
        style={{ borderBottom: '1px solid #e8edf3' }}
      >
        <h1 className="text-lg font-bold text-neutral-900">MCP Servers</h1>
        <p className="text-[13px] text-neutral-400 mt-0.5">Configure integrations available to your team's AI chat</p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-7 flex flex-col gap-6" style={{ background: '#f8fafc' }}>

        {/* Ticketing integrations */}
        <section>
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">
            Ticketing Integrations
          </div>
          {loading ? (
            <div className="flex flex-col gap-3">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : (
            <div className="flex flex-col gap-3 fade-in">
              {GUIDED_TYPES.map(type => {
                const server = servers.find(s => s.server_type === type) ?? null;
                const meta   = GUIDED_META[type];
                return server ? (
                  <TicketingCard
                    key={type}
                    server={server}
                    icon={meta.icon}
                    label={meta.label}
                    onEdit={() => openGuided(type, server.id)}
                    onRemove={() => deleteServer(server.id, meta.label)}
                  />
                ) : (
                  <TicketingSetupCard
                    key={type}
                    icon={meta.icon}
                    label={meta.label}
                    description={meta.description}
                    onConnect={() => openGuided(type)}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Advanced / custom MCP servers */}
        <section>
          <details>
            <summary className="cursor-pointer text-[13px] font-semibold text-neutral-500 pt-4 pb-2 flex items-center gap-2 select-none list-none [&::-webkit-details-marker]:hidden" style={{ borderTop: '1px solid #e8edf3' }}>
              <span className="text-[10px] text-neutral-400">▶</span>
              Advanced — Custom MCP Servers
            </summary>
            <div className="mt-3">
              <div className="flex justify-end mb-3">
                <Button onClick={() => { setEditingMcpId(null); setMcpModalOpen(true); }}>＋ Add Custom Server</Button>
              </div>
              {advanced.length === 0 ? (
                <div
                  className="text-center py-8 text-neutral-400 text-sm rounded-2xl bg-white"
                  style={{ border: '1px solid #e8edf3' }}
                >
                  No custom MCP servers configured.
                </div>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 fade-in">
                  {advanced.map(s => (
                    <div
                      key={s.id}
                      className="bg-white rounded-2xl p-4 transition-shadow"
                      style={{ border: '1px solid #e8edf3', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(24,119,242,0.08)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)')}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="text-[14px] font-bold text-neutral-900">{s.name}</div>
                          <div className="text-[11px] text-neutral-400 uppercase tracking-wider mt-0.5">{s.server_type}</div>
                        </div>
                        <Pill variant={s.is_active ? 'green' : 'gray'}>{s.is_active ? 'Active' : 'Inactive'}</Pill>
                      </div>
                      <div className="flex gap-3 text-[12px] text-neutral-400 mb-2">
                        <span>{s.tool_count} tool{s.tool_count !== 1 ? 's' : ''}</span>
                        <span>{s.requires_approval ? '⚠️ Requires approval' : '⚡ Auto-execute'}</span>
                      </div>
                      {s.tools.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {s.tools.map(t => (
                            <span key={t} className="text-[11px] px-1.5 py-0.5 rounded font-mono text-neutral-500" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>{t}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-1.5 mt-3">
                        <Button size="sm" variant="outline" onClick={() => { setEditingMcpId(s.id); setMcpModalOpen(true); }}>Edit</Button>
                        <Button size="sm" variant="outline" onClick={() => toggleServer(s.id, s.is_active)}>
                          {s.is_active ? 'Disable' : 'Enable'}
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => deleteServer(s.id, s.name)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </details>
        </section>
      </div>

      <FreshdeskModal
        open={guidedModal?.type === 'freshdesk'}
        onClose={() => setGuidedModal(null)}
        onSuccess={load}
        editingId={guidedModal?.type === 'freshdesk' ? guidedModal.editingId : null}
        allServers={servers}
      />
      <ZohoDeskModal
        open={guidedModal?.type === 'zohodesk'}
        onClose={() => setGuidedModal(null)}
        onSuccess={load}
        editingId={guidedModal?.type === 'zohodesk' ? guidedModal.editingId : null}
        allServers={servers}
      />
      <McpModal
        open={mcpModalOpen}
        onClose={() => setMcpModalOpen(false)}
        onSuccess={load}
        editingId={editingMcpId}
        allServers={servers}
      />
    </div>
  );
}

function TicketingSetupCard({
  icon, label, description, onConnect,
}: {
  icon: string; label: string; description: string; onConnect: () => void;
}) {
  return (
    <div
      className="bg-white rounded-2xl p-6 flex items-center gap-5 transition-shadow"
      style={{ border: '1px solid #e8edf3', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(24,119,242,0.08)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)')}
    >
      <div className="text-4xl shrink-0">{icon}</div>
      <div className="flex-1">
        <div className="text-[15px] font-bold text-neutral-900 mb-1">Connect {label}</div>
        <div className="text-[13px] text-neutral-500">{description}</div>
      </div>
      <Button onClick={onConnect} className="shrink-0">Connect</Button>
    </div>
  );
}

function TicketingCard({
  server, icon, label, onEdit, onRemove,
}: {
  server: McpServer; icon: string; label: string; onEdit: () => void; onRemove: () => void;
}) {
  const domainOrOrg = server.credentials?.domain ?? server.credentials?.org_id ?? 'Not configured';
  return (
    <div
      className="bg-white rounded-2xl p-5 flex items-center gap-4 transition-shadow"
      style={{ border: '1px solid #e8edf3', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(24,119,242,0.08)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)')}
    >
      <div className="text-3xl shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="text-[15px] font-bold text-neutral-900">{label}</span>
          <Pill variant={server.is_active ? 'green' : 'gray'}>{server.is_active ? 'Active' : 'Inactive'}</Pill>
        </div>
        <div className="text-[12.5px] text-neutral-500">
          {domainOrOrg} · {server.tool_count} tool{server.tool_count !== 1 ? 's' : ''} · {server.requires_approval ? '⚠️ Requires approval' : '⚡ Auto-execute'}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button size="sm" variant="outline" onClick={onEdit}>Edit</Button>
        <Button size="sm" variant="danger" onClick={onRemove}>Remove</Button>
      </div>
    </div>
  );
}
