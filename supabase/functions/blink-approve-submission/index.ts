// Supabase Edge Function: blink-approve-submission
//
// Handles the full "approve a waste submission" flow server-side, so the
// Blink API key and the app's sending wallet id never reach the browser:
//   1. Re-validates the calling admin against app_users / an env allowlist.
//   2. Loads the submission and computes the sats reward from its weight.
//   3. If eligible (not a duplicate + prominent location) sends sats via
//      Blink's lnAddressPaymentSend mutation to <submitted_by>@<BLINK_DOMAIN>.
//   4. Updates waste_table (status/verification fields) and credits
//      user_wallet.token_balance — all in one place, atomically enough for
//      this app's scale, using the Supabase service role key.
//
// POST body: {
//   submissionId: number,
//   adminUsername: string,
//   isDuplicate: boolean,
//   isProminentLocation: boolean,
// }
// Self-contained (no relative imports) so it can be pasted straight into the
// Supabase Dashboard's function editor, or deployed via the CLI.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
const BLINK_API_KEY = Deno.env.get("BLINK_API_KEY") ?? "";
const BLINK_BTC_WALLET_ID = Deno.env.get("BLINK_BTC_WALLET_ID") ?? "";
const BLINK_DOMAIN = Deno.env.get("BLINK_DOMAIN") ?? "blink.sv";
const SATS_PER_KG = Number(Deno.env.get("SATS_PER_KG") ?? "10");
const EXTRA_ADMINS = (Deno.env.get("ADMIN_BLINK_USERNAMES") ?? "")
  .split(",")
  .map((v) => v.trim().toLowerCase().split("@")[0])
  .filter(Boolean);

const SEND_MUTATION = `
  mutation lnAddressPaymentSend($input: LnAddressPaymentSendInput!) {
    lnAddressPaymentSend(input: $input) {
      status
      errors { message }
      transaction { id }
    }
  }
`;

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, message: "Method not allowed" }, 405);
  }

  try {
    const { submissionId, adminUsername, isDuplicate, isProminentLocation } =
      await req.json();

    if (!submissionId || !adminUsername) {
      return jsonResponse(
        {
          success: false,
          message: "submissionId and adminUsername are required",
        },
        400,
      );
    }

    const admin = String(adminUsername).trim().toLowerCase();
    const isAdmin = await verifyAdmin(admin);
    if (!isAdmin) {
      return jsonResponse(
        { success: false, message: "Not authorized as admin" },
        403,
      );
    }

    const { data: submission, error: fetchError } = await supabaseAdmin
      .from("waste_table")
      .select("*")
      .eq("id", submissionId)
      .maybeSingle();

    if (fetchError || !submission) {
      return jsonResponse(
        { success: false, message: "Submission not found" },
        404,
      );
    }

    if (submission.tokens_awarded) {
      return jsonResponse({
        success: true,
        granted: true,
        amountSats: Number(submission.tokens_amount || 0),
        message: "Already awarded",
      });
    }

    const shouldGrant = !isDuplicate && Boolean(isProminentLocation);
    const amountSats = Math.max(
      0,
      Math.round(Number(submission.weight || 0) * SATS_PER_KG),
    );

    let granted = false;
    let paymentHash: string | null = null;
    let payMessage: string | undefined;

    if (shouldGrant && amountSats > 0) {
      if (!BLINK_API_KEY || !BLINK_BTC_WALLET_ID) {
        payMessage = "Blink payout is not configured on the server yet.";
      } else {
        const lnAddress = `${submission.submitted_by}@${BLINK_DOMAIN}`;
        try {
          const res = await fetch(BLINK_GRAPHQL_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-KEY": BLINK_API_KEY,
            },
            body: JSON.stringify({
              query: SEND_MUTATION,
              variables: {
                input: {
                  walletId: BLINK_BTC_WALLET_ID,
                  amount: amountSats,
                  lnAddress,
                },
              },
            }),
          });
          const payload = await res.json();
          const result = payload?.data?.lnAddressPaymentSend;
          const errors = result?.errors ?? payload?.errors;

          if (
            result &&
            (result.status === "SUCCESS" || result.status === "ALREADY_PAID")
          ) {
            granted = true;
            paymentHash = result.transaction?.id ?? null;
          } else {
            payMessage =
              errors?.[0]?.message ||
              `Payout failed (status: ${result?.status ?? "unknown"})`;
          }
        } catch (payErr) {
          payMessage =
            payErr instanceof Error ? payErr.message : "Payout request failed";
        }
      }
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("waste_table")
      .update({
        status: "approved",
        tokens_awarded: granted,
        tokens_amount: granted ? amountSats : 0,
        verified_by: admin,
        verified_at: now,
        is_duplicate: Boolean(isDuplicate),
        is_prominent_location: Boolean(isProminentLocation),
        rejection_reason: null,
        tx_hash: paymentHash,
        updated_at: now,
      })
      .eq("id", submissionId);

    if (updateError) {
      return jsonResponse(
        { success: false, message: updateError.message },
        500,
      );
    }

    if (granted) {
      await creditWallet(submission.submitted_by, amountSats);
    }

    return jsonResponse({
      success: true,
      granted,
      amountSats: granted ? amountSats : 0,
      message: granted
        ? "Sats sent to Blink wallet"
        : payMessage || "Approved without payout",
    });
  } catch (err) {
    return jsonResponse(
      {
        success: false,
        message: err instanceof Error ? err.message : "Unexpected error",
      },
      500,
    );
  }
});

async function verifyAdmin(username: string): Promise<boolean> {
  if (EXTRA_ADMINS.includes(username)) return true;

  const { data } = await supabaseAdmin
    .from("app_users")
    .select("role, status")
    .eq("blink_username", username)
    .maybeSingle();

  return data?.role === "admin" && data?.status === "active";
}

async function creditWallet(account: string, amount: number) {
  const { data: wallet } = await supabaseAdmin
    .from("user_wallet")
    .select("token_balance")
    .eq("account", account)
    .maybeSingle();

  if (wallet) {
    await supabaseAdmin
      .from("user_wallet")
      .update({
        token_balance: Number(wallet.token_balance || 0) + amount,
        updated_at: new Date().toISOString(),
      })
      .eq("account", account);
  } else {
    await supabaseAdmin
      .from("user_wallet")
      .insert({ account, token_balance: amount });
  }
}
