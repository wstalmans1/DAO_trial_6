# High-Level Architecture: Voting Power Flow

## Your Understanding is Correct! ✅

Yes, you've got it right! Here's the complete picture:

---

## The Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: Voting Units Source                                │
│  (Delivers voting units to Votes.sol)                       │
│                                                              │
│  Examples:                                                   │
│  • MembershipAndVotes: "1 person = 1 vote"                  │
│  • MyToken20 (ERC20Votes): "1 token = 1 vote"               │
│                                                              │
│  Key Function:                                               │
│  - _getVotingUnits(account) → returns voting units         │
│  - _transferVotingUnits() → updates when units change       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ "Delivers voting units"
                       │ "Calls _transferVotingUnits()"
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: Votes.sol (Archive/Storage)                       │
│  (Stores voting power in checkpoints)                       │
│                                                              │
│  Central Mapping:                                            │
│  _delegateCheckpoints[delegatee] → Checkpoints.Trace208    │
│                                                              │
│  Key Functions:                                              │
│  - getVotes(account) → current voting power                 │
│  - getPastVotes(account, block) → historical voting power  │
│  - _moveDelegateVotes() → updates checkpoints               │
│                                                              │
│  Purpose:                                                    │
│  • Tracks voting power over time (checkpoints)              │
│  • Handles delegation (who votes for whom)                 │
│  • Provides historical lookups (for proposal snapshots)    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ "Queries voting power"
                       │ "Calls getVotes() / getPastVotes()"
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: Governor (Proposal Management)                    │
│  (Manages proposals and voting)                             │
│                                                              │
│  Key Functions:                                              │
│  - propose() → checks voting power (proposal threshold)     │
│  - castVote() → uses voting power to vote                   │
│  - execute() → executes successful proposals                │
│                                                              │
│  Purpose:                                                    │
│  • Creates proposals                                         │
│  • Manages voting period                                    │
│  • Counts votes                                             │
│  • Executes proposals                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Detailed Flow

### Step 1: Voting Units Source Creates Units

**MembershipAndVotes Example:**
```solidity
// When a member is added
addMember(Alice) {
    _isMember[Alice] = true;
    totalMembers += 1;
    
    // Mint 1 voting unit (from address(0))
    _transferVotingUnits(address(0), Alice, 1);  // ← Calls Votes.sol
    
    // Delegate to self
    _delegate(Alice, Alice);  // ← Calls Votes.sol
}
```

**MyToken20 Example:**
```solidity
// When tokens are transferred
_update(from, to, amount) {
    // ERC20 transfer logic
    super._update(from, to, amount);
    
    // ERC20Votes automatically calls:
    // _transferVotingUnits(from, to, amount)  // ← Calls Votes.sol
}
```

---

### Step 2: Votes.sol Archives Voting Power

**What happens inside Votes.sol:**

```solidity
// When _transferVotingUnits() is called
_transferVotingUnits(address(0), Alice, 1) {
    // Update total supply checkpoint
    _push(_totalCheckpoints, _add, 1);
    
    // Move votes to delegatee
    _moveDelegateVotes(
        delegates(address(0)),  // = address(0)
        delegates(Alice),       // = Alice (delegated to self)
        1
    );
}

// Inside _moveDelegateVotes()
_moveDelegateVotes(address(0), Alice, 1) {
    // Add checkpoint for Alice
    _push(_delegateCheckpoints[Alice], _add, 1);  // ← WRITES HERE!
    
    // Result: _delegateCheckpoints[Alice] = [{block: 100, votes: 1}]
}
```

**Result:**
- `_delegateCheckpoints[Alice]` now contains: `[{block: 100, votes: 1}]`
- Voting power is **archived** in checkpoints

---

### Step 3: Governor Queries Voting Power

**When creating a proposal:**

```solidity
// Inside Governor.propose()
propose(targets, values, calldatas, description) {
    // Check if proposer has enough voting power
    uint256 proposerVotes = votingPowerSource.getVotes(proposer);  // ← READS FROM Votes.sol
    
    require(proposerVotes >= proposalThreshold, "Insufficient voting power");
    
    // Get voting power at current block (for snapshot)
    uint256 snapshot = block.number;
    
    // Create proposal...
}
```

**When voting:**

```solidity
// Inside Governor.castVote()
castVote(proposalId, support) {
    // Get voting power at proposal snapshot block
    uint256 votingPower = votingPowerSource.getPastVotes(
        voter, 
        proposal.snapshot  // ← READS FROM Votes.sol (historical lookup)
    );
    
    require(votingPower > 0, "No voting power");
    
    // Record vote...
}
```

