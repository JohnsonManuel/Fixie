import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '../../../hooks/useFixieToast';
import { apiGet } from '../../../lib/fixie/api';
import { formatDate } from '../../../lib/fixie/utils';
import { Pill } from '../ui/Pill';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { TableSkeleton } from '../ui/Skeleton';
import type { Ticket } from '../../../types/fixie';

// Derive a human-readable service name from ticket fields
function getService(t: Ticket): string {
  if (t.server_type) return t.server_type;
  if (t.integration_name) return t.integration_name;
  const name = t.tool_name.toLowerCase();
  if (name.includes('freshdesk') || name.includes('freshworks')) return 'freshdesk';
  if (name.includes('zendesk')) return 'zendesk';
  if (name.includes('jira')) return 'jira';
  if (name.includes('servicenow')) return 'servicenow';
  if (name.includes('zoho')) return 'zoho';
  return 'general';
}

const SERVICE_LABELS: Record<string, string> = {
  freshdesk: 'Freshdesk',
  zendesk: 'Zendesk',
  jira: 'Jira',
  servicenow: 'ServiceNow',
  zoho: 'Zoho Desk',
  general: 'General',
};

export function TicketsView() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceIdx, setServiceIdx] = useState(0); // 0 = All

  const load = useCallback(async () => {
    try {
      // Combine pending approvals + history so tickets waiting for approval
      // are visible alongside already-executed ones
      const [pending, history, executed] = await Promise.allSettled([
        apiGet<Ticket[]>('/api/approvals/pending'),
        apiGet<Ticket[]>('/api/approvals/history'),
        apiGet<Ticket[]>('/api/admin/tool-executions'),
      ]);

      const seen = new Set<string>();
      const merged: Ticket[] = [];
      const add = (items: Ticket[]) => items.forEach(t => {
        if (!seen.has(t.id)) { seen.add(t.id); merged.push(t); }
      });

      if (pending.status === 'fulfilled') add(pending.value);
      if (history.status === 'fulfilled') add(history.value);
      if (executed.status === 'fulfilled') add(executed.value);

      // Most recent first
      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTickets(merged);
    } catch {
      toast('Failed to load tickets', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Initial load + 60s polling while view is mounted
  useEffect(() => {
    setLoading(true);
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  // Refresh immediately when a ticket is created via chat
  useEffect(() => {
    const handler = () => load();
    window.addEventListener('ticket-created', handler);
    return () => window.removeEventListener('ticket-created', handler);
  }, [load]);

  // Unique services derived from current tickets
  const services = useMemo(() => {
    const seen = new Set<string>();
    tickets.forEach(t => seen.add(getService(t)));
    return ['all', ...Array.from(seen)];
  }, [tickets]);

  const selectedService = services[serviceIdx] ?? 'all';

  const filtered = useMemo(() =>
    selectedService === 'all' ? tickets : tickets.filter(t => getService(t) === selectedService),
    [tickets, selectedService]
  );

  const prevService = () => setServiceIdx(i => (i - 1 + services.length) % services.length);
  const nextService = () => setServiceIdx(i => (i + 1) % services.length);

  const statusVariant = (s: string) =>
    s === 'approved' ? 'green' : s === 'rejected' ? 'red' : 'yellow';

  const statusLabel = (t: Ticket) => {
    if (t.status === 'pending') return 'Waiting for approval';
    return t.status;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="px-6 md:px-8 py-5 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-[17px] font-bold text-zinc-900 dark:text-zinc-100">Tickets</h1>
          <p className="text-[13px] text-zinc-400 dark:text-zinc-500 mt-0.5">Support tickets created through AI chat</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Service filter */}
          {services.length > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={prevService}
                aria-label="Previous service"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-colors"
                style={{ border: '1px solid #e4e4e7' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>

              <select
                value={selectedService}
                onChange={e => setServiceIdx(services.indexOf(e.target.value))}
                className="text-[12.5px] font-medium text-zinc-700 px-2.5 py-1 rounded-lg outline-none cursor-pointer"
                style={{ border: '1px solid #e4e4e7', background: '#fff' }}
              >
                <option value="all">All services</option>
                {services.filter(s => s !== 'all').map(s => (
                  <option key={s} value={s}>{SERVICE_LABELS[s] ?? s}</option>
                ))}
              </select>

              <button
                onClick={nextService}
                aria-label="Next service"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-colors"
                style={{ border: '1px solid #e4e4e7' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={() => { setLoading(true); load(); }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-zinc-50 dark:bg-zinc-950">
        <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
          {loading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : filtered.length === 0 ? (
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
                    {['Ticket', 'Service', 'Status', 'Result', 'Submitted', 'Reviewed by'].map(h => (
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
                  {filtered.map(t => {
                    const result = t.execution_result;
                    const ticketId = result?.ticket_id as number | undefined;
                    const ticketUrl = result?.url as string | undefined;
                    const subject = (t.tool_input?.subject ?? t.tool_input?.title ?? JSON.stringify(t.tool_input).slice(0, 60)) as string;
                    const service = getService(t);
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

                        {/* Service */}
                        <td className="px-5 py-3">
                          <span className="text-[12px] font-medium text-zinc-600">
                            {SERVICE_LABELS[service] ?? service}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3">
                          <Pill variant={statusVariant(t.status)}>
                            {statusLabel(t)}
                          </Pill>
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
