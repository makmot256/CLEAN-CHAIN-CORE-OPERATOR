// Client side of the Waste Management Assistant. The Groq call itself happens
// server-side in supabase/functions/groq-chat so the API key stays secret.
import { supabase } from "@/lib/supabaseClient";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Non-2xx responses carry our { error } body in the underlying Response.
const functionError = async (error: {
  message: string;
  context?: Response;
}): Promise<Error> => {
  const body = await error.context?.json?.().catch(() => null);
  return new Error(body?.error ?? error.message);
};

export const askAssistant = async (
  messages: ChatMessage[],
): Promise<string> => {
  const { data, error } = await supabase.functions.invoke("groq-chat", {
    body: { messages },
  });

  if (error) throw await functionError(error);
  if (!data?.reply) throw new Error(data?.error ?? "No reply received.");
  return data.reply as string;
};

// Speech-to-text via supabase/functions/groq-transcribe (Groq Whisper).
export const transcribeAudio = async (audio: Blob): Promise<string> => {
  const ext = audio.type.includes("mp4")
    ? "mp4"
    : audio.type.includes("ogg")
      ? "ogg"
      : "webm";
  const form = new FormData();
  form.append("audio", audio, `recording.${ext}`);

  const { data, error } = await supabase.functions.invoke("groq-transcribe", {
    body: form,
  });

  if (error) throw await functionError(error);
  return (data?.text as string | undefined) ?? "";
};

// Text-to-speech using the browser's built-in voices. Long text is split into
// sentences because Chrome silently stops utterances after ~15 seconds.
export const canSpeak = () =>
  typeof window !== "undefined" && "speechSynthesis" in window;

export const speak = (text: string, onEnd?: () => void) => {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();

  const chunks = text
    .replace(/^\s*(-|\d+\.)\s+/gm, "") // drop list markers so they aren't read out
    .split(/(?<=[.!?])\s+|\n+/)
    .map((c) => c.trim())
    .filter(Boolean);
  if (chunks.length === 0) return onEnd?.();

  chunks.forEach((chunk, i) => {
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.lang = "en-US";
    if (i === chunks.length - 1) {
      utterance.onend = () => onEnd?.();
      utterance.onerror = () => onEnd?.();
    }
    window.speechSynthesis.speak(utterance);
  });
};

export const stopSpeaking = () => {
  if (canSpeak()) window.speechSynthesis.cancel();
};
