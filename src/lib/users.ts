import { supabase } from "@/lib/supabaseClient";
import { isConfiguredAdmin, normalizeAddress, shortAddress } from "@/lib/admin";
import { isMissingRelationError } from "@/lib/adminSetup";
import type { AppUser, UserRole } from "@/lib/types";

export const upsertConnectedUser = async (
  wallet: string,
  roleHint?: Exclude<UserRole, "admin">,
) => {
  const wallet_address = normalizeAddress(wallet);
  if (!wallet_address) return;

  const { data: existing, error: existingError } = await supabase
    .from("app_users")
    .select("*")
    .eq("wallet_address", wallet_address)
    .maybeSingle();

  if (existingError && isMissingRelationError(existingError)) return;

  const now = new Date().toISOString();
  const configuredAdmin = isConfiguredAdmin(wallet_address);

  if (existing) {
    const updates: Record<string, unknown> = { last_seen_at: now };
    if (configuredAdmin) {
      updates.role = "admin";
      updates.status = "active";
    } else if (roleHint && existing.role !== "admin") {
      updates.role = roleHint;
    }
    await supabase.from("app_users").update(updates).eq("id", existing.id);
    return;
  }

  await supabase.from("app_users").insert({
    wallet_address,
    display_name: shortAddress(wallet_address),
    role: configuredAdmin ? "admin" : roleHint || "user",
    status: "active",
    last_seen_at: now,
  });
};

export const fetchAppUsers = async (): Promise<AppUser[]> => {
  const { data, error } = await supabase
    .from("app_users")
    .select("*")
    .order("last_seen_at", { ascending: false });

  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }
  return (data || []) as AppUser[];
};
