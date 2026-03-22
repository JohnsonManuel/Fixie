import React, { useState, useEffect, useRef, useCallback } from 'react';
import fixieLogo from '../../../images/image.png';
import { useApp } from '../../../contexts/FixieAppContext';
import { useToast } from '../../../hooks/useFixieToast';
import { apiGet, apiPost, apiDelete } from '../../../lib/fixie/api';
import { formatMarkdown } from '../../../lib/fixie/utils';
import { ConvListSkeleton } from '../ui/Skeleton';
import type { Conversation, Message, PendingConfirmation } from '../../../types/fixie';

/** Extends Message with an optional client-side timestamp (appended locally). */
interface DisplayMessage extends Message {
  ts?: number;
}

export function ChatView({ onOpenNav }: { onOpenNav: () => void }) {
  const { appUser, appOrg, currentConvId, setCurrentConvId } = useApp();
  const { toast } = useToast();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [convsLoading, setConvsLoading] = useState(true);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [pending, setPending] = useState<PendingConfirmation | null>(null);
  const [convTitle, setConvTitle] = useState('New Chat');
  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Prevents the currentConvId useEffect from double-loading when ChatView
  // itself sets currentConvId (as opposed to the Sidebar selecting externally).
  const suppressNextLoad = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, []);

  const loadConversations = useCallback(async () => {
    setConvsLoading(true);
    try {
      const data = await apiGet<Conversation[]>('/api/conversations');
      setConvs(data);
    } catch { /* silent */ } finally {
      setConvsLoading(false);
    }
  }, []);

  /** Fetches messages for a conversation by id — does NOT touch currentConvId. */
  const loadConversationById = useCallback(async (id: string) => {
    setPending(null);
    try {
      const data = await apiGet<{ title: string; messages: Message[] }>(`/api/conversations/${id}`);
      setConvTitle(data.title);
      setMessages(data.messages as DisplayMessage[]);
      setTimeout(scrollToBottom, 50);
    } catch {
      toast('Failed to load conversation', 'error');
    }
  }, [scrollToBottom, toast]);

  /** Desktop list: selects and loads a conversation. */
  const loadConversation = useCallback(async (id: string) => {
    suppressNextLoad.current = true;
    setCurrentConvId(id);
    await loadConversationById(id);
  }, [setCurrentConvId, loadConversationById]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // React to external currentConvId changes (e.g., Sidebar selecting on mobile).
  useEffect(() => {
    if (suppressNextLoad.current) {
      suppressNextLoad.current = false;
      return;
    }
    if (currentConvId === null) {
      setMessages([]);
      setConvTitle('New Chat');
      setPending(null);
      return;
    }
    loadConversationById(currentConvId);
  // loadConversationById is stable; currentConvId is the real trigger
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConvId]);

  const startNewChat = () => {
    suppressNextLoad.current = true;
    setCurrentConvId(null);
    setMessages([]);
    setPending(null);
    setConvTitle('New Chat');
    textareaRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, 130);
    el.style.height = next + 'px';
    // Only show scrollbar when content is taller than the cap
    el.style.overflowY = el.scrollHeight > 130 ? 'auto' : 'hidden';
  };

  const appendMsg = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, { role, content, ts: Date.now() }]);
    setTimeout(scrollToBottom, 50);
  };

  async function sendMessage() {
    const msg = inputVal.trim();
    if (!msg || sending) return;

    setSending(true);
    setInputVal('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.overflowY = 'hidden';
    }

    appendMsg('user', msg);
    setIsTyping(true);

    try {
      let body: Record<string, unknown> = { message: msg, conversation_id: currentConvId };

      if (pending && msg.toLowerCase() === 'yes') {
        body = {
          message: '',
          conversation_id: currentConvId,
          user_confirmed: true,
          confirmed_tool_name:     pending.tool_name,
          confirmed_tool_input:    pending.tool_input,
          confirmed_tool_use_id:   pending.tool_use_id,
          confirmed_integration_id: pending.integration_id,
          conversation_snapshot:   pending.conversation_snapshot,
        };
        setPending(null);
      }

      const data = await apiPost<{
        response: string;
        conversation_id: string;
        pending_confirmation?: PendingConfirmation;
        pending_approval?: boolean;
      }>('/api/chat/message', body);

      setIsTyping(false);

      if (!currentConvId) {
        suppressNextLoad.current = true;
        setCurrentConvId(data.conversation_id);
        await loadConversations();
      }

      if (data.pending_confirmation) {
        setPending(data.pending_confirmation);
        appendMsg('assistant', data.response);
      } else {
        appendMsg('assistant', data.response);
        setPending(null);
      }
    } catch (e: unknown) {
      setIsTyping(false);
      appendMsg('assistant', '⚠️ Error: ' + (e instanceof Error ? e.message : 'Something went wrong.'));
    }

    setSending(false);
    textareaRef.current?.focus();
  }

  async function confirmTool(confirmed: boolean) {
    if (!pending) return;
    const snap = pending;
    setPending(null);

    if (!confirmed) {
      appendMsg('assistant', 'Action cancelled.');
      return;
    }

    setIsTyping(true);
    try {
      const body = {
        message: '',
        conversation_id: currentConvId,
        user_confirmed: true,
        confirmed_tool_name:     snap.tool_name,
        confirmed_tool_input:    snap.tool_input,
        confirmed_tool_use_id:   snap.tool_use_id,
        confirmed_integration_id: snap.integration_id,
        conversation_snapshot:   snap.conversation_snapshot,
      };
      const data = await apiPost<{ response: string }>('/api/chat/message', body);
      setIsTyping(false);
      appendMsg('assistant', data.response);
    } catch (e: unknown) {
      setIsTyping(false);
      appendMsg('assistant', '⚠️ Error: ' + (e instanceof Error ? e.message : 'Something went wrong.'));
    }
  }

  async function deleteConv(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await apiDelete(`/api/conversations/${id}`);
      if (currentConvId === id) startNewChat();
      await loadConversations();
      toast('Conversation deleted');
    } catch {
      toast('Failed to delete conversation', 'error');
    }
  }

  const integrations = appOrg?.integrations ?? [];

  return (
    <div className="flex flex-1 overflow-hidden relative">

      {/* ── Conversation list — desktop only ──────────────────────────── */}
      {/* On mobile the sidebar handles conversation switching             */}
      <div
        className="hidden md:flex flex-col bg-white md:w-60 md:shrink-0"
        style={{ borderRight: '1px solid #e8edf3' }}
        aria-label="Conversation list"
      >
        {/* New Chat button */}
        <div className="p-3 shrink-0" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <button
            onClick={startNewChat}
            aria-label="Start a new chat"
            className="w-full py-2 px-3 text-white text-[13px] font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all btn-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1877F2]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Conversation items */}
        <div className="flex-1 overflow-y-auto py-2 px-2">
          {convsLoading ? (
            <ConvListSkeleton />
          ) : convs.length === 0 ? (
            <p className="text-[12.5px] text-neutral-400 px-2 py-4 leading-relaxed">
              No conversations yet — tap New Chat to start
            </p>
          ) : (
            <div className="fade-in flex flex-col">
              {convs.map(c => {
                const active = c.id === currentConvId;
                const date = new Date(c.last_message_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                return (
                  <div key={c.id} className="group relative mb-0.5">
                    <button
                      onClick={() => loadConversation(c.id)}
                      aria-label={`Open conversation: ${c.title}`}
                      aria-current={active ? 'true' : undefined}
                      className="w-full flex items-center gap-2 px-2.5 py-2.5 rounded-xl cursor-pointer transition-colors text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1877F2]"
                      style={
                        active
                          ? { background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid rgba(24,119,242,0.12)' }
                          : { border: '1px solid transparent' }
                      }
                      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = ''; }}
                    >
                      <div className="flex-1 min-w-0 pr-6">
                        <div
                          className="text-[13px] truncate"
                          style={{ color: active ? '#1877F2' : '#111827', fontWeight: active ? 600 : 500 }}
                        >
                          {c.title}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[11px] text-neutral-400">
                            {date} · {c.message_count} msg{c.message_count !== 1 ? 's' : ''}
                          </span>
                          {c.status === 'pending_approval' && (
                            <span
                              className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full"
                              style={{ border: '1px solid #fde68a' }}
                            >
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Delete button — sibling, not nested */}
                    <button
                      onClick={e => deleteConv(e, c.id)}
                      aria-label={`Delete conversation: ${c.title}`}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus:opacity-100 w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Chat area ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ background: '#f8fafc' }}>

        {/* Header */}
        <div
          className="px-3 flex items-center shrink-0 bg-white relative"
          style={{ borderBottom: '1px solid #e8edf3', minHeight: 56 }}
        >
          {/* Hamburger — mobile only, opens the single left sidebar */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-all shrink-0 z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1877F2]"
            onClick={onOpenNav}
            aria-label="Open navigation menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Mobile: Fixie brand — absolutely centered so it's true-center regardless of button width */}
          <div className="md:hidden absolute inset-0 flex items-center justify-center pointer-events-none gap-2.5" aria-hidden="true">
            <img
              src={fixieLogo}
              alt=""
              className="w-7 h-7 rounded-xl object-cover"
              style={{ boxShadow: '0 2px 10px rgba(24,119,242,0.22)' }}
            />
            <span
              className="text-[18px] font-bold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #1877F2 0%, #0E4F99 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Fixie
            </span>
          </div>

          {/* Desktop: conversation title + integrations */}
          <div className="hidden md:flex flex-col flex-1 min-w-0 py-3 px-0.5 gap-0.5">
            <div className="text-sm font-semibold text-neutral-900 truncate">{convTitle}</div>
            {integrations.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {integrations.map(i => (
                  <span
                    key={i.id}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: '#eff6ff', color: '#1877F2', border: '1px solid #dbeafe' }}
                  >
                    {i.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Desktop: org badge top-right */}
          {appOrg && !appOrg.slug.startsWith('user-') && (
            <div
              className="hidden md:inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-neutral-500 px-2.5 py-1 rounded-full shrink-0 ml-3"
              style={{ background: '#f8fafc', border: '1px solid #e8edf3' }}
            >
              <span aria-hidden="true">🏢</span>
              {appOrg.name}
            </div>
          )}
        </div>

        {/* Message list */}
        <div
          ref={messagesRef}
          className="flex-1 overflow-y-auto flex flex-col gap-3 px-3 py-4 md:px-5 md:py-5"
          style={{ overflowX: 'hidden' }}
          aria-live="polite"
          aria-label="Messages"
        >
          {messages.length === 0 && !isTyping && (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #bfdbfe' }}
                aria-hidden="true"
              >
                💬
              </div>
              <h3 className="text-[15px] font-bold text-neutral-700">Start a conversation</h3>
              <p className="text-sm text-neutral-400 max-w-xs leading-relaxed">
                {integrations.length > 0
                  ? `Available: ${integrations.map(i => i.name).join(', ')}`
                  : 'Type a message below to get started.'}
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <MessageBubble
              key={i}
              message={m}
              userName={appUser?.name ?? 'U'}
              userPhoto={appUser?.photo_url ?? null}
            />
          ))}

          {isTyping && <TypingIndicator />}
          {pending && <ConfirmCard pending={pending} onConfirm={confirmTool} />}
        </div>

        {/* Input bar */}
        <div
          className="px-3 md:px-5 pt-3 bg-white shrink-0"
          style={{
            borderTop: '1px solid #e8edf3',
            paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          }}
        >
          <div className="flex gap-2 items-end max-w-3xl mx-auto">
            <textarea
              ref={textareaRef}
              value={inputVal}
              onChange={e => { setInputVal(e.target.value); autoResize(e.target); }}
              onKeyDown={handleKey}
              rows={1}
              placeholder="Message…"
              aria-label="Type a message. Press Enter to send, Shift+Enter for new line."
              disabled={sending}
              className="flex-1 px-4 py-2.5 rounded-xl resize-none outline-none text-[13.5px] leading-relaxed transition-all disabled:opacity-60"
              style={{
                maxHeight: 130,
                overflowY: 'hidden',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#1877F2';
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(24,119,242,0.1)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.boxShadow = '';
              }}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !inputVal.trim()}
              aria-label="Send message"
              className="w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 transition-all btn-brand disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1877F2]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>

          {integrations.length > 0 && (
            <p className="text-[11.5px] text-neutral-400 mt-1.5 text-center max-w-3xl mx-auto">
              Available: {integrations.map(i => i.name).join(', ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────────────── */

function MessageBubble({
  message,
  userName,
  userPhoto,
}: {
  message: DisplayMessage;
  userName: string;
  userPhoto: string | null;
}) {
  const isUser = message.role === 'user';
  const timeStr = message.ts
    ? new Date(message.ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className={`chat-bubble flex gap-2 max-w-[88%] md:max-w-[75%] ${isUser ? 'self-end flex-row-reverse' : 'self-start'}`}>
      {/* Avatar */}
      <div className="shrink-0 mt-1">
        {isUser ? (
          userPhoto ? (
            <img
              src={userPhoto}
              alt={userName}
              className="w-7 h-7 rounded-full object-cover"
              style={{ boxShadow: '0 0 0 2px rgba(24,119,242,0.15)' }}
            />
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #1877F2 0%, #0E4F99 100%)' }}
              aria-hidden="true"
            >
              {userName.charAt(0).toUpperCase()}
            </div>
          )
        ) : (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
            style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1877F2' }}
            aria-hidden="true"
          >
            AI
          </div>
        )}
      </div>

      {/* Bubble + timestamp */}
      <div className={`flex flex-col gap-1 min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-[13.5px] leading-relaxed break-words ${
            isUser ? 'text-white rounded-tr-sm' : 'text-neutral-900 rounded-tl-sm'
          }`}
          style={
            isUser
              ? { background: 'linear-gradient(135deg, #1877F2 0%, #0E4F99 100%)', boxShadow: '0 2px 8px rgba(24,119,242,0.25)' }
              : { background: '#fff', border: '1px solid #e8edf3', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }
          }
          dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
        />
        {timeStr && (
          <span className="text-[11px] text-neutral-400 px-1 select-none">{timeStr}</span>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="chat-bubble flex gap-2 self-start" aria-label="Assistant is typing" role="status">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-1"
        style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1877F2' }}
        aria-hidden="true"
      >
        AI
      </div>
      <div
        className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center"
        style={{ border: '1px solid #e8edf3', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
      >
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="typing-dot w-1.5 h-1.5 rounded-full"
            style={{ animationDelay: `${i * 0.2}s`, background: '#1877F2', opacity: 0.5 }}
          />
        ))}
      </div>
    </div>
  );
}

function ConfirmCard({ pending, onConfirm }: { pending: PendingConfirmation; onConfirm: (v: boolean) => void }) {
  return (
    <div className="chat-bubble flex gap-2 self-start max-w-[90%] md:max-w-[480px]">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-1"
        style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1877F2' }}
        aria-hidden="true"
      >
        AI
      </div>
      <div
        className="bg-white rounded-2xl rounded-tl-sm p-4 flex-1 min-w-0"
        style={{ border: '1px solid #e8edf3', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        role="region"
        aria-label="Tool confirmation required"
      >
        <div className="text-[13px] font-semibold mb-2">
          🔧 {pending.tool_name}
          {pending.server_name && (
            <span className="text-neutral-400 font-normal ml-1.5">· {pending.server_name}</span>
          )}
        </div>
        <div className="flex flex-col gap-1.5 mb-3">
          {Object.entries(pending.tool_input).map(([k, v]) => (
            <div key={k} className="text-[12.5px] flex gap-2 flex-wrap">
              <span className="font-semibold text-neutral-500 min-w-[80px]">{k}</span>
              <span className="text-neutral-800 break-all">{String(v)}</span>
            </div>
          ))}
        </div>
        <p className="text-[12px] text-neutral-400 mb-3">
          {pending.requires_approval
            ? '⚠️ This requires admin approval after you confirm.'
            : '⚡ This will execute immediately.'}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onConfirm(true)}
            aria-label="Confirm tool execution"
            className="px-3 py-1.5 text-white text-[12.5px] font-semibold rounded-lg transition-all btn-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1877F2]"
          >
            ✓ Confirm
          </button>
          <button
            onClick={() => onConfirm(false)}
            aria-label="Cancel tool execution"
            className="px-3 py-1.5 text-neutral-700 text-[12.5px] font-medium rounded-lg transition-colors hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1877F2]"
            style={{ border: '1px solid #e2e8f0' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
