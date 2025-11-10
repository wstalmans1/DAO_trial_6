# Votes.sol Function Analysis: How Everything Relates to `_delegateCheckpoints`

## The Central Mapping

```solidity
mapping(address delegatee => Checkpoints.Trace208) private _delegateCheckpoints;
```

**This is indeed the epicenter!** Every function either:
1. **Reads from** `_delegateCheckpoints` (query voting power)
2. **Writes to** `_delegateCheckpoints` (update voting power)
3. **Supports** reading/writing (helper functions)

---

## Function Categories

### 📖 **READ Functions** (Query `_delegateCheckpoints`)

#### 1. `getVotes(address account)` - Lines 86-88
```solidity
function getVotes(address account) public view virtual returns (uint256) {
    return _delegateCheckpoints[account].latest();
}
```
**Relationship**: 
- **Direct read** from `_delegateCheckpoints[account]`
- Returns the **latest** (most recent) voting power for a delegatee
- **Purpose**: "How many votes does this delegatee have right now?"

**Example**: 
- `_delegateCheckpoints[Alice]` = `[{block: 100, votes: 50}, {block: 200, votes: 100}]`
- `getVotes(Alice)` → returns `100` (latest checkpoint)

---

#### 2. `getPastVotes(address account, uint256 timepoint)` - Lines 98-100
```solidity
function getPastVotes(address account, uint256 timepoint) public view virtual returns (uint256) {
    return _delegateCheckpoints[account].upperLookupRecent(_validateTimepoint(timepoint));
}
```
**Relationship**: 
- **Direct read** from `_delegateCheckpoints[account]`
- Uses `upperLookupRecent()` to find voting power at a **specific past block**
- **Purpose**: "How many votes did this delegatee have at block X?" (for proposal snapshots)

**Example**:
- `_delegateCheckpoints[Alice]` = `[{block: 100, votes: 50}, {block: 200, votes: 100}]`
- `getPastVotes(Alice, 150)` → returns `50` (checkpoint at block 100, which is ≤ 150)
- `getPastVotes(Alice, 250)` → returns `100` (checkpoint at block 200, which is ≤ 250)

**Why this matters**: Governor needs to know voting power at the **proposal creation block**, not current block!

---

#### 3. `_numCheckpoints(address account)` - Lines 218-220
```solidity
function _numCheckpoints(address account) internal view virtual returns (uint32) {
    return SafeCast.toUint32(_delegateCheckpoints[account].length());
}
```
**Relationship**: 
- **Direct read** from `_delegateCheckpoints[account]`
- Returns how many checkpoints exist for this delegatee
- **Purpose**: "How many times has this delegatee's voting power changed?"

**Example**:
- `_delegateCheckpoints[Alice]` = `[{block: 100, votes: 50}, {block: 200, votes: 100}]`
- `_numCheckpoints(Alice)` → returns `2`

---

#### 4. `_checkpoints(address account, uint32 pos)` - Lines 225-230
```solidity
function _checkpoints(
    address account,
    uint32 pos
) internal view virtual returns (Checkpoints.Checkpoint208 memory) {
    return _delegateCheckpoints[account].at(pos);
}
```
**Relationship**: 
- **Direct read** from `_delegateCheckpoints[account]`
- Returns a **specific checkpoint** by index position
- **Purpose**: "What was the exact checkpoint at position X?"

**Example**:
- `_delegateCheckpoints[Alice]` = `[{block: 100, votes: 50}, {block: 200, votes: 100}]`
- `_checkpoints(Alice, 0)` → returns `{block: 100, votes: 50}`
- `_checkpoints(Alice, 1)` → returns `{block: 200, votes: 100}`

---

### ✏️ **WRITE Functions** (Update `_delegateCheckpoints`)

