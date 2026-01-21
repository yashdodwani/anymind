import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Store, Wallet, Settings, MessageSquare, Coins, TrendingUp, ArrowLeft, Plus, X } from 'lucide-react';
import { useMantleBalance } from '../hooks/useMantleBalance';
import { useWallet } from '../contexts/WalletContextProvider';
import { useApiClient } from '../lib/api';
import appLogo from '../assets/logo.png';
import InfoIcon from './InfoIcon';

interface LLMConfig {
  id: string;
  name: string;
  displayName: string;
  platform: string;
  apiKeyConfigured: boolean;
}

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeSubTab: string;
  setActiveSubTab: (subTab: string) => void;
  customLLMs: LLMConfig[];
  onAddLLM: (llm: LLMConfig) => void;
}

const BalanceDisplay = () => {
  const { balance, loading } = useMantleBalance();
  const { connected } = useWallet();

  // Log balance changes for debugging
  useEffect(() => {
    if (balance !== null && balance !== undefined) {
      console.log('BalanceDisplay: balance changed to', balance);
    }
  }, [balance]);

  // Format balance with appropriate decimal places
  const formatBalance = (bal: number | null): string => {
    if (bal === null || bal === undefined) return '0';
    // Show more decimal places to see transaction fee changes
    // If balance is >= 1, show 4 decimals; if < 1, show 5 decimals
    if (bal >= 1) {
      return bal.toFixed(4);
    } else {
      return bal.toFixed(5);
    }
  };

  return (
    <div className="card-mantle px-4 py-2 min-w-[120px]">
      <div className="text-xs text-mantle-500 font-medium">Balance</div>
      <div className="text-sm font-semibold text-white" key={balance}>
        {loading ? '...' : connected ? `${formatBalance(balance)} ETH` : 'N/A'}
      </div>
    </div>
  );
};

