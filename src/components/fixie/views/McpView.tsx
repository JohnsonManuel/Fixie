import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../hooks/useFixieToast';
import { apiGet, apiPatch, apiDelete, apiPost } from '../../../lib/fixie/api';
import { Pill } from '../ui/Pill';
import { Button } from '../ui/Button';
import { CardSkeleton } from '../ui/Skeleton';
import { FreshdeskModal } from '../modals/FreshdeskModal';
import { ZohoDeskModal } from '../modals/ZohoDeskModal';
import { CustomServerModal } from '../modals/McpModal';
import { GenericIntegrationModal, INTEGRATION_CONFIGS } from '../modals/GenericIntegrationModal';
import { ReactComponent as FreshdeskLogo } from '../../../assets/logos/freshdesk.svg';
import { ReactComponent as ZohoDeskLogo } from '../../../assets/logos/zohodesk.svg';
import { ReactComponent as ZendeskLogo } from '../../../assets/logos/zendesk.svg';
import { ReactComponent as JiraLogo } from '../../../assets/logos/jira.svg';
import { ReactComponent as ServiceNowLogo } from '../../../assets/logos/servicenow.svg';
import { ReactComponent as GitHubLogo } from '../../../assets/logos/github.svg';
import { ReactComponent as GitLabLogo } from '../../../assets/logos/gitlab.svg';
import { ReactComponent as JenkinsLogo } from '../../../assets/logos/jenkins.svg';
import { ReactComponent as LinearLogo } from '../../../assets/logos/linear.svg';
import { ReactComponent as SlackLogo } from '../../../assets/logos/slack.svg';
import { ReactComponent as DatadogLogo } from '../../../assets/logos/datadog.svg';
import { ReactComponent as NewRelicLogo } from '../../../assets/logos/newrelic.svg';
import { ReactComponent as PagerDutyLogo } from '../../../assets/logos/pagerduty.svg';
import { ReactComponent as OpsGenieLogo } from '../../../assets/logos/opsgenie.svg';
import { ReactComponent as ConfluenceLogo } from '../../../assets/logos/confluence.svg';
import { Toggle } from '../ui/Toggle';
import type { IntegrationConfig, ToolSchema } from '../../../types/fixie';

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

const INTEGRATION_COLORS: Record<string, string> = {
  freshdesk: '#25c16f', zohodesk: '#e42527', zendesk: '#03363d', jira: '#0052cc',
  servicenow: '#81b5a1', github: '#24292f', gitlab: '#fc6d26', jenkins: '#d33833',
  linear: '#5e6ad2', slack: '#4a154b', datadog: '#632ca6', newrelic: '#008c99',
  pagerduty: '#06ac38', opsgenie: '#ef4444', confluence: '#0052cc',
  intune: '#0078d4', jamf: '#ef5a00',
  custom: '#71717a', mcp: '#2563eb',
};

const CATALOG_LOGOS: Record<string, React.ReactNode> = {
  zendesk: <ZendeskLogo className="w-9 h-9 shrink-0" />,
  jira: <JiraLogo className="w-9 h-9 shrink-0" />,
  servicenow: <ServiceNowLogo className="w-9 h-9 shrink-0" />,
  github: <GitHubLogo className="w-9 h-9 shrink-0" />,
  gitlab: <GitLabLogo className="w-9 h-9 shrink-0" />,
  jenkins: <JenkinsLogo className="w-9 h-9 shrink-0" />,
  linear: <LinearLogo className="w-9 h-9 shrink-0" />,
  slack: <SlackLogo className="w-9 h-9 shrink-0" />,
  datadog: <DatadogLogo className="w-9 h-9 shrink-0" />,
  newrelic: <NewRelicLogo className="w-9 h-9 shrink-0" />,
  pagerduty: <PagerDutyLogo className="w-9 h-9 shrink-0" />,
  opsgenie: <OpsGenieLogo className="w-9 h-9 shrink-0" />,
  confluence: <ConfluenceLogo className="w-9 h-9 shrink-0" />,
};

