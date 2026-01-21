import { useState, useEffect } from 'react';
import { TrendingUp, Users, Calendar, ExternalLink, Loader2, Download } from 'lucide-react';
import { useEthBalance } from '../hooks/useEthBalance';
import { useWallet } from '../contexts/WalletContextProvider';
import { useOnChainData } from '../hooks/useOnChainData';
import { useContract } from '../hooks/useContract';
import mantleLogo from '../assets/logo.png';

const EarningsDashboard = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const { balance, loading } = useEthBalance();
  const { connected, address } = useWallet();
  const { userCapsules, loading: capsulesLoading } = useOnChainData();
  const { contract, executeTransaction, loading: contractLoading } = useContract();
  
  const [withdrawing, setWithdrawing] = useState<Record<string, boolean>>({});
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalQueries, setTotalQueries] = useState(0);

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  useEffect(() => {
    if (userCapsules.length > 0) {
      const earnings = userCapsules.reduce((sum, capsule) => sum + capsule.earnings, 0);
      const queries = userCapsules.reduce((sum, capsule) => sum + (capsule.query_count || 0), 0);
      
      setTotalEarnings(earnings);
      setTotalQueries(queries);
    }
  }, [userCapsules]);

  const handleWithdrawEarnings = async (capsuleId: string, capsuleName: string, earnings: number) => {
    if (!contract || earnings <= 0) return;

    setWithdrawing(prev => ({ ...prev, [capsuleId]: true }));

    try {
      const result = await executeTransaction(
        () => contract.withdrawEarnings(capsuleId),
        `Successfully withdrew ${earnings.toFixed(4)} ETH from ${capsuleName}`
      );

      if (result) {
        await result.wait();
        alert(`Successfully withdrew ${earnings.toFixed(4)} ETH from ${capsuleName}!`);
        window.location.reload();
      }
    } catch (err) {
      console.error('Withdrawal error:', err);
    } finally {
      setWithdrawing(prev => ({ ...prev, [capsuleId]: false }));
    }
  };

  const chartData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    earnings: Math.random() * (totalEarnings / 30) + 0.001
  }));

  const avgRevenuePerQuery = totalQueries > 0 ? totalEarnings / totalQueries : 0;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Earnings Dashboard</h1>
            <p className="text-gray-400">
              {connected && address ? shortenAddress(address) : 'Connect wallet to view earnings'}
            </p>
          </div>
          
          <div className="flex space-x-3">
            {(['7d', '30d', '90d', '1y'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeRange(period)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timeRange === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {(capsulesLoading || loading) && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 text-blue-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-400">Loading earnings data from blockchain...</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-3">
              <img src={mantleLogo} alt="ETH" className="h-5 w-5" />
              <span className="text-gray-400">Wallet Balance</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {loading ? '...' : connected ? `${balance?.toFixed(4) ?? '0'} ETH` : 'N/A'}
            </div>
            <div className="text-sm text-gray-400">{connected ? 'Connected' : 'Not connected'}</div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-3">
              <Calendar className="h-5 w-5 text-blue-400" />
              <span className="text-gray-400">Total Earnings</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {capsulesLoading ? '...' : `${totalEarnings.toFixed(4)} ETH`}
            </div>
            <div className="text-sm text-gray-400">From all capsules</div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-3">
              <Users className="h-5 w-5 text-purple-400" />
              <span className="text-gray-400">Total Queries</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {capsulesLoading ? '...' : totalQueries}
            </div>
            <div className="text-sm text-gray-400">Across all capsules</div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="h-5 w-5 text-yellow-400" />
              <span className="text-gray-400">Avg Revenue</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {capsulesLoading ? '...' : avgRevenuePerQuery.toFixed(4)}
            </div>
            <div className="text-sm text-gray-400">ETH per query</div>
          </div>
        </div>

        {connected && address && (
          <div className="mb-8">
            <a 
              href={`https://explorer.sepolia.mantle.xyz/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View full transaction history on Mantle Explorer
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Daily Earnings (Estimated)</h3>
            <div className="h-64 flex items-end space-x-1 mb-4">
              {chartData.map((data, index) => (
                <div
                  key={index}
                  className="bg-blue-500 rounded-t-sm flex-1 min-w-0 transition-all hover:bg-blue-400"
                  style={{ height: `${Math.max((data.earnings / Math.max(...chartData.map(d => d.earnings))) * 100, 2)}%` }}
                  title={`Day ${data.day}: ${data.earnings.toFixed(4)} ETH`}
                ></div>
              ))}
            </div>
            <div className="text-center text-gray-400 text-sm">Last 30 days (estimated)</div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Performing Capsules</h3>
            <div className="space-y-4">
              {userCapsules
                .sort((a, b) => b.earnings - a.earnings)
                .slice(0, 3)
                .map((capsule, index) => (
                <div key={capsule.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-white font-medium">{capsule.name}</div>
                      <div className="text-sm text-gray-400">{capsule.category}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">{capsule.earnings.toFixed(4)} ETH</div>
                    <div className="text-sm text-gray-400">{capsule.stake_amount.toFixed(3)} ETH staked</div>
                  </div>
                </div>
              ))}
              
              {userCapsules.length === 0 && !capsulesLoading && (
                <div className="text-center py-8 text-gray-400">
                  No capsules found. Create and stake agents to start earning.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Capsule Earnings & Withdrawals</h3>
          
          {userCapsules.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-sm">
                    <th className="text-left pb-3">Capsule</th>
                    <th className="text-right pb-3">Stake</th>
                    <th className="text-right pb-3">Price/Query</th>
                    <th className="text-right pb-3">Earnings</th>
                    <th className="text-right pb-3">Action</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  {userCapsules.map((capsule) => (
                    <tr key={capsule.id} className="border-t border-gray-700">
                      <td className="py-3">
                        <div>
                          <div className="text-white font-medium">{capsule.name}</div>
                          <div className="text-sm text-gray-400">{capsule.category}</div>
                        </div>
                      </td>
                      <td className="text-right py-3 text-white">{capsule.stake_amount.toFixed(3)} ETH</td>
                      <td className="text-right py-3 text-blue-400">{capsule.price_per_query.toFixed(4)} ETH</td>
                      <td className="text-right py-3 text-green-400 font-semibold">
                        {capsule.earnings.toFixed(4)} ETH
                      </td>
                      <td className="text-right py-3">
                        {capsule.earnings > 0 ? (
                          <button
                            onClick={() => handleWithdrawEarnings(capsule.id, capsule.name, capsule.earnings)}
                            disabled={withdrawing[capsule.id] || contractLoading}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm rounded flex items-center space-x-1 ml-auto"
                          >
                            {withdrawing[capsule.id] ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Download className="h-3 w-3" />
                            )}
                            <span>Withdraw</span>
                          </button>
                        ) : (
                          <span className="text-gray-500 text-sm">No earnings</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !capsulesLoading ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">No capsules found</div>
              <div className="text-gray-500 text-sm">Create and stake agents to start earning from queries</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default EarningsDashboard;
