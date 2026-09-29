import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

interface UseTokenBalanceResult {
  balance: string;
  rawBalance: bigint;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Reads the lifetime sats ("Plastic Pennies") earned via the app for a given
 * Blink username, from the user_wallet table. This is an off-chain ledger
 * maintained server-side by the blink-approve-submission Edge Function
 * whenever an admin approves a waste submission — it is not a live query of
 * the user's actual Blink wallet balance (we never hold their Blink API key).
 */
export const useTokenBalance = (
  account: string | null | undefined,
): UseTokenBalanceResult => {
  const [balance, setBalance] = useState<string>("0");
  const [rawBalance, setRawBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!account) {
      setBalance("0");
      setRawBalance(BigInt(0));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from("user_wallet")
        .select("token_balance")
        .eq("account", account)
        .maybeSingle();

      if (queryError) throw queryError;

      const sats = Math.max(0, Math.round(Number(data?.token_balance ?? 0)));
      setBalance(String(sats));
      setRawBalance(BigInt(sats));
    } catch (err) {
      console.error("Error fetching sats balance:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch balance");
      setBalance("0");
      setRawBalance(BigInt(0));
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    rawBalance,
    isLoading,
    error,
    refetch: fetchBalance,
  };
};

export default useTokenBalance;
