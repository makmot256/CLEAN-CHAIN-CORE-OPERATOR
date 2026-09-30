import { supabase } from "@/lib/supabaseClient";
import { isConfiguredAdmin, normalizeAddress, shortAddress } from "@/lib/admin";
import { isMissingRelationError } from "@/lib/adminSetup";
import type { AppUser, UserRole } from "@/lib/types";

export const upsertConnectedUser = async (
  username: string,
  roleHint?: Exclude<UserRole, "admin">,
) => {
  const blink_username = normalizeAddress(username);
  if (!blink_username) return;

  const { data: existing, error: existingError } = await supabase
    .from("app_users")
    .select("*")
    .eq("blink_username", blink_username)
    .maybeSingle();

  if (existingError && isMissingRelationError(existingError)) return;

  const now = new Date().toISOString();
  const configuredAdmin = isConfiguredAdmin(blink_username);

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
    blink_username,
    display_name: shortAddress(blink_username),
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