function IntegrationConfigIcon({ serverType, size = 'md' }: { serverType: string; size?: 'sm' | 'md' | 'lg' }) {
  const bg = INTEGRATION_COLORS[serverType] ?? '#71717a';
  const cls = size === 'sm' ? 'w-7 h-7 text-[11px]' : size === 'lg' ? 'w-12 h-12 text-[16px]' : 'w-9 h-9 text-[13px]';
  return (
    <div className={`${cls} rounded-xl flex items-center justify-center text-white font-bold shrink-0`} style={{ background: bg }}>
      {serverType.charAt(0).toUpperCase()}
    </div>
  );
}

interface CatalogItem { slug: string; label: string; description: string; }
interface CatalogCategory { label: string; items: CatalogItem[]; }

const CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    label: 'ITSM',
    items: [
      { slug: 'zendesk', label: 'Zendesk', description: 'Manage support tickets via the Zendesk Ticketing API.' },
      { slug: 'jira', label: 'Jira', description: 'Create and track issues in Jira Service Management.' },
      { slug: 'servicenow', label: 'ServiceNow', description: 'Manage incidents, changes, and CMDB via the ServiceNow Table API.' },
    ],
  },
  {
    label: 'Endpoint Management',
    items: [
      { slug: 'intune', label: 'Microsoft Intune', description: 'List, lock, sync, and wipe Windows/iOS/Android devices managed by Intune.' },
      { slug: 'jamf', label: 'Jamf Pro', description: 'Manage Mac computers and iOS devices via the Jamf Pro API.' },
    ],
  },
  {
    label: 'DevOps',
    items: [
      { slug: 'github', label: 'GitHub', description: 'Manage issues and pull requests via the GitHub REST API.' },
      { slug: 'gitlab', label: 'GitLab', description: 'Manage issues and merge requests via the GitLab REST API.' },
      { slug: 'jenkins', label: 'Jenkins', description: 'Trigger builds and check job status via the Jenkins Remote API.' },
      { slug: 'linear', label: 'Linear', description: 'Create and update issues via the Linear GraphQL API.' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { slug: 'slack', label: 'Slack', description: 'Send messages and list channels via the Slack Web API.' },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { slug: 'datadog', label: 'Datadog', description: 'Manage incidents and monitors via the Datadog REST API.' },
      { slug: 'newrelic', label: 'New Relic', description: 'Query alerts, incidents, and entities via New Relic NerdGraph.' },
    ],
  },
  {
    label: 'Incident Management',
    items: [
      { slug: 'pagerduty', label: 'PagerDuty', description: 'Manage on-call incidents and escalations via the PagerDuty API.' },
      { slug: 'opsgenie', label: 'OpsGenie', description: 'Create and acknowledge alerts via the OpsGenie Alert API.' },
    ],
  },
  {
    label: 'Knowledge',
    items: [
      { slug: 'confluence', label: 'Confluence', description: 'Search and manage knowledge base pages via the Confluence REST API.' },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtToolName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function IntegrationsView() {
  const { toast } = useToast();
  const [servers, setServers] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toolDrawer, setToolDrawer] = useState<IntegrationConfig | null>(null);
  const [togglingTool, setTogglingTool] = useState<string | null>(null);

  type HealthStatus = 'checking' | 'ok' | 'error';
  const [healthMap, setHealthMap] = useState<Record<string, HealthStatus>>({});

  const [mcpModalOpen, setCustomServerModalOpen] = useState(false);
  const [editingMcpId, setEditingMcpId] = useState<string | null>(null);
  const [initialServerType, setInitialServerType] = useState<string | undefined>(undefined);
  const [guidedModal, setGuidedModal] = useState<{ type: GuidedType; editingId: string | null } | null>(null);
  const [genericModal, setGenericModal] = useState<{ slug: string; editingId: string | null } | null>(null);

  const checkHealth = useCallback(async (active: IntegrationConfig[]) => {
    if (active.length === 0) return;

    // Mark all active integrations as checking
    setHealthMap(prev => {
      const next = { ...prev };
      active.forEach(s => { next[s.id] = 'checking'; });
      return next;
    });

    // Fire all checks in parallel — don't block page render
    await Promise.allSettled(
      active.map(async server => {
        try {
          await apiPost('/api/admin/integrations/test', {
            server_type: server.server_type,
            credentials: server.credentials ?? {},
            nango_connection_id: server.nango_connection_id ?? null,
            nango_provider_config_key: server.nango_provider_config_key ?? null,
          });
          setHealthMap(prev => ({ ...prev, [server.id]: 'ok' }));
        } catch {
          setHealthMap(prev => ({ ...prev, [server.id]: 'error' }));
        }
      })
    );
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<IntegrationConfig[]>('/api/admin/integrations');
      setServers(data);
      // Health check runs after page renders — non-blocking
      checkHealth(data.filter(s => s.is_active));
    } catch {
      toast('Failed to load integrations', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast, checkHealth]);

  useEffect(() => { load(); }, [load]);

  // Keep toolDrawer in sync when servers refresh
  useEffect(() => {
    if (toolDrawer) {
      const updated = servers.find(s => s.id === toolDrawer.id);
      if (updated) setToolDrawer(updated);
    }
  }, [servers]); // eslint-disable-line react-hooks/exhaustive-deps

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
      if (toolDrawer?.id === id) setToolDrawer(null);
      toast(`"${name}" removed`);
      load();
    } catch { toast('Failed to remove integration', 'error'); }
  };

  const toggleToolAccess = async (serverId: string, toolName: string, currentAdminOnly: boolean) => {
    const key = `${serverId}:${toolName}`;
    setTogglingTool(key);
    try {
      await apiPatch(
        `/api/admin/integrations/${serverId}/tools/${encodeURIComponent(toolName)}`,
        { admin_only: !currentAdminOnly },
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

  const ALL_CATALOG_SLUGS = CATALOG_CATEGORIES.flatMap(c => c.items.map(i => i.slug));
  const advanced = servers.filter(s => !(GUIDED_TYPES as readonly string[]).includes(s.server_type) && !ALL_CATALOG_SLUGS.includes(s.server_type));
  const q = search.toLowerCase().trim();
  const filteredGuided = GUIDED_TYPES.filter(t => !q || t.includes(q) || GUIDED_META[t].label.toLowerCase().includes(q));
  const filteredAdvanced = advanced.filter(s => !q || s.name.toLowerCase().includes(q) || s.server_type.toLowerCase().includes(q));
  const filteredCatalog = CATALOG_CATEGORIES
    .map(cat => ({ ...cat, items: cat.items.filter(i => !q || i.slug.includes(q) || i.label.toLowerCase().includes(q)) }))
    .filter(cat => cat.items.length > 0);

  const openCatalogItem = (slug: string, editingId: string | null = null) => {
    if (INTEGRATION_CONFIGS[slug]) {
      setGenericModal({ slug, editingId });
    } else {
      setEditingMcpId(editingId);
      setInitialServerType(editingId ? undefined : slug);
      setCustomServerModalOpen(true);
    }
  };

  const openTools = (server: IntegrationConfig) => setToolDrawer(server);

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-6 md:px-8 py-5 shrink-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[17px] font-bold text-zinc-900 dark:text-zinc-100">Integrations</h1>
            <p className="text-[13px] text-zinc-400 dark:text-zinc-500 mt-0.5">Connect external services and manage tool access for your team</p>
          </div>
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search integrations…"
              className="pl-8 pr-3 py-1.5 text-[12.5px] rounded-lg outline-none w-48 transition-all"
              style={{ border: '1px solid #e4e4e7', background: '#fafafa' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#a1a1aa'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(9,9,11,0.06)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e4e4e7'; e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.boxShadow = ''; }}
            />
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-10 bg-zinc-50 dark:bg-zinc-950">

        {/* ── Ticketing ──────────────────────────────────────────────────── */}
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
                const meta = GUIDED_META[type];
                return server ? (
                  <ConnectedCard
                    key={type}
                    server={server}
                    logo={meta.logo}
                    label={meta.label}
                    health={healthMap[server.id]}
                    onEdit={() => openGuided(type, server.id)}
                    onRemove={() => deleteServer(server.id, meta.label)}
                    onToggle={() => toggleServer(server.id, server.is_active)}
                    onManageTools={() => openTools(server)}
                  />
                ) : (
                  <SetupCard
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

        {/* ── Catalog categories ─────────────────────────────────────────── */}
        {filteredCatalog.map(category => (
          <section key={category.label}>
            <SectionLabel>{category.label}</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 fade-in">
              {loading
                ? category.items.map(i => <CardSkeleton key={i.slug} />)
                : category.items.map(item => {
                  const server = servers.find(s => s.server_type === item.slug) ?? null;
                  const cfg = INTEGRATION_CONFIGS[item.slug];
                  const logo = CATALOG_LOGOS[item.slug] ?? <IntegrationConfigIcon serverType={item.slug} />;
                  return server ? (
                    <ConnectedCard
                      key={item.slug}
                      server={server}
                      logo={logo}
                      label={item.label}
                      subtitle={cfg?.displayValue?.(server.credentials ?? {}) ?? (server.credentials?.domain ?? server.credentials?.instance_url ?? server.credentials?.subdomain ?? '')}
                      health={healthMap[server.id]}
                      onEdit={() => openCatalogItem(item.slug, server.id)}
                      onRemove={() => deleteServer(server.id, item.label)}
                      onToggle={() => toggleServer(server.id, server.is_active)}
                      onManageTools={() => openTools(server)}
                    />
                  ) : (
                    <SetupCard
                      key={item.slug}
                      logo={logo}
                      label={item.label}
                      description={item.description}
                      onConnect={() => openCatalogItem(item.slug)}
                    />
                  );
                })
              }
            </div>
          </section>
        ))}

        {/* ── Custom MCP servers ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Custom MCP Servers</SectionLabel>
            <Button size="sm" variant="outline" onClick={() => { setEditingMcpId(null); setCustomServerModalOpen(true); }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add server
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"><CardSkeleton /></div>
          ) : filteredAdvanced.length === 0 ? (
            <EmptyMcpState onAdd={() => { setEditingMcpId(null); setCustomServerModalOpen(true); }} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 fade-in">
              {filteredAdvanced.map(s => (
                <ConnectedCard
                  key={s.id}
                  server={s}
                  logo={<IntegrationConfigIcon serverType={s.server_type} />}
                  label={s.name}
                  subtitle={s.server_type !== 'custom' && s.server_type !== 'mcp' ? s.server_type : (s.server_url ?? '')}
                  health={healthMap[s.id]}
                  onEdit={() => { setEditingMcpId(s.id); setCustomServerModalOpen(true); }}
                  onToggle={() => toggleServer(s.id, s.is_active)}
                  onRemove={() => deleteServer(s.id, s.name)}
                  onManageTools={() => openTools(s)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Tool drawer ────────────────────────────────────────────────────── */}
      <ToolDrawer
        server={toolDrawer}
        health={toolDrawer ? healthMap[toolDrawer.id] : undefined}
        togglingKey={togglingTool}
        onClose={() => setToolDrawer(null)}
        onToggleTool={toggleToolAccess}
      />

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <FreshdeskModal open={guidedModal?.type === 'freshdesk'} onClose={() => setGuidedModal(null)} onSuccess={load} editingId={guidedModal?.type === 'freshdesk' ? guidedModal.editingId : null} allServers={servers} />
      <ZohoDeskModal open={guidedModal?.type === 'zohodesk'} onClose={() => setGuidedModal(null)} onSuccess={load} editingId={guidedModal?.type === 'zohodesk' ? guidedModal.editingId : null} allServers={servers} />
      <CustomServerModal open={mcpModalOpen} onClose={() => { setCustomServerModalOpen(false); setInitialServerType(undefined); }} onSuccess={load} editingId={editingMcpId} allServers={servers} initialServerType={initialServerType} />
      {genericModal && (
        <GenericIntegrationModal
          open={!!genericModal}
          onClose={() => setGenericModal(null)}
          onSuccess={load}
          slug={genericModal.slug}
          editingId={genericModal.editingId}
          allServers={servers}
        />
      )}
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10.5px] font-semibold text-zinc-400 uppercase tracking-widest mb-3">{children}</p>;
}

// ── Setup card (not connected) ────────────────────────────────────────────────

function SetupCard({ logo, label, description, onConnect }: {
  logo: React.ReactNode; label: string; description: string; onConnect: () => void;
}) {
  return (
    <div
      className="bg-white dark:bg-zinc-900 rounded-2xl p-5 flex flex-col gap-4 cursor-pointer group transition-all border border-zinc-200 dark:border-zinc-700"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; const isDark = document.documentElement.classList.contains('dark'); (e.currentTarget as HTMLElement).style.borderColor = isDark ? '#52525b' : '#d4d4d8'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; const isDark = document.documentElement.classList.contains('dark'); (e.currentTarget as HTMLElement).style.borderColor = isDark ? '#3f3f46' : '#e4e4e7'; }}
      onClick={onConnect}
    >
      <div className="flex items-center gap-3">
        <div className="opacity-60 group-hover:opacity-100 transition-opacity">{logo}</div>
        <div>
          <div className="text-[13.5px] font-semibold text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">{label}</div>
          <div className="text-[11.5px] text-zinc-400 dark:text-zinc-500 mt-0.5">Not connected</div>
        </div>
      </div>
      <p className="text-[12px] text-zinc-400 dark:text-zinc-500 leading-relaxed flex-1">{description}</p>
      <div
        className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12.5px] font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-800 transition-all border border-dashed border-zinc-300 dark:border-zinc-600"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Connect
      </div>
    </div>
  );
}

// ── Connected card ────────────────────────────────────────────────────────────

function ConnectedCard({ server, logo, label, subtitle, health, onEdit, onRemove, onToggle, onManageTools }: {
  server: IntegrationConfig;
  logo: React.ReactNode;
  label: string;
  subtitle?: string;
  health?: 'checking' | 'ok' | 'error';
  onEdit: () => void;
  onRemove: () => void;
  onToggle: () => void;
  onManageTools: () => void;
}) {
  const userTools = server.tool_schemas.filter(t => !t.admin_only);
  const adminTools = server.tool_schemas.filter(t => t.admin_only);
  const domain = subtitle || server.credentials?.domain || server.credentials?.instance_url || server.credentials?.subdomain || '';

  const borderColor = server.is_active && health === 'error' ? '#fecaca' : '#e4e4e7';

  return (
    <div
      className="bg-white dark:bg-zinc-900 rounded-2xl flex flex-col transition-all"
      style={{ border: `1px solid ${borderColor}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
    >
      {/* Card header */}
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {logo}
            <div className="min-w-0">
              <div className="text-[13.5px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">{label}</div>
              {domain && (
                <div className="text-[11.5px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">{domain}</div>
              )}
            </div>
          </div>
          {/* Status indicator */}
          <HealthBadge isActive={server.is_active} health={health} />
        </div>

        {/* Tool stats */}
        <div className="flex flex-wrap gap-1.5">
          {userTools.length > 0 && (
            <ToolStatChip
              icon={<UserIcon />}
              label={`${userTools.length} user tool${userTools.length !== 1 ? 's' : ''}`}
              color="blue"
            />
          )}
          {adminTools.length > 0 && (
            <ToolStatChip
              icon={<ShieldIcon />}
              label={`${adminTools.length} admin tool${adminTools.length !== 1 ? 's' : ''}`}
              color="amber"
            />
          )}
          {server.requires_approval && (
            <ToolStatChip
              icon={<CheckCircleIcon />}
              label="Approval required"
              color="purple"
            />
          )}
        </div>

        {server.routing_hint && (
          <p className="text-[11px] text-zinc-400 italic leading-snug">{server.routing_hint}</p>
        )}
      </div>

      {/* Manage tools button */}
      <button
        type="button"
        onClick={onManageTools}
        className="flex items-center justify-between px-5 py-3 text-[12.5px] font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors w-full text-left"
        style={{ borderTop: '1px solid #f4f4f5', borderBottom: '1px solid #f4f4f5' }}
      >
        <span className="flex items-center gap-2">
          <WrenchIcon />
          Manage tools &amp; permissions
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Action buttons */}
      <div className="flex gap-1.5 p-3">
        <Button size="sm" variant="outline" onClick={onEdit} className="flex-1 justify-center">Edit</Button>
        <Button size="sm" variant="outline" onClick={onToggle} className="flex-1 justify-center">
          {server.is_active ? 'Disable' : 'Enable'}
        </Button>
        <Button size="sm" variant="danger" onClick={onRemove}>Remove</Button>
      </div>
    </div>
  );
}

// ── Health badge ──────────────────────────────────────────────────────────────

function HealthBadge({ isActive, health }: { isActive: boolean; health?: 'checking' | 'ok' | 'error' }) {
  if (!isActive) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
        <span className="text-[11px] font-medium text-zinc-400">Inactive</span>
      </div>
    );
  }

  if (!health || health === 'checking') {
    return (
      <div className="flex items-center gap-1.5 shrink-0" title="Verifying credentials…">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-pulse" />
        <span className="text-[11px] font-medium text-zinc-400">Checking…</span>
      </div>
    );
  }

  if (health === 'error') {
    return (
      <div className="flex items-center gap-1.5 shrink-0" title="Connection failed — credentials may be invalid or expired">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        <span className="text-[11px] font-medium text-red-500">Invalid credentials</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0" title="Connection verified">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
      <span className="text-[11px] font-medium text-green-600">Connected</span>
    </div>
  );
}

// ── Tool stat chip ────────────────────────────────────────────────────────────

function ToolStatChip({ icon, label, color }: { icon: React.ReactNode; label: string; color: 'blue' | 'amber' | 'purple' }) {
  const styles = {
    blue: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    amber: { bg: '#fffbeb', text: '#b45309', border: '#fcd34d' },
    purple: { bg: '#faf5ff', text: '#7c3aed', border: '#ddd6fe' },
  }[color];
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
      style={{ background: styles.bg, color: styles.text, border: `1px solid ${styles.border}` }}
    >
      {icon}{label}
    </span>
  );
}

// ── Tool drawer ───────────────────────────────────────────────────────────────

function ToolDrawer({ server, health, togglingKey, onClose, onToggleTool }: {
  server: IntegrationConfig | null;
  health?: 'checking' | 'ok' | 'error';
  togglingKey: string | null;
  onClose: () => void;
  onToggleTool: (serverId: string, toolName: string, currentAdminOnly: boolean) => void;
}) {
  useEffect(() => {
    if (!server) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [server, onClose]);

  if (!server) return null;

  const userTools = server.tool_schemas.filter(t => !t.admin_only);
  const adminTools = server.tool_schemas.filter(t => t.admin_only);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl flex flex-col border border-zinc-200 dark:border-zinc-800"
        style={{ maxHeight: '85vh', boxShadow: '0 24px 64px rgba(0,0,0,0.16)' }}
        role="dialog"
        aria-modal="true"
        aria-label={`Tool permissions — ${server.name}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 shrink-0" style={{ borderBottom: '1px solid #f4f4f5' }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[15px] font-bold shrink-0"
              style={{ background: INTEGRATION_COLORS[server.server_type] ?? '#71717a' }}>
              {server.server_type.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-zinc-900 truncate">{server.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <HealthBadge isActive={server.is_active} health={health} />
                {server.requires_approval && (
                  <>
                    <span className="text-zinc-300">·</span>
                    <span className="text-[11.5px] text-purple-600">Approval required</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors shrink-0"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Error banner */}
        {server.is_active && health === 'error' && (
          <div className="flex items-start gap-2.5 mx-6 mt-4 px-3.5 py-3 rounded-xl text-[12.5px] text-red-700 shrink-0"
            style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <div className="font-semibold mb-0.5">Connection failed</div>
              <div className="text-red-600 text-[11.5px]">Credentials may be invalid or expired. Close this dialog and edit the integration to update them.</div>
            </div>
          </div>
        )}

        {/* Summary bar */}
        <div className="flex items-center gap-6 px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #f4f4f5', background: '#fafafa', marginTop: server.is_active && health === 'error' ? 0 : undefined }}>
          {[
            { value: server.tool_schemas.length, label: 'Total', color: '#18181b' },
            { value: userTools.length, label: 'User', color: '#1d4ed8' },
            { value: adminTools.length, label: 'Admin only', color: '#b45309' },
            { value: server.tool_schemas.filter(t => t.read_only).length, label: 'Read-only', color: '#a1a1aa' },
          ].map((stat, i, arr) => (
            <div key={stat.label} className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-[20px] font-bold" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-wide mt-0.5">{stat.label}</div>
              </div>
              {i < arr.length - 1 && <div className="w-px h-8 bg-zinc-200" />}
            </div>
          ))}
        </div>

        {/* Tool list — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {server.tool_schemas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-8">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center mb-3 text-zinc-400">
                <WrenchIcon size={18} />
              </div>
              <p className="text-[13px] font-medium text-zinc-500 mb-1">No tools configured</p>
              <p className="text-[12px] text-zinc-400">Edit this integration to add tool schemas.</p>
            </div>
          ) : (
            <>
              {userTools.length > 0 && (
                <div>
                  <DrawerSectionHeader
                    label="User tools"
                    description="Available to all users in your organisation"
                    color="blue"
                    icon={<UserIcon />}
                  />
                  {userTools.map(t => (
                    <DrawerToolRow
                      key={t.name}
                      tool={{ ...t, admin_only: false }}
                      serverId={server.id}
                      togglingKey={togglingKey}
                      onToggle={onToggleTool}
                    />
                  ))}
                </div>
              )}
              {adminTools.length > 0 && (
                <div>
                  <DrawerSectionHeader
                    label="Admin-only tools"
                    description="Restricted — only admins can trigger these"
                    color="amber"
                    icon={<ShieldIcon />}
                  />
                  {adminTools.map(t => (
                    <DrawerToolRow
                      key={t.name}
                      tool={{ ...t, admin_only: true }}
                      serverId={server.id}
                      togglingKey={togglingKey}
                      onToggle={onToggleTool}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderTop: '1px solid #f4f4f5' }}>
          <p className="text-[11.5px] text-zinc-400">Toggle any tool to move it between user and admin access.</p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-[13px] font-medium rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function DrawerSectionHeader({ label, description, color, icon }: {
  label: string; description: string; color: 'blue' | 'amber'; icon: React.ReactNode;
}) {
  const textColor = color === 'blue' ? '#1d4ed8' : '#b45309';
  const bgColor = color === 'blue' ? '#eff6ff' : '#fffbeb';
  return (
    <div className="flex items-start gap-2.5 px-6 py-3 sticky top-0" style={{ background: bgColor, borderBottom: '1px solid #f4f4f5' }}>
      <span style={{ color: textColor, marginTop: 1 }}>{icon}</span>
      <div>
        <div className="text-[12px] font-semibold" style={{ color: textColor }}>{label}</div>
        <div className="text-[11px] text-zinc-400 mt-0.5">{description}</div>
      </div>
    </div>
  );
}

function DrawerToolRow({ tool, serverId, togglingKey, onToggle }: {
  tool: ToolSchema & { admin_only: boolean };
  serverId: string;
  togglingKey: string | null;
  onToggle: (serverId: string, toolName: string, currentAdminOnly: boolean) => void;
}) {
  const saving = togglingKey === `${serverId}:${tool.name}`;

  return (
    <div
      className="flex items-start gap-3 px-6 py-4 hover:bg-zinc-50 transition-colors"
      style={{ borderBottom: '1px solid #f9f9f9' }}
    >
      {/* Tool info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-[13px] font-medium text-zinc-800">{fmtToolName(tool.name)}</span>
          {tool.read_only && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>
              Read only
            </span>
          )}
        </div>
        {tool.description && (
          <p className="text-[11.5px] text-zinc-400 leading-snug">{tool.description}</p>
        )}
        <code className="text-[10px] text-zinc-300 mt-1 block">{tool.name}</code>
      </div>

      {/* Toggle */}
      <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
        {saving ? (
          <span className="text-[10.5px] text-zinc-400">Saving…</span>
        ) : (
          <>
            <Toggle
              checked={tool.admin_only}
              onChange={() => onToggle(serverId, tool.name, tool.admin_only)}
              label={`${tool.admin_only ? 'Admin only' : 'All users'}: ${tool.name}`}
            />
            <span className="text-[10px]" style={{ color: tool.admin_only ? '#b45309' : '#1d4ed8' }}>
              {tool.admin_only ? 'Admin only' : 'All users'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Empty MCP state ───────────────────────────────────────────────────────────

function EmptyMcpState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center rounded-2xl bg-white"
      style={{ border: '1.5px dashed #d4d4d8' }}
    >
      <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center mb-3 text-zinc-400" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </div>
      <p className="text-[13.5px] font-semibold text-zinc-600 mb-1">No custom MCP servers</p>
      <p className="text-[12px] text-zinc-400 mb-4 max-w-xs">
        Connect any MCP-compatible service by URL, or configure a custom integration manually.
      </p>
      <Button size="sm" onClick={onAdd}>Add server</Button>
    </div>
  );
}

// ── Inline SVG icon helpers ───────────────────────────────────────────────────

function UserIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function WrenchIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}
