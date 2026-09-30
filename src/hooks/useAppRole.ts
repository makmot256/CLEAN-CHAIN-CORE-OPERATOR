import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { normalizeAddress } from "@/lib/admin";
import { isMissingRelationError } from "@/lib/adminSetup";
import { hasPermission, type Permission } from "@/lib/permissions";
import type { UserRole, UserStatus } from "@/lib/types";

/**
 * Looks up the current Blink account's role/status from app_users and
 * exposes a `can(permission)` helper driven by the roles x actions matrix
 * in src/lib/permissions.ts. Suspended accounts fail every permission check.
 */
export const useAppRole = (account: string | null) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!account) {
      setRole(null);
      setStatus(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("app_users")
      .select("role, status")
      .eq("blink_username", normalizeAddress(account))
      .maybeSingle();

    if (!error || !isMissingRelationError(error)) {
      setRole((data?.role as UserRole) ?? null);
      setStatus((data?.status as UserStatus) ?? null);
    }
    setLoading(false);
  }, [account]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const can = useCallback(
    (permission: Permission) =>
      status !== "suspended" && hasPermission(role, permission),
    [role, status],
  );

  return { role, status, loading, refresh, can };
};
