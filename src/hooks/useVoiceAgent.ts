/**
 * useVoiceAgent — full-duplex voice loop for Fixie chat.
 *
 * State machine:
 *   idle → listening → recording → processing → speaking → listening → …
 *
 * Interruption: while in 'speaking', if mic volume exceeds threshold the
 * current TTS audio is stopped and recording begins immediately.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getApps } from 'firebase/app';
import { API_BASE } from '../lib/fixie/config';
import { apiUpload } from '../lib/fixie/api';

export type VoiceState = 'idle' | 'listening' | 'recording' | 'processing' | 'speaking';

const SPEECH_THRESHOLD   = 0.012;  // RMS amplitude to consider as speech
const INTERRUPT_THRESHOLD = 0.025; // higher threshold to trigger interruption
const SILENCE_MS         = 900;   // ms of silence before stopping recording
const MIN_SPEECH_MS      = 250;   // ignore recordings shorter than this

interface UseVoiceAgentOptions {
  onTranscript: (text: string) => void;
  onInterrupt:  () => void;
  onError:      (msg: string) => void;
}

export function useVoiceAgent({ onTranscript, onInterrupt, onError }: UseVoiceAgentOptions) {
  const [voiceState, _setVoiceState] = useState<VoiceState>('idle');

  // Keep a ref in sync so RAF callbacks always see the current state
  const stateRef          = useRef<VoiceState>('idle');
  const activeRef         = useRef(false);

  const audioCtxRef       = useRef<AudioContext | null>(null);
  const analyserRef       = useRef<AnalyserNode | null>(null);
  const streamRef         = useRef<MediaStream | null>(null);
  const recorderRef       = useRef<MediaRecorder | null>(null);
  const chunksRef         = useRef<Blob[]>([]);
  const silenceTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechStartRef    = useRef<number>(0);
  const rafRef            = useRef<number | null>(null);
  const ttsAudioRef       = useRef<HTMLAudioElement | null>(null);

  const setState = useCallback((s: VoiceState) => {
    stateRef.current = s;
    _setVoiceState(s);
  }, []);

  // ── Stop TTS playback ────────────────────────────────────────────────────────
  const stopTTS = useCallback(() => {
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current.src = '';
      ttsAudioRef.current = null;
    }
  }, []);

  // ── Stop recording ───────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  }, []);

  // ── Start recording ──────────────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    if (!streamRef.current || !activeRef.current) return;
    chunksRef.current    = [];
    speechStartRef.current = Date.now();
    setState('recording');

    const recorder = new MediaRecorder(streamRef.current);
    recorderRef.current  = recorder;

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };

    recorder.onstop = async () => {
      if (!activeRef.current) return;
      if (Date.now() - speechStartRef.current < MIN_SPEECH_MS) { setState('listening'); return; }

      setState('processing');
      try {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const form = new FormData();
        form.append('audio', blob, 'recording.webm');
        const { text } = await apiUpload<{ text: string }>('/api/chat/transcribe', form);
        if (text.trim() && activeRef.current) {
          onTranscript(text.trim());
          // Stay in 'processing' — ChatView will call speak() when it has a response,
          // or call setListening() if something fails.
        } else {
          if (activeRef.current) setState('listening');
        }
      } catch {
        onError('Could not transcribe. Try again.');
        if (activeRef.current) setState('listening');
      }
    };

    recorder.start();
  }, [setState, onTranscript, onError]);

  // ── VAD loop (runs on every animation frame) ─────────────────────────────────
  const startVAD = useCallback(() => {
    if (!analyserRef.current) return;
    const analyser = analyserRef.current;
    const buf = new Float32Array(analyser.fftSize);

    const tick = () => {
      if (!activeRef.current) return;
      rafRef.current = requestAnimationFrame(tick);

      analyser.getFloatTimeDomainData(buf);
      const rms = Math.sqrt(buf.reduce((s, v) => s + v * v, 0) / buf.length);
      const state = stateRef.current;

      if (state === 'listening' && rms > SPEECH_THRESHOLD) {
        // Speech detected → start recording
        startRecording();

      } else if (state === 'recording') {
        if (rms < SPEECH_THRESHOLD) {
          // Silence — start / keep silence timer
          if (!silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              silenceTimerRef.current = null;
              stopRecording();
            }, SILENCE_MS);
          }
        } else {
          // Still speaking — cancel silence timer
          if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
        }

      } else if (state === 'speaking' && rms > INTERRUPT_THRESHOLD) {
        // User interrupted TTS
        stopTTS();
        onInterrupt();
        startRecording();
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [startRecording, stopRecording, stopTTS, onInterrupt]);

  // ── Public: activate voice mode ──────────────────────────────────────────────
  const activate = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
      });
      streamRef.current = stream;

      const ctx      = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audioCtxRef.current  = ctx;
      analyserRef.current  = analyser;

      activeRef.current = true;
      setState('listening');
      startVAD();
    } catch {
      onError('Microphone access denied.');
    }
  }, [setState, startVAD, onError]);

  // ── Public: deactivate voice mode ────────────────────────────────────────────
  const deactivate = useCallback(() => {
    activeRef.current = false;
    if (rafRef.current)        cancelAnimationFrame(rafRef.current);
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    stopRecording();
    stopTTS();
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    streamRef.current   = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
    setState('idle');
  }, [setState, stopRecording, stopTTS]);

  // ── Public: speak Claude's response ──────────────────────────────────────────
  const speak = useCallback(async (text: string) => {
    if (!activeRef.current) return;
    setState('speaking');
    try {
      let token = '';
      if (getApps().length) {
        const user = getAuth().currentUser;
        if (user) token = await user.getIdToken();
      }

      const res = await fetch(`${API_BASE}/api/chat/speak`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('TTS failed');

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const audio = new Audio(url);
      ttsAudioRef.current = audio;

      await new Promise<void>(resolve => {
        audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
        audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
        audio.play().catch(resolve);
      });

      // Only go back to listening if we weren't interrupted
      if (activeRef.current && stateRef.current === 'speaking') setState('listening');
    } catch {
      if (activeRef.current) setState('listening');
    }
  }, [setState]);

  // ── Public: manually return to listening (e.g. after failed send) ────────────
  const setListening = useCallback(() => {
    if (activeRef.current) setState('listening');
  }, [setState]);

  // Cleanup on unmount
  useEffect(() => () => deactivate(), [deactivate]);

  return { voiceState, activate, deactivate, speak, setListening };
}
