import React, { useState, useEffect, useRef, useCallback } from 'react';
import fixieLogo from '../../../images/image.png';
import { useApp } from '../../../contexts/FixieAppContext';
import { useToast } from '../../../hooks/useFixieToast';
import { apiGet, apiPost, apiStream } from '../../../lib/fixie/api';
import { formatMarkdown } from '../../../lib/fixie/utils';
import { useVoiceAgent } from '../../../hooks/useVoiceAgent';
import type { VoiceState } from '../../../hooks/useVoiceAgent';
import type { Message, PendingConfirmation } from '../../../types/fixie';
import { ChatLoadingSkeleton } from '../ui/Skeleton';

interface DisplayMessage extends Message { ts?: number; streaming?: boolean; }

export function ChatView({ onOpenNav }: { onOpenNav: () => void }) {
  const { appUser, appOrg, currentConvId, setCurrentConvId } = useApp();
  const { toast } = useToast();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [pending, setPending] = useState<PendingConfirmation | null>(null);
  const [convTitle, setConvTitle] = useState('New Chat');
  const [voiceActive, setVoiceActive] = useState(false);
  const [isLoadingConv, setIsLoadingConv] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suppressNextLoad = useRef(false);

  const sendVoiceRef = useRef<(text: string) => void>(() => { });
  const { voiceState, activate: activateVoice, deactivate: deactivateVoice, speak, setListening } = useVoiceAgent({
    onTranscript: (text) => sendVoiceRef.current(text),
    onInterrupt: () => { /* TTS already stopped by hook; recording resumes automatically */ },
    onError: (msg) => toast(msg, 'error'),
  });

  const scrollToBottom = useCallback(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, []);

  const loadConversationById = useCallback(async (id: string) => {
    setPending(null);
    setIsLoadingConv(true);
    try {
      const data = await apiGet<{ title: string; messages: Message[] }>(`/api/conversations/${id}`);
      setConvTitle(data.title);
      setMessages(data.messages as DisplayMessage[]);
      setTimeout(scrollToBottom, 50);
    } catch {
      toast('Failed to load conversation', 'error');
    } finally {
      setIsLoadingConv(false);
    }
  }, [scrollToBottom, toast]);

  useEffect(() => {
    if (suppressNextLoad.current) { suppressNextLoad.current = false; return; }
    if (currentConvId === null) { setMessages([]); setConvTitle('New Chat'); setPending(null); return; }
    loadConversationById(currentConvId);
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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, 130);
    el.style.height = next + 'px';
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
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.overflowY = 'hidden'; }
    await _doSend(msg);
    setSending(false);
    textareaRef.current?.focus();
  }

  async function sendVoiceMessage(text: string) {
    if (sending) { setListening(); return; }
    setSending(true);
    appendMsg('user', text);
    await _doSend(text, (response) => speak(response), true);
    setSending(false);
  }
  // Keep ref in sync so the hook's onTranscript closure always calls the latest version
  sendVoiceRef.current = sendVoiceMessage;

  async function _doSend(msg: string, onResponse?: (text: string) => void, skipUserBubble = false) {
    if (!skipUserBubble) appendMsg('user', msg);

    // Build request body (may be a confirmed-tool stage-2 payload)
    let body: Record<string, unknown> = { message: msg, conversation_id: currentConvId };
    if (pending && msg.toLowerCase() === 'yes') {
      body = {
        message: msg, conversation_id: currentConvId, user_confirmed: true,
        confirmed_tool_name: pending.tool_name, confirmed_tool_input: pending.tool_input,
        confirmed_tool_use_id: pending.tool_use_id, confirmed_integration_id: pending.integration_id,
        conversation_snapshot: pending.conversation_snapshot,
      };
      setPending(null);
    }

    // Insert an empty streaming assistant bubble
    const streamTs = Date.now();
    setMessages(prev => [...prev, { role: 'assistant', content: '', ts: streamTs, streaming: true }]);
    setTimeout(scrollToBottom, 50);

    let fullText = '';
    try {
      const result = await apiStream('/api/chat/stream', body, (token) => {
        fullText += token;
        setMessages(prev => prev.map(m =>
          m.ts === streamTs ? { ...m, content: m.content + token } : m,
        ));
        setTimeout(scrollToBottom, 0);
      });

      // Mark streaming complete
      setMessages(prev => prev.map(m =>
        m.ts === streamTs ? { ...m, streaming: false } : m,
      ));

      if (!currentConvId) { suppressNextLoad.current = true; setCurrentConvId(result.conversation_id); }
      if (result.pending_confirmation) {
        setPending(result.pending_confirmation as unknown as PendingConfirmation);
      } else {
        setPending(null);
      }
      onResponse?.(fullText);
    } catch (e: unknown) {
      // Remove the streaming placeholder and show an error bubble instead
      setMessages(prev => prev.filter(m => m.ts !== streamTs));
      appendMsg('assistant', '⚠️ ' + (e instanceof Error ? e.message : 'Something went wrong.'));
      setListening();
    }
  }

  async function confirmTool(confirmed: boolean) {
    if (!pending) return;
    const snap = pending;
    setPending(null);
    if (!confirmed) { appendMsg('assistant', 'Action cancelled.'); return; }
    const confirmationText = 'Confirmed';
    appendMsg('user', confirmationText);
    setIsTyping(true);
    try {
      const body = {
        message: confirmationText, conversation_id: currentConvId, user_confirmed: true,
        confirmed_tool_name: snap.tool_name, confirmed_tool_input: snap.tool_input,
        confirmed_tool_use_id: snap.tool_use_id, confirmed_integration_id: snap.integration_id,
        conversation_snapshot: snap.conversation_snapshot,
      };
      const data = await apiPost<{ response: string }>('/api/chat/message', body);
      setIsTyping(false);
      appendMsg('assistant', data.response);
    } catch (e: unknown) {
      setIsTyping(false);
      appendMsg('assistant', '⚠️ ' + (e instanceof Error ? e.message : 'Something went wrong.'));
    }
  }

  const integrations = appOrg?.integrations ?? [];
  const isEmpty = messages.length === 0 && !isTyping && !pending;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();
  const firstName = (appUser?.name ?? '').split(' ')[0] || 'there';

  const SUGGESTIONS = [
    { label: 'Create a support ticket', prompt: 'Create a support ticket for ' },
    { label: 'Check open tickets', prompt: 'Show me my open support tickets' },
    { label: 'Update a ticket', prompt: 'Update the status of ticket #' },
    { label: 'Reply to a ticket', prompt: 'Reply to ticket #' },
  ];

  const applyPrompt = (prompt: string) => {
    setInputVal(prompt);
    setTimeout(() => {
      textareaRef.current?.focus();
      if (textareaRef.current) autoResize(textareaRef.current);
    }, 0);
  };

  const toggleVoiceMode = () => {
    if (voiceActive) { deactivateVoice(); setVoiceActive(false); }
    else { activateVoice(); setVoiceActive(true); }
  };

  return (
    <div className="flex flex-1 overflow-hidden relative">

      {/* ── Chat area ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-zinc-50 dark:bg-zinc-950">

        {isEmpty ? (
          /* ── Welcome / empty state ────────────────────────────────────────── */
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 fade-in">

            {/* Mobile hamburger — top left */}
            <button
              className="md:hidden absolute top-3 left-3 w-8 h-8 flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 transition-colors"
              onClick={onOpenNav}
              aria-label="Open navigation menu"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Logo */}
            <img src={fixieLogo} alt="Fixie" className="w-10 h-10 rounded-xl object-cover mb-5 shadow-sm" />

            {/* Greeting */}
            <h1 className="text-[22px] md:text-[26px] font-bold text-zinc-900 mb-1.5 text-center">
              {greeting}, {firstName}
            </h1>
            <p className="text-[14px] text-zinc-400 mb-8 text-center">
              What can I help you with today?
            </p>

            {/* Centered input */}
            <div className="w-full max-w-2xl">
              <div
                className="flex gap-2 items-end bg-white dark:bg-zinc-900 rounded-xl px-3.5 py-2.5 transition-all border border-zinc-200 dark:border-zinc-700"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = '#7c3aed'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
                onBlurCapture={e => { const el = e.currentTarget as HTMLElement; if (document.documentElement.classList.contains('dark')) { el.style.borderColor = '#3f3f46'; } else { el.style.borderColor = '#e4e4e7'; } el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
              >
                <textarea
                  ref={textareaRef}
                  value={inputVal}
                  onChange={e => { setInputVal(e.target.value); autoResize(e.target); }}
                  onKeyDown={handleKey}
                  rows={1}
                  placeholder="Ask me anything — create tickets, check statuses, look up users…"
                  aria-label="Type a message. Press Enter to send, Shift+Enter for new line."
                  disabled={sending}
                  className="flex-1 resize-none outline-none text-[13.5px] leading-relaxed bg-transparent disabled:opacity-50 text-zinc-900 placeholder-zinc-400"
                  style={{ maxHeight: 130, overflowY: 'hidden' }}
                />
                <MicButton voiceState={voiceState} active={voiceActive} onClick={toggleVoiceMode} disabled={sending} />
                <button
                  onClick={sendMessage}
                  disabled={sending || !inputVal.trim()}
                  aria-label="Send message"
                  className="w-8 h-8 rounded-lg text-white flex items-center justify-center shrink-0 btn-brand disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>

              {/* Suggestion chips */}
              <div className="flex flex-wrap gap-2 mt-3 justify-center">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s.label}
                    onClick={() => applyPrompt(s.prompt)}
                    className="text-[12px] font-medium px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-600 hover:text-violet-700 dark:hover:text-violet-400 hover:border-violet-300 dark:hover:border-violet-600 transition-colors"
                    style={{ border: '1px solid #e4e4e7' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#c4b5fd'; (e.currentTarget as HTMLElement).style.background = '#f5f3ff'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e4e4e7'; (e.currentTarget as HTMLElement).style.background = '#ffffff'; }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Connected integrations hint */}
              {integrations.length > 0 && (
                <p className="text-[11px] text-zinc-400 mt-3 text-center">
                  Connected to {integrations.map(i => i.name).join(' · ')}
                </p>
              )}
            </div>
          </div>

        ) : (
          /* ── Normal chat view ─────────────────────────────────────────────── */
          <>
            {/* Header */}
            <div
              className="px-3 md:px-5 flex items-center shrink-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800"
              style={{ borderBottom: '1px solid #e4e4e7', minHeight: 52 }}
            >
              <button
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors shrink-0 z-10"
                onClick={onOpenNav}
                aria-label="Open navigation menu"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>

              <div className="md:hidden absolute inset-0 flex items-center justify-center pointer-events-none gap-2" aria-hidden="true">
                <img src={fixieLogo} alt="" className="w-6 h-6 rounded-md object-cover" />
                <span className="text-[14px] font-bold text-zinc-900 tracking-tight">Fixie</span>
              </div>

              <div className="hidden md:flex flex-col flex-1 min-w-0 py-3 gap-0.5">
                <div className="text-[13px] font-semibold text-zinc-900 truncate">{convTitle}</div>
                {integrations.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {integrations.map(i => (
                      <span key={i.id} className="text-[10.5px] font-medium px-1.5 py-px rounded bg-zinc-100 text-zinc-500">
                        {i.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {appOrg && !appOrg.slug.startsWith('user-') && (
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 px-2 py-1 rounded-md ml-3 shrink-0" style={{ background: '#f4f4f5' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  {appOrg.name}
                </span>
              )}
            </div>

            {/* Message list */}
            <div
              ref={messagesRef}
              className="flex-1 overflow-y-auto flex flex-col gap-3 relative"
              style={{ overflowX: 'hidden' }}
              aria-live="polite"
              aria-label="Messages"
            >
              {isLoadingConv ? (
                <ChatLoadingSkeleton />
              ) : (
                <div className="flex flex-col gap-3 px-4 py-5 md:px-6">
                  {messages.map((m, i) => (
                    <MessageBubble key={i} message={m} userName={appUser?.name ?? 'U'} />
                  ))}
                  {isTyping && <TypingIndicator />}
                  {pending && <ConfirmCard pending={pending} onConfirm={confirmTool} />}
                </div>
              )}
            </div>

            {/* Voice status bar */}
            {voiceActive && (
              <VoiceStatusBar
                voiceState={voiceState}
                onStop={() => { deactivateVoice(); setVoiceActive(false); }}
              />
            )}

            {/* Input bar */}
            <div
              className="px-4 md:px-6 pt-3 bg-white dark:bg-zinc-900 shrink-0"
              style={{ borderTop: voiceActive ? 'none' : '1px solid #e4e4e7', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
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
                  className="flex-1 px-3.5 py-2.5 rounded-lg resize-none outline-none text-[13.5px] leading-relaxed transition-all disabled:opacity-50"
                  style={{ maxHeight: 130, overflowY: 'hidden', background: '#fafafa', border: '1px solid #e4e4e7' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e4e4e7'; e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.boxShadow = ''; }}
                />
                <MicButton voiceState={voiceState} active={voiceActive} onClick={toggleVoiceMode} disabled={sending} />
                <button
                  onClick={sendMessage}
                  disabled={sending || !inputVal.trim()}
                  aria-label="Send message"
                  className="w-9 h-9 rounded-lg text-white flex items-center justify-center shrink-0 btn-brand disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
              {integrations.length > 0 && (
                <p className="text-[11px] text-zinc-400 mt-1.5 text-center max-w-3xl mx-auto">
                  {integrations.map(i => i.name).join(' · ')}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── MicButton ─────────────────────────────────────────────────────────────────
function MicButton({ voiceState, active, onClick, disabled }: {
  voiceState: VoiceState; active: boolean; onClick: () => void; disabled: boolean;
}) {
  const isProcessing = voiceState === 'processing' || voiceState === 'speaking';

  const bgStyle = active
    ? voiceState === 'recording'
      ? { background: '#fef2f2', border: '1px solid #fca5a5' }
      : { background: '#f5f3ff', border: '1px solid #c4b5fd' }
    : { background: 'transparent', border: '1px solid #e4e4e7' };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled && !active}
      aria-label={active ? 'Stop voice mode' : 'Start voice mode'}
      title={active ? `Voice: ${voiceState}` : 'Voice mode'}
      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      style={bgStyle}
    >
      {voiceState === 'recording' ? (
        <span className="relative flex items-center justify-center w-3 h-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
      ) : isProcessing ? (
        <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke={active ? '#7c3aed' : '#71717a'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
        >
          <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      )}
    </button>
  );
}

// ── VoiceStatusBar ─────────────────────────────────────────────────────────────
function VoiceStatusBar({ voiceState, onStop }: { voiceState: VoiceState; onStop: () => void }) {
  const labels: Record<VoiceState, string> = {
    idle: '',
    listening: 'Listening…',
    recording: 'Recording…',
    processing: 'Thinking…',
    speaking: 'Speaking — tap mic to interrupt',
  };
  const colors: Record<VoiceState, string> = {
    idle: '', listening: '#7c3aed', recording: '#dc2626', processing: '#d97706', speaking: '#059669',
  };

  return (
    <div
      className="flex items-center justify-between px-4 py-2 text-[12px] font-medium"
      style={{ background: '#f5f3ff', borderTop: '1px solid #ede9fe', color: colors[voiceState] }}
    >
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ background: colors[voiceState] }} />
          <span className="relative inline-flex rounded-full h-2 w-2"
            style={{ background: colors[voiceState] }} />
        </span>
        {labels[voiceState]}
      </div>
      <button
        onClick={onStop}
        className="text-[11px] text-zinc-500 hover:text-red-500 transition-colors"
      >
        Exit voice mode
      </button>
    </div>
  );
}

// ── MessageBubble ──────────────────────────────────────────────────────────────
function MessageBubble({ message, userName }: {
  message: DisplayMessage; userName: string;
}) {
  const isUser = message.role === 'user';
  const timeStr = message.ts && !message.streaming
    ? new Date(message.ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className={`chat-bubble flex gap-2 max-w-[88%] md:max-w-[72%] ${isUser ? 'self-end flex-row-reverse' : 'self-start'}`}>
      {/* Avatar */}
      <div className="shrink-0 mt-1">
        {isUser ? (
          <div className="w-6 h-6 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0" aria-hidden="true">
            {userName.charAt(0).toUpperCase()}
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200 text-[9px] font-bold text-zinc-500 flex items-center justify-center shrink-0" aria-hidden="true">
            AI
          </div>
        )}
      </div>

      {/* Bubble + time */}
      <div className={`flex flex-col gap-1 min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-3.5 py-2.5 rounded-xl text-[13.5px] leading-relaxed break-words ${isUser ? 'text-white rounded-tr-sm' : 'text-zinc-800 rounded-tl-sm'
            }`}
          style={
            isUser
              ? { background: '#7c3aed' }
              : { background: '#ffffff', border: '1px solid #e4e4e7', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }
          }
        >
          {message.streaming ? (
            /* Plain text during streaming to avoid broken partial markdown */
            <>
              <span style={{ whiteSpace: 'pre-wrap' }}>{message.content || '\u00A0'}</span>
              <span
                aria-hidden="true"
                className="inline-block w-0.5 h-[1em] bg-zinc-500 ml-0.5 align-text-bottom animate-pulse"
              />
            </>
          ) : (
            <span dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }} />
          )}
        </div>
        {timeStr && <span className="text-[10.5px] text-zinc-400 px-1 select-none">{timeStr}</span>}
      </div>
    </div>
  );
}

// ── TypingIndicator ────────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="chat-bubble flex gap-2 self-start" aria-label="Assistant is typing" role="status">
      <div className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200 text-[9px] font-bold text-zinc-500 flex items-center justify-center shrink-0 mt-1" aria-hidden="true">AI</div>
      <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center" style={{ border: '1px solid #e4e4e7' }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="typing-dot w-1.5 h-1.5 rounded-full bg-zinc-400" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );
}

// ── ConfirmCard ────────────────────────────────────────────────────────────────
function ConfirmCard({ pending, onConfirm }: { pending: PendingConfirmation; onConfirm: (v: boolean) => void }) {
  return (
    <div className="chat-bubble flex gap-2 self-start max-w-[90%] md:max-w-[460px]">
      <div className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200 text-[9px] font-bold text-zinc-500 flex items-center justify-center shrink-0 mt-1" aria-hidden="true">AI</div>
      <div
        className="bg-white rounded-xl rounded-tl-sm p-4 flex-1 min-w-0"
        style={{ border: '1px solid #e4e4e7', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
        role="region"
        aria-label="Tool confirmation required"
      >
        {/* Tool header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded bg-zinc-100 flex items-center justify-center shrink-0">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <span className="text-[13px] font-semibold text-zinc-900">{pending.tool_name}</span>
          {pending.server_name && <span className="text-[11.5px] text-zinc-400 ml-auto">{pending.server_name}</span>}
        </div>

        {/* Params */}
        <div className="rounded-lg px-3 py-2.5 mb-3 space-y-1.5" style={{ background: '#fafafa', border: '1px solid #f4f4f5' }}>
          {Object.entries(pending.tool_input).map(([k, v]) => (
            <div key={k} className="flex gap-3 text-[12px]">
              <span className="text-zinc-400 font-medium w-20 shrink-0 truncate">{k}</span>
              <span className="text-zinc-700 break-all">{String(v)}</span>
            </div>
          ))}
        </div>

        {/* Notice */}
        <p className="text-[11.5px] text-zinc-500 mb-3">
          {pending.requires_approval ? 'Requires admin approval before execution.' : 'Will execute immediately upon confirmation.'}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onConfirm(true)}
            className="px-3 py-1.5 text-[12px] font-semibold rounded-md btn-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          >
            Confirm
          </button>
          <button
            onClick={() => onConfirm(false)}
            className="px-3 py-1.5 text-[12px] font-medium rounded-md text-zinc-600 hover:bg-zinc-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900"
            style={{ border: '1px solid #e4e4e7' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
