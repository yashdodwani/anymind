import { ethers } from 'ethers';

// Contract ABI - extracted from the Solidity contract
export const MANTLEMEMO_ABI = [
  // Events
  "event AgentRegistered(address indexed owner, string agentId)",
  "event CapsuleCreated(address indexed creator, string capsuleId)",
  "event StakedOnCapsule(address indexed staker, string capsuleId, uint256 amount)",
  "event UnstakedFromCapsule(address indexed staker, string capsuleId, uint256 amount)",
  "event PriceUpdated(string capsuleId, uint256 newPrice)",
  "event EarningsWithdrawn(address indexed creator, uint256 amount)",
  "event CapsuleQueried(address indexed user, string capsuleId, uint256 amountPaid)",

  // Core Functions
  "function registerAgent(string memory _agentId, string memory _name, string memory _displayName, string memory _platform)",
  "function createCapsule(string memory _capsuleId, string memory _name, string memory _description, string memory _category, uint256 _price)",
  "function stake(string memory _capsuleId) payable",
  "function unstake(string memory _capsuleId, uint256 _amount)",
  "function queryCapsule(address _creator, string memory _capsuleId) payable",
  "function withdrawEarnings(string memory _capsuleId)",
  "function updateCapsulePrice(string memory _capsuleId, uint256 _newPrice)",

  // View Functions
  "function getAgentsByOwner(address _owner) view returns (string[] memory)",
  "function getCapsulesByOwner(address _owner) view returns (string[] memory)",
  "function getAgentDetails(address _owner, string memory _agentId) view returns (tuple(address owner, string agentId, string name, string displayName, string platform, uint256 createdAt, uint256 reputation, bool exists))",
  "function getCapsuleDetails(address _creator, string memory _capsuleId) view returns (tuple(address creator, string capsuleId, string name, string description, string category, uint256 price, uint256 totalStake, uint256 createdAt, uint256 updatedAt, uint256 earnings, bool exists))",
  "function getStakeDetails(address _creator, string memory _capsuleId, address _staker) view returns (tuple(uint256 stakedAt, uint256 lockUntil, bool exists))",
  "function getAllCapsuleLogs() view returns (tuple(address creator, string capsuleId, uint256 timestamp)[] memory)",
  "function getAllAgentLogs() view returns (tuple(address owner, string agentId, uint256 timestamp)[] memory)",
  "function getCapsulesByOwnerDetailed(address _owner) view returns (tuple(address creator, string capsuleId, string name, string description, string category, uint256 price, uint256 totalStake, uint256 createdAt, uint256 updatedAt, uint256 earnings, bool exists)[] memory)",
  "function getAgentsByOwnerDetailed(address _owner) view returns (tuple(address owner, string agentId, string name, string displayName, string platform, uint256 createdAt, uint256 reputation, bool exists)[] memory)",

  // Constants
  "function MAX_PRICE_PER_QUERY() view returns (uint256)",
  "function MIN_PRICE_PER_QUERY() view returns (uint256)",
  "function MAX_STAKE_AMOUNT() view returns (uint256)",
  "function MIN_STAKE_AMOUNT() view returns (uint256)",
  "function LOCK_PERIOD_SECONDS() view returns (uint256)"
];

// Contract address on Mantle Sepolia
export const MANTLEMEMO_CONTRACT_ADDRESS = import.meta.env.VITE_MANTLEMEMO_CONTRACT_ADDRESS || "0x4287F8a28AC24FF1b0723D26747CBE7F39C9C167";

// Type definitions matching the contract structs
export interface Agent {
  owner: string;
  agentId: string;
  name: string;
  displayName: string;
  platform: string;
  createdAt: bigint;
  reputation: bigint;
  exists: boolean;
}

export interface Capsule {
  creator: string;
  capsuleId: string;
  name: string;
  description: string;
  category: string;
  price: bigint;
  totalStake: bigint;
  createdAt: bigint;
  updatedAt: bigint;
  earnings: bigint;
  exists: boolean;
}

export interface StakeInfo {
  stakedAt: bigint;
  lockUntil: bigint;
  exists: boolean;
}

export interface CapsuleLog {
  creator: string;
  capsuleId: string;
  timestamp: bigint;
}

export interface AgentLog {
  owner: string;
  agentId: string;
  timestamp: bigint;
}

// Contract interaction class
export class MantlememoContract {
  private contract: ethers.Contract;

  constructor(signer: ethers.JsonRpcSigner) {
    this.contract = new ethers.Contract(
      MANTLEMEMO_CONTRACT_ADDRESS,
      MANTLEMEMO_ABI,
      signer
    );
  }

  // Agent functions
  async registerAgent(
    agentId: string,
    name: string,
    displayName: string,
    platform: string
  ): Promise<ethers.ContractTransactionResponse> {
    return await this.contract.registerAgent(agentId, name, displayName, platform);
  }

  async getAgentsByOwner(owner: string): Promise<string[]> {
    return await this.contract.getAgentsByOwner(owner);
  }

  async getAgentDetails(owner: string, agentId: string): Promise<Agent> {
    return await this.contract.getAgentDetails(owner, agentId);
  }

  async getAgentsByOwnerDetailed(owner: string): Promise<Agent[]> {
    return await this.contract.getAgentsByOwnerDetailed(owner);
  }

