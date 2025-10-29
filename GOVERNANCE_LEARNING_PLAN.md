

# Governance Learning Path (Hardhat, IVotes/Votes first, Membership → Governor)

### Phase 0 — Workspace readiness (Hardhat)

- Use existing `packages/contracts` Hardhat project; TS scripts/tests.
- Confirm network/EVM config in `hardhat.config.ts`.

### Phase 1 — Minimal Governor + ERC20Votes (no timelock)

- Create minimal `ERC20Votes` token (checkpoints, delegation).
- Implement `Governor` with basic settings: `votingDelay`, `votingPeriod`, `GovernorVotesQuorumFraction`, `proposalThreshold`.
- Wire Governor to token (`IVotes` constructor).
- Exercise: mint, delegate, propose, vote, execute a simple `Box` target.
- Tests: proposal lifecycle (Pending → Active → Succeeded → Executed).

### Phase 2 — IVotes and Votes deep dive (core learning focus)

- Map Governor snapshot reads to `IVotes` calls: `getVotes`, `getPastVotes`, `getPastTotalSupply`.
- Explore `Votes` base internals: checkpoints, delegation, move delegates, supply checkpoints.
- Validate `COUNTING_MODE` via `GovernorCountingSimple`; edge cases around snapshot boundaries.
- Tests: delegation changes, past vs current votes, quorum from `getPastTotalSupply`.

### Phase 3 — Custom membership registry powering Governor (primary goal)

- Build `MemberRegistry` (owner-controlled add/remove; emits events; optional single-membership invariant).
- Implement `VotesAdapter` that wraps registry and implements `IVotes` using OZ `Votes` checkpoints:
- `getVotes`, `getPastVotes`, `getPastTotalSupply`, and delegation (optional: 1:1 address vote power).
- Hooks to update checkpoints on add/remove (and optional pause/ban semantics).
- Deploy Governor pointing to adapter (not a token). Show proposals using membership-based voting.
- Tests: add/remove members affects future votes not past; quorum computed from adapter total supply; delegation behavior if included.

### Phase 4 — Optional enhancements: ERC721Votes or SBT

- Option A: ERC721Votes (transferable) as an alternate IVotes source; compare to adapter.
- Option B: SBT (non-transferable ERC721Votes) for 1-person-1-vote; enforce one token per address.
- Tests: transfers (A) vs reverts (B); snapshot stability.

### Phase 5 — Optional: TimelockController integration

- Add `TimelockController` with `GovernorTimelockControl` for queued execution.
- Role hygiene: governor as proposer, open/allowlist executor, revoke admin.
- Tests: queue/execute path.

### Phase 6 — Advanced topics and hardening

- Parameter tuning: quorum (fraction vs absolute), thresholds, delays/periods.
- Batched proposals; proposal types (multi-targets/calldatas/values).
- Upgradeability considerations; emergency controls; event indexing for UI.
- Frontend read-only display of proposals and receipts with `viem`.

### Files we will add/touch (indicative)

- `packages/contracts/contracts/Governance/MyToken20.sol`
- `packages/contracts/contracts/Governance/MyGovernor.sol`
- `packages/contracts/contracts/Governance/MemberRegistry.sol`
- `packages/contracts/contracts/Governance/VotesAdapter.sol`
- (optional) `packages/contracts/contracts/Governance/MyToken721(.sol|SBT.sol)`
- `packages/contracts/scripts/deploy-governor-*.ts`
- `packages/contracts/test/governor-*.ts`

### Milestone exercises

- P1: Flip boolean in `Box` via proposal; verify lifecycle.
- P2: Demonstrate `getPastVotes`/`getPastTotalSupply` impact; delegation edge cases.
- P3: Add/remove member; verify voting power and quorum via adapter; past snapshots immutable.
- P4 (opt): Show transfer vs soulbound effects on voting snapshots.
- P5 (opt): Queue+execute via timelock.

### Decision notes

- Governor depends only on `IVotes`; both tokens and adapters work if they implement it correctly.
- Learning centers on `Votes` checkpoints and how Governor queries snapshots, then extends to a custom registry powering those checkpoints.



*************************************************************************
*************************************************************************

# Governance Learning Plan

## Objective
Build a custom membership registry that feeds into OpenZeppelin's Governor for a "1 person, 1 vote" DAO setup.

## Learning Path

### ✅ Phase 1: Minimal Governor + ERC20Votes (COMPLETED)
**Goal**: Deploy and verify the simplest complete governance system

**What was accomplished**:
- ✅ Deployed `Box.sol`, `MyToken20.sol`, and `MyGovernor.sol` to Sepolia
- ✅ Verified contracts on Etherscan and Blockscout
- ✅ Transferred Box ownership to Governor
- ✅ Delegated voting power to deployer
- ✅ Configured voting parameters (delay, period, threshold, quorum)

