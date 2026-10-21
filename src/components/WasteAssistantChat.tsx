import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Mic,
  Send,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  askAssistant,
  canSpeak,
  speak,
  stopSpeaking,
  transcribeAudio,
  type ChatMessage,
} from "@/lib/assistant";

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hello! I'm your waste management assistant. Type or tap the mic to ask me about sorting plastics, recycling, or how CleanChain rewards work.",
};

const SUGGESTIONS = [
  "How do I properly sort plastic waste?",
  "How do I earn sats on CleanChain?",
  "Which plastics can be recycled?",
];

// Voice questions are short; stop recording automatically after this.
const MAX_RECORDING_MS = 60_000;

const pickMimeType = () =>
  ["audio/webm;codecs=opus", "audio/webm", "audio/ogg", "audio/mp4"].find(
    (t) => MediaRecorder.isTypeSupported?.(t),
  );

const WasteAssistantChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const stopTimerRef = useRef<number>();

  const ttsSupported = canSpeak();
  const micSupported =
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined";
  const busy = loading || transcribing;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, transcribing]);

  // Stop any speech or recording when leaving the tab.
  useEffect(
    () => () => {
      stopSpeaking();
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      window.clearTimeout(stopTimerRef.current);
    },
    [],
  );

  const playMessage = (index: number, text: string) => {
    setSpeakingIndex(index);
    speak(text, () =>
      setSpeakingIndex((current) => (current === index ? null : current)),
    );
  };

  const togglePlay = (index: number, text: string) => {
    if (speakingIndex === index) {
      stopSpeaking();
      setSpeakingIndex(null);
    } else {
      playMessage(index, text);
    }
  };

  const send = async (text: string, readAloud = voiceReplies) => {
    const content = text.trim();
    if (!content || busy) return;

    stopSpeaking();
    setSpeakingIndex(null);
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      // The greeting is UI-only; don't send it as model history.
      const reply = await askAssistant(next.slice(1));
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      if (readAloud && ttsSupported) playMessage(next.length, reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecorded = async (blob: Blob) => {
    if (blob.size === 0) return;
    setTranscribing(true);
    setError(null);
    try {
      const text = await transcribeAudio(blob);
      if (!text) {
        setError("I didn't catch that. Please try again.");
        return;
      }
      // Speaking a question turns on spoken answers.
      setVoiceReplies(ttsSupported);
      setTranscribing(false);
      await send(text, ttsSupported);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Voice input failed.");
    } finally {
      setTranscribing(false);
    }
  };

  const startRecording = async () => {
    setError(null);
    stopSpeaking();
    setSpeakingIndex(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        window.clearTimeout(stopTimerRef.current);
        setRecording(false);
        handleRecorded(
          new Blob(chunks, { type: recorder.mimeType || "audio/webm" }),
        );
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      stopTimerRef.current = window.setTimeout(
        () => recorder.state === "recording" && recorder.stop(),
        MAX_RECORDING_MS,
      );
    } catch {
      setError(
        "Microphone access was blocked. Allow it in your browser settings to use voice.",
      );
    }
  };

  const toggleRecording = () => {
    if (recording) recorderRef.current?.stop();
    else startRecording();
  };

  const toggleVoiceReplies = () => {
    if (voiceReplies) {
      stopSpeaking();
      setSpeakingIndex(null);
    }
    setVoiceReplies(!voiceReplies);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div>
      <div
        ref={scrollRef}
        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-80 mb-4 overflow-y-auto"
        aria-live="polite"
      >
        <div className="space-y-3">
          {messages.map((m, i) =>
            m.role === "assistant" ? (
              <div key={i} className="flex items-start gap-1 max-w-[85%]">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap dark:text-gray-200">
                    {m.content}
                  </p>
                </div>
                {ttsSupported && (
                  <button
                    type="button"
                    onClick={() => togglePlay(i, m.content)}
                    className="shrink-0 p-1.5 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-700"
                    aria-label={speakingIndex === i ? "Stop reading" : "Read aloud"}
                    title={speakingIndex === i ? "Stop reading" : "Read aloud"}
                  >
                    {speakingIndex === i ? (
                      <Square className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div
                key={i}
                className="bg-white dark:bg-gray-700 p-3 rounded-lg max-w-[85%] ml-auto"
              >
                <p className="text-sm whitespace-pre-wrap dark:text-gray-200">
                  {m.content}
                </p>
              </div>
            ),
          )}
          {(loading || transcribing) && (
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg w-fit flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
              {transcribing && (
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  Transcribing…
                </span>
              )}
            </div>
          )}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      </div>

      {messages.length === 1 && !busy && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map((s) => (
            <Button
              key={s}
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => send(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        {micSupported && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={toggleRecording}
            disabled={busy}
            className={
              recording
                ? "shrink-0 border-red-500 text-red-500 hover:text-red-600 animate-pulse"
                : "shrink-0"
            }
            aria-label={recording ? "Stop recording" : "Speak your question"}
            title={recording ? "Stop recording" : "Speak your question"}
          >
            {recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
        )}
        <Input
          placeholder={
            recording
              ? "Listening… tap the red button when you're done"
              : "Ask about waste management..."
          }
          className="flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={2000}
          disabled={busy || recording}
        />
        {ttsSupported && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={toggleVoiceReplies}
            className={
              voiceReplies
                ? "shrink-0 border-blue-500 text-blue-600 dark:text-blue-400"
                : "shrink-0"
            }
            aria-pressed={voiceReplies}
            aria-label={voiceReplies ? "Turn off spoken replies" : "Turn on spoken replies"}
            title={voiceReplies ? "Spoken replies on" : "Spoken replies off"}
          >
            {voiceReplies ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        )}
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 shrink-0"
          disabled={busy || recording || !input.trim()}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span className="ml-2 hidden sm:inline">Send</span>
        </Button>
      </form>
    </div>
  );
};

export default WasteAssistantChat;
