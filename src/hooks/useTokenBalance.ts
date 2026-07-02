import { useState, useEffect, useCallback } from 'react';
import { ethers, BrowserProvider, formatUnits } from 'ethers';
import { CONTRACTS, TOKEN_CONFIG } from '@/lib/config';
import { PlasticPennyABI } from '@/lib/abi/PlasticPenny';

interface UseTokenBalanceResult {
  balance: string;
  rawBalance: bigint;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useTokenBalance = (account: string | null | undefined): UseTokenBalanceResult => {
  const [balance, setBalance] = useState<string>('0');
  const [rawBalance, setRawBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!account || !window.ethereum) {
      setBalance('0');
      setRawBalance(BigInt(0));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        CONTRACTS.PLASTIC_PENNY,
        PlasticPennyABI,
        provider
      );

      const balanceRaw = await contract.balanceOf(account);
      const formattedBalance = formatUnits(balanceRaw, TOKEN_CONFIG.DECIMALS);
      
      setRawBalance(balanceRaw);
      setBalance(parseFloat(formattedBalance).toFixed(2));
    } catch (err) {
      console.error('Error fetching token balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
      setBalance('0');
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
