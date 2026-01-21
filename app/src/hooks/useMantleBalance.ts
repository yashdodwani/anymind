import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../contexts/WalletContextProvider';

export const useMantleBalance = () => {
  const { provider, address, connected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!address || !connected || !provider) {
      setBalance(null);
      return;
    }

    setLoading(true);
    try {
      const balanceWei = await provider.getBalance(address);
      const balanceMnt = parseFloat(balanceWei.toString()) / 1e18;
      setBalance(balanceMnt);
    } catch (error) {
      console.error('Error fetching ETH balance:', error);
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, [provider, address, connected]);

  useEffect(() => {
    fetchBalance();

    // Set up polling for balance changes (every 10 seconds)
    if (address && connected && provider) {
      const interval = setInterval(fetchBalance, 10000);
      return () => clearInterval(interval);
    }
  }, [fetchBalance, address, connected, provider]);

  return { balance, loading, refetch: fetchBalance };
};