#### 5. `_moveDelegateVotes(address from, address to, uint256 amount)` - Lines 194-213
```solidity
function _moveDelegateVotes(address from, address to, uint256 amount) internal virtual {
    if (from != to && amount > 0) {
        if (from != address(0)) {
            (uint256 oldValue, uint256 newValue) = _push(
                _delegateCheckpoints[from],  // ← WRITES HERE
                _subtract,
                SafeCast.toUint208(amount)
            );
            emit DelegateVotesChanged(from, oldValue, newValue);
        }
        if (to != address(0)) {
            (uint256 oldValue, uint256 newValue) = _push(
                _delegateCheckpoints[to],    // ← WRITES HERE
                _add,
                SafeCast.toUint208(amount)
            );
            emit DelegateVotesChanged(to, oldValue, newValue);
        }
    }
}
```
**Relationship**: 
- **Direct write** to `_delegateCheckpoints[from]` (subtract votes)
- **Direct write** to `_delegateCheckpoints[to]` (add votes)
- Uses `_push()` to create new checkpoints
- **Purpose**: "Move voting power from one delegatee to another"

**Example**:
- Before: `_delegateCheckpoints[Alice]` = `[{block: 100, votes: 50}]`
- Before: `_delegateCheckpoints[Bob]` = `[{block: 100, votes: 30}]`
- Call: `_moveDelegateVotes(Alice, Bob, 20)` at block 200
- After: `_delegateCheckpoints[Alice]` = `[{block: 100, votes: 50}, {block: 200, votes: 30}]`
- After: `_delegateCheckpoints[Bob]` = `[{block: 100, votes: 30}, {block: 200, votes: 50}]`

**This is THE function that updates `_delegateCheckpoints`!**

---

#### 6. `_delegate(address account, address delegatee)` - Lines 169-175
```solidity
function _delegate(address account, address delegatee) internal virtual {
    address oldDelegate = delegates(account);
    _delegatee[account] = delegatee;

    emit DelegateChanged(account, oldDelegate, delegatee);
    _moveDelegateVotes(oldDelegate, delegatee, _getVotingUnits(account));  // ← Calls _moveDelegateVotes
}
```
**Relationship**: 
- **Indirect write** to `_delegateCheckpoints` via `_moveDelegateVotes()`
- Moves votes from `oldDelegate` to `newDelegate`
- **Purpose**: "Account delegates its voting units to a delegatee"

**Flow**:
1. Get old delegatee (who currently has the votes)
2. Update `_delegatee` mapping
3. Call `_moveDelegateVotes()` → **updates `_delegateCheckpoints`**

**Example**:
- Account A has 100 tokens, currently delegated to Alice
- Call `_delegate(A, Bob)`
- `_moveDelegateVotes(Alice, Bob, 100)` is called
- `_delegateCheckpoints[Alice]` decreases by 100
- `_delegateCheckpoints[Bob]` increases by 100

---

#### 7. `delegate(address delegatee)` - Lines 135-138
```solidity
function delegate(address delegatee) public virtual {
    address account = _msgSender();
    _delegate(account, delegatee);  // ← Calls _delegate
}
```
**Relationship**: 
- **Indirect write** to `_delegateCheckpoints` via `_delegate()` → `_moveDelegateVotes()`
- Public wrapper for `_delegate()`
- **Purpose**: "Public function to delegate your votes"

---

#### 8. `delegateBySig(...)` - Lines 143-162
```solidity
function delegateBySig(...) public virtual {
    // ... signature validation ...
    _delegate(signer, delegatee);  // ← Calls _delegate
}
```
**Relationship**: 
- **Indirect write** to `_delegateCheckpoints` via `_delegate()` → `_moveDelegateVotes()`
- Allows delegation via signature (gasless delegation)
- **Purpose**: "Delegate votes without paying gas (using signature)"

---

#### 9. `_transferVotingUnits(address from, address to, uint256 amount)` - Lines 181-189
```solidity
function _transferVotingUnits(address from, address to, uint256 amount) internal virtual {
    if (from == address(0)) {
        _push(_totalCheckpoints, _add, SafeCast.toUint208(amount));
    }
    if (to == address(0)) {
        _push(_totalCheckpoints, _subtract, SafeCast.toUint208(amount));
    }
    _moveDelegateVotes(delegates(from), delegates(to), amount);  // ← Calls _moveDelegateVotes
}
```
**Relationship**: 
- **Indirect write** to `_delegateCheckpoints` via `_moveDelegateVotes()`
- Called when voting units are transferred (mint/burn/transfer)
- **Purpose**: "Update delegate checkpoints when tokens/membership change"

