import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../hooks/useFixieToast';
import { apiGet, apiPatch, apiDelete } from '../../../lib/fixie/api';
import { Pill } from '../ui/Pill';
import { Button } from '../ui/Button';
import { CardSkeleton } from '../ui/Skeleton';
import { FreshdeskModal } from '../modals/FreshdeskModal';
import { ZohoDeskModal } from '../modals/ZohoDeskModal';
import { McpModal } from '../modals/McpModal';
import { ReactComponent as FreshdeskLogo } from '../../../assets/logos/freshdesk.svg';
import { ReactComponent as ZohoDeskLogo } from '../../../assets/logos/zohodesk.svg';
import { Toggle } from '../ui/Toggle';
import type { McpServer, ToolSchema } from '../../../types/fixie';

const GUIDED_TYPES = ['freshdesk', 'zohodesk'] as const;
type GuidedType = typeof GUIDED_TYPES[number];

const GUIDED_META: Record<GuidedType, { label: string; description: string; logo: React.ReactNode }> = {
  freshdesk: {
    label: 'Freshdesk',
    description: 'Create, retrieve, and update support tickets via the Freshdesk REST API.',
    logo: <FreshdeskLogo className="w-9 h-9 shrink-0" />,
  },
  zohodesk: {
    label: 'Zoho Desk',
    description: 'Manage tickets and send replies via the Zoho Desk API with OAuth 2.0.',
    logo: <ZohoDeskLogo className="w-9 h-9 shrink-0" />,
  },
};

function McpServerIcon({ serverType }: { serverType: string }) {
  const colors: Record<string, string> = {
    jira: '#0052cc', linear: '#5e6ad2', github: '#24292f', zendesk: '#03363d', custom: '#71717a', mcp: '#2563eb',
  };
  const bg = colors[serverType] ?? '#71717a';
  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[13px] font-bold shrink-0"
      style={{ background: bg }}
    >
      {serverType.charAt(0).toUpperCase()}
    </div>
  );
}

