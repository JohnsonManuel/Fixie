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
        apiGet<ApprovalRequest[]>('/api/approvals/history'),
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
      await apiPost(`/api/approvals/${reviewTarget.id}/review`, { approved, reviewer_note: reviewNote || null });
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

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="px-6 md:px-8 py-5 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-[17px] font-bold text-zinc-900 dark:text-zinc-100">Approvals</h1>
          <p className="text-[13px] text-zinc-400 dark:text-zinc-500 mt-0.5">Review and action pending tool requests</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-8" style={{ background: '#fafafa' }}>

        {/* ── Pending ──────────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">Pending</h2>
            {!loading && pending.length > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pending.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              <ApprovalCardSkeleton /><ApprovalCardSkeleton />
            </div>
          ) : pending.length === 0 ? (
            <div
              className="bg-white dark:bg-zinc-900 rounded-xl px-6 py-8 text-center fade-in flex flex-col items-center gap-2 border border-zinc-200 dark:border-zinc-800"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-1" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-[13.5px] font-medium text-zinc-600 dark:text-zinc-300">All caught up</p>
              <p className="text-[12px] text-zinc-400 dark:text-zinc-500">No pending approvals at this time.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 fade-in">
              {pending.map(a => (
                <div
                  key={a.id}
                  className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Tool name */}
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-[12px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded">
                          {a.tool_name}
                        </code>
                        <span className="text-[12px] text-zinc-400 dark:text-zinc-500">{timeAgo(a.created_at)}</span>
                        {a.expires_at && (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-px rounded-full ring-1 ring-amber-200/60 dark:ring-amber-500/30">
                            expires {timeAgo(a.expires_at)}
                          </span>
                        )}
                      </div>

                      {/* Params */}
                      <div
                        className="rounded-lg px-3 py-2.5 space-y-1.5"
                        style={{ background: '#fafafa', border: '1px solid #f4f4f5' }}
                      >
                        {Object.entries(a.tool_input).map(([k, v]) => (
                          <div key={k} className="flex gap-3 text-[12px]">
                            <span className="text-zinc-400 font-medium w-24 shrink-0 truncate">{k}</span>
                            <span className="text-zinc-700 break-all font-mono">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => { setReviewTarget(a); setReviewNote(''); }}
                      className="shrink-0"
                    >
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── History ──────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-4">History</h2>
          <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
            {loading ? (
              <TableSkeleton rows={4} cols={5} />
            ) : history.length === 0 ? (
              <div className="text-center py-10 text-[13px] text-zinc-400">No history yet</div>
            ) : (
              <div className="overflow-x-auto fade-in">
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f4f4f5' }}>
                      {['Tool', 'Status', 'Reviewed by', 'Date', 'Note'].map(h => (
                        <th key={h} className="text-left text-[10.5px] font-semibold text-zinc-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(a => (
                      <tr
                        key={a.id}
                        className="transition-colors"
                        style={{ borderBottom: '1px solid #f9f9f9' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}
                      >
                        <td className="px-5 py-3">
                          <code className="text-[11.5px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">{a.tool_name}</code>
                        </td>
                        <td className="px-5 py-3">
                          <Pill variant={a.status === 'approved' ? 'green' : a.status === 'rejected' ? 'red' : 'gray'}>
                            {a.status}
                          </Pill>
                        </td>
                        <td className="px-5 py-3 text-[12.5px] text-zinc-500">{a.reviewed_by ?? '—'}</td>
                        <td className="px-5 py-3 text-[12.5px] text-zinc-400 whitespace-nowrap">{a.reviewed_at ? formatDate(a.reviewed_at) : '—'}</td>
                        <td className="px-5 py-3 text-[12.5px] text-zinc-400">{a.reviewer_note ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── Review modal ─────────────────────────────────────────────────────── */}
      <Modal
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        title="Review tool request"
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
            <code className="text-[13px] font-semibold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded block w-fit mb-1">
              {reviewTarget.tool_name}
            </code>
            <p className="text-[12px] text-zinc-400 mb-4">Requested {timeAgo(reviewTarget.created_at)}</p>

            <div className="rounded-lg overflow-hidden mb-4" style={{ border: '1px solid #e4e4e7' }}>
              {Object.entries(reviewTarget.tool_input).map(([k, v], i, arr) => (
                <div
                  key={k}
                  className="flex gap-4 px-4 py-2.5 text-[12.5px]"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid #f4f4f5' : 'none', background: i % 2 === 0 ? '#fff' : '#fafafa' }}
                >
                  <span className="font-semibold text-zinc-500 w-28 shrink-0">{k}</span>
                  <span className="text-zinc-800 break-all">{String(v)}</span>
                </div>
              ))}
            </div>

            <label className="block text-[12px] font-semibold text-zinc-600 mb-1.5">
              Reviewer note <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <textarea
              value={reviewNote}
              onChange={e => setReviewNote(e.target.value)}
              rows={2}
              placeholder="Reason for approval or rejection…"
              className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none resize-none transition-all"
              style={{ border: '1px solid #e4e4e7' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#a1a1aa'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(9,9,11,0.06)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e4e4e7'; e.currentTarget.style.boxShadow = ''; }}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