**Example** (from `MembershipAndVotes.addMember()`):
- `addMember(Alice)` calls `_transferVotingUnits(address(0), Alice, 1)`
- This calls `_moveDelegateVotes(delegates(0), delegates(Alice), 1)`
- Since `delegates(Alice)` = Alice (auto-delegated), `_delegateCheckpoints[Alice]` increases by 1

---

### 🔧 **SUPPORT Functions** (Helper functions for reading/writing)

#### 10. `_push(...)` - Lines 232-238
```solidity
function _push(
    Checkpoints.Trace208 storage store,  // ← This is _delegateCheckpoints[delegatee]
    function(uint208, uint208) view returns (uint208) op,
    uint208 delta
) private returns (uint208 oldValue, uint208 newValue) {
    return store.push(clock(), op(store.latest(), delta));
}
```
**Relationship**: 
- **Direct write** to `_delegateCheckpoints` (via the `store` parameter)
- Creates a new checkpoint with current block number
- **Purpose**: "Add a new checkpoint entry"

**How it works**:
- Gets latest value: `store.latest()` (e.g., 50 votes)
- Applies operation: `op(50, delta)` (e.g., `_add(50, 20)` = 70)
- Creates checkpoint: `store.push(blockNumber, 70)`
- Result: New entry `{block: currentBlock, votes: 70}` added to `_delegateCheckpoints[delegatee]`

**Called by**: `_moveDelegateVotes()` (lines 197-198, 205-206)

---

#### 11. `_add(uint208 a, uint208 b)` - Lines 240-242
```solidity
function _add(uint208 a, uint208 b) private pure returns (uint208) {
    return a + b;
}
```
**Relationship**: 
- **Support function** for `_push()` when adding votes
- Used in `_moveDelegateVotes()` when `to != address(0)`
- **Purpose**: "Calculate new voting power when adding"

---

#### 12. `_subtract(uint208 a, uint208 b)` - Lines 244-246
```solidity
function _subtract(uint208 a, uint208 b) private pure returns (uint208) {
    return a - b;
}
```
**Relationship**: 
- **Support function** for `_push()` when subtracting votes
- Used in `_moveDelegateVotes()` when `from != address(0)`
- **Purpose**: "Calculate new voting power when subtracting"

---

#### 13. `clock()` - Lines 58-60
```solidity
function clock() public view virtual returns (uint48) {
    return Time.blockNumber();
}
```
**Relationship**: 
- **Support function** for `_push()` (provides block number for checkpoints)
- Used when creating new checkpoints in `_delegateCheckpoints`
- **Purpose**: "Get current block number for checkpoint timestamp"

---

#### 14. `_validateTimepoint(uint256 timepoint)` - Lines 77-81
```solidity
function _validateTimepoint(uint256 timepoint) internal view returns (uint48) {
    uint48 currentTimepoint = clock();
    if (timepoint >= currentTimepoint) revert ERC5805FutureLookup(timepoint, currentTimepoint);
    return SafeCast.toUint48(timepoint);
}
```
**Relationship**: 
- **Support function** for `getPastVotes()` (line 99)
- Ensures we can't query future blocks (checkpoints don't exist yet)
- **Purpose**: "Validate that we're querying a past block"

---

#### 15. `delegates(address account)` - Lines 128-130
```solidity
function delegates(address account) public view virtual returns (address) {
    return _delegatee[account];
}
```
**Relationship**: 
- **Support function** for `_transferVotingUnits()` (line 188)
- Returns who an account has delegated to
- **Purpose**: "Find which delegatee to update in `_delegateCheckpoints`"

**Example**:
- `delegates(Alice)` → returns `Bob`
- When Alice's tokens change, we update `_delegateCheckpoints[Bob]` (not Alice!)

---