  // Capsule functions
  async createCapsule(
    capsuleId: string,
    name: string,
    description: string,
    category: string,
    priceInEther: string
  ): Promise<ethers.ContractTransactionResponse> {
    const priceWei = ethers.parseEther(priceInEther);
    return await this.contract.createCapsule(capsuleId, name, description, category, priceWei);
  }

  async getCapsulesByOwner(owner: string): Promise<string[]> {
    return await this.contract.getCapsulesByOwner(owner);
  }

  async getCapsuleDetails(creator: string, capsuleId: string): Promise<Capsule> {
    return await this.contract.getCapsuleDetails(creator, capsuleId);
  }

  async getCapsulesByOwnerDetailed(owner: string): Promise<Capsule[]> {
    return await this.contract.getCapsulesByOwnerDetailed(owner);
  }

  async getAllCapsuleLogs(): Promise<CapsuleLog[]> {
    return await this.contract.getAllCapsuleLogs();
  }

  async getAllAgentLogs(): Promise<AgentLog[]> {
    return await this.contract.getAllAgentLogs();
  }

  // Staking functions
  async stake(capsuleId: string, amountInEther: string): Promise<ethers.ContractTransactionResponse> {
    const amountWei = ethers.parseEther(amountInEther);
    return await this.contract.stake(capsuleId, { value: amountWei });
  }

  async unstake(capsuleId: string, amountInEther: string): Promise<ethers.ContractTransactionResponse> {
    const amountWei = ethers.parseEther(amountInEther);
    return await this.contract.unstake(capsuleId, amountWei);
  }

  async getStakeDetails(creator: string, capsuleId: string, staker: string): Promise<StakeInfo> {
    return await this.contract.getStakeDetails(creator, capsuleId, staker);
  }

  // Query functions
  async queryCapsule(
    creator: string,
    capsuleId: string,
    priceInEther: string
  ): Promise<ethers.ContractTransactionResponse> {
    const priceWei = ethers.parseEther(priceInEther);
    return await this.contract.queryCapsule(creator, capsuleId, { value: priceWei });
  }

  // Earnings functions
  async withdrawEarnings(capsuleId: string): Promise<ethers.ContractTransactionResponse> {
    return await this.contract.withdrawEarnings(capsuleId);
  }

  // Price update
  async updateCapsulePrice(capsuleId: string, newPriceInEther: string): Promise<ethers.ContractTransactionResponse> {
    const priceWei = ethers.parseEther(newPriceInEther);
    return await this.contract.updateCapsulePrice(capsuleId, priceWei);
  }

  // Constants
  async getConstants() {
    const [maxPrice, minPrice, maxStake, minStake, lockPeriod] = await Promise.all([
      this.contract.MAX_PRICE_PER_QUERY(),
      this.contract.MIN_PRICE_PER_QUERY(),
      this.contract.MAX_STAKE_AMOUNT(),
      this.contract.MIN_STAKE_AMOUNT(),
      this.contract.LOCK_PERIOD_SECONDS()
    ]);

    return {
      maxPricePerQuery: ethers.formatEther(maxPrice),
      minPricePerQuery: ethers.formatEther(minPrice),
      maxStakeAmount: ethers.formatEther(maxStake),
      minStakeAmount: ethers.formatEther(minStake),
      lockPeriodSeconds: Number(lockPeriod)
    };
  }

  // Event listeners
  onAgentRegistered(callback: (owner: string, agentId: string) => void) {
    this.contract.on("AgentRegistered", callback);
  }

  onCapsuleCreated(callback: (creator: string, capsuleId: string) => void) {
    this.contract.on("CapsuleCreated", callback);
  }

  onCapsuleQueried(callback: (user: string, capsuleId: string, amountPaid: bigint) => void) {
    this.contract.on("CapsuleQueried", callback);
  }

  onStakedOnCapsule(callback: (staker: string, capsuleId: string, amount: bigint) => void) {
    this.contract.on("StakedOnCapsule", callback);
  }

  onEarningsWithdrawn(callback: (creator: string, amount: bigint) => void) {
    this.contract.on("EarningsWithdrawn", callback);
  }

  // Cleanup
  removeAllListeners() {
    this.contract.removeAllListeners();
  }
}

// Utility functions
export function formatCapsuleForUI(capsule: Capsule) {
  return {
    id: capsule.capsuleId,
    name: capsule.name,
    description: capsule.description,
    category: capsule.category,
    creator_wallet: capsule.creator,
    price_per_query: parseFloat(ethers.formatEther(capsule.price)),
    stake_amount: parseFloat(ethers.formatEther(capsule.totalStake)),
    earnings: parseFloat(ethers.formatEther(capsule.earnings)),
    created_at: new Date(Number(capsule.createdAt) * 1000).toISOString(),
    updated_at: new Date(Number(capsule.updatedAt) * 1000).toISOString(),
    exists: capsule.exists
  };
}

export function formatAgentForUI(agent: Agent) {
  return {
    id: agent.agentId,
    name: agent.name,
    display_name: agent.displayName,
    platform: agent.platform,
    owner: agent.owner,
    reputation: Number(agent.reputation) / 100, // Convert from basis points to percentage
    created_at: new Date(Number(agent.createdAt) * 1000).toISOString(),
    exists: agent.exists
  };
}