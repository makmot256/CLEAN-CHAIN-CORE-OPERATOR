// Supabase Edge Function: blink-lookup-username
//
// Validates that a Blink (blink.sv) username exists by calling Blink's public
// `accountDefaultWallet` GraphQL query. This query needs NO API key, so it is
// safe to call directly from here without holding any Blink secret.
//
// POST body: { "username": string }
// Response:  { "valid": boolean, "walletId"?: string, "error"?: string }
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

const BLINK_GRAPHQL_URL =
  Deno.env.get("BLINK_GRAPHQL_URL") ?? "https://api.blink.sv/graphql";

const USERNAME_QUERY = `
  query accountDefaultWallet($username: Username!, $walletCurrency: WalletCurrency) {
    accountDefaultWallet(username: $username, walletCurrency: $walletCurrency) {
      id
      currency
      walletCurrency
    }
  }
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ valid: false, error: "Method not allowed" }, 405);
  }

  try {
    const { username } = await req.json();
    if (!username || typeof username !== "string") {
      return jsonResponse({ valid: false, error: "Username is required" }, 400);
    }

    const clean = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,50}$/.test(clean)) {
      return jsonResponse({
        valid: false,
        error: "Usernames are 3-50 letters, numbers or underscores.",
      });
    }

    const res = await fetch(BLINK_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: USERNAME_QUERY,
        variables: { username: clean, walletCurrency: "BTC" },
      }),
    });

    const payload = await res.json();
    const wallet = payload?.data?.accountDefaultWallet;

    if (!wallet?.id) {
      return jsonResponse({ valid: false });
    }

    return jsonResponse({ valid: true, walletId: wallet.id });
  } catch (err) {
    return jsonResponse(
      {
        valid: false,
        error: err instanceof Error ? err.message : "Lookup failed",
      },
      500,
    );
  }
});
