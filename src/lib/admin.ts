import { supabase } from "@/lib/supabaseClient";
import {
  ADMIN_BLINK_USERNAMES,
  BLINK_CONFIG,
  DUPLICATE_RADIUS_METERS,
} from "@/lib/config";
import { normalizeUsername, shortUsername } from "@/lib/blink";
import type { WasteSubmission } from "@/lib/types";

// Kept as aliases so existing imports across the app (users.ts, admin components)
// keep working — identity is now a Blink username instead of a 0x wallet address.
export const normalizeAddress = normalizeUsername;
export const shortAddress = shortUsername;

export const getConfiguredAdminWallets = (): string[] => {
  const fromEnv =
    (import.meta.env.VITE_ADMIN_BLINK_USERNAMES as string | undefined) || "";
  return [...ADMIN_BLINK_USERNAMES, ...fromEnv.split(",")]
    .map((value) => normalizeUsername(value))
    .filter(Boolean);
};

export const isConfiguredAdmin = (account?: string | null) => {
  if (!account) return false;
  return getConfiguredAdminWallets().includes(normalizeUsername(account));
};

const promoteToAdmin = async (username: string) => {
  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from("app_users")
    .select("id")
    .eq("blink_username", username)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("app_users")
      .update({ role: "admin", status: "active", last_seen_at: now })
      .eq("id", existing.id);
    return;
  }

  await supabase.from("app_users").insert({
    blink_username: username,
    display_name: shortUsername(username),
    role: "admin",
    status: "active",
    last_seen_at: now,
  });
};

export const checkIsAdmin = async (
  account?: string | null,
): Promise<boolean> => {
  if (!account) return false;
  const username = normalizeUsername(account);
  if (isConfiguredAdmin(username)) return true;

  const { data } = await supabase
    .from("app_users")
    .select("role, status")
    .eq("blink_username", username)
    .maybeSingle();

  if (data?.role === "admin" && data?.status === "active") return true;

  // First-run: if no admin usernames are configured and none exist in the DB,
  // the Blink account opening /admin becomes the operator.
  const envAdmins = getConfiguredAdminWallets();
  const { data: admins, error: adminLookupError } = await supabase
    .from("app_users")
    .select("id")
    .eq("role", "admin")
    .eq("status", "active")
    .limit(1);

  const noAdminsYet = Boolean(adminLookupError) || !admins?.length;
  if (envAdmins.length === 0 && noAdminsYet) {
    await promoteToAdmin(username).catch(() => undefined);
    return true;
  }

  return false;
};

// Sats ("Plastic Pennies") awarded for a given weight of collected plastic.
export const rewardForWeight = (weight: number) =>
  Math.max(0, Math.round(Number(weight || 0) * BLINK_CONFIG.SATS_PER_KG));

const toRad = (value: number) => (value * Math.PI) / 180;

export const distanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const parseCoords = (submission: WasteSubmission) => {
  const lat = parseFloat(submission.latitude ?? "");
  const lng = parseFloat(submission.longitude ?? "");
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
};

export const findPossibleDuplicates = (
  submission: WasteSubmission,
  all: WasteSubmission[],
) => {
  const origin = parseCoords(submission);
  return all.filter((other) => {
    if (other.id === submission.id) return false;
    if (other.status === "rejected") return false;

    const sameWallet =
      normalizeAddress(other.submitted_by) ===
      normalizeAddress(submission.submitted_by);
    const sameType =
      (other.waste_type || "").toLowerCase() ===
      (submission.waste_type || "").toLowerCase();

    const otherCoords = parseCoords(other);
    const nearby =
      origin && otherCoords
        ? distanceMeters(
            origin.lat,
            origin.lng,
            otherCoords.lat,
            otherCoords.lng,
          ) <= DUPLICATE_RADIUS_METERS
        : false;

    return nearby && (sameWallet || sameType);
  });
};

export const canGrantTokens = (opts: {
  isDuplicate: boolean;
  isProminentLocation: boolean;
}) => !opts.isDuplicate && opts.isProminentLocation;

// Sats payouts now happen server-side via the blink-approve-submission Supabase
// Edge Function (see src/lib/blink.ts -> approveSubmission), which is the only
// place that holds the Blink API key. There is no client-side mint anymore.

export const imageUrls = (value?: string | null) =>
  (value || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
