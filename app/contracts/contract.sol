// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


/**
Deployed contract adress: contract address=0x4287F8a28AC24FF1b0723D26747CBE7F39C9C167
*/

/**
 * @title Mantlememo
 * @notice A decentralized marketplace for AI Agents and Memory Capsules.
 * @dev This contract handles:
 * 1. Registry: Creating Agents and Capsules.
 * 2. Staking: Owners locking ETH/MNT to signal credibility.
 * 3. Marketplace: Users paying ETH/MNT to query capsules.
 * 4. Accounting: Tracking earnings and allowing withdrawals.
 */
contract Mantlememo {
    // ============================================================================
    // 1. CONSTANTS & CONFIGURATION
    // ============================================================================
    
    // Price Limits (Assuming 18 decimals, 1 Ether = 10^18 Wei)
    uint256 public constant MAX_PRICE_PER_QUERY = 1 ether; 
    uint256 public constant MIN_PRICE_PER_QUERY = 0.0001 ether; 
    
    // Staking Limits
    uint256 public constant MAX_STAKE_AMOUNT = 100 ether;
    uint256 public constant MIN_STAKE_AMOUNT = 0.0001 ether;
    
    // Validation Config
    uint256 public constant MIN_STRING_LENGTH = 1;
    uint256 public constant LOCK_PERIOD_SECONDS = 7 days; // Stake is locked for 1 week

    // ============================================================================
    // 2. CUSTOM ERRORS
    // @dev Use these in your frontend 'try/catch' blocks to show specific error messages.
    // ============================================================================

    error EmptyString();            // Input string cannot be empty
    error InvalidMetadataLength();  // String is too long (gas protection)
    error CapsuleNotFound();        // Capsule ID does not exist
    error InvalidPrice();           // Price is below MIN or above MAX
    error PriceTooHigh();           // Price exceeds MAX limit
    error InsufficientPayment();    // User sent less ETH than required
    error TransferFailed();         // ETH transfer failed (recipient rejected funds)
    
    // Staking Errors
    error StakeTooHigh();           // Stake exceeds MAX limit
    error InsufficientStake();      // Trying to unstake more than you have
    error StakeLocked();            // Trying to unstake before 7 days passed
    error Unauthorized();           // Only the owner can perform this action

    // ============================================================================
    // 3. DATA STRUCTURES (STATE)
    // ============================================================================

    struct Agent {
        address owner;       // Wallet address of the agent creator
        string agentId;      // Unique String ID (e.g., "agent_gpt4_v1")
        string name;         // Human readable name
        string displayName;  // UI display name
        string platform;     // Model provider (e.g., "openai")
        uint256 createdAt;   // Block timestamp of creation
        uint256 reputation;  // Trust score (default 10000 = 100%)
        bool exists;         // check to prevent duplicates
    }

    struct Capsule {
        address creator;     // Wallet that owns this data capsule
        string capsuleId;    // Unique String ID
        string name;         // Capsule name
        string description;  // Short description for UI
        string category;     // Filter category (e.g., "coding", "finance")
        uint256 price;       // Price in Wei to query this capsule
        uint256 totalStake;  // Total ETH staked on this capsule
        uint256 createdAt;   // Timestamp
        uint256 updatedAt;   // Last modification timestamp
        uint256 earnings; // total money earned by the capsule
        bool exists;         // check to prevent duplicates
    }

    struct Staking {
        // uint256 amount;      // Amount currently locked
        uint256 stakedAt;    // Timestamp of last stake addition
        uint256 lockUntil;   // Timestamp when funds become withdrawable
        bool exists;         // Flag for first-time stakers
    }

    struct Earnings {
        uint256 totalEarnings; // ETH available for withdrawal
        uint256 queryCount;    // Total number of paid queries
        uint256 lastUpdated;   // Timestamp of last earning
    }

    // ============================================================================
    // 4. ON-CHAIN HISTORY LOGS
    // @dev These arrays allow other contracts/frontends to read history 
    // without an indexer (The Graph), though checking arrays is gas-heavy.
    // ============================================================================

    struct AgentRegisteredLog {
        address owner;
        string agentId;
        uint256 timestamp;
    }

    struct CapsuleCreatedLog {
        address creator;
        string capsuleId;
        uint256 timestamp;
    }

    struct StakedOnCapsuleLog {
        address staker;
        string capsuleId;
        uint256 amount;
        uint256 timestamp;
    }
    
    struct UnstakedFromCapsuleLog {
        address staker;
        string capsuleId;
        uint256 amount;
        uint256 timestamp;
    }

    struct PriceUpdatedLog {
        string capsuleId;
        uint256 newPrice;
        uint256 timestamp;
    }

    struct EarningsWithdrawnLog {
        address creator;
        uint256 amount;
        uint256 timestamp;
    }

    struct CapsuleQueriedLog {
        address user;
        string capsuleId;
        uint256 amountPaid;
        uint256 timestamp;
    }

    // Public Arrays for History
    AgentRegisteredLog[] public agentRegisteredHistory;
    CapsuleCreatedLog[] public capsuleCreatedHistory;
    StakedOnCapsuleLog[] public stakedOnCapsuleHistory;
    UnstakedFromCapsuleLog[] public unstakedFromCapsuleHistory;
    PriceUpdatedLog[] public priceUpdatedHistory;
    EarningsWithdrawnLog[] public earningsWithdrawnHistory;
    CapsuleQueriedLog[] public capsuleQueriedHistory;

    // ============================================================================
    // 5. STORAGE MAPPINGS
    // ============================================================================

    // Core Data Lookups (Using Hash Keys for efficiency)
    mapping(bytes32 => Agent) public agents;
    mapping(bytes32 => Capsule) public capsules;
    mapping(bytes32 => Earnings) public earnings;

    // Staking Lookup: CapsuleHash -> UserAddress -> StakeData
    mapping(bytes32 => mapping(address => Staking)) public stakes;

    // Discovery Helper: "What does this user own?"
    mapping(address => string[]) public ownerAgents;
    mapping(address => string[]) public ownerCapsules;

    // ============================================================================
    // 6. EVENTS (For Frontend Listeners)
    // @dev Your frontend should subscribe to these to update the UI in real-time.
    // ============================================================================

    event AgentRegistered(address indexed owner, string agentId);
    event CapsuleCreated(address indexed creator, string capsuleId);
    event StakedOnCapsule(address indexed staker, string capsuleId, uint256 amount);
    event UnstakedFromCapsule(address indexed staker, string capsuleId, uint256 amount);
    event PriceUpdated(string capsuleId, uint256 newPrice);
    event EarningsWithdrawn(address indexed creator, uint256 amount);
    
    // Critical Event: Backend listens to this to verify payment before serving AI response
    event CapsuleQueried(address indexed user, string capsuleId, uint256 amountPaid);

    // ============================================================================
    // 7. CORE FUNCTIONS
    // ============================================================================

    /**
     * @notice Registers a new AI Agent identity.
     * @param _agentId Unique ID for the agent (max 32 chars).
     * @param _name Human readable name.
     * @param _displayName Name shown in UI.
     * @param _platform AI Provider (e.g. "openai").
     */
    function registerAgent(
        string memory _agentId,
        string memory _name,
        string memory _displayName,
        string memory _platform
    ) external {
        // --- Validation ---
        if (bytes(_agentId).length < MIN_STRING_LENGTH) revert EmptyString();
        if (bytes(_name).length < MIN_STRING_LENGTH) revert EmptyString();
        // Gas protection: prevent massive strings
        if (bytes(_agentId).length > 32) revert InvalidMetadataLength();
        if (bytes(_name).length > 128) revert InvalidMetadataLength();

        // --- Key Derivation ---
        // Generates a unique slot based on Owner + ID
        bytes32 agentKey = keccak256(abi.encodePacked(msg.sender, _agentId));
        Agent storage agent = agents[agentKey];
        
        require(!agent.exists, "Agent already exists");

        // --- State Update ---
        agent.owner = msg.sender;
        agent.agentId = _agentId;
        agent.name = _name;
        agent.displayName = _displayName;
        agent.platform = _platform;
        agent.createdAt = block.timestamp;
        agent.reputation = 10000; // Start at 100%
        agent.exists = true;

        // Add to discovery list
        ownerAgents[msg.sender].push(_agentId);

        // --- Logging ---
        emit AgentRegistered(msg.sender, _agentId);
        
        agentRegisteredHistory.push(AgentRegisteredLog({
            owner: msg.sender,
            agentId: _agentId,
            timestamp: block.timestamp
        }));
    }

    /**
     * @notice Creates a new tradable Memory Capsule.
     * @param _capsuleId Unique ID for the capsule.
     * @param _price Price per query in Wei.
     */
    function createCapsule(
        string memory _capsuleId,
        string memory _name,
        string memory _description,
        string memory _category,
        uint256 _price
    ) external {
        if (bytes(_capsuleId).length < MIN_STRING_LENGTH) revert EmptyString();
        if (bytes(_capsuleId).length > 32) revert InvalidMetadataLength();
        if (_price < MIN_PRICE_PER_QUERY) revert InvalidPrice();
        if (_price > MAX_PRICE_PER_QUERY) revert PriceTooHigh();

        bytes32 capsuleKey = keccak256(abi.encodePacked(msg.sender, _capsuleId));
        Capsule storage capsule = capsules[capsuleKey];
        
        require(!capsule.exists, "Capsule already exists");

        capsule.creator = msg.sender;
        capsule.capsuleId = _capsuleId;
        capsule.name = _name;
        capsule.description = _description;
        capsule.category = _category;
        capsule.price = _price;
        capsule.totalStake = 0;
        capsule.earnings=0;
        capsule.createdAt = block.timestamp;
        capsule.updatedAt = block.timestamp;
        capsule.exists = true;

        ownerCapsules[msg.sender].push(_capsuleId);

        emit CapsuleCreated(msg.sender, _capsuleId);

        capsuleCreatedHistory.push(CapsuleCreatedLog({
            creator: msg.sender,
            capsuleId: _capsuleId,
            timestamp: block.timestamp
        }));
    }

    /**
     * @notice Stakes ETH/MNT on a capsule to verify credibility.
     * @dev REQUIREMENT: Only the capsule creator can stake (Self-Staking).
     * @param _capsuleId The ID of the capsule.
     */
    function stake(string memory _capsuleId) external payable {
        uint256 amount = msg.value;

        if (amount < MIN_STAKE_AMOUNT) revert InsufficientPayment();
        if (amount > MAX_STAKE_AMOUNT) revert StakeTooHigh();

        // 1. Identify Capsule
        bytes32 capsuleKey = keccak256(abi.encodePacked(msg.sender, _capsuleId));
        Capsule storage capsule = capsules[capsuleKey];
        
        // 2. Checks
        if (!capsule.exists) revert CapsuleNotFound();
        // Ensure only owner can stake (Requirement #4)
        if (capsule.creator != msg.sender) revert Unauthorized();

        //  struct Staking {
        // uint256 amount;      // Amount currently locked
        // uint256 stakedAt;    // Timestamp of last stake addition
        // uint256 lockUntil;   // Timestamp when funds become withdrawable
        // bool exists;         // Flag for first-time stakers
        // }

        // Staking Lookup: CapsuleHash -> UserAddress -> StakeData
        // mapping(bytes32 => mapping(address => Staking)) public stakes;

        // 3. Update User Stake Record
        Staking storage userStake = stakes[capsuleKey][msg.sender];
        
        if (!userStake.exists) {
            capsule.totalStake += amount;
            userStake.stakedAt = block.timestamp;
            userStake.lockUntil = block.timestamp + LOCK_PERIOD_SECONDS;
            userStake.exists = true;
        } else {
              capsule.totalStake += amount;
            // Extend lock period on new deposit
            userStake.lockUntil = block.timestamp + LOCK_PERIOD_SECONDS;
        }

        // 4. Update Capsule 
        capsule.updatedAt = block.timestamp;

        emit StakedOnCapsule(msg.sender, _capsuleId, amount);

        stakedOnCapsuleHistory.push(StakedOnCapsuleLog({
            staker: msg.sender,
            capsuleId: _capsuleId,
            amount: amount,
            timestamp: block.timestamp
        }));
    }

    /**
     * @notice Unstakes ETH/MNT from a capsule.
     * @dev Checks for lock expiration and sends funds back to user.
     * @param _capsuleId The ID of the capsule.
     * @param _amount Amount to withdraw in Wei.
     */
    function unstake(string memory _capsuleId, uint256 _amount) external {
        if (_amount == 0) revert InsufficientPayment();

        bytes32 capsuleKey = keccak256(abi.encodePacked(msg.sender, _capsuleId));
        Capsule storage capsule = capsules[capsuleKey];
        
        if (!capsule.exists) revert CapsuleNotFound();

        Staking storage userStake = stakes[capsuleKey][msg.sender];

        // 1. Check Balance
        if (!userStake.exists || capsule.totalStake < _amount) {
            revert InsufficientStake();
        }

        // 2. Check Lock Period
        if (block.timestamp < userStake.lockUntil) {
            revert StakeLocked();
        }

        // 3. Update State (Effects before Interaction)
        capsule.totalStake -= _amount;
        capsule.updatedAt = block.timestamp;

        // 4. Send Money (Interaction)
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        if (!success) revert TransferFailed();

        emit UnstakedFromCapsule(msg.sender, _capsuleId, _amount);
        
        unstakedFromCapsuleHistory.push(UnstakedFromCapsuleLog({
            staker: msg.sender,
            capsuleId: _capsuleId,
            amount: _amount,
            timestamp: block.timestamp
        }));
    }

    /**
     * @notice Pay to use a capsule.
     * @dev Funds are held in contract until creator withdraws them.
     */
    function queryCapsule(
        address _creator, 
        string memory _capsuleId
    ) external payable {
        // 1. Identify Capsule using Creator Address + ID
        bytes32 capsuleKey = keccak256(abi.encodePacked(_creator, _capsuleId));
        Capsule storage capsule = capsules[capsuleKey];

        // 2. Validation
        if (!capsule.exists) revert CapsuleNotFound();
        
        uint256 cost = capsule.price;
        if (msg.value < cost) revert InsufficientPayment();

        // 3. Accounting (Credit the creator)
        Earnings storage earningRecord = earnings[capsuleKey];
        capsule.earnings+=cost;
        earningRecord.totalEarnings += cost;
        earningRecord.queryCount += 1;
        earningRecord.lastUpdated = block.timestamp;

        // 4. Refund Excess Payment
        uint256 excess = msg.value - cost;
        if (excess > 0) {
             (bool success, ) = payable(msg.sender).call{value: excess}("");
             if (!success) revert TransferFailed();
        }

        // 5. Emit Event for Off-chain Backend
        emit CapsuleQueried(msg.sender, _capsuleId, cost);

        capsuleQueriedHistory.push(CapsuleQueriedLog({
            user: msg.sender,
            capsuleId: _capsuleId,
            amountPaid: cost,
            timestamp: block.timestamp
        }));
    }

    /**
     * @notice Withdraw accumulated earnings from capsule sales.
     */
    function withdrawEarnings(string memory _capsuleId) external {
        // Only the owner can withdraw, so we derive key using msg.sender
        bytes32 capsuleKey = keccak256(abi.encodePacked(msg.sender, _capsuleId));
        Earnings storage earningRecord = earnings[capsuleKey];
        Capsule storage capsule = capsules[capsuleKey];

        
        uint256 amount = earningRecord.totalEarnings;
        
        if (amount == 0) revert InsufficientPayment(); // "Nothing to withdraw"
        if (address(this).balance < amount) revert TransferFailed(); // Safety check

        // Reset balance BEFORE transfer to prevent re-entrancy
        earningRecord.totalEarnings = 0;
        capsule.earnings=0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();

        emit EarningsWithdrawn(msg.sender, amount);

        earningsWithdrawnHistory.push(EarningsWithdrawnLog({
            creator: msg.sender,
            amount: amount,
            timestamp: block.timestamp
        }));
    }

    /**
     * @notice Update price per query.
     */
    function updateCapsulePrice(string memory _capsuleId, uint256 _newPrice) external {
        if (_newPrice < MIN_PRICE_PER_QUERY) revert InvalidPrice();
        if (_newPrice > MAX_PRICE_PER_QUERY) revert PriceTooHigh();
        
        bytes32 capsuleKey = keccak256(abi.encodePacked(msg.sender, _capsuleId));
        Capsule storage capsule = capsules[capsuleKey];
        
        if (!capsule.exists) revert CapsuleNotFound();
        if(msg.sender!=capsule.creator) revert Unauthorized();
        capsule.price = _newPrice;
        capsule.updatedAt = block.timestamp;

        emit PriceUpdated(_capsuleId, _newPrice);

        priceUpdatedHistory.push(PriceUpdatedLog({
            capsuleId: _capsuleId,
            newPrice: _newPrice,
            timestamp: block.timestamp
        }));
    }

    // ============================================================================
    // 8. VIEW FUNCTIONS
    // ============================================================================

    function getAgentsByOwner(address _owner) external view returns (string[] memory) {
        return ownerAgents[_owner];
    }

    function getCapsulesByOwner(address _owner) external view returns (string[] memory) {
        return ownerCapsules[_owner];
    }
    /**
     * @notice Helper to get full Agent details using just strings (no hashing needed on frontend)
     */
    function getAgentDetails(address _owner, string memory _agentId) external view returns (Agent memory) {
        bytes32 key = keccak256(abi.encodePacked(_owner, _agentId));
        return agents[key];
    }

    /**
     * @notice Helper to get full Capsule details using just strings
     */
    function getCapsuleDetails(address _creator, string memory _capsuleId) external view returns (Capsule memory) {
        bytes32 key = keccak256(abi.encodePacked(_creator, _capsuleId));
        return capsules[key];
    }

    /**
     * @notice Helper to get Staking details for a specific user on a specific capsule
     */
    function getStakeDetails(address _creator, string memory _capsuleId, address _staker) external view returns (Staking memory) {
        bytes32 key = keccak256(abi.encodePacked(_creator, _capsuleId));
        return stakes[key][_staker];
    }

    /**
     * @notice Returns ALL created capsules logs in one request.
     * @dev WARNING: Use pagination in production if this array gets massive (>2000 items).
     * For an MVP, this is fine and allows you to build an "Explore" feed easily.
     */
    function getAllCapsuleLogs() external view returns (CapsuleCreatedLog[] memory) {
        return capsuleCreatedHistory;
    }

    /**
     * @notice Returns ALL registered agents logs in one request.
     */
    function getAllAgentLogs() external view returns (AgentRegisteredLog[] memory) {
        return agentRegisteredHistory;
    }
    
    /**
     * @notice Returns a detailed list of capsules owned by a user (Structs, not just IDs)
     * @dev This saves the frontend from looping through IDs and fetching details one by one.
     */
    function getCapsulesByOwnerDetailed(address _owner) external view returns (Capsule[] memory) {
        string[] memory ids = ownerCapsules[_owner];
        Capsule[] memory details = new Capsule[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            bytes32 key = keccak256(abi.encodePacked(_owner, ids[i]));
            details[i] = capsules[key];
        }

        return details;
    }
    function getAgentsByOwnerDetailed(address _owner) external view returns (Agent[] memory) {
        string[] memory ids = ownerAgents[_owner];
        Agent[] memory details = new Agent[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            bytes32 key = keccak256(abi.encodePacked(_owner, ids[i]));
            details[i] = agents[key];
        }
        return details;
    }
}