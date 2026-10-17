// Client side of the Waste Management Assistant. The Groq call itself happens
// server-side in supabase/functions/groq-chat so the API key stays secret.
import { supabase } from "@/lib/supabaseClient";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const askAssistant = async (
  messages: ChatMessage[],
): Promise<string> => {
  const { data, error } = await supabase.functions.invoke("groq-chat", {
    body: { messages },
  });

  if (error) {
    // Non-2xx responses carry our { error } body in the underlying Response.
    const body = await error.context?.json?.().catch(() => null);
    throw new Error(body?.error ?? error.message);
  }
  if (!data?.reply) throw new Error(data?.error ?? "No reply received.");
  return data.reply as string;
};
