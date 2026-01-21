import { useState, useEffect } from 'react';
import { TrendingUp, Shield, Star, Coins, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { useWallet } from '../contexts/WalletContextProvider';
import { useApiClient } from '../lib/api';
import { useContract } from '../hooks/useContract';
import { useOnChainData } from '../hooks/useOnChainData';

interface Agent {
  id: string;
  name: string;
  display_name: string;
  platform: string;
  api_key_configured: boolean;
  model?: string;
  user_wallet?: string;
}

const Staking = () => {
  const { address, connected, signer } = useWallet();
  const apiClient = useApiClient();
  const { contract, executeTransaction, loading: contractLoading, error: contractError } = useContract();
  const { userCapsules, loadUserData, getStakeInfo } = useOnChainData();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [loadingStaking, setLoadingStaking] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [stakeAmounts, setStakeAmounts] = useState<Record<string, string>>({});
  const [stakingInfo, setStakingInfo] = useState<Record<string, any>>({});

  // Fetch user's agents from API (for agents that haven't been staked yet)
  useEffect(() => {
    if (connected && address) {
      fetchAgents();
    }
  }, [connected, address]);

  // Load staking info for user's capsules
  useEffect(() => {
    if (userCapsules.length > 0 && address) {
      loadStakingInfo();
    }
  }, [userCapsules, address]);

  const fetchAgents = async () => {
    try {
      setLoadingAgents(true);
      const data = await apiClient.getAgents() as Agent[];
      setAgents(data);
    } catch (error) {
      console.error('Error fetching agents:', error);
      setError('Failed to load agents');
    } finally {
      setLoadingAgents(false);
    }
  };

  const loadStakingInfo = async () => {
    if (!address) return;
    
    const stakingMap: Record<string, any> = {};
    
    for (const capsule of userCapsules) {
      try {
        const stakeInfo = await getStakeInfo(capsule.creator_wallet, capsule.id, address);
        if (stakeInfo) {
          stakingMap[capsule.id] = {
            stake_amount: capsule.stake_amount,
            staked_at: stakeInfo.stakedAt.toISOString(),
            lock_until: stakeInfo.lockUntil.toISOString(),
            is_locked: stakeInfo.isLocked
          };
        }
      } catch (error) {
        console.error(`Error loading stake info for ${capsule.id}:`, error);
      }
    }
    
    setStakingInfo(stakingMap);
  };

  const handleCreateCapsule = async (agentId: string, agentName: string) => {
    if (!connected || !address || !signer || !contract) {
      setError('Please connect your wallet first');
      return;
    }

    const amountStr = stakeAmounts[agentId] || '0';
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid stake amount');
      return;
    }

    setLoadingStaking(prev => ({ ...prev, [agentId]: true }));
    setError(null);

    try {
      // First, create the capsule on the smart contract
      const capsuleId = `${agentId}_${Date.now()}`;
      const description = `AI Agent: ${agentName}`;
      const category = 'AI Assistant';
      const pricePerQuery = '0.05'; // Default price

      const createResult = await executeTransaction(
        () => contract.createCapsule(capsuleId, agentName, description, category, pricePerQuery),
        'Capsule created successfully'
      );

      if (!createResult) {
        throw new Error('Failed to create capsule on blockchain');
      }

      // Wait for transaction confirmation
      await createResult.wait();

      // Then stake on the capsule
      const stakeResult = await executeTransaction(
        () => contract.stake(capsuleId, amount.toString()),
        'Staking successful'
      );

      if (!stakeResult) {
        throw new Error('Failed to stake on capsule');
      }

      // Wait for staking transaction confirmation
      await stakeResult.wait();

      // Create the agent-capsule mapping in the backend
      try {
        await apiClient.stakeOnAgent(agentId, {
          stake_amount: amount,
          price_per_query: parseFloat(pricePerQuery),
          category,
          description,
          payment_signature: stakeResult.hash,
        });
      } catch (apiError) {
        console.error('Backend API error (non-critical):', apiError);
        // Don't fail the whole process if backend fails
      }

      // Refresh data
      await loadUserData();
      
      // Clear the stake amount input
      setStakeAmounts(prev => ({ ...prev, [agentId]: '' }));
      
      alert(`Successfully created and staked ${amount} ETH on capsule for ${agentName}!`);

    } catch (err) {
      console.error('Staking error:', err);
      const message = err instanceof Error ? err.message : 'Staking failed';
      setError(message);
    } finally {
      setLoadingStaking(prev => ({ ...prev, [agentId]: false }));
    }
  };

  const handleStakeMore = async (capsuleId: string, capsuleName: string) => {
    if (!connected || !address || !signer || !contract) {
      setError('Please connect your wallet first');
      return;
    }

    const amountStr = stakeAmounts[capsuleId] || '0';
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid stake amount');
      return;
    }

    setLoadingStaking(prev => ({ ...prev, [capsuleId]: true }));
    setError(null);

    try {
      const stakeResult = await executeTransaction(
        () => contract.stake(capsuleId, amount.toString()),
        'Additional staking successful'
      );

      if (!stakeResult) {
        throw new Error('Failed to add stake');
      }

      // Wait for transaction confirmation
      await stakeResult.wait();

      // Refresh data
      await loadUserData();
      await loadStakingInfo();
      
      // Clear the stake amount input
      setStakeAmounts(prev => ({ ...prev, [capsuleId]: '' }));
      
      alert(`Successfully added ${amount} ETH stake to ${capsuleName}!`);

    } catch (err) {
      console.error('Additional staking error:', err);
      const message = err instanceof Error ? err.message : 'Additional staking failed';
      setError(message);
    } finally {
      setLoadingStaking(prev => ({ ...prev, [capsuleId]: false }));
    }
  };

  const handleUnstake = async (capsuleId: string, capsuleName: string) => {
    if (!connected || !address || !signer || !contract) {
      setError('Please connect your wallet first');
      return;
    }

    const amountStr = stakeAmounts[capsuleId] || '0';
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid unstake amount');
      return;
    }

    // Check if stake is locked
    const stakeInfo = stakingInfo[capsuleId];
    if (stakeInfo?.is_locked) {
      setError('Stake is still locked. Please wait for the 7-day lock period to expire.');
      return;
    }

    setLoadingStaking(prev => ({ ...prev, [capsuleId]: true }));
    setError(null);

    try {
      const unstakeResult = await executeTransaction(
        () => contract.unstake(capsuleId, amount.toString()),
        'Unstaking successful'
      );

      if (!unstakeResult) {
        throw new Error('Failed to unstake');
      }

      // Wait for transaction confirmation
      await unstakeResult.wait();

      // Refresh data
      await loadUserData();
      await loadStakingInfo();
      
      // Clear the stake amount input
      setStakeAmounts(prev => ({ ...prev, [capsuleId]: '' }));
      
      alert(`Successfully unstaked ${amount} ETH from ${capsuleName}!`);

    } catch (err) {
      console.error('Unstaking error:', err);
      const message = err instanceof Error ? err.message : 'Unstaking failed';
      setError(message);
    } finally {
      setLoadingStaking(prev => ({ ...prev, [capsuleId]: false }));
    }
  };

  if (!connected) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400">Please connect your wallet to view and manage your staking positions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Staking Dashboard</h1>
          <p className="text-gray-400 mt-1">Stake ETH on your agents to list them in the marketplace</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Shield className="h-4 w-4" />
          <span>7-day lock period applies</span>
        </div>
      </div>

      {(error || contractError) && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <span className="text-red-300">{error || contractError}</span>
        </div>
      )}

      {/* Existing Staked Capsules */}
      {userCapsules.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Coins className="h-5 w-5 mr-2" />
            Your Staked Capsules
          </h2>
          
          <div className="grid gap-4">
            {userCapsules.map((capsule) => {
              const stakeInfo = stakingInfo[capsule.id];
              const isLoading = loadingStaking[capsule.id];
              
              return (
                <div key={capsule.id} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-white">{capsule.name}</h3>
                      <p className="text-gray-400 text-sm">{capsule.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <span className="text-green-400">
                          <Coins className="h-4 w-4 inline mr-1" />
                          {capsule.stake_amount} ETH staked
                        </span>
                        <span className="text-blue-400">
                          {capsule.price_per_query} ETH per query
                        </span>
                        <span className="text-purple-400">
                          {capsule.earnings} ETH earned
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Category</div>
                      <div className="text-white">{capsule.category}</div>
                    </div>
                  </div>

                  {stakeInfo && (
                    <div className="mb-4 p-3 bg-gray-900/50 rounded border border-gray-600">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Staked At:</span>
                          <div className="text-white">{new Date(stakeInfo.staked_at).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Lock Until:</span>
                          <div className={`${stakeInfo.is_locked ? 'text-red-400' : 'text-green-400'}`}>
                            {new Date(stakeInfo.lock_until).toLocaleDateString()}
                            {stakeInfo.is_locked && ' (Locked)'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Amount (ETH)"
                      value={stakeAmounts[capsule.id] || ''}
                      onChange={(e) => setStakeAmounts(prev => ({ ...prev, [capsule.id]: e.target.value }))}
                      className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleStakeMore(capsule.id, capsule.name)}
                      disabled={isLoading || contractLoading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded flex items-center space-x-2"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      <span>Add Stake</span>
                    </button>
                    <button
                      onClick={() => handleUnstake(capsule.id, capsule.name)}
                      disabled={isLoading || contractLoading || stakeInfo?.is_locked}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Unstake'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Agents to Stake */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Create New Staked Capsules
        </h2>
        
        {loadingAgents ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-400" />
            <p className="text-gray-400 mt-2">Loading your agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No Agents Found</h3>
            <p className="text-gray-400">Create an agent first to stake and list it in the marketplace.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {agents.map((agent) => {
              const isLoading = loadingStaking[agent.id];
              // Check if this agent already has a staked capsule
              const hasStakedCapsule = userCapsules.some(c => c.name === agent.display_name);
              
              return (
                <div key={agent.id} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-white">{agent.display_name}</h3>
                      <p className="text-gray-400 text-sm">Platform: {agent.platform}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm text-gray-300">Ready for staking</span>
                        {hasStakedCapsule && (
                          <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Already Staked</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Model</div>
                      <div className="text-white">{agent.model || 'Default'}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      step="0.01"
                      min="0.0001"
                      max="100"
                      placeholder="Stake amount (ETH)"
                      value={stakeAmounts[agent.id] || ''}
                      onChange={(e) => setStakeAmounts(prev => ({ ...prev, [agent.id]: e.target.value }))}
                      className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleCreateCapsule(agent.id, agent.display_name)}
                      disabled={isLoading || contractLoading || hasStakedCapsule}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded flex items-center space-x-2"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coins className="h-4 w-4" />}
                      <span>{hasStakedCapsule ? 'Already Staked' : 'Create & Stake'}</span>
                    </button>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-400">
                    Min: 0.0001 ETH • Max: 100 ETH • Lock period: 7 days
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Staking;