**When checking quorum:**

```solidity
// Inside Governor._quorumReached()
_quorumReached(proposalId) {
    // Get total supply at proposal snapshot
    uint256 totalSupply = votingPowerSource.getPastTotalSupply(
        proposal.snapshot  // ← READS FROM Votes.sol
    );
    
    // Calculate quorum (e.g., 4% of total)
    uint256 requiredQuorum = (totalSupply * quorumFraction) / 100;
    
    // Check if votes cast >= quorum
    return (forVotes + abstainVotes >= requiredQuorum);
}
```

---

## Complete Example Flow

### Scenario: Alice wants to create a proposal

**1. Alice is added as member:**
```
MembershipAndVotes.addMember(Alice)
  ↓
_transferVotingUnits(address(0), Alice, 1)
  ↓
Votes.sol: _moveDelegateVotes(address(0), Alice, 1)
  ↓
Votes.sol: _push(_delegateCheckpoints[Alice], _add, 1)
  ↓
Result: _delegateCheckpoints[Alice] = [{block: 100, votes: 1}]
```

**2. Alice creates a proposal:**
```
Governor.propose(...)
  ↓
Governor checks: votingPowerSource.getVotes(Alice)
  ↓
Votes.sol: _delegateCheckpoints[Alice].latest() → returns 1
  ↓
Governor: 1 >= proposalThreshold (1) ✅
  ↓
Proposal created with snapshot = block 200
```

**3. Alice votes on her proposal:**
```
Governor.castVote(proposalId, 1)  // 1 = For
  ↓
Governor checks: votingPowerSource.getPastVotes(Alice, block 200)
  ↓
Votes.sol: _delegateCheckpoints[Alice].upperLookupRecent(200)
  ↓
Votes.sol: Returns 1 (voting power at block 200)
  ↓
Governor: Records 1 vote For
```

**4. Proposal execution:**
```
Governor.execute(proposalId)
  ↓
Governor checks: _quorumReached(proposalId)
  ↓
Governor: votingPowerSource.getPastTotalSupply(block 200)
  ↓
Votes.sol: _totalCheckpoints.upperLookupRecent(200) → returns 1
  ↓
Governor: Quorum = 1 * 4% / 100 = 0.04 → rounds to 1
  ↓
Governor: forVotes (1) >= quorum (1) ✅
  ↓
Proposal executed!
```

---

## Key Insights

### 1. **Separation of Concerns**

- **Voting Units Source** (`MembershipAndVotes` / `MyToken20`):
  - Defines **what** gives voting power (membership vs tokens)
  - Manages the **source** of voting units
  - Calls `_transferVotingUnits()` when units change

- **Votes.sol**:
  - **Archives** voting power in checkpoints
  - Handles **delegation** (who votes for whom)
  - Provides **historical lookups** (for proposal snapshots)
  - **Never** creates voting units (only stores them)

- **Governor**:
  - **Queries** voting power from Votes.sol
  - Manages **proposal lifecycle**
  - **Never** modifies voting power (only reads it)

### 2. **Why This Architecture?**

✅ **Flexibility**: Governor works with ANY `IVotes` contract
- Token-based voting? Use `ERC20Votes`
- Membership-based? Use `MembershipAndVotes`
- Custom logic? Implement `IVotes` interface

✅ **Security**: Historical checkpoints prevent flash loan attacks
- Voting power is snapshotted at proposal creation
- Can't manipulate voting power after proposal is created

✅ **Modularity**: Each layer has a single responsibility
- Easy to understand
- Easy to test
- Easy to modify

### 3. **The Interface: IVotes**

All three layers communicate via the `IVotes` interface:

```solidity
interface IVotes {
    function getVotes(address account) external view returns (uint256);
    function getPastVotes(address account, uint256 blockNumber) external view returns (uint256);
    function getPastTotalSupply(uint256 blockNumber) external view returns (uint256);
    function delegates(address account) external view returns (address);
    function delegate(address delegatee) external;
}
```

- **Voting Units Source** implements `IVotes` (via `Votes` base contract)
- **Governor** queries `IVotes` (doesn't care about implementation)

---

## Summary

**Your understanding is 100% correct!**

1. ✅ **Voting Units Source** (`MembershipAndVotes` / `MyToken20`) delivers voting units to Votes.sol
2. ✅ **Votes.sol** archives/stores voting power in `_delegateCheckpoints`
3. ✅ **Governor** queries voting power from Votes.sol to manage proposals

The flow is:
```
Voting Units Source → Votes.sol (archive) → Governor (query)
```

This is a clean, modular architecture! 🎯