const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeSubTab,
  setActiveSubTab,
  customLLMs,
  onAddLLM
}) => {
  const [showAddLLM, setShowAddLLM] = useState(false);
  const [newLLMName, setNewLLMName] = useState('');
  const [newLLMModel, setNewLLMModel] = useState('');
  const [newLLMPlatform, setNewLLMPlatform] = useState('');
  const [newLLMApiKey, setNewLLMApiKey] = useState('');
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const api = useApiClient();

  const mainTabs = [
    { id: 'agents', label: 'Agents', icon: Brain },
    { id: 'marketplace', label: 'Marketplace', icon: Store },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const platforms = [
    'OpenRouter',
    'OpenAI',
    'Anthropic',
    'Gemini',
    'Hugging Face',
    'Groq',
  ];

  const handleAddLLM = async () => {
    if (!newLLMName.trim() || !newLLMPlatform || !newLLMApiKey.trim()) return;

    setIsCreatingAgent(true);
    try {
      // Create agent immediately via API so it persists
      const agentName = newLLMName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '-');
      const createdAgent = await api.createAgent({
        name: agentName,
        display_name: newLLMName,
        platform: newLLMPlatform,
        api_key: newLLMApiKey,
        model: newLLMModel.trim() || newLLMName // Use OpenRouter model name if provided, otherwise fallback to display name
      }) as any;

      // Convert created agent to LLMConfig format
      const newLLM: LLMConfig = {
        id: createdAgent.id,
        name: createdAgent.name,
        displayName: createdAgent.display_name || newLLMName,
        platform: createdAgent.platform,
        apiKeyConfigured: true
      };

      // Add to local state
      onAddLLM(newLLM);

      // Clear form
      setNewLLMName('');
      setNewLLMModel('');
      setNewLLMPlatform('');
      setNewLLMApiKey('');
      setShowAddLLM(false);

      console.log('Agent created successfully:', createdAgent.id);
    } catch (error) {
      console.error('Error creating agent:', error);
      alert(`Failed to create agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingAgent(false);
    }
  };

  const getSubTabs = (tabId: string) => {
    switch (tabId) {
      case 'agents':
        // Filter out any GPT or Mistral agents (but not substrings like "devstral")
        // Allow specific exception: 'openai/gpt-oss-120b:free'
        const ALLOWED_MODELS = ['openai/gpt-oss-120b:free'];

        const isGPTOrMistral = (str: string): boolean => {
          const lower = str.toLowerCase();
          // Allow specific models
          if (ALLOWED_MODELS.some(allowed => lower.includes(allowed.toLowerCase()))) {
            return false;
          }
          // Check for exact matches or common patterns
          return lower === 'gpt' || lower === 'mistral' ||
            /^gpt[-_\s]/.test(lower) || /[-_\s]gpt[-_\s]/.test(lower) || /[-_\s]gpt$/.test(lower) ||
            /^mistral[-_\s]/.test(lower) || /[-_\s]mistral[-_\s]/.test(lower) || /[-_\s]mistral$/.test(lower);
        };

        const customAgents = customLLMs
          .filter(llm => {
            const id = (llm.id || '').toLowerCase();
            const name = (llm.name || '').toLowerCase();
            const displayName = (llm.displayName || '').toLowerCase();
            // Check if this is an allowed model
            const isAllowed = ALLOWED_MODELS.some(allowed =>
              id.includes(allowed.toLowerCase()) ||
              name.includes(allowed.toLowerCase()) ||
              displayName.includes(allowed.toLowerCase())
            );
            if (isAllowed) return true;
            // Otherwise apply normal filtering
            return !isGPTOrMistral(id) && !isGPTOrMistral(name) && !isGPTOrMistral(displayName);
          })
          .map(llm => ({
            id: llm.id, // Use agent ID instead of name
            label: llm.displayName,
            icon: MessageSquare
          }));
        return customAgents;
      case 'marketplace':
        return [
          { id: 'browse', label: 'Browse', icon: Store },
          { id: 'staking', label: 'Staking', icon: Coins }
        ];
      case 'wallet':
        return [
          { id: 'balance', label: 'Balance', icon: Wallet },
          { id: 'earnings', label: 'Earnings', icon: TrendingUp }
        ];
      default:
        return [];
    }
  };

  const subTabs = getSubTabs(activeTab);

  return (
    <>
      <div className="nav-floating shadow-lg">
        {/* Main Navigation */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link
                to="/"
                className="nav-link-mantle p-2"
                title="Back to landing page"
              >
                <ArrowLeft className="h-5 w-5 text-mantle-500 hover:text-mantle-400" />
              </Link>
              <img src={appLogo} alt="Anymind" className="h-8 w-8" />
              <span className="heading-sm text-mantle-400">Anymind</span>
            </div>

            <div className="flex items-center space-x-2">
              {mainTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      // Set default sub-tab when switching main tabs
                      const defaultSubTabs = getSubTabs(tab.id);
                      if (defaultSubTabs.length > 0) {
                        setActiveSubTab(defaultSubTabs[0].id);
                      }
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-2xl transition-all duration-250 ${activeTab === tab.id
                      ? 'btn-mantle-primary'
                      : 'text-mantle-400 hover:bg-white/5 hover:text-mantle-300'
                      }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <BalanceDisplay />
          </div>
        </div>

        {/* Sub Navigation */}
        {(subTabs.length > 0 || (activeTab === 'agents' && customLLMs.length === 0)) && (
          <div className="px-6 pb-4">
            <div className="flex space-x-2 flex-wrap gap-2">
              {subTabs.map((subTab) => {
                const Icon = subTab.icon;
                // Check if this is an agent tab (has an ID that matches a custom LLM)
                const isAgentTab = activeTab === 'agents' && customLLMs.some(llm => llm.id === subTab.id);
                return (
                  <div
                    key={subTab.id}
                    className="relative inline-flex items-center"
                  >
                    <button
                      onClick={() => setActiveSubTab(subTab.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-sm transition-all duration-250 ${activeSubTab === subTab.id
                        ? 'glass text-mantle-300'
                        : 'text-mantle-500 hover:bg-white/5 hover:text-mantle-400'
                        }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{subTab.label}</span>
                    </button>
                    {isAgentTab && (
                      <div className="ml-1" onClick={(e) => e.stopPropagation()}>
                        <InfoIcon id={subTab.id} label="LLM ID" />
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Add LLM button in agents tab - always visible when on agents tab */}
              {activeTab === 'agents' && (
                <button
                  onClick={() => setShowAddLLM(true)}
                  className="btn-mantle-primary flex items-center space-x-2 px-4 py-2 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add LLM</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add LLM Modal */}
      {showAddLLM && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card-mantle p-8 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Settings className="h-6 w-6 text-mantle-400" />
                <h2 className="heading-sm text-white">Add New LLM</h2>
              </div>
              <button
                onClick={() => setShowAddLLM(false)}
                className="p-2 hover:bg-mantle-950 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-mantle-500" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-mantle-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newLLMName}
                  onChange={(e) => setNewLLMName(e.target.value)}
                  placeholder="e.g., Llama 3, Claude, Gemini Pro"
                  className="input-mantle"
                />
                <p className="text-xs text-mantle-500 mt-1">
                  This is the name that will appear in the UI
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-mantle-300 mb-2">
                  Model Name
                </label>
                <input
                  type="text"
                  value={newLLMModel}
                  onChange={(e) => setNewLLMModel(e.target.value)}
                  placeholder="e.g., meta-llama/llama-3.3-70b-instruct:free"
                  className="input-mantle"
                />
                <p className="text-xs text-mantle-500 mt-1">
                  The exact model identifier from OpenRouter (optional - will use display name if not provided)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-mantle-300 mb-2">
                  Platform / Provider
                </label>
                <select
                  value={newLLMPlatform}
                  onChange={(e) => setNewLLMPlatform(e.target.value)}
                  className="input-mantle"
                >
                  <option value="">Select a platform</option>
                  {platforms.map(platform => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-mantle-300 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={newLLMApiKey}
                  onChange={(e) => setNewLLMApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="input-mantle"
                />
                <p className="text-xs text-mantle-500 mt-2">
                  Your API key is stored securely and never shared.
                </p>
              </div>

              <div className="card-mantle-dark p-4">
                <h4 className="text-mantle-400 font-semibold mb-2">Supported Platforms</h4>
                <p className="text-sm text-mantle-300">
                  We support any Openrouter.ai-compatible API endpoint. Enter your provider's API key to get started.
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowAddLLM(false)}
                  className="btn-mantle-secondary flex-1 py-3"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLLM}
                  disabled={!newLLMName.trim() || !newLLMPlatform || !newLLMApiKey.trim() || isCreatingAgent}
                  className="btn-mantle-primary flex-1 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingAgent ? 'Creating...' : 'Add LLM'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
