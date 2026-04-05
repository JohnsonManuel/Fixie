import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { apiPost } from '../../../lib/fixie/api';
import { useToast } from '../../../hooks/useFixieToast';

export function InviteModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim()) { setError('Please enter an email address.'); return; }
    setLoading(true); setError('');
    try {
      const data = await apiPost<{ message: string }>('/api/admin/users', { email: email.trim() });
      toast(data.message || 'User added successfully');
      onClose(); onSuccess(); setEmail('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add User to Organisation"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading}>{loading ? 'Adding…' : 'Add User'}</Button>
        </>
      }
    >
      <p className="text-[13px] text-neutral-500 mb-4">The user must have already signed up via the login page with their Firebase account.</p>
      <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Email Address</label>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder="colleague@company.com"
        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-[13.5px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
      {error && <p className="text-[12.5px] text-red-500 mt-2">{error}</p>}
    </Modal>
  );
}
