import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../hooks/useFixieToast';
import { apiGet, apiPost } from '../../../lib/fixie/api';
import { timeAgo, formatDate } from '../../../lib/fixie/utils';
import { Pill } from '../ui/Pill';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import type { ApprovalRequest } from '../../../types/fixie';

export function ApprovalsView() {
  const { toast } = useToast();
  const [pending, setPending] = useState<ApprovalRequest[]>([]);
  const [all, setAll] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState<ApprovalRequest | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, a] = await Promise.all([
        apiGet<ApprovalRequest[]>('/api/approvals/pending'),
        apiGet<ApprovalRequest[]>('/api/approvals/all'),
      ]);
      setPending(p);
      setAll(a);
    } catch {
      toast('Failed to load approvals', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const submitApproval = async (approved: boolean) => {
    if (!reviewTarget) return;
    try {
      await apiPost(`/api/approvals/${reviewTarget.id}/action`, { approved, reviewer_note: reviewNote || null });
      toast(approved ? 'Approved and executed' : 'Rejected');
      setReviewTarget(null);
      setReviewNote('');
      load();
    } catch (e: unknown) {
      toast('Failed: ' + (e instanceof Error ? e.message : 'error'), 'error');
    }
  };

  const history = all.filter(a => a.status !== 'pending');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-7 py-5 border-b border-neutral-200 bg-white flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">Approvals</h1>
          <p className="text-[13px] text-neutral-500 mt-0.5">Review and action pending tool requests from users</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>↻ Refresh</Button>
      </div>

      <div className="flex-1 overflow-y-auto p-7 flex flex-col gap-6">
        {/* Pending */}
        <section>
          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-3">Pending</div>
          {loading ? (
            <div className="text-center py-8 text-neutral-400">Loading…</div>
          ) : pending.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center text-neutral-400 shadow-sm">
              <div className="text-3xl mb-2">✅</div>
              No pending approvals
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pending.map(a => (
                <div key={a.id} className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold mb-1">
                      <span className="font-mono text-[13px] bg-neutral-100 px-2 py-0.5 rounded">{a.tool_name}</span>
                    </div>
                    <div className="text-[12px] text-neutral-400 mb-2">
                      Requested {timeAgo(a.created_at)}
                      {a.expires_at && ` · Expires ${timeAgo(a.expires_at)}`}
                    </div>
                    <pre className="text-[12.5px] bg-neutral-50 px-3 py-2 rounded-lg font-mono whitespace-pre-wrap break-all text-neutral-700">
                      {JSON.stringify(a.tool_input, null, 2)}
                    </pre>
                  </div>
                  <Button size="sm" onClick={() => { setReviewTarget(a); setReviewNote(''); }} className="shrink-0">Review</Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* History */}
        <section>
          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-3">History</div>
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
            {history.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-sm">No history yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100">
                      {['Tool', 'Status', 'Reviewed By', 'Reviewed At', 'Note'].map(h => (
                        <th key={h} className="text-left text-[11.5px] font-semibold text-neutral-400 uppercase tracking-wider px-4 py-2.5 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(a => (
                      <tr key={a.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50">
                        <td className="px-4 py-3 font-mono text-[12.5px]">
                          <span className="bg-neutral-100 px-2 py-0.5 rounded">{a.tool_name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Pill variant={a.status === 'approved' ? 'green' : a.status === 'rejected' ? 'red' : 'gray'}>{a.status}</Pill>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-neutral-400">{a.reviewed_by ?? '—'}</td>
                        <td className="px-4 py-3 text-[13px] text-neutral-400 whitespace-nowrap">{a.reviewed_at ? formatDate(a.reviewed_at) : '—'}</td>
                        <td className="px-4 py-3 text-[13px] text-neutral-400">{a.reviewer_note ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Review modal */}
      <Modal
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        title="Review Tool Request"
        footer={
          <>
            <Button variant="outline" onClick={() => setReviewTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => submitApproval(false)}>Reject</Button>
            <Button onClick={() => submitApproval(true)}>Approve &amp; Execute</Button>
          </>
        }
      >
        {reviewTarget && (
          <>
            <div className="text-base font-bold mb-1">{reviewTarget.tool_name}</div>
            <div className="text-[12px] text-neutral-400 mb-4">Requested {timeAgo(reviewTarget.created_at)}</div>
            <div className="bg-neutral-50 rounded-lg px-3 py-2 mb-4 divide-y divide-neutral-100">
              {Object.entries(reviewTarget.tool_input).map(([k, v]) => (
                <div key={k} className="flex gap-3 py-1.5 text-[13px]">
                  <span className="font-semibold text-neutral-500 min-w-[100px]">{k}</span>
                  <span className="text-neutral-800">{String(v)}</span>
                </div>
              ))}
            </div>
            <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Reviewer Note (optional)</label>
            <textarea
              value={reviewNote}
              onChange={e => setReviewNote(e.target.value)}
              rows={2}
              placeholder="Reason for approval or rejection…"
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-[13.5px] outline-none focus:border-indigo-400 resize-none"
            />
          </>
        )}
      </Modal>
    </div>
  );
}