export function McpView() {
  const { toast } = useToast();
  const [servers, setServers]           = useState<McpServer[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [mcpModalOpen, setMcpModalOpen] = useState(false);
  const [editingMcpId, setEditingMcpId] = useState<string | null>(null);
  const [guidedModal, setGuidedModal]   = useState<{ type: GuidedType; editingId: string | null } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<McpServer[]>('/api/admin/integrations');
      setServers(data);
    } catch {
      toast('Failed to load integrations', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const toggleServer = async (id: string, active: boolean) => {
    try {
      await apiPatch(`/api/admin/integrations/${id}`, { is_active: !active });
      toast(`Integration ${active ? 'disabled' : 'enabled'}`);
      load();
    } catch { toast('Failed to update integration', 'error'); }
  };

  const deleteServer = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await apiDelete(`/api/admin/integrations/${id}`);
      toast(`"${name}" removed`);
      load();
    } catch { toast('Failed to remove integration', 'error'); }
  };

  const [togglingTool, setTogglingTool] = useState<string | null>(null);

  const toggleToolAccess = async (serverId: string, toolName: string, currentAdminOnly: boolean) => {
    const key = `${serverId}:${toolName}`;
    setTogglingTool(key);
    try {
      await apiPatch(
        `/api/admin/integrations/${serverId}/tools/${encodeURIComponent(toolName)}`,
        { admin_only: !currentAdminOnly }
      );
      setServers(prev =>
        prev.map(s =>
          s.id !== serverId ? s : {
            ...s,
            tool_schemas: s.tool_schemas.map(t =>
              t.name === toolName ? { ...t, admin_only: !currentAdminOnly } : t
            ),
          }
        )
      );
    } catch {
      toast('Failed to update tool access', 'error');
    } finally {
      setTogglingTool(null);
    }
  };

  const openGuided = (type: GuidedType, editingId: string | null = null) => setGuidedModal({ type, editingId });

  const advanced = servers.filter(s => !(GUIDED_TYPES as readonly string[]).includes(s.server_type));
  const q = search.toLowerCase().trim();
  const filteredGuided   = GUIDED_TYPES.filter(t => !q || t.includes(q) || GUIDED_META[t].label.toLowerCase().includes(q));
  const filteredAdvanced = advanced.filter(s => !q || s.name.toLowerCase().includes(q) || s.server_type.toLowerCase().includes(q));

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="px-6 md:px-8 py-5 shrink-0 bg-white" style={{ borderBottom: '1px solid #e4e4e7' }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[17px] font-bold text-zinc-900">Integrations</h1>
            <p className="text-[13px] text-zinc-400 mt-0.5">Connect external services to your team's AI chat</p>
          </div>
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-8 pr-3 py-1.5 text-[12.5px] rounded-lg outline-none w-44 transition-all"
              style={{ border: '1px solid #e4e4e7', background: '#fafafa' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#a1a1aa'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(9,9,11,0.06)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e4e4e7'; e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.boxShadow = ''; }}
            />
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-10" style={{ background: '#fafafa' }}>

        {/* ── Ticketing integrations ────────────────────────────────────────── */}
        <section>
          <SectionLabel>Ticketing</SectionLabel>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <CardSkeleton /><CardSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 fade-in">
              {filteredGuided.map(type => {
                const server = servers.find(s => s.server_type === type) ?? null;
                const meta   = GUIDED_META[type];
                return server ? (
                  <TicketingCard
                    key={type}
                    server={server}
                    logo={meta.logo}
                    label={meta.label}
                    onEdit={() => openGuided(type, server.id)}
                    onRemove={() => deleteServer(server.id, meta.label)}
                    onToggle={() => toggleServer(server.id, server.is_active)}
                    togglingTool={togglingTool}
                    onToolToggle={(toolName, currentAdminOnly) => toggleToolAccess(server.id, toolName, currentAdminOnly)}
                  />
                ) : (
                  <TicketingSetupCard
                    key={type}
                    logo={meta.logo}
                    label={meta.label}
                    description={meta.description}
                    onConnect={() => openGuided(type)}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* ── Custom MCP servers ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Custom MCP Servers</SectionLabel>
            <Button size="sm" variant="outline" onClick={() => { setEditingMcpId(null); setMcpModalOpen(true); }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add server
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"><CardSkeleton /></div>
          ) : filteredAdvanced.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 text-center rounded-xl bg-white"
              style={{ border: '1.5px dashed #d4d4d8' }}
            >
              <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center mb-3 text-zinc-400" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <p className="text-[13.5px] font-semibold text-zinc-600 mb-1">No custom MCP servers</p>
              <p className="text-[12px] text-zinc-400 mb-4 max-w-xs">
                Connect any MCP-compatible service by URL, or configure a custom integration manually.
              </p>
              <Button size="sm" onClick={() => { setEditingMcpId(null); setMcpModalOpen(true); }}>Add server</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 fade-in">
              {filteredAdvanced.map(s => (
                <CustomServerCard
                  key={s.id}
                  server={s}
                  onEdit={() => { setEditingMcpId(s.id); setMcpModalOpen(true); }}
                  onToggle={() => toggleServer(s.id, s.is_active)}
                  onRemove={() => deleteServer(s.id, s.name)}
                  togglingTool={togglingTool}
                  onToolToggle={(toolName, currentAdminOnly) => toggleToolAccess(s.id, toolName, currentAdminOnly)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      <FreshdeskModal open={guidedModal?.type === 'freshdesk'} onClose={() => setGuidedModal(null)} onSuccess={load} editingId={guidedModal?.type === 'freshdesk' ? guidedModal.editingId : null} allServers={servers} />
      <ZohoDeskModal  open={guidedModal?.type === 'zohodesk'}  onClose={() => setGuidedModal(null)} onSuccess={load} editingId={guidedModal?.type === 'zohodesk'  ? guidedModal.editingId : null} allServers={servers} />
      <McpModal       open={mcpModalOpen} onClose={() => setMcpModalOpen(false)} onSuccess={load} editingId={editingMcpId} allServers={servers} />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10.5px] font-semibold text-zinc-400 uppercase tracking-widest mb-3">{children}</p>;
}

function TicketingSetupCard({ logo, label, description, onConnect }: {
  logo: React.ReactNode; label: string; description: string; onConnect: () => void;
}) {
  return (
    <div
      className="bg-white rounded-xl p-5 flex flex-col gap-4 transition-shadow"
      style={{ border: '1px solid #e4e4e7', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)')}
    >
      <div className="flex items-center gap-3">
        {logo}
        <div>
          <div className="text-[13.5px] font-bold text-zinc-900">{label}</div>
          <div className="text-[11.5px] text-zinc-400 mt-0.5">Not connected</div>
        </div>
      </div>
      <p className="text-[12px] text-zinc-500 leading-relaxed flex-1">{description}</p>
      <Button onClick={onConnect} className="w-full justify-center" size="sm">Connect</Button>
    </div>
  );
}

function TicketingCard({ server, logo, label, onEdit, onRemove, onToggle, togglingTool, onToolToggle }: {
  server: McpServer; logo: React.ReactNode; label: string;
  onEdit: () => void; onRemove: () => void; onToggle: () => void;
  togglingTool: string | null;
  onToolToggle: (toolName: string, currentAdminOnly: boolean) => void;
}) {
  const [toolPanelOpen, setToolPanelOpen] = useState(false);
  const domainOrOrg = server.credentials?.domain ?? server.credentials?.org_id ?? '—';
  return (
    <div
      className="bg-white rounded-xl p-5 flex flex-col gap-3 transition-shadow"
      style={{ border: '1px solid #e4e4e7', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {logo}
          <div>
            <div className="text-[13.5px] font-bold text-zinc-900">{label}</div>
            <div className="text-[11.5px] text-zinc-500 mt-0.5 truncate max-w-[140px]">{domainOrOrg}</div>
          </div>
        </div>
        <Pill variant={server.is_active ? 'green' : 'gray'}>{server.is_active ? 'Active' : 'Inactive'}</Pill>
      </div>

      <div className="flex items-center gap-3 text-[11.5px] text-zinc-400">
        <span>{server.tool_count} tool{server.tool_count !== 1 ? 's' : ''}</span>
        <span className="w-px h-3 bg-zinc-200" />
        <span>{server.requires_approval ? 'Approval required' : 'Auto-execute'}</span>
      </div>

      <button
        type="button"
        onClick={() => setToolPanelOpen(o => !o)}
        className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors w-full text-left"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round"
          className={`transition-transform duration-150 ${toolPanelOpen ? 'rotate-90' : ''}`}
          aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        Tool access
      </button>

      {toolPanelOpen && (
        <ToolPermissionsPanel
          schemas={server.tool_schemas.map(t => ({ ...t, admin_only: t.admin_only ?? false }))}
          serverId={server.id}
          togglingKey={togglingTool}
          onToggle={onToolToggle}
        />
      )}

      <div className="flex gap-1.5 pt-2" style={{ borderTop: '1px solid #f4f4f5' }}>
        <Button size="sm" variant="outline" onClick={onEdit} className="flex-1 justify-center">Edit</Button>
        <Button size="sm" variant="outline" onClick={onToggle} className="flex-1 justify-center">
          {server.is_active ? 'Disable' : 'Enable'}
        </Button>
        <Button size="sm" variant="danger" onClick={onRemove}>Remove</Button>
      </div>
    </div>
  );
}

function CustomServerCard({ server, onEdit, onToggle, onRemove, togglingTool, onToolToggle }: {
  server: McpServer; onEdit: () => void; onToggle: () => void; onRemove: () => void;
  togglingTool: string | null;
  onToolToggle: (toolName: string, currentAdminOnly: boolean) => void;
}) {
  const [toolPanelOpen, setToolPanelOpen] = useState(false);
  return (
    <div
      className="bg-white rounded-xl p-5 flex flex-col gap-3 transition-shadow"
      style={{ border: '1px solid #e4e4e7', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <McpServerIcon serverType={server.server_type} />
          <div>
            <div className="text-[13.5px] font-bold text-zinc-900">{server.name}</div>
            <div className="text-[10.5px] text-zinc-400 uppercase tracking-wider mt-0.5 font-mono">{server.server_type}</div>
          </div>
        </div>
        <Pill variant={server.is_active ? 'green' : 'gray'}>{server.is_active ? 'Active' : 'Inactive'}</Pill>
      </div>

      <div className="flex items-center gap-3 text-[11.5px] text-zinc-400">
        <span>{server.tool_count} tool{server.tool_count !== 1 ? 's' : ''}</span>
        <span className="w-px h-3 bg-zinc-200" />
        <span>{server.requires_approval ? 'Approval required' : 'Auto-execute'}</span>
      </div>

      {server.tools.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {server.tools.slice(0, 4).map(t => (
            <code key={t} className="text-[10.5px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500">{t}</code>
          ))}
          {server.tools.length > 4 && (
            <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-400">+{server.tools.length - 4}</span>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setToolPanelOpen(o => !o)}
        className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors w-full text-left"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round"
          className={`transition-transform duration-150 ${toolPanelOpen ? 'rotate-90' : ''}`}
          aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        Tool access
      </button>

      {toolPanelOpen && (
        <ToolPermissionsPanel
          schemas={server.tool_schemas.map(t => ({ ...t, admin_only: t.admin_only ?? false }))}
          serverId={server.id}
          togglingKey={togglingTool}
          onToggle={onToolToggle}
        />
      )}

      <div className="flex gap-1.5 pt-2" style={{ borderTop: '1px solid #f4f4f5' }}>
        <Button size="sm" variant="outline" onClick={onEdit} className="flex-1 justify-center">Edit</Button>
        <Button size="sm" variant="outline" onClick={onToggle} className="flex-1 justify-center">
          {server.is_active ? 'Disable' : 'Enable'}
        </Button>
        <Button size="sm" variant="danger" onClick={onRemove}>Delete</Button>
      </div>
    </div>
  );
}

// ── Tool permissions panel ─────────────────────────────────────────────────────

function ToolPermissionsPanel({
  schemas, serverId, togglingKey, onToggle,
}: {
  schemas: (ToolSchema & { admin_only: boolean })[];
  serverId: string;
  togglingKey: string | null;
  onToggle: (toolName: string, currentAdminOnly: boolean) => void;
}) {
  const userTools  = schemas.filter(t => !t.admin_only);
  const adminTools = schemas.filter(t =>  t.admin_only);

  return (
    <div className="pt-2.5" style={{ borderTop: '1px solid #f4f4f5' }}>
      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">
        Tool permissions
      </p>

      {userTools.length > 0 && (
        <div className="mb-2.5">
          <p className="text-[10px] text-zinc-400 mb-1">All users</p>
          {userTools.map(t => (
            <ToolRow key={t.name} tool={t} serverId={serverId} togglingKey={togglingKey} onToggle={onToggle} />
          ))}
        </div>
      )}

      {adminTools.length > 0 && (
        <div>
          <p className="text-[10px] text-zinc-400 mb-1">Admin only</p>
          {adminTools.map(t => (
            <ToolRow key={t.name} tool={t} serverId={serverId} togglingKey={togglingKey} onToggle={onToggle} />
          ))}
        </div>
      )}

      {schemas.length === 0 && (
        <p className="text-[11px] text-zinc-400 italic">No tools configured.</p>
      )}
    </div>
  );
}

function ToolRow({
  tool, serverId, togglingKey, onToggle,
}: {
  tool: ToolSchema & { admin_only: boolean };
  serverId: string;
  togglingKey: string | null;
  onToggle: (toolName: string, currentAdminOnly: boolean) => void;
}) {
  const saving = togglingKey === `${serverId}:${tool.name}`;
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <code className="text-[10.5px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 truncate">
        {tool.name}
      </code>
      <div className="flex items-center gap-2 shrink-0">
        {saving
          ? <span className="text-[10px] text-zinc-400">Saving…</span>
          : <span className="text-[10px] text-zinc-400">{tool.admin_only ? 'Admin only' : 'All users'}</span>
        }
        <Toggle
          checked={tool.admin_only}
          onChange={() => onToggle(tool.name, tool.admin_only)}
          label={`${tool.admin_only ? 'Admin only' : 'All users'}: ${tool.name}`}
        />
      </div>
    </div>
  );
}
