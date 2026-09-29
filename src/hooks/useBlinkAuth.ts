import { useCallback, useEffect, useState } from "react";
import { lookupBlinkUsername, normalizeUsername } from "@/lib/blink";
import { upsertConnectedUser } from "@/lib/users";

const STORAGE_KEY = "blinkUsername";

/**
 * Replaces the old MetaMask-based useWallet hook. Instead of connecting a
 * browser wallet, the user logs in with their Blink (blink.sv) Lightning
 * wallet username. We verify the username exists via a Supabase Edge
 * Function (no Blink API key is ever exposed to the browser), then persist
 * it locally and upsert it into app_users so the admin can see every
 * signed-in Blink account.
 */
export const useBlinkAuth = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem(STORAGE_KEY)
        : null;
    if (saved) setUsername(saved);
  }, []);

  const login = useCallback(async (rawUsername: string) => {
    const clean = normalizeUsername(rawUsername || "");
    if (!clean) {
      return { ok: false, error: "Enter your Blink username." };
    }

    setIsLoggingIn(true);
    try {
      const result = await lookupBlinkUsername(clean);
      if (!result.valid) {
        return {
          ok: false,
          error: result.error || "No Blink wallet found for that username.",
        };
      }

      window.localStorage.setItem(STORAGE_KEY, clean);
      setUsername(clean);
      await upsertConnectedUser(clean).catch(() => undefined);
      return { ok: true as const };
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Could not verify Blink username.",
      };
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUsername(null);
  }, []);

  return { username, account: username, login, logout, isLoggingIn };
};