**Contracts Deployed**:
- Box: `0xF48B6a410bF4C6A8Fe2B587b7BE626f0439f7237`
- MyToken20: `0x8fF0FF3CB9B904E911c0B8E0a5db9cBD6fa036d3`
- MyGovernor: `0xc5A92da165d3d017B13b4428E4d4fd4a59B287c4`

---

### ✅ Phase 2: Understanding Voting Power & Delegation (COMPLETED)
**Goal**: Deep dive into how `IVotes`, `Votes`, `ERC20Votes`, and `Checkpoints` work together

**What was learned**:
- ✅ `_delegateCheckpoints` mapping: `address => Checkpoints.Trace208`
- ✅ `_writeCheckpoint()` adds (delegate, voting power, block number) tuples
- ✅ `_getVotingUnits()` defines voting power logic (typically returns `balanceOf`)
- ✅ `_update()` hook updates checkpoints when balances change
- ✅ `getVotes()` vs `getPastVotes()` - current vs historical voting power
- ✅ Delegation mechanism: tokens can be delegated to self or others
- ✅ Voting power is determined at a specific block (proposal start)

**Key Mental Model**:
1. ERC20 tracks balances
2. ERC20Votes adds checkpoints when balances change
3. Governor queries `getPastVotes()` at proposal start block
4. Delegation determines WHO has the voting power

---

### 🔄 Phase 3: Testing Complete Proposal Lifecycle (IN PROGRESS)
**Goal**: Successfully create, vote on, and execute a governance proposal

**Current Status**:
- ✅ Created proposals successfully on Sepolia
- 🔄 Encountered issues with proposal execution (state/quorum issues)
- 🔄 Need to test full lifecycle (Create → Vote → Execute)

**Next Steps**:
1. **Test proposal flow locally** using a Hardhat node
2. **Debug quorum issues** on Sepolia
3. **Execute at least one successful proposal**

**Technical Details to Test**:
- Proposal creation with correct description hash
- Voting period (7 blocks) and vote casting
- Quorum calculation (4% = 40,000 MDT)
- Proposal state transitions: Pending → Active → Succeeded → Executed
- Execution of the proposal (changing Box value)

---

### ⏳ Phase 4: Advanced Voting Scenarios (TODO)
**Goal**: Explore complex voting patterns

**What to explore**:
- Multiple proposals at once
- Overlapping voting periods
- Failed proposals (Defeated state)
- Quorum changes during voting
- Token transfers during voting period
- Delegation changes impact on voting power

---

### ⏳ Phase 5: Custom Membership Registry (FINAL GOAL)
**Goal**: Build a custom membership registry that feeds into Governor

**What to build**:
- Custom `IVotes`-compatible contract for member registry
- Implement `getVotes()` and `getPastVotes()` for "1 person, 1 vote"
- Replace `MyToken20` with custom registry in `MyGovernor`
- Test that governance works with custom voting power source

**Key Questions to Answer**:
- Can we implement `IVotes` without ERC20?
- How to handle member addition/removal?
- How to handle voting power delegation with membership?
- Should membership be soulbound (SBT)?

---

## Current Blockers

### Issue: Proposal Execution Failing
**Problem**: Proposals created successfully but execution fails
**Possible causes**:
1. Quorum not reached (need 40,000 MDT out of 1,000,000 MDT)
2. Proposal in wrong state (not "Succeeded")
3. Voting period hasn't ended yet
4. Checkpoints not set at correct block numbers

**Investigation needed**:
- Check proposal state: `await governor.state(proposalId)`
- Check quorum reached: `await governor._quorumReached(proposalId)`
- Check vote succeeded: `await governor._voteSucceeded(proposalId)`
- Verify voting power at proposal start block

### Recommended Next Steps:
1. **Local testing** - Run full proposal flow on local Hardhat node
2. **Debug script** - Create script to check all proposal conditions
3. **Simulate execution** - Use `callStatic` to test execution before submitting
4. **Check past voting power** - Verify voting power at historical blocks

---

## Infrastructure & Tools

**Deployment**: Sepolia testnet
**Explorers**: Etherscan and Blockscout
**Scripts**:
- `deploy-governance.ts` - Deploy all contracts
- `create-proposal.ts` - Create and vote on proposals
- `execute-proposal.ts` - Execute proposals
- `test-proposal-flow.ts` - Test complete flow

**Configuration**:
- Voting Delay: 1 block
- Voting Period: 7 blocks
- Proposal Threshold: 1,000 MDT
- Quorum Fraction: 4%

