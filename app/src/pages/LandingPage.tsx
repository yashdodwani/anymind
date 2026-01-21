import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContextProvider';
import {
  MessageSquare,
  Package,
  Store,
  ArrowRight,
  CheckCircle,
  Zap,
  Terminal,
  Github,
  ExternalLink,
} from "lucide-react";
import mantleLogo from "../assets/logo.png";
import appLogo from "../assets/logo.png";
import cometBg from "../assets/comet.gif";
import mantleIcon from "../assets/mantle.png";
import { useMantleBalance } from "../hooks/useMantleBalance";

export default function LandingPage() {
  const { connected, address, disconnect, connect } = useWallet();
  const { balance, loading } = useMantleBalance();
  const [showDisconnect, setShowDisconnect] = useState(false);
  const disconnectRef = useRef<HTMLDivElement>(null);

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (disconnectRef.current && !disconnectRef.current.contains(event.target as Node)) {
        setShowDisconnect(false);
      }
    };

    if (showDisconnect) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDisconnect]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="nav-floating sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img src={mantleLogo} alt="Anymind" className="h-8 w-8" />
              <span className="text-xl font-bold text-mantle-400">
                Anymind
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/marketplace" className="nav-link-mantle">
                Marketplace
              </Link>
              <a href="#how-it-works" className="nav-link-mantle">
                How it Works
              </a>
              <a href="#developers" className="nav-link-mantle">
                Developers
              </a>
            </div>

            <div className="flex items-center gap-3">
              {connected && address ? (
                <div className="flex items-center gap-3" ref={disconnectRef}>
                  <div className="glass px-4 py-2 text-sm font-medium text-mantle-300">
                    {loading ? '...' : `${balance ?? '0'} ETH`}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowDisconnect(!showDisconnect)}
                      className="btn-mantle-secondary px-4 py-2 text-sm"
                    >
                      {shortenAddress(address)}
                    </button>
                    {showDisconnect && (
                      <div className="absolute right-0 mt-2 w-48 glass p-2 z-50">
                        <button
                          onClick={() => {
                            disconnect();
                            setShowDisconnect(false);
                          }}
                          className="bg-black hover:bg-mantle-950 text-mantle-400 px-4 py-2 rounded-2xl text-sm font-medium transition-colors whitespace-nowrap w-full"
                        >
                          Disconnect
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button onClick={connect} className="btn-mantle-primary px-6 py-2">
                  Connect MetaMask
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden glow-teal" style={{
        backgroundImage: `url(${cometBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="text-center mb-8">
            <span className="badge-mantle mb-6">
              <img src={mantleIcon} alt="Ethereum" className="w-4 h-4" />
               ‎ v1 live on Ethereum Sepolia testnet
            </span>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Turn AI conversations into{' '}
              <span className="text-mantle-400">
                on-chain intelligence
              </span>
              .
            </h1>
            <p className="text-xl font-light text-white-200 max-w-3xl mx-auto mb-10">

              Anymind is an Ethereum-native AI intelligence marketplace. Chat with agents, package
              long-term intelligence into capsules, and monetize them as revenue-generating assets.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center glow-primary">
              {connected ? (
                <Link to="/app" className="btn-mantle-primary px-8 py-3 text-lg">
                  Enter App <ArrowRight className="w-5 h-5 ml-2 inline" />
                </Link>
              ) : (
                <button onClick={connect} className="btn-mantle-primary px-8 py-3 text-lg">
                  Connect MetaMask <ArrowRight className="w-5 h-5 ml-2 inline" />
                </button>
              )}
              <Link to="/marketplace" className="btn-mantle-secondary px-8 py-3 text-lg">
                View Marketplace
              </Link>
            </div>
          </div>

          {/* Code Preview */}
          <div className="max-w-4xl mx-auto mt-16">
            <div className="code-block-floating overflow-hidden">
              <div className="status-hud px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-mantle-400" />
                  <span className="text-sm text-mantle-400">Anymind-agent.py</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-mantle-500" />
                  <div className="w-3 h-3 rounded-full bg-mantle-600" />
                  <div className="w-3 h-3 rounded-full bg-mantle-400" />
                </div>
              </div>
              <div className="p-6 font-mono text-sm overflow-x-auto">
                <pre className="text-white">
                  <code>
                    <span className="text-mantle-600">1</span>{' '}
                    <span className="text-white">from</span> anymind{' '}
                    <span className="text-white">import</span> Agent{'\n'}
                    <span className="text-mantle-600">2</span> agent = Agent({'\n'}
                    <span className="text-mantle-600">3</span>{' '}
                    <span className="text-white">    agent_id</span>=
                    <span className="text-white">"your-agent-id"</span>,{'\n'}
                    <span className="text-mantle-600">4</span>{' '}
                    <span className="text-white">    chat_id</span>=
                    <span className="text-white">"your-chat-id"</span>,{'\n'}
                    <span className="text-mantle-600">5</span>{' '}
                    <span className="text-white">    wallet_address</span>=
                    <span className="text-white">"YourMantleWalletAddress"</span>,{'\n'}
                    <span className="text-mantle-600">6</span>{' '}
                    <span className="text-white">    base_url</span>=
                    <span className="text-white">"Anymind.ai"</span>
                    {'\n'}
                    <span className="text-mantle-600">7</span> ){'\n'}
                    <span className="text-mantle-600">8</span> {'\n'}
                    <span className="text-mantle-600">9</span> response = agent.
                    <span className="text-white">chat</span>(
                    <span className="text-white">"Your message here"</span>){'\n'}
                    <span className="text-mantle-600">10</span>{' '}
                    <span className="text-white">print</span>(response)
                  </code>
                </pre>
              </div>
              <div className="status-hud px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-mantle-500 animate-pulse" />
                  <span className="text-sm text-mantle-400">Status</span>
                  <span className="text-sm font-semibold text-mantle-300">LIVE</span>
                </div>
                <div className="flex items-center gap-6 text-sm text-mantle-400">
                  <div>
                    <span className="font-semibold text-white">4,821</span> Queries Served
                  </div>
                  <div>
                    <span className="font-semibold text-white">24.1 ETH</span> Total Revenue
                  </div>
                  <a href="#" className="text-mantle-400 hover:text-mantle-300 flex items-center gap-1">
                    View on Explorer <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-strong p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: "Saved on Compute", val: "40%", sub: "vs traditional RAG" },
                { label: "Time to Market", val: "98%", sub: "faster deployment" },
                { label: "Revenue Generated", val: "2.4M", sub: "ETH to creators" },
                { label: "Active Capsules", val: "12k+", sub: "intelligence assets" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-mantle-400 mb-2">
                    {stat.val}
                  </div>
                  <div className="text-white font-medium mb-1">{stat.label}</div>
                  <div className="text-sm text-mantle-500">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              The lifecycle of intelligence.
            </h2>
            <p className="text-xl text-mantle-300 max-w-3xl mx-auto">
              Anymind turns ephemeral chats into persistent, composable, and revenue-generating
              primitives.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-2 text-mantle-400 hover:text-mantle-300 mt-6"
            >
              Read the whitepaper <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="space-y-24">
            {/* Step 1 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="glass w-12 h-12 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-mantle-400" />
                  </div>
                  <span className="badge-mantle">STEP 1</span>
                </div>
                <h3 className="text-3xl font-bold mb-4">Chat & Compose</h3>
                <p className="text-mantle-300 text-lg">
                  Engage with foundational models. Our intelligence layer structures these
                  conversations into reusable reasoning patterns as you go.
                </p>
              </div>
              <div className="card-mantle p-8">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="glass p-4 animate-pulse"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    >
                      <div className="h-4 bg-mantle-800 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-mantle-800 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="card-mantle p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <Package className="w-12 h-12 text-mantle-400" />
                    <div>
                      <div className="font-semibold text-lg text-white">Intelligence Capsule</div>
                      <div className="text-sm text-mantle-400">Ready to deploy</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-mantle-400" />
                      <span className="text-mantle-300">Metadata defined</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-mantle-400" />
                      <span className="text-mantle-300">Context packaged</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-mantle-400" />
                      <span className="text-mantle-300">Pricing configured</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="glass w-12 h-12 flex items-center justify-center">
                    <Package className="w-6 h-6 text-mantle-400" />
                  </div>
                  <span className="badge-mantle">STEP 2</span>
                </div>
                <h3 className="text-3xl font-bold mb-4">Package</h3>
                <p className="text-mantle-300 text-lg">
                  Seal your intelligence into an Intelligence Capsule. Define metadata, specialized
                  context, and pricing models.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="glass w-12 h-12 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-mantle-400" />
                  </div>
                  <span className="badge-mantle">STEP 3</span>
                </div>
                <h3 className="text-3xl font-bold mb-4">Stake</h3>
                <p className="text-mantle-300 text-lg">
                  Stake ETH behind your capsule to signal reputation and boost visibility in the
                  marketplace.
                </p>
              </div>
              <div className="card-mantle p-8">
                <div className="text-center">
                  <div className="text-5xl font-bold text-mantle-400 mb-2">450 ETH</div>
                  <div className="text-mantle-400 mb-6">Staked Amount</div>
                  <div className="glass p-4">
                    <div className="text-sm text-mantle-400 mb-1">Marketplace Rank</div>
                    <div className="text-2xl font-bold text-mantle-400">#12</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="card-mantle p-8">
                  <div className="text-center mb-6">
                    <div className="text-6xl font-bold text-mantle-400 mb-2">
                      0.0001s
                    </div>
                    <div className="text-mantle-400">Settlement Time</div>
                  </div>
                  <div className="space-y-3">
                    <div className="glass p-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-mantle-400">Query Fee</span>
                        <span className="text-mantle-300 font-semibold">0.005 ETH</span>
                      </div>
                    </div>
                    <div className="glass p-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-mantle-400">Creator Revenue</span>
                        <span className="text-mantle-300 font-semibold">0.0045 ETH</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="glass w-12 h-12 flex items-center justify-center">
                    <Store className="w-6 h-6 text-mantle-400" />
                  </div>
                  <span className="badge-mantle">STEP 4</span>
                </div>
                <h3 className="text-3xl font-bold mb-4">Monetize</h3>
                <p className="text-mantle-300 text-lg">
                  Each query to your capsule triggers a lightning-fast Mantle micropayment.
                  Permissionless, transparent, and direct.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Capsules */}
      <section className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-2">Featured Intelligence Assets</h2>
              <p className="text-mantle-400">Top performing capsules in the marketplace</p>
            </div>
            <div className="flex gap-2">
              <button className="badge-mantle">
                All Categories
              </button>
              <button className="badge-accent hover:bg-mantle-800/30 transition-colors">
                Trending
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "DeFi Alpha Hunter",
                creator: "0xAlpha",
                queries: "12.4k",
                staked: "450 ETH",
                price: "0.005",
                category: "Trading",
              },
              {
                name: "Legal Contract Analyzer",
                creator: "LegalMind",
                queries: "8.2k",
                staked: "320 ETH",
                price: "0.01",
                category: "Legal",
              },
              {
                name: "Code Review Assistant",
                creator: "DevDAO",
                queries: "24.1k",
                staked: "890 ETH",
                price: "0.003",
                category: "Development",
              },
            ].map((capsule, i) => (
              <div
                key={i}
                className="card-mantle p-6 hover-lift cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1 group-hover:text-mantle-400 transition-colors">
                      {capsule.name}
                    </h3>
                    <p className="text-sm text-mantle-500">by {capsule.creator}</p>
                  </div>
                  <span className="badge-mantle">
                    {capsule.category}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-2xl font-bold text-white">{capsule.queries}</div>
                    <div className="text-xs text-mantle-500">Queries</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{capsule.staked}</div>
                    <div className="text-xs text-mantle-500">Staked</div>
                  </div>
                </div>

                <div className="glass p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-mantle-500">Price per query</div>
                    <div className="text-lg font-bold text-mantle-400">{capsule.price} ETH</div>
                  </div>
                  <button className="btn-mantle-accent px-4 py-2 text-sm">
                    Query Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Developers Section */}
      <section id="developers" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-strong p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Terminal className="w-6 h-6 text-mantle-400" />
                  <span className="badge-mantle">
                    Open Source SDK
                  </span>
                </div>
                <h2 className="text-4xl font-bold mb-4">Build on Anymind</h2>
                <p className="text-mantle-300 text-lg mb-6">
                  Our TypeScript SDK makes it easy to create, query, and monetize intelligence
                  capsules. Full Mantle integration out of the box.
                </p>
                <div className="flex gap-4">
                  <a
                    href="#"
                    className="btn-mantle-primary px-6 py-3"
                  >
                    View Docs <ExternalLink className="w-4 h-4 ml-2 inline" />
                  </a>
                  <a
                    href="#"
                    className="btn-mantle-secondary px-6 py-3"
                  >
                    <Github className="w-4 h-4 mr-2 inline" /> GitHub
                  </a>
                </div>
              </div>

              <div className="card-mantle p-6 font-mono text-sm">
                <div className="text-mantle-400 mb-4">
                  <span className="text-mantle-600">// Quick start</span>
                  <br />
                  <span className="text-mantle-400">npm install</span> @Anymind/sdk
                </div>
                <div className="text-mantle-400">
                  <span className="text-mantle-600">// Query a capsule</span>
                  <br />
                  <span className="text-mantle-400">const</span> response ={' '}
                  <span className="text-mantle-400">await</span> capsule.
                  <span className="text-mantle-300">query</span>({'{'}
                  <br />
                  <span className="text-mantle-500">  prompt</span>:{' '}
                  <span className="text-mantle-300">"Analyze this contract..."</span>
                  <br />
                  {'}'});
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass p-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <img src={appLogo} alt="Anymind" className="h-8 w-8" />
                <span className="text-xl font-bold text-mantle-400">Anymind</span>
              </div>

              <div className="flex gap-8">
                <a href="#" className="nav-link-mantle">
                  Documentation
                </a>
                <a href="#" className="nav-link-mantle">
                  GitHub
                </a>
                <a href="#" className="nav-link-mantle">
                  Discord
                </a>
                <a href="#" className="nav-link-mantle">
                  Twitter
                </a>
              </div>

              <div className="text-mantle-500 text-sm">
                © 2026 Anymind Protocol. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}