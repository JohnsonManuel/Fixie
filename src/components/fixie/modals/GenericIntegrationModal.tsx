/**
 * GenericIntegrationModal
 *
 * A single reusable modal that handles credential collection, test-connection,
 * and save for all catalog integrations (Jira, GitHub, Slack, PagerDuty, etc.).
 *
 * Each integration declares a CredentialFieldConfig array that describes its
 * required/optional fields.  The modal renders them, calls the shared
 * /api/admin/integrations/test endpoint, and saves via POST or PATCH.
 */
import { useState, useEffect } from 'react';
import { Modal }    from '../ui/Modal';
import { Button }   from '../ui/Button';
import { Toggle }   from '../ui/Toggle';
import { apiPost, apiPatch } from '../../../lib/fixie/api';
import { useToast } from '../../../hooks/useFixieToast';
import type { IntegrationConfig } from '../../../types/fixie';

// ── Credential field definition ───────────────────────────────────────────────

export interface CredentialField {
  key:          string;
  label:        string;
  type:         'text' | 'password' | 'select' | 'url';
  placeholder?: string;
  hint?:        string;
  options?:     string[];   // for select type
  optional?:    boolean;
}

export interface IntegrationFormConfig {
  slug:        string;
  label:       string;
  fields:      CredentialField[];
  /** Derive a display name from credentials (shown under the label in the card) */
  displayValue?: (creds: Record<string, string>) => string;
}

// ── Per-integration configs ───────────────────────────────────────────────────

