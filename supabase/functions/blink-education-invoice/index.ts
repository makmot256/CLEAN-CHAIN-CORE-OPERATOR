// Supabase Edge Function: blink-education-invoice
//
// Sells access to educational videos for sats over Lightning. Invoices are
// created on the app's own Blink wallet (BLINK_API_KEY / BLINK_BTC_WALLET_ID),
// so the user can pay from Blink or any other Lightning wallet. The video
// URLs live only here, and are returned only once the invoice is PAID, so
// they never ship in the frontend bundle.
//
// POST body (one of):
//   { action: "create", username: string, courseId: string }
//     -> { paymentRequest, paymentHash, amountSats }
//   { action: "check", username: string, paymentHash: string }
//     -> { status: "PENDING" | "PAID" | "EXPIRED", courseId, url? }
//   { action: "list", username: string }
//     -> { purchases: { courseId, url }[] }
//
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

// Authoritative price list. Keep ids/prices in sync with EDUCATION_COURSES
// in src/lib/education.ts (the frontend only uses them for display).
const COURSES: Record<string, { title: string; priceSats: number; url: string }> = {
  "upcycling-plastic": {
    title: "Upcycling Plastic into Marketable Products",
    priceSats: 200,
    url: "https://www.youtube.com/watch?v=3DYP9wEnBew&pp=ygUqVXBjeWNsaW5nIFBsYXN0aWMgaW50byBNYXJrZXRhYmxlIFByb2R1Y3Rz",
  },
  "waste-tokens": {
    title: "Tracking & Trading Waste Tokens",
    priceSats: 300,
    url: "https://www.youtube.com/watch?v=COwaYEgA8aQ&pp=ygUedGtlbmlzYWlvbiBpbiB3YXN0ZSBtYW5hZ2VtZW50",
  },
  "sell-to-president": {
    title: "How To Sell to the President Waste",
    priceSats: 50,
    url: "https://www.youtube.com/shorts/MQwAnbfU-TA",
  },
  "community-cleanup": {
    title: "How to Earn with Community Clean-Up Drives",
    priceSats: 100,
    url: "https://www.youtube.com/watch?v=L6Hb1cRZRfU&pp=ygUqSG93IHRvIEVhcm4gd2l0aCBDb21tdW5pdHkgQ2xlYW4tVXAgRHJpdmVz",
  },
};

const INVOICE_CREATE_MUTATION = `
  mutation lnInvoiceCreate($input: LnInvoiceCreateInput!) {
    lnInvoiceCreate(input: $input) {
      invoice { paymentRequest paymentHash satoshis }
      errors { message }
    }
  }
`;

const INVOICE_STATUS_QUERY = `
  query lnInvoicePaymentStatus($input: LnInvoicePaymentStatusInput!) {
    lnInvoicePaymentStatus(input: $input) { status }
  }
`;

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const blinkRequest = async (query: string, variables: unknown) => {
  const res = await fetch(BLINK_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": BLINK_API_KEY,
    },
    body: JSON.stringify({ query, variables }),
  });
  return await res.json();
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const { action, username, courseId, paymentHash } = await req.json();
    const account = String(username ?? "").trim().toLowerCase().split("@")[0];
    if (!account) {
      return jsonResponse({ error: "username is required" }, 400);
    }

    if (action === "list") {
      const { data, error } = await supabaseAdmin
        .from("education_purchases")
        .select("course_id")
        .eq("account", account)
        .eq("status", "PAID");
      if (error) return jsonResponse({ error: error.message }, 500);

      const purchases = [...new Set((data ?? []).map((r) => r.course_id))]
        .filter((id) => COURSES[id])
        .map((id) => ({ courseId: id, url: COURSES[id].url }));
      return jsonResponse({ purchases });
    }

    if (!BLINK_API_KEY || !BLINK_BTC_WALLET_ID) {
      return jsonResponse(
        { error: "Blink payments are not configured on the server yet." },
        500,
      );
    }

    if (action === "create") {
      const course = COURSES[courseId];
      if (!course) return jsonResponse({ error: "Unknown course" }, 400);

      const payload = await blinkRequest(INVOICE_CREATE_MUTATION, {
        input: {
          walletId: BLINK_BTC_WALLET_ID,
          amount: course.priceSats,
          memo: `CleanChain course: ${course.title}`,
        },
      });
      const result = payload?.data?.lnInvoiceCreate;
      const invoice = result?.invoice;
      if (!invoice) {
        const errors = result?.errors ?? payload?.errors;
        return jsonResponse(
          { error: errors?.[0]?.message || "Could not create invoice" },
          502,
        );
      }

      const { error } = await supabaseAdmin.from("education_purchases").insert({
        payment_hash: invoice.paymentHash,
        payment_request: invoice.paymentRequest,
        account,
        course_id: courseId,
        amount_sats: course.priceSats,
        status: "PENDING",
      });
      if (error) return jsonResponse({ error: error.message }, 500);

      return jsonResponse({
        paymentRequest: invoice.paymentRequest,
        paymentHash: invoice.paymentHash,
        amountSats: course.priceSats,
      });
    }

    if (action === "check") {
      const { data: purchase } = await supabaseAdmin
        .from("education_purchases")
        .select("*")
        .eq("payment_hash", paymentHash)
        .eq("account", account)
        .maybeSingle();
      if (!purchase) return jsonResponse({ error: "Invoice not found" }, 404);

      let status = purchase.status as string;
      if (status === "PENDING") {
        const payload = await blinkRequest(INVOICE_STATUS_QUERY, {
          input: { paymentRequest: purchase.payment_request },
        });
        status = payload?.data?.lnInvoicePaymentStatus?.status ?? "PENDING";

        if (status !== "PENDING") {
          await supabaseAdmin
            .from("education_purchases")
            .update({
              status,
              paid_at: status === "PAID" ? new Date().toISOString() : null,
            })
            .eq("payment_hash", paymentHash);
        }
      }

      return jsonResponse({
        status,
        courseId: purchase.course_id,
        url: status === "PAID" ? COURSES[purchase.course_id]?.url : undefined,
      });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      500,
    );
  }
});
