// Supabase Edge Function: groq-chat
//
// Powers the "Waste Management Assistant" chat tab. Forwards the conversation
// to Groq's OpenAI-compatible chat completions API with a CleanChain-specific
// system prompt. The Groq API key lives only here, as an Edge Function secret,
// so it never reaches the browser bundle.
//
// POST body: { "messages": { role: "user" | "assistant", content: string }[] }
// Response:  { "reply": string } | { "error": string }
//
// Secrets: GROQ_API_KEY (required), GROQ_MODEL (optional), SATS_PER_KG (optional)
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

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = Deno.env.get("GROQ_MODEL") ?? "openai/gpt-oss-120b";
const SATS_PER_KG = Deno.env.get("SATS_PER_KG") ?? "10";

// Limits that keep a public, unauthenticated endpoint from being used as a
// free general-purpose LLM proxy or running up the Groq bill.
const MAX_HISTORY = 12;
const MAX_MESSAGE_CHARS = 2000;

const SYSTEM_PROMPT = `You are the CleanChain Waste Management Assistant, a friendly helper inside the CleanChain Core Operator app.

About CleanChain:
- Users log in with their Blink (blink.sv) Bitcoin Lightning wallet username. No browser wallet extension is needed.
- Users collect plastic waste and submit it in the app with the waste type, weight, a photo and GPS location.
- An admin reviews each submission. Approved submissions earn "Plastic Pennies": real satoshis (sats) paid to the user's Blink Lightning wallet, currently ${SATS_PER_KG} sats per kg.
- The marketplace lets users redeem tokens for goods, and the education section offers paid courses.
- Logistics organisations and waste trackers pick up and process collected waste.

What you help with:
- Sorting and identifying plastics (resin codes 1-7: PET, HDPE, PVC, LDPE, PP, PS, other), cleaning and preparing waste, safe handling.
- Recycling, reducing and reusing plastic, and the environmental impact of plastic waste.
- How to use CleanChain: submitting waste, how rewards work, Blink wallets and sats.

Rules:
- Keep answers short and practical (a few sentences or a short list). Use plain language.
- Reply in plain text only: no Markdown (no **bold**, # headings or tables). For lists, start lines with "- " or "1. ".
- If you don't know a CleanChain-specific detail (exact payout timing, a particular user's balance or submission status), say so and suggest checking the dashboard or contacting an admin. Never invent policies or numbers.
- Politely decline requests unrelated to waste, recycling, the environment or the CleanChain platform.`;

type ChatMessage = { role: "user" | "assistant"; content: string };

const isChatMessage = (m: unknown): m is ChatMessage =>
  typeof m === "object" &&
  m !== null &&
  ((m as ChatMessage).role === "user" ||
    (m as ChatMessage).role === "assistant") &&
  typeof (m as ChatMessage).content === "string";

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
      { error: "The assistant isn't configured yet (missing GROQ_API_KEY)." },
      500,
    );
  }

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return jsonResponse({ error: "messages must be a non-empty array" }, 400);
    }
    if (!messages.every(isChatMessage)) {
      return jsonResponse({ error: "Invalid message format" }, 400);
    }

    const history = (messages as ChatMessage[])
      .slice(-MAX_HISTORY)
      .map((m) => ({
        role: m.role,
        content: m.content.slice(0, MAX_MESSAGE_CHARS),
      }));

    if (history[history.length - 1].role !== "user") {
      return jsonResponse({ error: "Last message must be from the user" }, 400);
    }

    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
        temperature: 0.5,
        // gpt-oss is a reasoning model: its hidden reasoning counts toward
        // this budget, so keep effort low and leave room for the answer.
        reasoning_effort: "low",
        max_tokens: 1500,
      }),
    });

    if (!groqRes.ok) {
      const detail = await groqRes.text();
      console.error("Groq API error:", groqRes.status, detail);
      const message =
        groqRes.status === 429
          ? "The assistant is busy right now. Please try again in a moment."
          : "The assistant couldn't respond. Please try again.";
      return jsonResponse({ error: message }, 502);
    }

    const data = await groqRes.json();
    const reply: string | undefined = data?.choices?.[0]?.message?.content;
    if (!reply) {
      return jsonResponse({ error: "Empty response from the assistant." }, 502);
    }

    return jsonResponse({ reply: reply.trim() });
  } catch (err) {
    console.error("groq-chat error:", err);
    return jsonResponse({ error: "Something went wrong. Please try again." }, 500);
  }
});
