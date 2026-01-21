import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../contexts/WalletContextProvider';
import { useContract } from './useContract';
import { 
  formatCapsuleForUI, 
  formatAgentForUI,
  CapsuleLog,
  AgentLog 
} from '../contracts/MantlememoContract';

export interface OnChainCapsule {
  id: string;
  name: string;
  description: string;
  category: string;
  creator_wallet: string;
  price_per_query: number;
  stake_amount: number;
  earnings: number;
  created_at: string;
  updated_at: string;
  exists: boolean;
  query_count?: number;
}

export interface OnChainAgent {
  id: string;
  name: string;
  display_name: string;
  platform: string;
  owner: string;
  reputation: number;
  created_at: string;
  exists: boolean;
}

export function useOnChainData() {
  const { address, connected } = useWallet();
  const { contract, loading: contractLoading, error: contractError } = useContract();
  
  const [userCapsules, setUserCapsules] = useState<OnChainCapsule[]>([]);
  const [userAgents, setUserAgents] = useState<OnChainAgent[]>([]);
  const [allCapsules, setAllCapsules] = useState<OnChainCapsule[]>([]);
  const [allAgents, setAllAgents] = useState<OnChainAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's capsules and agents
  const loadUserData = useCallback(async () => {
    if (!contract || !address || !connected) return;

    setLoading(true);
    setError(null);

    try {
      // Load user's capsules
      const capsules = await contract.getCapsulesByOwnerDetailed(address);
      const formattedCapsules = capsules.map(formatCapsuleForUI);
      setUserCapsules(formattedCapsules);

      // Load user's agents
      const agents = await contract.getAgentsByOwnerDetailed(address);
      const formattedAgents = agents.map(formatAgentForUI);
      setUserAgents(formattedAgents);

    } catch (err) {
      console.error('Error loading user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, [contract, address, connected]);

  // Load all capsules from the marketplace
  const loadAllCapsules = useCallback(async () => {
    if (!contract) return;

    setLoading(true);
    setError(null);

    try {
      // Get all capsule creation logs
      const capsuleLogs: CapsuleLog[] = await contract.getAllCapsuleLogs();
      
      // Load detailed info for each capsule
      const capsulePromises = capsuleLogs.map(async (log) => {
        try {
          const capsule = await contract.getCapsuleDetails(log.creator, log.capsuleId);
          return formatCapsuleForUI(capsule);
        } catch (err) {
          console.error(`Error loading capsule ${log.capsuleId}:`, err);
          return null;
        }
      });

      const capsules = await Promise.all(capsulePromises);
      const validCapsules = capsules.filter((c): c is OnChainCapsule => c !== null);
      setAllCapsules(validCapsules);

    } catch (err) {
      console.error('Error loading all capsules:', err);
      setError(err instanceof Error ? err.message : 'Failed to load marketplace data');
    } finally {
      setLoading(false);
    }
  }, [contract]);

  // Load all agents
  const loadAllAgents = useCallback(async () => {
    if (!contract) return;

    try {
      // Get all agent registration logs
      const agentLogs: AgentLog[] = await contract.getAllAgentLogs();
      
      // Load detailed info for each agent
      const agentPromises = agentLogs.map(async (log) => {
        try {
          const agent = await contract.getAgentDetails(log.owner, log.agentId);
          return formatAgentForUI(agent);
        } catch (err) {
          console.error(`Error loading agent ${log.agentId}:`, err);
          return null;
        }
      });

      const agents = await Promise.all(agentPromises);
      const validAgents = agents.filter((a): a is OnChainAgent => a !== null);
      setAllAgents(validAgents);

    } catch (err) {
      console.error('Error loading all agents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load agents data');
    }
  }, [contract]);

  // Get specific capsule details
  const getCapsuleDetails = useCallback(async (creator: string, capsuleId: string): Promise<OnChainCapsule | null> => {
    if (!contract) return null;

    try {
      const capsule = await contract.getCapsuleDetails(creator, capsuleId);
      return formatCapsuleForUI(capsule);
    } catch (err) {
      console.error('Error loading capsule details:', err);
      return null;
    }
  }, [contract]);

  // Get specific agent details
  const getAgentDetails = useCallback(async (owner: string, agentId: string): Promise<OnChainAgent | null> => {
    if (!contract) return null;

    try {
      const agent = await contract.getAgentDetails(owner, agentId);
      return formatAgentForUI(agent);
    } catch (err) {
      console.error('Error loading agent details:', err);
      return null;
    }
  }, [contract]);

  // Get staking info for a capsule
  const getStakeInfo = useCallback(async (creator: string, capsuleId: string, staker: string) => {
    if (!contract) return null;

    try {
      const stakeInfo = await contract.getStakeDetails(creator, capsuleId, staker);
      return {
        stakedAt: new Date(Number(stakeInfo.stakedAt) * 1000),
        lockUntil: new Date(Number(stakeInfo.lockUntil) * 1000),
        exists: stakeInfo.exists,
        isLocked: Date.now() < Number(stakeInfo.lockUntil) * 1000
      };
    } catch (err) {
      console.error('Error loading stake info:', err);
      return null;
    }
  }, [contract]);

  // Load initial data when contract is ready
  useEffect(() => {
    if (contract && connected && address) {
      loadUserData();
    }
  }, [contract, connected, address, loadUserData]);

  // Load marketplace data when contract is ready
  useEffect(() => {
    if (contract) {
      loadAllCapsules();
      loadAllAgents();
    }
  }, [contract, loadAllCapsules, loadAllAgents]);

  return {
    // Data
    userCapsules,
    userAgents,
    allCapsules,
    allAgents,
    
    // Loading states
    loading: loading || contractLoading,
    error: error || contractError,
    
    // Functions
    loadUserData,
    loadAllCapsules,
    loadAllAgents,
    getCapsuleDetails,
    getAgentDetails,
    getStakeInfo,
    
    // Contract instance for direct access
    contract
  };
}