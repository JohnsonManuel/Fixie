import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../../contexts/FixieAppContext';
import { useToast } from '../../../hooks/useFixieToast';
import { apiGet, apiPost, apiDelete } from '../../../lib/fixie/api';
import { formatMarkdown } from '../../../lib/fixie/utils';
import { ConvListSkeleton } from '../ui/Skeleton';
import type { Conversation, Message, PendingConfirmation } from '../../../types/fixie';

export function ChatView() {
  const { appUser, appOrg, currentConvId, setCurrentConvId } = useApp();
  const { toast } = useToast();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [convsLoading, setConvsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [pending, setPending] = useState<PendingConfirmation | null>(null);
  const [convTitle, setConvTitle] = useState('New conversation');
  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const loadConversation = useCallback(async (id: string) => {
    setCurrentConvId(id);
    setPending(null);
    try {
      const data = await apiGet<{ title: string; messages: Message[] }>(`/api/conversations/${id}`);
      setConvTitle(data.title);
      setMessages(data.messages);
      setTimeout(scrollToBottom, 50);
    } catch {
      toast('Failed to load conversation', 'error');
    }
  }, [setCurrentConvId, scrollToBottom, toast]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const startNewChat = () => {
    setCurrentConvId(null);
    setMessages([]);
    setPending(null);
    setConvTitle('New conversation');
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
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  };

  const appendMsg = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, { role, content }]);
    setTimeout(scrollToBottom, 50);
  };

  async function sendMessage() {
    const msg = inputVal.trim();
    if (!msg || sending) return;

    setSending(true);
    setInputVal('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
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
          confirmed_mcp_server_id: pending.mcp_server_id,
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
        confirmed_mcp_server_id: snap.mcp_server_id,
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
    <div className="flex flex-1 overflow-hidden">
      {/* Conv list sidebar */}
      <div className="w-60 shrink-0 flex flex-col bg-white" style={{ borderRight: '1px solid #e8edf3' }}>
        <div className="p-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <button
            onClick={startNewChat}
            className="w-full py-2 px-3 text-white text-[13px] font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all btn-brand"
          >
            ＋ New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2 px-2">
          {convsLoading ? (
            <ConvListSkeleton />
          ) : convs.length === 0 ? (
            <p className="text-[12.5px] text-neutral-400 px-2 py-4 leading-relaxed">
              No conversations yet — click New Chat to start
            </p>
          ) : (
            <div className="fade-in">
              {convs.map(c => {
                const active = c.id === currentConvId;
                const date = new Date(c.last_message_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                return (
                  <div
                    key={c.id}
                    onClick={() => loadConversation(c.id)}
                    className="group flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition-all mb-0.5"
                    style={
                      active
                        ? { background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid rgba(24,119,242,0.12)' }
                        : { border: '1px solid transparent' }
                    }
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = ''; }}
                  >
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[13px] font-medium truncate"
                        style={{ color: active ? '#1877F2' : '#111827', fontWeight: active ? 600 : 500 }}
                      >
                        {c.title}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-neutral-400">{date} · {c.message_count} msg{c.message_count !== 1 ? 's' : ''}</span>
                        {c.status === 'pending_approval' && (
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full" style={{ border: '1px solid #fde68a' }}>
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={e => deleteConv(e, c.id)}
                      className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-lg text-sm transition-all"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#f8fafc' }}>
        {/* Header */}
        <div className="px-5 py-3.5 flex items-center gap-3 shrink-0 bg-white" style={{ borderBottom: '1px solid #e8edf3' }}>
          <div className="flex-1">
            <div className="text-sm font-semibold text-neutral-900">{convTitle}</div>
            {integrations.length > 0 && (
              <div className="flex gap-1.5 mt-1 flex-wrap">
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
        </div>

        {/* Messages */}
        <div ref={messagesRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-3.5">
          {messages.length === 0 && !isTyping && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #bfdbfe' }}
              >
                💬
              </div>
              <h3 className="text-[15px] font-bold text-neutral-700">Start a conversation</h3>
              <p className="text-sm text-neutral-400 text-center max-w-xs leading-relaxed">
                {integrations.length > 0
                  ? `Available: ${integrations.map(i => i.name).join(', ')}`
                  : 'Type a message below. I can help create tickets and manage issues.'}
              </p>
            </div>
          )}
          {messages.map((m, i) => <MessageBubble key={i} message={m} userName={appUser?.name ?? 'U'} />)}
          {isTyping && <TypingIndicator />}
          {pending && <ConfirmCard pending={pending} onConfirm={confirmTool} />}
        </div>

        {/* Input */}
        <div className="px-5 py-4 bg-white shrink-0" style={{ borderTop: '1px solid #e8edf3' }}>
          <div className="flex gap-2.5 items-end">
            <textarea
              ref={textareaRef}
              value={inputVal}
              onChange={e => { setInputVal(e.target.value); autoResize(e.target); }}
              onKeyDown={handleKey}
              rows={1}
              placeholder="Message…"
              className="flex-1 px-4 py-2.5 rounded-xl resize-none outline-none text-[13.5px] leading-relaxed transition-all"
              style={{
                maxHeight: 140,
                overflowY: 'auto',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#1877F2'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(24,119,242,0.1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.boxShadow = ''; }}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !inputVal.trim()}
              className="w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 transition-all btn-brand disabled:opacity-40"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          {integrations.length > 0 && (
            <p className="text-[11.5px] text-neutral-400 mt-1.5">
              Available integrations: {integrations.map(i => i.name).join(', ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, userName }: { message: Message; userName: string }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-2.5 max-w-[80%] ${isUser ? 'self-end flex-row-reverse' : 'self-start'}`}>
      <div
        className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
        style={{
          background: isUser
            ? 'linear-gradient(135deg, #1877F2 0%, #0E4F99 100%)'
            : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          color: isUser ? '#fff' : '#a78bfa',
        }}
      >
        {isUser ? userName.charAt(0).toUpperCase() : 'AI'}
      </div>
      <div
        className={`px-3.5 py-2.5 rounded-xl text-[13.5px] leading-relaxed max-w-full ${
          isUser ? 'text-white rounded-br-sm' : 'text-neutral-900 rounded-bl-sm'
        }`}
        style={
          isUser
            ? { background: 'linear-gradient(135deg, #1877F2 0%, #0E4F99 100%)', boxShadow: '0 2px 8px rgba(24,119,242,0.25)' }
            : { background: '#fff', border: '1px solid #e8edf3', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }
        }
        dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
      />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5 self-start">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: '#a78bfa' }}
      >
        AI
      </div>
      <div className="bg-white rounded-xl px-4 py-3 flex gap-1 items-center" style={{ border: '1px solid #e8edf3', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="typing-dot w-2 h-2 rounded-full"
            style={{ animationDelay: `${i * 0.2}s`, background: '#1877F2', opacity: 0.6 }}
          />
        ))}
      </div>
    </div>
  );
}

function ConfirmCard({ pending, onConfirm }: { pending: PendingConfirmation; onConfirm: (v: boolean) => void }) {
  return (
    <div className="flex gap-2.5 self-start max-w-[480px]">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: '#a78bfa' }}
      >
        AI
      </div>
      <div className="bg-white rounded-xl p-4 flex-1" style={{ border: '1px solid #e8edf3', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="text-[13px] font-semibold mb-2">
          🔧 {pending.tool_name}
          {pending.server_name && <span className="text-neutral-400 font-normal ml-1.5">· {pending.server_name}</span>}
        </div>
        <div className="flex flex-col gap-1.5 mb-3">
          {Object.entries(pending.tool_input).map(([k, v]) => (
            <div key={k} className="text-[12.5px] flex gap-2">
              <span className="font-semibold text-neutral-500 min-w-[80px]">{k}</span>
              <span className="text-neutral-800">{String(v)}</span>
            </div>
          ))}
        </div>
        <p className="text-[12px] text-neutral-400 mb-3">
          {pending.requires_approval ? '⚠️ This requires admin approval after you confirm.' : '⚡ This will execute immediately.'}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onConfirm(true)}
            className="px-3 py-1.5 text-white text-[12.5px] font-semibold rounded-lg transition-all btn-brand"
          >
            ✓ Confirm
          </button>
          <button
            onClick={() => onConfirm(false)}
            className="px-3 py-1.5 text-neutral-700 text-[12.5px] font-medium rounded-lg transition-colors hover:bg-neutral-50"
            style={{ border: '1px solid #e2e8f0' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
