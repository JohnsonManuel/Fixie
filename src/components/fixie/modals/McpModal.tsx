import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { apiPost, apiPatch } from '../../../lib/fixie/api';
import { useToast } from '../../../hooks/useFixieToast';
import type { McpServer } from '../../../types/fixie';

export function McpModal({
  open, onClose, onSuccess, editingId, allServers,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingId: string | null;
  allServers: McpServer[];
}) {
  const { toast } = useToast();
  const [name, setName]         = useState('');
  const [type, setType]         = useState('');
  const [url, setUrl]           = useState('');
  const [approval, setApproval] = useState(true);
  const [creds, setCreds]       = useState('');
  const [tools, setTools]       = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    if (editingId) {
      const s = allServers.find(x => x.id === editingId);
      if (s) {
        setName(s.name); setType(s.server_type); setUrl(s.server_url ?? '');
        setApproval(s.requires_approval);
        setCreds(JSON.stringify(s.credentials, null, 2));
        setTools(JSON.stringify(s.tool_schemas, null, 2));
      }
    } else {
      setName(''); setType(''); setUrl(''); setApproval(true); setCreds(''); setTools('');
    }
  }, [open, editingId, allServers]);

  const submit = async () => {
    if (!name.trim() || !type) { setError('Name and server type are required.'); return; }
    let credentials = {}, tool_schemas: unknown[] = [];
    try { credentials  = creds.trim() ? JSON.parse(creds)  : {}; } catch { setError('Invalid JSON in Credentials.'); return; }
    try { tool_schemas = tools.trim() ? JSON.parse(tools) : []; } catch { setError('Invalid JSON in Tool Schemas.'); return; }
    setLoading(true); setError('');
    try {
      if (editingId) {
        await apiPatch(`/api/admin/mcp-servers/${editingId}`, { name, credentials, tool_schemas, requires_approval: approval });
        toast('Server updated');
      } else {
        await apiPost('/api/admin/mcp-servers', {
          name, server_type: type, server_url: url.trim() || null,
          credentials, tool_schemas, requires_approval: approval,
        });
        toast('Server added');
      }
      onClose(); onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingId ? 'Edit MCP Server' : 'Add Custom MCP Server'}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading}>{loading ? 'Saving…' : 'Save Server'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="My Integration"
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-[13.5px] outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Server Type</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-[13.5px] outline-none focus:border-indigo-400 bg-white">
              <option value="">Select type…</option>
              {['jira', 'linear', 'zendesk', 'github', 'custom'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Server URL <span className="text-neutral-400 font-normal">(optional)</span></label>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://your-mcp-server.com/sse"
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-[13.5px] outline-none focus:border-indigo-400" />
        </div>

        <label className="flex items-center gap-2.5 text-[13px] font-medium text-neutral-700 cursor-pointer">
          <input type="checkbox" checked={approval} onChange={e => setApproval(e.target.checked)} className="w-4 h-4 rounded accent-indigo-500" />
          Require admin approval before executing tools
        </label>

        <div>
          <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Credentials (JSON)</label>
          <textarea value={creds} onChange={e => setCreds(e.target.value)} rows={4}
            placeholder='{"api_key": "your-key"}'
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-[12px] outline-none focus:border-indigo-400 font-mono resize-y bg-[#1a1a2e] text-cyan-200 min-h-[80px]" />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Tool Schemas (JSON array)</label>
          <textarea value={tools} onChange={e => setTools(e.target.value)} rows={5}
            placeholder='[{"name":"my_tool","description":"...","input_schema":{...}}]'
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-[12px] outline-none focus:border-indigo-400 font-mono resize-y bg-[#1a1a2e] text-cyan-200 min-h-[100px]" />
        </div>

        {error && <p className="text-[12.5px] text-red-500">{error}</p>}
      </div>
    </Modal>
  );
}
