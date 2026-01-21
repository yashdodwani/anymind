import { useState, useEffect } from 'react';
import { Search, Star, TrendingUp, ShoppingCart, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContextProvider';
import { useApiClient } from '../lib/api';
import { useOnChainData } from '../hooks/useOnChainData';
import { queryCapsuleWithContract } from '../utils/mantlePayment';

interface MarketplaceCapsule {
  id: string;
  name: string;
  category: string;
  creator_wallet: string;
  reputation: number;
  stake_amount: number;
  price_per_query: number;
  description: string;
  query_count: number;
  rating: number;
}

const Marketplace = () => {
  const apiClient = useApiClient();
  const navigate = useNavigate();
  const { address, connected, signer } = useWallet();
  const { allCapsules, loading: onChainLoading, error: onChainError, loadAllCapsules } = useOnChainData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const [capsules, setCapsules] = useState<MarketplaceCapsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [buyingCapsuleId, setBuyingCapsuleId] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  useEffect(() => {
    console.log('Marketplace component mounted');
    return () => {
      console.log('Marketplace component unmounted');
    };
  }, []);

  useEffect(() => {
    const handleCapsuleStaked = (event: CustomEvent) => {
      console.log('Capsule staked event received:', event.detail);
      loadAllCapsules();
    };

    window.addEventListener('capsuleStaked', handleCapsuleStaked as EventListener);
    return () => {
      window.removeEventListener('capsuleStaked', handleCapsuleStaked as EventListener);
    };
  }, [loadAllCapsules]);

  const sortOptions = [
    { value: 'popular', label: 'Popular' },
    { value: 'newest', label: 'Newest' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'stake', label: 'Highest Staked' }
  ];

  useEffect(() => {
    if (allCapsules.length > 0) {
      let processedCapsules = allCapsules.map(capsule => ({
        id: capsule.id,
        name: capsule.name,
        category: capsule.category,
        creator_wallet: capsule.creator_wallet,
        reputation: 85,
        stake_amount: capsule.stake_amount,
        price_per_query: capsule.price_per_query,
        description: capsule.description,
        query_count: 0,
        rating: 4.5
      }));

      switch (sortBy) {
        case 'newest':
          processedCapsules.sort((a, b) => b.id.localeCompare(a.id));
          break;
        case 'price_low':
          processedCapsules.sort((a, b) => a.price_per_query - b.price_per_query);
          break;
        case 'price_high':
          processedCapsules.sort((a, b) => b.price_per_query - a.price_per_query);
          break;
        case 'rating':
          processedCapsules.sort((a, b) => b.rating - a.rating);
          break;
        case 'stake':
          processedCapsules.sort((a, b) => b.stake_amount - a.stake_amount);
          break;
        case 'popular':
        default:
          processedCapsules.sort((a, b) => b.query_count - a.query_count);
          break;
      }

      setCapsules(processedCapsules);
      
      const uniqueCategories = ['All', ...new Set(processedCapsules.map(c => c.category).filter(Boolean))];
      setCategories(uniqueCategories);
    }
    
    setLoading(onChainLoading);
    setError(onChainError);
  }, [allCapsules, sortBy, onChainLoading, onChainError]);

  useEffect(() => {
    const fetchSupplementalData = async () => {
      try {
        const apiCapsules = await apiClient.browseMarketplace({}) as MarketplaceCapsule[];
        
        setCapsules(prevCapsules => 
          prevCapsules.map(capsule => {
            const apiCapsule = apiCapsules.find(api => 
              api.name === capsule.name && api.creator_wallet === capsule.creator_wallet
            );
            
            if (apiCapsule) {
              return {
                ...capsule,
                query_count: apiCapsule.query_count || capsule.query_count,
                rating: apiCapsule.rating || capsule.rating,
                reputation: apiCapsule.reputation || capsule.reputation
              };
            }
            
            return capsule;
          })
        );
      } catch (err) {
        console.log('Could not fetch supplemental data from API:', err);
      }
    };

    if (capsules.length > 0) {
      fetchSupplementalData();
    }
  }, [capsules.length, apiClient]);

  const handleBuy = async (capsule: MarketplaceCapsule) => {
    if (!connected || !address || !signer) {
      alert('Please connect your wallet to purchase this capsule');
      return;
    }

    setBuyingCapsuleId(capsule.id);
    setError(null);
    setPurchaseSuccess(null);

    try {
      const contractResult = await queryCapsuleWithContract(
        signer,
        capsule.creator_wallet,
        capsule.id,
        capsule.price_per_query.toString()
      );

      if (!contractResult.success) {
        throw new Error(contractResult.error || 'Smart contract payment failed');
      }

      setPurchaseSuccess(capsule.id);
      
      alert(`Successfully purchased ${capsule.name}!\n\nTransaction: ${contractResult.hash}\n\nYou can now access this capsule.`);
      
      setTimeout(() => {
        navigate(`/app/marketplace/${capsule.id}`);
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Purchase failed';
      setError(message);
      alert(`Purchase failed: ${message}`);
      console.error('Buy error:', err);
    } finally {
      setBuyingCapsuleId(null);
    }
  };

  const filteredCapsules = capsules.filter(capsule => {
    const matchesSearch = searchQuery === '' || 
                         capsule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         capsule.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || capsule.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen p-8 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Marketplace</h1>
          <p className="text-gray-400">Discover and access AI memory capsules from the blockchain</p>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search capsules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-700 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 text-blue-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-400">Loading marketplace from blockchain...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-600 bg-opacity-20 border border-red-500 rounded-lg p-6 mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-red-400 font-semibold mb-1">Error</h3>
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          </div>
        )}

        {purchaseSuccess && (
          <div className="bg-green-600 bg-opacity-20 border border-green-500 rounded-lg p-6 mb-6 flex items-start">
            <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-green-400 font-semibold mb-1">Purchase Successful!</h3>
              <p className="text-green-200 text-sm">Payment sent via smart contract. You can now access this capsule.</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCapsules.map((capsule) => (
                <div key={capsule.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{capsule.name}</h3>
                      <p className="text-sm text-blue-400">{capsule.category}</p>
                    </div>
                    {capsule.rating > 0 && (
                      <div className="flex items-center space-x-1 text-yellow-400">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-medium">{capsule.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">{capsule.description}</p>

                  <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                    <span className="font-mono text-xs">{capsule.creator_wallet?.substring(0, 8)}...</span>
                    {capsule.reputation > 0 && (
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>{capsule.reputation.toFixed(0)}%</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
                    <div className="bg-gray-700 rounded p-2 text-center">
                      <div className="text-green-400 font-semibold">{capsule.stake_amount.toFixed(3)}</div>
                      <div className="text-gray-400">ETH Staked</div>
                    </div>
                    <div className="bg-gray-700 rounded p-2 text-center">
                      <div className="text-blue-400 font-semibold">{capsule.query_count}</div>
                      <div className="text-gray-400">Queries</div>
                    </div>
                    <div className="bg-gray-700 rounded p-2 text-center">
                      <div className="text-purple-400 font-semibold">{capsule.price_per_query.toFixed(4)}</div>
                      <div className="text-gray-400">ETH/query</div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleBuy(capsule)}
                      disabled={!connected || buyingCapsuleId === capsule.id}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors text-center flex items-center justify-center"
                    >
                      {buyingCapsuleId === capsule.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          Buy ({capsule.price_per_query.toFixed(4)} ETH)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredCapsules.length === 0 && !loading && (
              <div className="text-center py-12">
                {capsules.length === 0 ? (
                  <>
                    <div className="text-gray-400 mb-2 text-lg">No capsules available on the blockchain yet</div>
                    <div className="text-gray-500 text-sm mb-4">
                      Create and stake agents in the Staking tab to make them available here
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-gray-400 mb-2">No capsules found matching your criteria</div>
                    <button 
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('All');
                      }}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Clear filters
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
