import { useState } from 'react';
import { useWallet } from '../contexts/WalletContextProvider';
import { useApiClient } from '../lib/api';
import { queryCapsuleWithContract, ContractQueryResult } from '../utils/mantlePayment';

export interface QueryResult {
  response: string;
  capsule_id: string;
  price_paid: number;
  txHash?: string;
}

export function useCapsuleQuery() {
  const { signer } = useWallet();
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryWithPayment = async (
    capsuleId: string,
    prompt: string,
    creatorWallet: string,
    pricePerQuery: number
  ): Promise<QueryResult | null> => {
    if (!signer) {
      setError('Wallet not connected. Please connect your wallet first.');
      return null;
    }

    if (!prompt.trim()) {
      setError('Please enter a question');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      let paymentHash: string | undefined;

      // Send payment via smart contract if price > 0
      if (pricePerQuery > 0) {
        const contractResult: ContractQueryResult = await queryCapsuleWithContract(
          signer,
          creatorWallet,
          capsuleId,
          pricePerQuery.toString()
        );

        if (!contractResult.success) {
          throw new Error(contractResult.error || 'Smart contract payment failed');
        }

        paymentHash = contractResult.hash;
      }

      // Query capsule with payment proof
      const response: any = await apiClient.queryCapsule(capsuleId, {
        prompt,
        payment_signature: paymentHash,
        amount_paid: pricePerQuery,
      });

      return {
        response: response.response || '',
        capsule_id: response.capsule_id || capsuleId,
        price_paid: response.price_paid || pricePerQuery,
        txHash: paymentHash
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Query failed';
      setError(message);
      console.error('Query error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    queryWithPayment,
    loading,
    error,
    clearError: () => setError(null)
  };
}
