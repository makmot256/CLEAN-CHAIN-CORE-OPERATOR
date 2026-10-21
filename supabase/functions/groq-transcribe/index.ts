// Supabase Edge Function: groq-transcribe
//
// Speech-to-text for the Waste Management Assistant's microphone button.
// Forwards a short voice recording to Groq's Whisper transcription API. The
// Groq API key lives only here, as an Edge Function secret.
//
// POST body: multipart/form-data with an "audio" file (webm, ogg, mp4, wav...)
// Response:  { "text": string } | { "error": string }
//
// Secrets: GROQ_API_KEY (required), GROQ_STT_MODEL (optional)
//
// Self-contained (no relative imports) so it can be pasted straight into the
// Supabase Dashboard's function editor, or deployed via the CLI.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const GROQ_STT_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_STT_MODEL =
  Deno.env.get("GROQ_STT_MODEL") ?? "whisper-large-v3-turbo";

// A one-minute voice message is well under 1 MB; this cap stops the public
// endpoint being used to transcribe arbitrary long recordings.
const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("GROQ_API_KEY");
  if (!apiKey) {
    return jsonResponse(
      { error: "Voice input isn't configured yet (missing GROQ_API_KEY)." },
      500,
    );
  }

  try {
    const form = await req.formData();
    const audio = form.get("audio");
    if (!(audio instanceof File) || audio.size === 0) {
      return jsonResponse({ error: "No audio received." }, 400);
    }
    if (audio.size > MAX_AUDIO_BYTES) {
      return jsonResponse({ error: "Recording is too long." }, 413);
    }

    const upstream = new FormData();
    upstream.append("file", audio, audio.name || "recording.webm");
    upstream.append("model", GROQ_STT_MODEL);
    upstream.append("response_format", "json");
    upstream.append("temperature", "0");

    const groqRes = await fetch(GROQ_STT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
    });

    if (!groqRes.ok) {
      const detail = await groqRes.text();
      console.error("Groq STT error:", groqRes.status, detail);
      const message =
        groqRes.status === 429
          ? "Voice input is busy right now. Please try again in a moment."
          : "Couldn't understand the recording. Please try again.";
      return jsonResponse({ error: message }, 502);
    }

    const data = await groqRes.json();
    const text = typeof data?.text === "string" ? data.text.trim() : "";
    return jsonResponse({ text });
  } catch (err) {
    console.error("groq-transcribe error:", err);
    return jsonResponse({ error: "Something went wrong. Please try again." }, 500);
  }
});
