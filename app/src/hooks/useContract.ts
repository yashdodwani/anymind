import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../contexts/WalletContextProvider';
import { MantlememoContract } from '../contracts/MantlememoContract';

export function useContract() {
  const { signer, connected } = useWallet();
  const [contract, setContract] = useState<MantlememoContract | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (connected && signer) {
      try {
        const contractInstance = new MantlememoContract(signer);
        setContract(contractInstance);
        setError(null);
      } catch (err) {
        console.error('Error initializing contract:', err);
        setError('Failed to initialize contract');
        setContract(null);
      }
    } else {
      setContract(null);
    }
  }, [signer, connected]);

  const executeTransaction = useCallback(async <T>(
    operation: () => Promise<T>,
    successMessage?: string
  ): Promise<T | null> => {
    if (!contract) {
      setError('Contract not initialized');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await operation();
      if (successMessage) {
        console.log(successMessage);
      }
      return result;
    } catch (err) {
      console.error('Transaction error:', err);
      let errorMessage = 'Transaction failed';
      
      if (err instanceof Error) {
        if (err.message.includes('user rejected')) {
          errorMessage = 'Transaction was cancelled by user';
        } else if (err.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for transaction';
        } else if (err.message.includes('EmptyString')) {
          errorMessage = 'Input cannot be empty';
        } else if (err.message.includes('InvalidPrice')) {
          errorMessage = 'Price is outside allowed range';
        } else if (err.message.includes('CapsuleNotFound')) {
          errorMessage = 'Capsule not found';
        } else if (err.message.includes('Unauthorized')) {
          errorMessage = 'You are not authorized to perform this action';
        } else if (err.message.includes('StakeLocked')) {
          errorMessage = 'Stake is still locked (7 day period)';
        } else if (err.message.includes('InsufficientStake')) {
          errorMessage = 'Insufficient stake amount';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [contract]);

  return {
    contract,
    loading,
    error,
    executeTransaction,
    clearError: () => setError(null)
  };
}