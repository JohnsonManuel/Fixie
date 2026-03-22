import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Toggle } from '../ui/Toggle';
import { apiPost, apiPatch } from '../../../lib/fixie/api';
import { useToast } from '../../../hooks/useFixieToast';
import { FRESHDESK_SCHEMAS } from '../../../lib/fixie/freshdesk-schemas';
import type { McpServer } from '../../../types/fixie';

type TestStatus = 'idle' | 'testing' | 'ok' | 'fail';

export function FreshdeskModal({
  open, onClose, onSuccess, editingId, allServers,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingId: string | null;
  allServers: McpServer[];
}) {
  const { toast } = useToast();
  const [domain, setDomain] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [approval, setApproval] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    if (!open) return;
    setError(''); setApiKey(''); setTestStatus('idle'); setTestMessage('');
    if (editingId) {
      const s = allServers.find(x => x.id === editingId);
      setDomain(s?.credentials?.domain ?? '');
      setApproval(s?.requires_approval ?? true);
    } else {
      setDomain(''); setApproval(true);
    }
  }, [open, editingId, allServers]);

  const handleDomainChange = (v: string) => { setDomain(v); setTestStatus('idle'); setTestMessage(''); };
  const handleApiKeyChange = (v: string) => { setApiKey(v); setTestStatus('idle'); setTestMessage(''); };

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

  const canSave = testStatus === 'ok' || (!!editingId && !apiKey.trim());

  const submit = async () => {
    if (!domain.trim()) { setError('Please enter your Freshdesk domain.'); return; }
    setLoading(true); setError('');
    const credentials: Record<string, string> = { domain: domain.trim() };
    if (apiKey.trim()) credentials.api_key = apiKey.trim();
    try {
      if (editingId) {
        await apiPatch(`/api/admin/integrations/${editingId}`, { credentials, requires_approval: approval });
        toast('Freshdesk updated');
      } else {
        await apiPost('/api/admin/integrations', {
          name: 'Freshdesk', server_type: 'freshdesk',
          credentials, tool_schemas: FRESHDESK_SCHEMAS,
          requires_approval: approval, is_active: true,
        });
        toast('Freshdesk connected');
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
      title={editingId ? 'Edit Freshdesk' : 'Connect Freshdesk'}
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
          <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Freshdesk Domain</label>
          <input
            type="text"
            value={domain}
            onChange={e => handleDomainChange(e.target.value)}
            placeholder="yourcompany.freshdesk.com"
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-[13.5px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
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
              onChange={e => handleApiKeyChange(e.target.value)}
              placeholder={editingId ? '••••••••' : 'Your Freshdesk API key'}
              className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-[13.5px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
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
            Test your connection before saving to make sure everything works.
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
