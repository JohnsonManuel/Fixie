import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Toggle } from '../ui/Toggle';
import { apiPost, apiPatch } from '../../../lib/fixie/api';
import { useToast } from '../../../hooks/useFixieToast';
import { ZOHODESK_SCHEMAS } from '../../../lib/fixie/zohodesk-schemas';
import type { McpServer } from '../../../types/fixie';

type TestStatus = 'idle' | 'testing' | 'ok' | 'fail';

const REGIONS = [
  { value: 'com',    label: 'United States (desk.zoho.com)' },
  { value: 'eu',     label: 'Europe (desk.zoho.eu)' },
  { value: 'in',     label: 'India (desk.zoho.in)' },
  { value: 'com.au', label: 'Australia (desk.zoho.com.au)' },
  { value: 'jp',     label: 'Japan (desk.zoho.jp)' },
];

export function ZohoDeskModal({
  open, onClose, onSuccess, editingId, allServers,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingId: string | null;
  allServers: McpServer[];
}) {
  const { toast } = useToast();
  const [accessToken, setAccessToken] = useState('');
  const [orgId, setOrgId]             = useState('');
  const [region, setRegion]           = useState('com');
  const [approval, setApproval]       = useState(true);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [testStatus, setTestStatus]   = useState<TestStatus>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    if (!open) return;
    setError(''); setAccessToken(''); setTestStatus('idle'); setTestMessage('');
    if (editingId) {
      const s = allServers.find(x => x.id === editingId);
      setOrgId(s?.credentials?.org_id ?? '');
      setRegion(s?.credentials?.region ?? 'com');
      setApproval(s?.requires_approval ?? true);
    } else {
      setOrgId(''); setRegion('com'); setApproval(true);
    }
  }, [open, editingId, allServers]);

  const resetTest = () => { setTestStatus('idle'); setTestMessage(''); };
  const handleTokenChange  = (v: string) => { setAccessToken(v);  resetTest(); };
  const handleOrgIdChange  = (v: string) => { setOrgId(v);        resetTest(); };
  const handleRegionChange = (v: string) => { setRegion(v);       resetTest(); };

  const testConnection = async () => {
    if (!accessToken.trim()) { setError('Access token is required to test the connection.'); return; }
    if (!orgId.trim())       { setError('Organization ID is required to test the connection.'); return; }
    setError(''); setTestStatus('testing'); setTestMessage('');
    try {
      await apiPost('/api/admin/mcp-servers/test', {
        server_type: 'zohodesk',
        credentials: { access_token: accessToken.trim(), org_id: orgId.trim(), region },
      });
      setTestStatus('ok');
      setTestMessage('Connection successful — credentials are valid.');
    } catch (e: unknown) {
      setTestStatus('fail');
      setTestMessage(e instanceof Error ? e.message : 'Connection failed.');
    }
  };

  const canSave = testStatus === 'ok' || (!!editingId && !accessToken.trim());

  const submit = async () => {
    if (!orgId.trim()) { setError('Organization ID is required.'); return; }
    setLoading(true); setError('');
    const credentials: Record<string, string> = { org_id: orgId.trim(), region };
    if (accessToken.trim()) credentials.access_token = accessToken.trim();
    try {
      if (editingId) {
        await apiPatch(`/api/admin/mcp-servers/${editingId}`, { credentials, requires_approval: approval });
        toast('Zoho Desk updated');
      } else {
        await apiPost('/api/admin/mcp-servers', {
          name: 'Zoho Desk', server_type: 'zohodesk',
          credentials, tool_schemas: ZOHODESK_SCHEMAS,
          requires_approval: approval, is_active: true,
        });
        toast('Zoho Desk connected');
      }
      onClose(); onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingId ? 'Edit Zoho Desk' : 'Connect Zoho Desk'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading || !canSave} title={!canSave ? 'Test connection first' : undefined}>
            {loading ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">

        <div>
          <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
            Access Token
            {editingId && <span className="text-neutral-400 font-normal ml-1.5">(leave blank to keep existing)</span>}
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={accessToken}
              onChange={e => handleTokenChange(e.target.value)}
              placeholder={editingId ? '••••••••' : 'Zoho OAuth access token'}
              className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-[13.5px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            <Button
              variant="outline"
              onClick={testConnection}
              disabled={testStatus === 'testing' || !accessToken.trim() || !orgId.trim()}
            >
              {testStatus === 'testing' ? 'Testing…' : 'Test'}
            </Button>
          </div>
          <p className="text-[11.5px] text-neutral-400 mt-1">
            Generate from <strong>Zoho API Console</strong> → Self Client → Scopes: <code className="bg-neutral-100 px-1 rounded">Desk.tickets.ALL</code>
          </p>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Organization ID</label>
          <input
            type="text"
            value={orgId}
            onChange={e => handleOrgIdChange(e.target.value)}
            placeholder="e.g. 1234567890"
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-[13.5px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <p className="text-[11.5px] text-neutral-400 mt-1">
            Found in Zoho Desk → <strong>Settings</strong> → Developer Space → API
          </p>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Data Centre Region</label>
          <select
            value={region}
            onChange={e => handleRegionChange(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-[13.5px] outline-none focus:border-indigo-400 bg-white"
          >
            {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {testStatus === 'ok' && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg text-[13px] text-green-700">
            <span className="text-base">✓</span>
            {testMessage}
          </div>
        )}
        {testStatus === 'fail' && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-700">
            <span className="text-base">✗</span>
            {testMessage}
          </div>
        )}

        {testStatus === 'idle' && !editingId && (
          <p className="text-[12px] text-neutral-400">
            Enter your access token and org ID, then click Test before saving.
          </p>
        )}

        <div>
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-medium text-neutral-700">Require Admin Approval</label>
            <Toggle checked={approval} onChange={setApproval} label="Require admin approval" />
          </div>
          <p className="text-[11.5px] text-neutral-400 mt-1">When enabled, every ticket action must be reviewed by an admin before executing.</p>
        </div>

        {error && <p className="text-[12.5px] text-red-500">{error}</p>}
      </div>
    </Modal>
  );
}
