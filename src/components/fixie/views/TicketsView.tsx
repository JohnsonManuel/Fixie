import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../hooks/useFixieToast';
import { apiGet } from '../../../lib/fixie/api';
import { formatDate } from '../../../lib/fixie/utils';
import { Pill } from '../ui/Pill';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import type { Ticket } from '../../../types/fixie';

export function TicketsView() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<Ticket[]>('/api/admin/tickets');
      setTickets(data);
    } catch {
      toast('Failed to load tickets', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const statusVariant = (s: string) => s === 'approved' ? 'green' : s === 'rejected' ? 'red' : 'yellow';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-7 py-5 border-b border-neutral-200 bg-white flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">Tickets</h1>
          <p className="text-[13px] text-neutral-500 mt-0.5">Track support tickets created through AI chat</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>↻ Refresh</Button>
      </div>

      <div className="flex-1 overflow-y-auto p-7">
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-10 text-neutral-400">Loading…</div>
          ) : tickets.length === 0 ? (
            <EmptyState icon="🎫" title="No tickets yet" body="Tickets appear here when users run ticket-related tools in chat." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100">
                    {['Ticket', 'Tool', 'Status', 'Result', 'Submitted', 'Reviewed By'].map(h => (
                      <th key={h} className="text-left text-[11.5px] font-semibold text-neutral-400 uppercase tracking-wider px-4 py-2.5 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(t => {
                    const result = t.execution_result;
                    const ticketId = result?.ticket_id as number | undefined;
                    const ticketUrl = result?.url as string | undefined;
                    const subject = (t.tool_input?.subject ?? t.tool_input?.title ?? JSON.stringify(t.tool_input).slice(0, 60)) as string;
                    return (
                      <tr key={t.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50">
                        <td className="px-4 py-3">
                          {ticketId
                            ? ticketUrl
                              ? <a href={ticketUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-500 hover:underline">#{ticketId}</a>
                              : <span className="text-neutral-400">#{ticketId}</span>
                            : <span className="text-neutral-300">—</span>}
                          <div className="text-[12px] text-neutral-400 mt-0.5 max-w-[200px] truncate" title={subject}>{subject}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-mono bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded">{t.tool_name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Pill variant={statusVariant(t.status)}>{t.status}</Pill>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-neutral-500">
                          {(result?.status as string | undefined) ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-neutral-400 whitespace-nowrap">{formatDate(t.created_at)}</td>
                        <td className="px-4 py-3 text-[13px] text-neutral-400">{t.reviewed_by ?? '—'}</td>
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
