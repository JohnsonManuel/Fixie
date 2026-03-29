import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Toggle } from '../ui/Toggle';
import { apiPost, apiPatch } from '../../../lib/fixie/api';
import { useToast } from '../../../hooks/useFixieToast';
import type { IntegrationConfig } from '../../../types/fixie';

type Tab = 'url' | 'manual';
type DiscoverStatus = 'idle' | 'loading' | 'ok' | 'fail';

interface ToolSchema { name: string; description: string; input_schema: Record<string, unknown>; }

export function CustomServerModal({
  open, onClose, onSuccess, editingId, allServers, initialServerType,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingId: string | null;
  allServers: IntegrationConfig[];
  initialServerType?: string;
}) {
  const { toast } = useToast();
  const existing = editingId ? allServers.find(x => x.id === editingId) : null;

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>('url');

  // ── URL tab state ──────────────────────────────────────────────────────────
  const [serverUrl, setServerUrl]           = useState('');
  const [urlName, setUrlName]               = useState('');
  const [urlApproval, setUrlApproval]       = useState(true);
  const [discoverStatus, setDiscoverStatus] = useState<DiscoverStatus>('idle');
  const [discoverError, setDiscoverError]   = useState('');
  const [discoveredSchemas, setDiscoveredSchemas] = useState<ToolSchema[]>([]);

  // ── Manual tab state ───────────────────────────────────────────────────────
  const [name, setName]         = useState('');
  const [type, setType]         = useState('');
  const [url, setUrl]           = useState('');
  const [approval, setApproval] = useState(true);
  const [creds, setCreds]       = useState('');
  const [tools, setTools]       = useState('');

  // ── Shared ─────────────────────────────────────────────────────────────────
  const [routingHint, setRoutingHint] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(''); setDiscoverError(''); setDiscoverStatus('idle'); setDiscoveredSchemas([]);

    if (existing) {
      // Default to URL tab if the server has a server_url
      setTab(existing.server_url ? 'url' : 'manual');

      // Populate URL tab
      setServerUrl(existing.server_url ?? '');
      setUrlName(existing.name);
      setUrlApproval(existing.requires_approval);
      setDiscoveredSchemas(existing.tool_schemas as ToolSchema[] ?? []);
      if (existing.server_url && existing.tool_schemas?.length) setDiscoverStatus('ok');

      // Populate Manual tab
      setName(existing.name);
      setType(existing.server_type);
      setUrl(existing.server_url ?? '');
      setApproval(existing.requires_approval);
      setCreds(JSON.stringify(existing.credentials, null, 2));
      setTools(JSON.stringify(existing.tool_schemas, null, 2));
      setRoutingHint(existing.routing_hint ?? '');
    } else {
      setServerUrl(''); setUrlName(''); setUrlApproval(true);
      setUrl(''); setApproval(true); setCreds(''); setTools('');
      setRoutingHint('');
      if (initialServerType) {
        setTab('manual');
        setType(initialServerType);
        setName('');
      } else {
        setTab('url');
        setName(''); setType('');
      }
    }
  }, [open, editingId, allServers]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── URL tab: discover tools ────────────────────────────────────────────────
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
      if (!urlName.trim()) setUrlName(new URL(serverUrl.trim()).hostname);
    } catch (e: unknown) {
      setDiscoverStatus('fail');
      setDiscoverError(e instanceof Error ? e.message : 'Could not connect to MCP server.');
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submit = async () => {
    setError(''); setLoading(true);
    try {
      if (tab === 'url') {
        if (!serverUrl.trim())    { setError('Server URL is required.'); return; }
        if (!urlName.trim())      { setError('Name is required.'); return; }
        if (!discoveredSchemas.length && !editingId) { setError('Discover tools before saving.'); return; }

        const payload = {
          name: urlName.trim(),
          server_type: 'mcp',
          server_url:  serverUrl.trim(),
          credentials: {},
          tool_schemas: discoveredSchemas,
          requires_approval: urlApproval,
          routing_hint: routingHint.trim() || null,
        };
        if (editingId) {
          await apiPatch(`/api/admin/integrations/${editingId}`, payload);
          toast('Integration updated');
        } else {
          await apiPost('/api/admin/integrations', { ...payload, is_active: true });
          toast('MCP server connected');
        }
      } else {
        if (!name.trim() || !type) { setError('Name and server type are required.'); return; }
        let credentials = {}, tool_schemas: unknown[] = [];
        try { credentials  = creds.trim()  ? JSON.parse(creds)  : {}; } catch { setError('Invalid JSON in Credentials.');    return; }
        try { tool_schemas = tools.trim() ? JSON.parse(tools) : []; } catch { setError('Invalid JSON in Tool Schemas.');    return; }

        const payload = { name, credentials, tool_schemas, requires_approval: approval, routing_hint: routingHint.trim() || null };
        if (editingId) {
          await apiPatch(`/api/admin/integrations/${editingId}`, payload);
          toast('Server updated');
        } else {
          await apiPost('/api/admin/integrations', {
            ...payload, server_type: type, server_url: url.trim() || null, is_active: true,
          });
          toast('Server added');
        }
      }
      onClose(); onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save.');
    } finally {
      setLoading(false);
    }
  };

  const canSaveUrl    = !!serverUrl.trim() && !!urlName.trim() && (discoverStatus === 'ok' || !!editingId);
  const canSaveManual = !!name.trim() && !!type;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingId ? 'Edit Integration' : 'Add Custom Integration'}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading || (tab === 'url' ? !canSaveUrl : !canSaveManual)}>
            {loading ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: '#f1f5f9' }}>
        {([['url', 'Connect via URL'], ['manual', 'Manual Setup']] as [Tab, string][]).map(([t, label]) => (
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
                placeholder="https://your-mcp-server.com/sse"
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
              The SSE or HTTP endpoint of your MCP-compatible server.
            </p>
          </div>

          {/* Discovery result */}
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

          <div>
            <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Integration Name</label>
            <input
              type="text"
              value={urlName}
              onChange={e => setUrlName(e.target.value)}
              placeholder="My MCP Server"
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-[13.5px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-center justify-between py-0.5">
            <div>
              <div className="text-[13px] font-medium text-neutral-700">Require Admin Approval</div>
              <div className="text-[11.5px] text-neutral-400 mt-0.5">Every tool action must be reviewed before executing.</div>
            </div>
            <Toggle checked={urlApproval} onChange={setUrlApproval} label="Require admin approval" />
          </div>
        </div>
      )}

      {/* ── Manual tab ────────────────────────────────────────────────────── */}
      {tab === 'manual' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="My Integration"
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-[13.5px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Server Type</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-[13.5px] outline-none focus:border-blue-400 bg-white">
                <option value="">Select type…</option>
                {['freshdesk', 'zohodesk', 'zendesk', 'jira', 'servicenow', 'github', 'gitlab', 'jenkins', 'linear', 'slack', 'datadog', 'newrelic', 'pagerduty', 'opsgenie', 'confluence', 'custom', 'mcp'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
              Server URL <span className="text-neutral-400 font-normal">(optional)</span>
            </label>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://your-mcp-server.com/sse"
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-[13.5px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </div>

          <div className="flex items-center justify-between py-0.5">
            <div>
              <div className="text-[13px] font-medium text-neutral-700">Require Admin Approval</div>
              <div className="text-[11.5px] text-neutral-400 mt-0.5">Every tool action must be reviewed before executing.</div>
            </div>
            <Toggle checked={approval} onChange={setApproval} label="Require admin approval" />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Credentials (JSON)</label>
            <textarea value={creds} onChange={e => setCreds(e.target.value)} rows={4}
              placeholder='{"api_key": "your-key"}'
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-[12px] outline-none focus:border-blue-400 font-mono resize-y bg-[#1a1a2e] text-cyan-200 min-h-[80px]" />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Tool Schemas (JSON array)</label>
            <textarea value={tools} onChange={e => setTools(e.target.value)} rows={5}
              placeholder='[{"name":"my_tool","description":"...","input_schema":{}}]'
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-[12px] outline-none focus:border-blue-400 font-mono resize-y bg-[#1a1a2e] text-cyan-200 min-h-[100px]" />
          </div>
        </div>
      )}

      {/* ── Routing hint (shared, outside tabs) ───────────────────────────── */}
      <div className="mt-5">
        <label className="block text-[11.5px] font-medium text-zinc-600 mb-1">
          Routing hint <span className="text-zinc-400 font-normal">(optional)</span>
        </label>
        <textarea
          rows={2}
          value={routingHint}
          onChange={e => setRoutingHint(e.target.value)}
          placeholder="e.g. Use for specific types of issues or requests"
          className="w-full text-[12.5px] rounded-lg px-3 py-2 resize-none outline-none transition-all"
          style={{ border: '1px solid #e4e4e7', background: '#fafafa' }}
        />
        <p className="text-[11px] text-zinc-400 mt-1">
          Tells the AI when to use this integration vs. others when multiple are connected.
        </p>
      </div>

      {error && (
        <p className="text-[12.5px] text-red-500 mt-3">{error}</p>
      )}
    </Modal>
  );
}
