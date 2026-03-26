import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../hooks/useFixieToast';
import { apiGet } from '../../../lib/fixie/api';
import { formatDate } from '../../../lib/fixie/utils';
import { Pill } from '../ui/Pill';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { TableSkeleton } from '../ui/Skeleton';
import type { Ticket } from '../../../types/fixie';

export function TicketsView() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<Ticket[]>('/api/admin/tool-executions');
      setTickets(data);
    } catch {
      toast('Failed to load tickets', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const statusVariant = (s: string) =>
    s === 'approved' ? 'green' : s === 'rejected' ? 'red' : 'yellow';

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="px-6 md:px-8 py-5 flex items-center justify-between shrink-0 bg-white" style={{ borderBottom: '1px solid #e4e4e7' }}>
        <div>
          <h1 className="text-[17px] font-bold text-zinc-900">Tickets</h1>
          <p className="text-[13px] text-zinc-400 mt-0.5">Support tickets created through AI chat</p>
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
      <div className="flex-1 overflow-y-auto p-6 md:p-8" style={{ background: '#fafafa' }}>
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #e4e4e7' }}>
          {loading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : tickets.length === 0 ? (
            <EmptyState
              icon="🎫"
              title="No tickets yet"
              body="Tickets appear here when users run ticket-related tools through the AI chat."
            />
          ) : (
            <div className="overflow-x-auto fade-in">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ borderBottom: '1px solid #f4f4f5' }}>
                    {['Ticket', 'Tool', 'Status', 'Result', 'Submitted', 'Reviewed by'].map(h => (
                      <th
                        key={h}
                        className="text-left text-[10.5px] font-semibold text-zinc-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(t => {
                    const result    = t.execution_result;
                    const ticketId  = result?.ticket_id as number | undefined;
                    const ticketUrl = result?.url as string | undefined;
                    const subject   = (t.tool_input?.subject ?? t.tool_input?.title ?? JSON.stringify(t.tool_input).slice(0, 60)) as string;
                    return (
                      <tr
                        key={t.id}
                        className="transition-colors"
                        style={{ borderBottom: '1px solid #f9f9f9' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}
                      >
                        {/* Ticket ID + subject */}
                        <td className="px-5 py-3">
                          {ticketId ? (
                            ticketUrl ? (
                              <a
                                href={ticketUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[12.5px] font-semibold text-blue-600 hover:underline"
                              >
                                #{ticketId}
                              </a>
                            ) : (
                              <span className="text-[12.5px] font-semibold text-zinc-500">#{ticketId}</span>
                            )
                          ) : (
                            <span className="text-zinc-300">—</span>
                          )}
                          <div className="text-[11.5px] text-zinc-400 mt-0.5 max-w-[200px] truncate" title={subject}>
                            {subject}
                          </div>
                        </td>

                        {/* Tool name */}
                        <td className="px-5 py-3">
                          <code className="text-[11px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">{t.tool_name}</code>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3">
                          <Pill variant={statusVariant(t.status)}>{t.status}</Pill>
                        </td>

                        {/* Result status */}
                        <td className="px-5 py-3 text-[12.5px] text-zinc-500">
                          {(result?.status as string | undefined) ?? '—'}
                        </td>

                        {/* Submitted date */}
                        <td className="px-5 py-3 text-[12.5px] text-zinc-400 whitespace-nowrap">
                          {formatDate(t.created_at)}
                        </td>

                        {/* Reviewed by */}
                        <td className="px-5 py-3 text-[12.5px] text-zinc-400">
                          {t.reviewed_by ?? '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
