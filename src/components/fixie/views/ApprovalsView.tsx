import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../hooks/useFixieToast';
import { apiGet, apiPost } from '../../../lib/fixie/api';
import { timeAgo, formatDate } from '../../../lib/fixie/utils';
import { Pill } from '../ui/Pill';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ApprovalCardSkeleton, TableSkeleton } from '../ui/Skeleton';
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
      {/* Header */}
      <div
        className="px-7 py-5 flex items-center justify-between shrink-0 bg-white"
        style={{ borderBottom: '1px solid #e8edf3' }}
      >
        <div>
          <h1 className="text-lg font-bold text-neutral-900">Approvals</h1>
          <p className="text-[13px] text-neutral-400 mt-0.5">Review and action pending tool requests from users</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>↻ Refresh</Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-7 flex flex-col gap-6" style={{ background: '#f8fafc' }}>
        {/* Pending section */}
        <section>
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Pending</div>
          {loading ? (
            <div className="flex flex-col gap-3">
              <ApprovalCardSkeleton />
              <ApprovalCardSkeleton />
            </div>
          ) : pending.length === 0 ? (
            <div
              className="bg-white rounded-2xl p-8 text-center fade-in"
              style={{ border: '1px solid #e8edf3', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              <div className="text-3xl mb-2">✅</div>
              <p className="text-[13.5px] font-medium text-neutral-500">All caught up — no pending approvals</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 fade-in">
              {pending.map(a => (
                <div
                  key={a.id}
                  className="bg-white rounded-2xl p-5 flex items-start justify-between gap-4"
                  style={{ border: '1px solid #e8edf3', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-[12.5px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-md font-semibold" style={{ border: '1px solid #dbeafe' }}>
                        {a.tool_name}
                      </span>
                    </div>
                    <div className="text-[12px] text-neutral-400 mb-3">
                      Requested {timeAgo(a.created_at)}
                      {a.expires_at && ` · Expires ${timeAgo(a.expires_at)}`}
                    </div>
                    <pre className="text-[12px] px-3 py-2.5 rounded-xl font-mono whitespace-pre-wrap break-all text-neutral-700" style={{ background: '#f8fafc', border: '1px solid #e8edf3' }}>
                      {JSON.stringify(a.tool_input, null, 2)}
                    </pre>
                  </div>
                  <Button size="sm" onClick={() => { setReviewTarget(a); setReviewNote(''); }} className="shrink-0">
                    Review
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* History section */}
        <section>
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">History</div>
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid #e8edf3', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            {loading ? (
              <TableSkeleton rows={4} cols={5} />
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-[13px] text-neutral-400">No history yet</div>
            ) : (
              <div className="overflow-x-auto fade-in">
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {['Tool', 'Status', 'Reviewed By', 'Reviewed At', 'Note'].map(h => (
                        <th key={h} className="text-left text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(a => (
                      <tr
                        key={a.id}
                        className="transition-colors"
                        style={{ borderBottom: '1px solid #f8fafc' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fafbfc')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-[12px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded">{a.tool_name}</span>
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
            <div className="rounded-xl px-3 py-2 mb-4 divide-y divide-neutral-100" style={{ background: '#f8fafc', border: '1px solid #e8edf3' }}>
              {Object.entries(reviewTarget.tool_input).map(([k, v]) => (
                <div key={k} className="flex gap-3 py-1.5 text-[13px]">
                  <span className="font-semibold text-neutral-500 min-w-[100px]">{k}</span>
                  <span className="text-neutral-800">{String(v)}</span>
                </div>
              ))}
            </div>
            <label className="block text-[13px] font-semibold text-neutral-700 mb-1.5">Reviewer Note (optional)</label>
            <textarea
              value={reviewNote}
              onChange={e => setReviewNote(e.target.value)}
              rows={2}
              placeholder="Reason for approval or rejection…"
              className="w-full px-3 py-2 rounded-xl text-[13.5px] outline-none resize-none transition-all"
              style={{ border: '1px solid #e2e8f0' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#1877F2')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
