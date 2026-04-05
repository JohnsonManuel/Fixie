import React, { useState, useEffect, useRef, useCallback } from 'react';
import fixieLogo from '../../../images/image.png';
import { useApp } from '../../../contexts/FixieAppContext';
import { useToast } from '../../../hooks/useFixieToast';
import { apiGet, apiPost, apiDelete } from '../../../lib/fixie/api';
import { formatMarkdown } from '../../../lib/fixie/utils';
import { ConvListSkeleton } from '../ui/Skeleton';
import type { Conversation, Message, PendingConfirmation } from '../../../types/fixie';

interface DisplayMessage extends Message { ts?: number; }

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
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [voiceMode, setVoiceMode]     = useState(false);
  const messagesRef      = useRef<HTMLDivElement>(null);
  const textareaRef      = useRef<HTMLTextAreaElement>(null);
  const suppressNextLoad = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef   = useRef<any>(null);
  const voiceModeRef     = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
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

  const loadConversation = useCallback(async (id: string) => {
    suppressNextLoad.current = true;
    setCurrentConvId(id);
    await loadConversationById(id);
  }, [setCurrentConvId, loadConversationById]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

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

  function speakResponse(text: string) {
    window.speechSynthesis.cancel();
    const plain = text
      .replace(/<[^>]*>/g, '')
      .replace(/[#*`_~[\]()>]/g, '')
      .replace(/\n+/g, ' ')
      .trim();
    if (!plain) return;
    const utterance = new SpeechSynthesisUtterance(plain);
    utterance.rate = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend   = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }

  async function sendMessageWithText(msg: string) {
    if (!msg || sending) return;
    setSending(true);
    setInputVal('');
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.overflowY = 'hidden'; }
    appendMsg('user', msg);
    setIsTyping(true);
    try {
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
      const data = await apiPost<{
        response: string; conversation_id: string;
        pending_confirmation?: PendingConfirmation; pending_approval?: boolean;
      }>('/api/chat/message', body);
      setIsTyping(false);
      if (!currentConvId) { suppressNextLoad.current = true; setCurrentConvId(data.conversation_id); await loadConversations(); }
      if (data.pending_confirmation) { setPending(data.pending_confirmation); appendMsg('assistant', data.response); }
      else { appendMsg('assistant', data.response); setPending(null); }
      if (voiceModeRef.current) speakResponse(data.response);
    } catch (e: unknown) {
      setIsTyping(false);
      appendMsg('assistant', '⚠️ ' + (e instanceof Error ? e.message : 'Something went wrong.'));
    }
    setSending(false);
    textareaRef.current?.focus();
  }

  async function sendMessage() {
    await sendMessageWithText(inputVal.trim());
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

  async function deleteConv(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await apiDelete(`/api/conversations/${id}`);
      if (currentConvId === id) startNewChat();
      await loadConversations();
      toast('Conversation deleted');
    } catch { toast('Failed to delete conversation', 'error'); }
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

  const startRecording = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast('Speech recognition is not supported in this browser. Try Chrome or Edge.', 'error');
      return;
    }
    stopSpeaking();
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript.trim();
      if (transcript) sendMessageWithText(transcript);
    };
    recognition.onerror = () => {
      toast('Voice recognition failed. Please try again.', 'error');
      setIsRecording(false);
    };
    recognition.onend = () => setIsRecording(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const toggleVoiceMode = () => {
    const next = !voiceModeRef.current;
    voiceModeRef.current = next;
    setVoiceMode(next);
    if (!next) stopSpeaking();
  };

  return (
    <div className="flex flex-1 overflow-hidden relative">

      {/* ── Conversation list — desktop ────────────────────────────────────── */}
      <div
        className="hidden md:flex flex-col bg-white md:w-56 md:shrink-0"
        style={{ borderRight: '1px solid #e4e4e7' }}
        aria-label="Conversation list"
      >
        {/* New Chat */}
        <div className="p-3 shrink-0" style={{ borderBottom: '1px solid #f4f4f5' }}>
          <button
            onClick={startNewChat}
            aria-label="Start a new chat"
            className="w-full py-1.5 px-3 text-[12.5px] font-semibold rounded-md flex items-center justify-center gap-1.5 btn-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Conversation items */}
        <div className="flex-1 overflow-y-auto py-1.5 px-2">
          {convsLoading ? (
            <ConvListSkeleton />
          ) : convs.length === 0 ? (
            <p className="text-[11.5px] text-zinc-400 px-2 py-4 leading-relaxed">No chats yet — tap New Chat to start.</p>
          ) : (
            <div className="fade-in flex flex-col gap-px">
              {convs.map(c => {
                const active = c.id === currentConvId;
                const date = new Date(c.last_message_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                return (
                  <div key={c.id} className="group relative">
                    <button
                      onClick={() => loadConversation(c.id)}
                      aria-label={`Open conversation: ${c.title}`}
                      aria-current={active ? 'true' : undefined}
                      className="w-full flex items-start gap-2 px-2.5 py-2 rounded-md cursor-pointer transition-colors text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600"
                      style={active ? { background: '#f5f3ff' } : {}}
                      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#fafafa'; }}
                      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = ''; }}
                    >
                      <div className="flex-1 min-w-0 pr-5">
                        <div className="text-[12.5px] truncate" style={{ color: active ? '#5b21b6' : '#3f3f46', fontWeight: active ? 600 : 500 }}>
                          {c.title}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10.5px] text-zinc-400">{date}</span>
                          {c.status === 'pending_approval' && (
                            <span className="text-[9.5px] font-semibold bg-amber-50 text-amber-700 px-1.5 py-px rounded-full ring-1 ring-amber-200/60">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={e => deleteConv(e, c.id)}
                      aria-label={`Delete conversation: ${c.title}`}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus:opacity-100 w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                    >
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
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

      {/* ── Chat area ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-zinc-50">

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
                className="flex gap-2 items-end bg-white rounded-xl px-3.5 py-2.5 transition-all"
                style={{ border: '1px solid #e4e4e7', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = '#7c3aed'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
                onBlurCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e4e4e7'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
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
                <VoiceModeButton voiceMode={voiceMode} isSpeaking={isSpeaking} onToggleMode={toggleVoiceMode} onStop={stopSpeaking} />
                <MicButton isRecording={isRecording} onClick={toggleRecording} disabled={sending} />
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
                    className="text-[12px] font-medium px-3 py-1.5 rounded-full bg-white text-zinc-600 hover:text-violet-700 hover:border-violet-300 transition-colors"
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
              className="px-3 md:px-5 flex items-center shrink-0 bg-white"
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
              className="flex-1 overflow-y-auto flex flex-col gap-3 px-4 py-5 md:px-6"
              style={{ overflowX: 'hidden' }}
              aria-live="polite"
              aria-label="Messages"
            >
              {messages.map((m, i) => (
                <MessageBubble key={i} message={m} userName={appUser?.name ?? 'U'} />
              ))}
              {isTyping && <TypingIndicator />}
              {pending && <ConfirmCard pending={pending} onConfirm={confirmTool} />}
            </div>

            {/* Input bar */}
            <div
              className="px-4 md:px-6 pt-3 bg-white shrink-0"
              style={{ borderTop: '1px solid #e4e4e7', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
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
                <VoiceModeButton voiceMode={voiceMode} isSpeaking={isSpeaking} onToggleMode={toggleVoiceMode} onStop={stopSpeaking} />
                <MicButton isRecording={isRecording} onClick={toggleRecording} disabled={sending} />
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

// ── VoiceModeButton ───────────────────────────────────────────────────────────
function VoiceModeButton({ voiceMode, isSpeaking, onToggleMode, onStop }: {
  voiceMode: boolean; isSpeaking: boolean; onToggleMode: () => void; onStop: () => void;
}) {
  if (isSpeaking) {
    return (
      <button
        type="button"
        onClick={onStop}
        aria-label="Stop speaking"
        title="Stop speaking"
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all"
        style={{ background: '#ede9fe', border: '1px solid #a78bfa' }}
      >
        <span className="relative flex items-center justify-center w-3 h-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-600" />
        </span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onToggleMode}
      aria-label={voiceMode ? 'Disable voice responses' : 'Enable voice responses'}
      title={voiceMode ? 'Voice responses on — click to disable' : 'Enable voice responses'}
      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all"
      style={voiceMode
        ? { background: '#ede9fe', border: '1px solid #a78bfa' }
        : { background: 'transparent', border: '1px solid #e4e4e7' }
      }
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={voiceMode ? '#7c3aed' : '#71717a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        {voiceMode ? (
          <>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </>
        ) : (
          <line x1="23" y1="9" x2="17" y2="15" />
        )}
      </svg>
    </button>
  );
}

// ── MicButton ─────────────────────────────────────────────────────────────────
function MicButton({ isRecording, onClick, disabled }: {
  isRecording: boolean; onClick: () => void; disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isRecording ? 'Stop listening' : 'Speak a message'}
      title={isRecording ? 'Listening… click to cancel' : 'Click to speak'}
      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      style={isRecording
        ? { background: '#fef2f2', border: '1px solid #fca5a5' }
        : { background: 'transparent', border: '1px solid #e4e4e7' }
      }
    >
      {isRecording ? (
        <span className="relative flex items-center justify-center w-3 h-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      )}
    </button>
  );
}

// ── MessageBubble ──────────────────────────────────────────────────────────────
function MessageBubble({ message, userName }: {
  message: DisplayMessage; userName: string;
}) {
  const isUser = message.role === 'user';
  const timeStr = message.ts
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
          className={`px-3.5 py-2.5 rounded-xl text-[13.5px] leading-relaxed break-words ${
            isUser ? 'text-white rounded-tr-sm' : 'text-zinc-800 rounded-tl-sm'
          }`}
          style={
            isUser
              ? { background: '#7c3aed' }
              : { background: '#ffffff', border: '1px solid #e4e4e7', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }
          }
          dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
        />
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
