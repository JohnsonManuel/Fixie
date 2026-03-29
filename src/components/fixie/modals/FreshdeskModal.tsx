import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Toggle } from '../ui/Toggle';
import { apiPost, apiPatch } from '../../../lib/fixie/api';
import { useToast } from '../../../hooks/useFixieToast';
import { FRESHDESK_SCHEMAS } from '../../../lib/fixie/freshdesk-schemas';
import type { IntegrationConfig } from '../../../types/fixie';

type Tab = 'apikey' | 'url';
type TestStatus = 'idle' | 'testing' | 'ok' | 'fail';
type DiscoverStatus = 'idle' | 'loading' | 'ok' | 'fail';
interface ToolSchema { name: string; description: string; input_schema: Record<string, unknown>; }

export function FreshdeskModal({
  open, onClose, onSuccess, editingId, allServers,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingId: string | null;
  allServers: IntegrationConfig[];
}) {
  const { toast } = useToast();
  const existing = editingId ? allServers.find(x => x.id === editingId) : null;

  // ── Tab ────────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>('apikey');

  // ── API Key tab ────────────────────────────────────────────────────────────
  const [domain, setDomain]         = useState('');
  const [apiKey, setApiKey]         = useState('');
  const [approval, setApproval]     = useState(true);
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testMessage, setTestMessage] = useState('');

  // ── URL tab ────────────────────────────────────────────────────────────────
  const [serverUrl, setServerUrl]           = useState('');
  const [urlApproval, setUrlApproval]       = useState(true);
  const [discoverStatus, setDiscoverStatus] = useState<DiscoverStatus>('idle');
  const [discoverError, setDiscoverError]   = useState('');
  const [discoveredSchemas, setDiscoveredSchemas] = useState<ToolSchema[]>([]);

  // ── Shared ─────────────────────────────────────────────────────────────────
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(''); setTestStatus('idle'); setTestMessage('');
    setDiscoverStatus('idle'); setDiscoverError(''); setDiscoveredSchemas([]);

    if (existing) {
      // If already connected via MCP URL, default to URL tab
      setTab(existing.server_url ? 'url' : 'apikey');
      // API key tab
      setDomain(existing.credentials?.domain ?? '');
      setApiKey('');
      setApproval(existing.requires_approval ?? true);
      // URL tab
      setServerUrl(existing.server_url ?? '');
      setUrlApproval(existing.requires_approval ?? true);
      if (existing.server_url && existing.tool_schemas?.length) {
        setDiscoveredSchemas(existing.tool_schemas as ToolSchema[]);
        setDiscoverStatus('ok');
      }
    } else {
      setTab('apikey');
      setDomain(''); setApiKey(''); setApproval(true);
      setServerUrl(''); setUrlApproval(true);
    }
  }, [open, editingId, allServers]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── API key: test connection ───────────────────────────────────────────────
  const testConnection = async () => {
    if (!domain.trim()) { setError('Please enter your Freshdesk domain.'); return; }
    if (!apiKey.trim()) { setError('API key is required to test the connection.'); return; }
    setError(''); setTestStatus('testing'); setTestMessage('');
    try {
      await apiPost('/api/admin/integrations/test', {
        server_type: 'freshdesk',
        credentials: { domain: domain.trim(), api_key: apiKey.trim() },
      });
      setTestStatus('ok');
      setTestMessage('Connection successful — credentials are valid.');
    } catch (e: unknown) {
      setTestStatus('fail');
      setTestMessage(e instanceof Error ? e.message : 'Connection failed.');
    }
  };

  // ── URL: discover tools ────────────────────────────────────────────────────
  const handleDiscover = async () => {
    if (!serverUrl.trim()) { setDiscoverError('Enter a server URL first.'); return; }
    setDiscoverStatus('loading'); setDiscoverError(''); setDiscoveredSchemas([]);
    try {
      const res = await apiPost<{ tool_schemas: ToolSchema[]; tool_count: number }>(
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
      if (tab === 'apikey') {
        if (!domain.trim()) { setError('Please enter your Freshdesk domain.'); return; }
        const credentials: Record<string, string> = { domain: domain.trim() };
        if (apiKey.trim()) credentials.api_key = apiKey.trim();
        if (editingId) {
          await apiPatch(`/api/admin/integrations/${editingId}`, {
            credentials, requires_approval: approval, server_url: null,
          });
          toast('Freshdesk updated');
        } else {
          await apiPost('/api/admin/integrations', {
            name: 'Freshdesk', server_type: 'freshdesk',
            credentials, tool_schemas: FRESHDESK_SCHEMAS,
            requires_approval: approval, is_active: true,
          });
          toast('Freshdesk connected');
        }
      } else {
        if (!serverUrl.trim()) { setError('Server URL is required.'); return; }
        if (!discoveredSchemas.length && !editingId) { setError('Discover tools before saving.'); return; }
        if (editingId) {
          await apiPatch(`/api/admin/integrations/${editingId}`, {
            server_url: serverUrl.trim(),
            credentials: {},
            tool_schemas: discoveredSchemas,
            requires_approval: urlApproval,
          });
          toast('Freshdesk updated');
        } else {
          await apiPost('/api/admin/integrations', {
            name: 'Freshdesk', server_type: 'freshdesk',
            server_url: serverUrl.trim(), credentials: {},
            tool_schemas: discoveredSchemas,
            requires_approval: urlApproval, is_active: true,
          });
          toast('Freshdesk connected via MCP');
        }
      }
      onClose(); onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save.');
    } finally {
      setLoading(false);
    }
  };

  const canSaveApiKey = testStatus === 'ok' || (!!editingId && !apiKey.trim());
  const canSaveUrl    = !!serverUrl.trim() && (discoverStatus === 'ok' || !!editingId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingId ? 'Edit Freshdesk' : 'Connect Freshdesk'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={submit}
            disabled={loading || (tab === 'apikey' ? !canSaveApiKey : !canSaveUrl)}
            title={tab === 'apikey' && !canSaveApiKey ? 'Test connection first' : undefined}
          >
            {loading ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: '#f1f5f9' }}>
        {([['apikey', 'API Key'], ['url', 'MCP Server URL']] as [Tab, string][]).map(([t, label]) => (
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

      {/* ── API Key tab ───────────────────────────────────────────────────── */}
      {tab === 'apikey' && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Freshdesk Domain</label>
            <input
              type="text"
              value={domain}
              onChange={e => { setDomain(e.target.value); setTestStatus('idle'); setTestMessage(''); }}
              placeholder="yourcompany.freshdesk.com"
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-[13.5px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <p className="text-[11.5px] text-neutral-400 mt-1">Your Freshdesk subdomain (e.g. acme.freshdesk.com)</p>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
              API Key
              {editingId && <span className="text-neutral-400 font-normal ml-1.5">(leave blank to keep existing)</span>}
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={e => { setApiKey(e.target.value); setTestStatus('idle'); setTestMessage(''); }}
                placeholder={editingId ? '••••••••' : 'Your Freshdesk API key'}
                className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-[13.5px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <Button
                variant="outline"
                onClick={testConnection}
                disabled={testStatus === 'testing' || !domain.trim() || !apiKey.trim()}
              >
                {testStatus === 'testing' ? 'Testing…' : 'Test'}
              </Button>
            </div>
          </div>

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

          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-medium text-neutral-700">Require Admin Approval</div>
              <p className="text-[11.5px] text-neutral-400 mt-0.5">Every ticket action must be reviewed before executing.</p>
            </div>
            <Toggle checked={approval} onChange={setApproval} label="Require admin approval" />
          </div>
        </div>
      )}

      {/* ── URL tab ───────────────────────────────────────────────────────── */}
      {tab === 'url' && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">MCP Server URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={serverUrl}
                onChange={e => { setServerUrl(e.target.value); setDiscoverStatus('idle'); setDiscoveredSchemas([]); setDiscoverError(''); }}
                placeholder="https://freshdesk-mcp.example.com/sse"
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
              Use this if you're running a Freshdesk MCP-compatible server.
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
              <p className="text-[11.5px] text-neutral-400 mt-0.5">Every ticket action must be reviewed before executing.</p>
            </div>
            <Toggle checked={urlApproval} onChange={setUrlApproval} label="Require admin approval" />
          </div>
        </div>
      )}

      {error && <p className="text-[12.5px] text-red-500 mt-3">{error}</p>}
    </Modal>
  );
}