export const INTEGRATION_CONFIGS: Record<string, IntegrationFormConfig> = {
  zendesk: {
    slug:  'zendesk',
    label: 'Zendesk',
    fields: [
      { key: 'subdomain',  label: 'Subdomain',    type: 'text',     placeholder: 'yourcompany',          hint: 'The part before .zendesk.com' },
      { key: 'email',      label: 'Agent Email',  type: 'text',     placeholder: 'you@yourcompany.com' },
      { key: 'api_token',  label: 'API Token',    type: 'password', placeholder: 'Zendesk API token',    hint: 'Admin → Apps & Integrations → APIs → Zendesk API' },
    ],
    displayValue: c => c.subdomain ? `${c.subdomain}.zendesk.com` : '',
  },
  jira: {
    slug:  'jira',
    label: 'Jira',
    fields: [
      { key: 'domain',     label: 'Domain',       type: 'text',     placeholder: 'yourcompany.atlassian.net' },
      { key: 'email',      label: 'Email',        type: 'text',     placeholder: 'you@yourcompany.com' },
      { key: 'api_token',  label: 'API Token',    type: 'password', placeholder: 'Atlassian API token',  hint: 'id.atlassian.com → Security → Create and manage API tokens' },
    ],
    displayValue: c => c.domain || '',
  },
  servicenow: {
    slug:  'servicenow',
    label: 'ServiceNow',
    fields: [
      { key: 'instance_url', label: 'Instance URL', type: 'text',     placeholder: 'yourinstance.service-now.com', hint: 'Your ServiceNow instance hostname' },
      { key: 'username',     label: 'Username',     type: 'text',     placeholder: 'admin' },
      { key: 'password',     label: 'Password',     type: 'password', placeholder: '••••••••' },
    ],
    displayValue: c => c.instance_url || '',
  },
  github: {
    slug:  'github',
    label: 'GitHub',
    fields: [
      { key: 'token', label: 'Personal Access Token', type: 'password', placeholder: 'ghp_... or github_pat_...', hint: 'github.com → Settings → Developer settings → Personal access tokens. Needs repo scope.' },
    ],
    displayValue: () => 'github.com',
  },
  gitlab: {
    slug:  'gitlab',
    label: 'GitLab',
    fields: [
      { key: 'token',    label: 'Personal Access Token', type: 'password', placeholder: 'glpat-...', hint: 'gitlab.com → User Settings → Access Tokens. Needs api scope.' },
      { key: 'base_url', label: 'GitLab URL',            type: 'url',      placeholder: 'https://gitlab.com', hint: 'Leave as default for gitlab.com, or enter your self-hosted URL', optional: true },
    ],
    displayValue: c => c.base_url || 'gitlab.com',
  },
  jenkins: {
    slug:  'jenkins',
    label: 'Jenkins',
    fields: [
      { key: 'base_url',  label: 'Jenkins URL',  type: 'url',      placeholder: 'https://jenkins.yourcompany.com' },
      { key: 'username',  label: 'Username',     type: 'text',     placeholder: 'admin' },
      { key: 'api_token', label: 'API Token',    type: 'password', placeholder: 'Jenkins API token', hint: 'User → Configure → Add new Token' },
    ],
    displayValue: c => c.base_url || '',
  },
  linear: {
    slug:  'linear',
    label: 'Linear',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'lin_api_...', hint: 'linear.app → Settings → API → Personal API keys' },
    ],
    displayValue: () => 'linear.app',
  },
  slack: {
    slug:  'slack',
    label: 'Slack',
    fields: [
      { key: 'bot_token', label: 'Bot Token', type: 'password', placeholder: 'xoxb-...', hint: 'api.slack.com/apps → Your App → OAuth & Permissions → Bot User OAuth Token' },
    ],
    displayValue: () => 'Slack workspace',
  },
  datadog: {
    slug:  'datadog',
    label: 'Datadog',
    fields: [
      { key: 'api_key', label: 'API Key',         type: 'password', placeholder: 'Datadog API key',         hint: 'Organization Settings → API Keys' },
      { key: 'app_key', label: 'Application Key', type: 'password', placeholder: 'Datadog Application key', hint: 'Organization Settings → Application Keys' },
      {
        key: 'site', label: 'Datadog Site', type: 'select',
        options: ['datadoghq.com', 'datadoghq.eu', 'us3.datadoghq.com', 'us5.datadoghq.com', 'ap1.datadoghq.com'],
        hint: 'Your Datadog region (default: US)', optional: true,
      },
    ],
    displayValue: c => c.site || 'datadoghq.com',
  },
  newrelic: {
    slug:  'newrelic',
    label: 'New Relic',
    fields: [
      { key: 'api_key',    label: 'User API Key', type: 'password', placeholder: 'NRAK-...', hint: 'one.newrelic.com → Profile → API keys → Create a key (User type)' },
      { key: 'account_id', label: 'Account ID',   type: 'text',     placeholder: '1234567',  hint: 'Found in New Relic URL: one.newrelic.com/accounts/{accountId}' },
    ],
    displayValue: c => c.account_id ? `Account ${c.account_id}` : 'New Relic',
  },
  pagerduty: {
    slug:  'pagerduty',
    label: 'PagerDuty',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'PagerDuty API key', hint: 'Integrations → API Access Keys → Create New API Key' },
    ],
    displayValue: () => 'pagerduty.com',
  },
  opsgenie: {
    slug:  'opsgenie',
    label: 'OpsGenie',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'OpsGenie API key', hint: 'Teams → Integrations → Add Integration → API → API Key' },
    ],
    displayValue: () => 'opsgenie.com',
  },
  confluence: {
    slug:  'confluence',
    label: 'Confluence',
    fields: [
      { key: 'domain',    label: 'Domain',    type: 'text',     placeholder: 'yourcompany.atlassian.net' },
      { key: 'email',     label: 'Email',     type: 'text',     placeholder: 'you@yourcompany.com' },
      { key: 'api_token', label: 'API Token', type: 'password', placeholder: 'Atlassian API token', hint: 'Same token as Jira — id.atlassian.com → Security → API tokens' },
    ],
    displayValue: c => c.domain || '',
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

type Tab = 'credentials' | 'url';
type TestStatus = 'idle' | 'testing' | 'ok' | 'fail';
type DiscoverStatus = 'idle' | 'loading' | 'ok' | 'fail';
interface ToolSchema { name: string; description: string; input_schema: Record<string, unknown>; }

export function GenericIntegrationModal({
  open, onClose, onSuccess, slug, editingId, allServers,
}: {
  open:       boolean;
  onClose:    () => void;
  onSuccess:  () => void;
  slug:       string;
  editingId:  string | null;
  allServers: IntegrationConfig[];
}) {
  const { toast }   = useToast();
  const config      = INTEGRATION_CONFIGS[slug];
  const existing    = editingId ? allServers.find(x => x.id === editingId) : null;

  // ── Tab ────────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>('credentials');

  // ── Credential field values ────────────────────────────────────────────────
  const [values, setValues] = useState<Record<string, string>>({});

  // ── Test state ─────────────────────────────────────────────────────────────
  const [testStatus,  setTestStatus]  = useState<TestStatus>('idle');
  const [testMessage, setTestMessage] = useState('');

  // ── URL tab state ──────────────────────────────────────────────────────────
  const [serverUrl,          setServerUrl]          = useState('');
  const [urlApproval,        setUrlApproval]        = useState(true);
  const [discoverStatus,     setDiscoverStatus]     = useState<DiscoverStatus>('idle');
  const [discoverError,      setDiscoverError]      = useState('');
  const [discoveredSchemas,  setDiscoveredSchemas]  = useState<ToolSchema[]>([]);

  // ── Shared ─────────────────────────────────────────────────────────────────
  const [approval,  setApproval]  = useState(true);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);

  // ── Reset on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open || !config) return;
    setError(''); setTestStatus('idle'); setTestMessage('');
    setDiscoverStatus('idle'); setDiscoverError(''); setDiscoveredSchemas([]);

    if (existing) {
      setTab(existing.server_url ? 'url' : 'credentials');
      const populated: Record<string, string> = {};
      config.fields.forEach(f => {
        populated[f.key] = existing.credentials?.[f.key] ?? '';
      });
      setValues(populated);
      setApproval(existing.requires_approval ?? true);
      setServerUrl(existing.server_url ?? '');
      setUrlApproval(existing.requires_approval ?? true);
      if (existing.server_url && existing.tool_schemas?.length) {
        setDiscoveredSchemas(existing.tool_schemas as ToolSchema[]);
        setDiscoverStatus('ok');
      }
    } else {
      setTab('credentials');
      const empty: Record<string, string> = {};
      config.fields.forEach(f => { empty[f.key] = f.type === 'select' && f.options ? f.options[0] : ''; });
      setValues(empty);
      setApproval(true);
      setServerUrl('');
    }
  }, [open, editingId, slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const setValue = (key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
    setTestStatus('idle');
    setTestMessage('');
  };

  // ── Test connection ────────────────────────────────────────────────────────
  const testConnection = async () => {
    const requiredMissing = config.fields.filter(f => !f.optional && !values[f.key]?.trim());
    if (requiredMissing.length) {
      setError(`Please fill in: ${requiredMissing.map(f => f.label).join(', ')}`);
      return;
    }
    setError(''); setTestStatus('testing'); setTestMessage('');
    const credentials: Record<string, string> = {};
    config.fields.forEach(f => { if (values[f.key]?.trim()) credentials[f.key] = values[f.key].trim(); });
    try {
      await apiPost('/api/admin/integrations/test', { server_type: slug, credentials });
      setTestStatus('ok');
      setTestMessage('Connection successful — credentials are valid.');
    } catch (e: unknown) {
      setTestStatus('fail');
      setTestMessage(e instanceof Error ? e.message : 'Connection failed.');
    }
  };

  // ── URL tab: discover tools ────────────────────────────────────────────────
  const handleDiscover = async () => {
    if (!serverUrl.trim()) { setDiscoverError('Enter a server URL first.'); return; }
    setDiscoverStatus('loading'); setDiscoverError(''); setDiscoveredSchemas([]);
    try {
      const res = await apiPost<{ tool_schemas: ToolSchema[] }>(
        '/api/admin/integrations/discover',
        { server_url: serverUrl.trim() },
      );
      setDiscoveredSchemas(res.tool_schemas);
      setDiscoverStatus('ok');
    } catch (e: unknown) {
      setDiscoverStatus('fail');
      setDiscoverError(e instanceof Error ? e.message : 'Could not connect to MCP server.');
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submit = async () => {
    setLoading(true); setError('');
    try {
      if (tab === 'credentials') {
        const requiredMissing = config.fields.filter(f => !f.optional && !values[f.key]?.trim());
        if (requiredMissing.length && !editingId) {
          setError(`Please fill in: ${requiredMissing.map(f => f.label).join(', ')}`);
          return;
        }
        const credentials: Record<string, string> = {};
        config.fields.forEach(f => {
          const v = values[f.key]?.trim();
          // On edit, skip password fields if left blank (keep existing)
          if (v || !editingId) credentials[f.key] = v ?? '';
          else if (v) credentials[f.key] = v;
        });
        // For edit: only include non-empty values so we don't blank out existing secrets
        const credsToSend: Record<string, string> = {};
        config.fields.forEach(f => {
          const v = values[f.key]?.trim();
          if (v) credsToSend[f.key] = v;
        });

        if (editingId) {
          await apiPatch(`/api/admin/integrations/${editingId}`, {
            credentials: credsToSend,
            requires_approval: approval,
            server_url: null,
          });
          toast(`${config.label} updated`);
        } else {
          await apiPost('/api/admin/integrations', {
            name:              config.label,
            server_type:       slug,
            credentials:       credsToSend,
            tool_schemas:      [],  // backend pulls canonical schemas from REGISTRY
            requires_approval: approval,
            is_active:         true,
          });
          toast(`${config.label} connected`);
        }
      } else {
        // URL tab
        if (!serverUrl.trim()) { setError('Server URL is required.'); return; }
        if (!discoveredSchemas.length && !editingId) { setError('Discover tools before saving.'); return; }
        const payload = {
          server_url:        serverUrl.trim(),
          credentials:       {},
          tool_schemas:      discoveredSchemas,
          requires_approval: urlApproval,
        };
        if (editingId) {
          await apiPatch(`/api/admin/integrations/${editingId}`, payload);
          toast(`${config.label} updated`);
        } else {
          await apiPost('/api/admin/integrations', {
            name: config.label, server_type: slug, is_active: true, ...payload,
          });
          toast(`${config.label} connected via MCP`);
        }
      }
      onClose(); onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save.');
    } finally {
      setLoading(false);
    }
  };

  if (!config) return null;

  const allRequiredFilled = config.fields.every(f => f.optional || !!values[f.key]?.trim());
  const canSaveCreds = testStatus === 'ok' || (!!editingId && !config.fields.some(f => !f.optional && !!values[f.key]?.trim() && testStatus === 'idle'));
  const canSaveCredsLoose = testStatus === 'ok' || !!editingId;
  const canSaveUrl   = !!serverUrl.trim() && (discoverStatus === 'ok' || !!editingId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingId ? `Edit ${config.label}` : `Connect ${config.label}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={submit}
            disabled={loading || (tab === 'credentials' ? !canSaveCredsLoose : !canSaveUrl)}
            title={tab === 'credentials' && !canSaveCredsLoose ? 'Test your connection before saving' : undefined}
          >
            {loading ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: '#f1f5f9' }}>
        {([['credentials', 'API Credentials'], ['url', 'MCP Server URL']] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(''); }}
            className="flex-1 py-2 text-[13px] font-medium rounded-lg transition-all"
            style={
              tab === t
                ? { background: 'white', color: '#1877F2', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', fontWeight: 600 }
                : { color: '#6b7280' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Credentials tab ─────────────────────────────────────────────────── */}
      {tab === 'credentials' && (
        <div className="flex flex-col gap-4">
          {config.fields.map((field, idx) => (
            <div key={field.key}>
              <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
                {field.label}
                {field.optional && <span className="text-neutral-400 font-normal ml-1.5">(optional)</span>}
                {editingId && field.type === 'password' && (
                  <span className="text-neutral-400 font-normal ml-1.5">(leave blank to keep existing)</span>
                )}
              </label>

              {field.type === 'select' ? (
                <select
                  value={values[field.key] ?? ''}
                  onChange={e => setValue(field.key, e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-[13.5px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
                >
                  {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <div className={idx === config.fields.length - 1 ? 'flex gap-2' : ''}>
                  <input
                    type={field.type === 'password' ? 'password' : field.type === 'url' ? 'url' : 'text'}
                    value={values[field.key] ?? ''}
                    onChange={e => setValue(field.key, e.target.value)}
                    placeholder={field.placeholder ?? ''}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-[13.5px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  {/* Put Test button next to last field */}
                  {idx === config.fields.length - 1 && (
                    <Button
                      variant="outline"
                      onClick={testConnection}
                      disabled={testStatus === 'testing' || !allRequiredFilled}
                    >
                      {testStatus === 'testing' ? 'Testing…' : 'Test'}
                    </Button>
                  )}
                </div>
              )}

              {field.hint && (
                <p className="text-[11.5px] text-neutral-400 mt-1">{field.hint}</p>
              )}
            </div>
          ))}

          {/* Test result */}
          {testStatus === 'ok' && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[13px] text-green-700" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <span>✓</span> {testMessage}
            </div>
          )}
          {testStatus === 'fail' && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[13px] text-red-700" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <span>✗</span> {testMessage}
            </div>
          )}
          {testStatus === 'idle' && !editingId && (
            <p className="text-[12px] text-neutral-400">Test your connection before saving.</p>
          )}

          {/* Approval toggle */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="text-[13px] font-medium text-neutral-700">Require Admin Approval</div>
              <p className="text-[11.5px] text-neutral-400 mt-0.5">Every action must be reviewed before executing.</p>
            </div>
            <Toggle checked={approval} onChange={setApproval} label="Require admin approval" />
          </div>
        </div>
      )}

      {/* ── URL tab ─────────────────────────────────────────────────────────── */}
      {tab === 'url' && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">MCP Server URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={serverUrl}
                onChange={e => { setServerUrl(e.target.value); setDiscoverStatus('idle'); setDiscoveredSchemas([]); setDiscoverError(''); }}
                placeholder={`https://${slug}-mcp.example.com/sse`}
                className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-[13.5px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <Button
                variant="outline"
                onClick={handleDiscover}
                disabled={discoverStatus === 'loading' || !serverUrl.trim()}
              >
                {discoverStatus === 'loading' ? 'Connecting…' : 'Discover Tools'}
              </Button>
            </div>
            <p className="text-[11.5px] text-neutral-400 mt-1">
              Use this if you're running a {config.label}-compatible MCP server.
            </p>
          </div>

          {discoverStatus === 'ok' && discoveredSchemas.length > 0 && (
            <div className="rounded-xl p-3.5" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div className="flex items-center gap-2 text-[13px] font-semibold text-green-700 mb-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                {discoveredSchemas.length} tool{discoveredSchemas.length !== 1 ? 's' : ''} discovered
              </div>
              <div className="flex flex-wrap gap-1.5">
                {discoveredSchemas.map(t => (
                  <span key={t.name} className="text-[11px] px-2 py-0.5 rounded-full font-mono text-green-700" style={{ background: '#dcfce7', border: '1px solid #bbf7d0' }}>
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {discoverStatus === 'fail' && (
            <div className="flex items-start gap-2 rounded-xl px-3.5 py-3 text-[13px] text-red-700" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {discoverError}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-medium text-neutral-700">Require Admin Approval</div>
              <p className="text-[11.5px] text-neutral-400 mt-0.5">Every action must be reviewed before executing.</p>
            </div>
            <Toggle checked={urlApproval} onChange={setUrlApproval} label="Require admin approval" />
          </div>
        </div>
      )}

      {error && <p className="text-[12.5px] text-red-500 mt-3">{error}</p>}
    </Modal>
  );
}
