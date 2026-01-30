# Anymind: Multi-Agent Systems Memory Runtime on Ethereum

Instead of fine-tuning models or constantly rebuilding prompts, Anymind converts every interaction into **retrievable, portable memory** that agents can leverage across sessions, tools, and decentralized apps. The system is designed so intelligence persists beyond a single request, enabling agents to behave consistently across ecosystems.

Anymind is a **Multi-Agentic framework (MAS) runtime** that makes agents stateful by default while aligning naturally with Ethereum and wallet-centric application flows. Chats, messages, user preferences, capsules, staking activity, earnings data, and semantic recall persist through a **single storage layer: Qdrant**, while wallet identities and on-chain components integrate seamlessly with the runtime.

This enables agents to operate across decentralized apps, marketplaces, and governance environments without losing contextual intelligence.

---

## What it does (MAS Track)

* **Agents**: Configurable LLM backends (provider/model/key) with a stable identity usable across decentralized and traditional apps.
* **Chats**: Multiple isolated sessions per agent, enabling scoped memory for governance discussions, marketplaces, or DAO workflows.
* **Messages**: Persistent conversation history plus vectorized content for long-term recall and cross-session reasoning.
* **Preferences**: Wallet-linked user settings and configurations that survive restarts and device changes.
* **Capsules / Marketplace**: Publishable, searchable memory capsules usable in decentralized marketplaces and agent ecosystems.
* **Runtime**: FastAPI endpoints consumed by a React client and Web3 UI layers without requiring route or contract modifications.

This architecture allows agent intelligence to move fluidly between Web2 services and Ethereum-powered applications.

---

## Why Qdrant

Qdrant operates as the **single persistence layer**, ensuring simplicity while supporting Web3-style application patterns:

* **Structured storage via payloads** for agents, chats, preferences, staking data, and earnings metadata.
* **Vector storage** enabling semantic retrieval of conversations and capsule discovery.
* **Named collections per entity type**, avoiding monolithic storage and supporting modular scaling.

If Qdrant becomes unavailable, the backend fails loudly on startup, ensuring runtime consistency rather than silent data loss — a critical requirement for decentralized and financial applications.

---

## Core Concepts

* **Agent**: A runnable configuration (provider/model) with a persistent identity usable across dApps and sessions.
* **Chat**: A scoped agent session storing interaction history and runtime settings.
* **Message**: A durable event in a chat, vectorized to support recall and reasoning.
* **Memory**: Retrieved semantic context injected into LLM calls through mem0 on top of Qdrant.
* **Wallet Identity**: Users interact through wallet addresses, enabling seamless Ethereum integration.

---

## SDK Usage (Read-Only)

```python
from anymind import Agent

agent = Agent(
    agent_id="agent_123",
    chat_id="governance_chat",
)

response = agent.chat("Analyze proposal X")
```

Agents remain stateful regardless of where calls originate — SDK, dApp UI, or backend services.

---

## Architecture

* **Frontend**: React client with wallet-based identity integration.
* **Runtime**: FastAPI powering MAS execution and API access.
* **Persistence Layer**: Qdrant storing structured payloads and semantic vectors.
* **Semantic Memory**: mem0 using Qdrant for contextual retrieval.
* **Ethereum Integration**: Optional smart contract modules supporting staking, payments, and governance participation.

The architecture allows agent intelligence to bridge centralized infrastructure and decentralized ecosystems.

---

## Getting Started

### Prerequisites

* A running Qdrant instance (local or hosted)
* `OPENAI_API_KEY` for embeddings and semantic retrieval
* Wallet support for Ethereum integration if using staking or marketplace flows

### Run Qdrant locally

```bash
docker run -p 6333:6333 qdrant/qdrant
```

### Running the app

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Agents immediately gain persistent memory and wallet-linked identity support.

---

## Ethereum Module (Staking & Payments)

Anymind includes Ethereum integration for decentralized economic interactions. While MAS runtime remains the core, blockchain support enables agent-driven marketplaces and incentive mechanisms.

Capabilities include:

* Agent staking and rewards participation
* Capsule monetization and discovery flows
* Payment and earnings tracking
* DAO or governance workflow extensions

Configuration details:

* **Network**: Ethereum Sepolia (Chain ID: 11155111)
* **Contract Address**: `0x4287F8a28AC24FF1b0723D26747CBE7F39C9C167`
* **Explorer Access**: Viewable via Sepolia blockchain explorers

On-chain logic remains modular, allowing future migration to mainnet or L2 networks without redesigning agent runtime logic.

---

## What Anymind is NOT

Anymind intentionally avoids design decisions that complicate agent usability or scalability:

* ❌ No model fine-tuning requirement
* ❌ No raw conversation data stored on-chain
* ❌ No prompt marketplace dependency
* ❌ No AI inference performed on-chain

Blockchain augments economic and identity flows, while computation and memory stay off-chain for performance and cost efficiency.

---

## Status

✅ **MAS runtime**: Multi-agent chats with persistent memory via Qdrant
✅ **Semantic recall**: Message embeddings with vector retrieval
✅ **Marketplace data**: Capsules, staking, and earnings stored through Qdrant payloads
✅ **SDK access**: Persistent agent intelligence via API and SDK
✅ **Ethereum compatibility**: Wallet-native flows and optional contract integrations

---
