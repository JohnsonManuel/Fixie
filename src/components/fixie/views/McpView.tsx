import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../hooks/useFixieToast';
import { apiGet, apiPatch, apiDelete } from '../../../lib/fixie/api';
import { Pill } from '../ui/Pill';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
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
  const [servers, setServers]         = useState<McpServer[]>([]);
  const [loading, setLoading]         = useState(true);
  const [mcpModalOpen, setMcpModalOpen]   = useState(false);
  const [editingMcpId, setEditingMcpId]   = useState<string | null>(null);
  const [guidedModal, setGuidedModal] = useState<{ type: GuidedType; editingId: string | null } | null>(null);

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
      <div className="px-7 py-5 border-b border-neutral-200 bg-white shrink-0">
        <h1 className="text-lg font-bold text-neutral-900">MCP Servers</h1>
        <p className="text-[13px] text-neutral-500 mt-0.5">Configure integrations available to your team's AI chat</p>
      </div>

      <div className="flex-1 overflow-y-auto p-7 flex flex-col gap-6">

        {/* Ticketing integrations */}
        <section>
          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-3">Ticketing Integrations</div>
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <div className="flex flex-col gap-3">
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
            <summary className="cursor-pointer text-[13px] font-semibold text-neutral-500 border-t border-neutral-200 pt-4 pb-2 flex items-center gap-2 select-none list-none [&::-webkit-details-marker]:hidden">
              <span className="text-[10px] text-neutral-400">▶</span>
              Advanced — Custom MCP Servers
            </summary>
            <div className="mt-3">
              <div className="flex justify-end mb-3">
                <Button onClick={() => { setEditingMcpId(null); setMcpModalOpen(true); }}>＋ Add Custom Server</Button>
              </div>
              {advanced.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-sm">No custom MCP servers configured.</div>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                  {advanced.map(s => (
                    <div key={s.id} className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="text-[15px] font-bold text-neutral-900">{s.name}</div>
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
                            <span key={t} className="text-[11px] px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 rounded text-neutral-500 font-mono">{t}</span>
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
    <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm flex items-center gap-5">
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
    <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
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