#### 16. `_getVotingUnits(address)` - Line 251
```solidity
function _getVotingUnits(address) internal view virtual returns (uint256);
```
**Relationship**: 
- **Support function** for `_delegate()` (line 174)
- Returns how many voting units an account owns
- **Purpose**: "Determine how much voting power to move"

**Example**:
- `_getVotingUnits(Alice)` → returns `100` (Alice owns 100 tokens)
- When Alice delegates, we move 100 votes to her delegatee

---

### 📊 **TOTAL SUPPLY Functions** (Related but separate)

#### 17. `getPastTotalSupply(uint256 timepoint)` - Lines 114-116
```solidity
function getPastTotalSupply(uint256 timepoint) public view virtual returns (uint256) {
    return _totalCheckpoints.upperLookupRecent(_validateTimepoint(timepoint));
}
```
**Relationship**: 
- **NOT directly related** to `_delegateCheckpoints`
- Uses `_totalCheckpoints` (separate mapping for total supply)
- **Purpose**: "Get total voting units at a past block" (for quorum calculations)

**Note**: This is separate from `_delegateCheckpoints` because:
- `_delegateCheckpoints` = per-delegatee voting power
- `_totalCheckpoints` = total supply of all voting units

---

#### 18. `_getTotalSupply()` - Lines 121-123
```solidity
function _getTotalSupply() internal view virtual returns (uint256) {
    return _totalCheckpoints.latest();
}
```
**Relationship**: 
- **NOT directly related** to `_delegateCheckpoints`
- Uses `_totalCheckpoints` (separate mapping)

---

## Summary: Function Relationships

### Direct Reads from `_delegateCheckpoints`:
1. ✅ `getVotes()` - Read latest
2. ✅ `getPastVotes()` - Read historical
3. ✅ `_numCheckpoints()` - Read count
4. ✅ `_checkpoints()` - Read specific checkpoint

### Direct Writes to `_delegateCheckpoints`:
5. ✅ `_moveDelegateVotes()` - **THE MAIN WRITE FUNCTION**
6. ✅ `_push()` - Creates checkpoints (called by `_moveDelegateVotes`)

### Indirect Writes (call `_moveDelegateVotes`):
7. ✅ `_delegate()` - Delegation logic
8. ✅ `delegate()` - Public delegation
9. ✅ `delegateBySig()` - Signature delegation
10. ✅ `_transferVotingUnits()` - Token/membership transfers

### Support Functions:
11. ✅ `_add()` - Math helper
12. ✅ `_subtract()` - Math helper
13. ✅ `clock()` - Block number for checkpoints
14. ✅ `_validateTimepoint()` - Validation for historical queries
15. ✅ `delegates()` - Find delegatee
16. ✅ `_getVotingUnits()` - Get voting units to move

### Not Related (uses `_totalCheckpoints` instead):
17. ⚠️ `getPastTotalSupply()` - Total supply, not per-delegatee
18. ⚠️ `_getTotalSupply()` - Total supply, not per-delegatee

---

## The Complete Flow

### When a vote is delegated:
```
delegate(Alice, Bob)
  ↓
_delegate(Alice, Bob)
  ↓
_moveDelegateVotes(oldDelegate, Bob, 100)
  ↓
_push(_delegateCheckpoints[oldDelegate], _subtract, 100)  ← WRITE
_push(_delegateCheckpoints[Bob], _add, 100)              ← WRITE
```

### When voting units are transferred:
```
_transferVotingUnits(from, to, amount)
  ↓
_moveDelegateVotes(delegates(from), delegates(to), amount)
  ↓
_push(_delegateCheckpoints[...], ...)  ← WRITE
```

### When querying voting power:
```
getVotes(Alice)
  ↓
_delegateCheckpoints[Alice].latest()  ← READ
```

---

## Key Insight

**Every function that modifies voting power eventually calls `_moveDelegateVotes()`, which directly writes to `_delegateCheckpoints`.**

**Every function that queries voting power directly reads from `_delegateCheckpoints`.**

This is why `_delegateCheckpoints` is truly the epicenter! 🎯


