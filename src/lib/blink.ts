// Client-side helpers for Blink (Bitcoin Lightning wallet) identity + payouts.
// Actual Blink API calls happen server-side in supabase/functions/* — the
// browser never sees the Blink API key.
import { supabase } from "@/lib/supabaseClient";
import { BLINK_CONFIG } from "@/lib/config";

const USERNAME_PATTERN = /^[a-z0-9_]{3,50}$/;

// Accepts a plain username ('jane_doe') or a full Lightning Address pointing
// at this app's domain ('jane_doe@blink.sv'), and normalizes both to just
// the username so either form logs the user into the same account.
export const normalizeUsername = (value: string) => {
  const trimmed = (value || "").trim().toLowerCase();
  const at = trimmed.indexOf("@");
  if (at === -1) return trimmed;
  const domain = trimmed.slice(at + 1);
  return domain === BLINK_CONFIG.DOMAIN.toLowerCase()
    ? trimmed.slice(0, at)
    : trimmed;
};

export const isValidBlinkUsernameFormat = (value: string) =>
  USERNAME_PATTERN.test(normalizeUsername(value || ""));

export const lightningAddressFor = (username: string) =>
  `${normalizeUsername(username)}@${BLINK_CONFIG.DOMAIN}`;

export const shortUsername = (username?: string | null) =>
  username ? `@${username}` : "—";

export const lookupBlinkUsername = async (
  username: string,
): Promise<{ valid: boolean; error?: string }> => {
  const clean = normalizeUsername(username);
  if (!isValidBlinkUsernameFormat(clean)) {
    return {
      valid: false,
      error:
        "Enter your Blink username or Lightning Address, e.g. jane_doe or jane_doe@blink.sv.",
    };
  }

  const { data, error } = await supabase.functions.invoke(
    "blink-lookup-username",
    { body: { username: clean } },
  );

  if (error) return { valid: false, error: error.message };
  return { valid: Boolean(data?.valid), error: data?.error };
};

export interface ApproveSubmissionResult {
  success: boolean;
  granted: boolean;
  amountSats: number;
  message?: string;
}

export const approveSubmission = async (params: {
  submissionId: number;
  adminUsername: string;
  isDuplicate: boolean;
  isProminentLocation: boolean;
}): Promise<ApproveSubmissionResult> => {
  const { data, error } = await supabase.functions.invoke(
    "blink-approve-submission",
    { body: params },
  );

  if (error) {
    return {
      success: false,
      granted: false,
      amountSats: 0,
      message: error.message,
    };
  }

  return data as ApproveSubmissionResult;
};
