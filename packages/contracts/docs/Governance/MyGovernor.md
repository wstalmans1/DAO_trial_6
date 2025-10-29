# Solidity API

## MyGovernor

A minimal Governor implementation for DAO governance

_This contract combines multiple Governor extensions to create a complete governance system

INHERITANCE CHAIN EXPLANATION:
1. Governor - Core governance logic (proposal lifecycle, voting, execution)
2. GovernorSettings - Configurable parameters (delays, thresholds)
3. GovernorCountingSimple - Vote counting (for/against/abstain)
4. GovernorVotes - Connects to IVotes token for voting power
5. GovernorVotesQuorumFraction - Quorum as percentage of total supply_

### constructor

```solidity
constructor(string _name, contract IVotes token, uint256 _votingDelay, uint256 _votingPeriod, uint256 _proposalThreshold, uint256 _quorumFraction) public
```

### name

```solidity
function name() public pure returns (string)
```

_Override required by Governor
Returns the name of the governance system_

### votingDelay

```solidity
function votingDelay() public view returns (uint256)
```

_Override required by Governor
Returns the voting delay (blocks to wait before voting starts)

WHY VOTING DELAY MATTERS:
- Prevents flash loan attacks on proposal creation
- Gives time for community to review proposals
- Example: 1 block delay = ~12 seconds on Ethereum_

### votingPeriod

```solidity
function votingPeriod() public view returns (uint256)
```

_Override required by Governor
Returns the voting period (how long voting is open)

WHY VOTING PERIOD MATTERS:
- Must be long enough for community participation
- Too short = rushed decisions, too long = governance paralysis
- Example: 45818 blocks ≈ 1 week on Ethereum_

### proposalThreshold

```solidity
function proposalThreshold() public view returns (uint256)
```

_Override required by Governor
Returns the proposal threshold (minimum voting power to create proposals)

WHY PROPOSAL THRESHOLD MATTERS:
- Prevents spam proposals
- Ensures proposers have skin in the game
- Example: 1000 tokens = need 1000 voting power to propose_

### quorum

```solidity
function quorum(uint256 blockNumber) public view returns (uint256)
```

_Override required by Governor
Returns the quorum required for a proposal to succeed

HOW QUORUM WORKS:
- Quorum = minimum percentage of total supply that must vote
- Calculated as: (total votes cast / total supply) >= quorum fraction
- Example: 4% quorum = at least 4% of total supply must vote
- This is calculated using getPastTotalSupply() at proposal creation time_

### _getVotes

```solidity
function _getVotes(address account, uint256 blockNumber, bytes) internal view returns (uint256)
```

_Override required by Governor
Returns the current voting power of an account

HOW VOTING POWER IS DETERMINED:
- Calls token.getVotes(account) to get current voting power
- This uses the checkpoints from ERC20Votes
- Only accounts with delegated voting power can vote_

### _quorumReached

```solidity
function _quorumReached(uint256 proposalId) internal view returns (bool)
```

_Override required by Governor
Returns the total supply at a specific block

HOW TOTAL SUPPLY IS USED:
- Used to calculate quorum requirements
- Calls token.getPastTotalSupply(blockNumber)
- This uses the supply checkpoints from ERC20Votes_

### COUNTING_MODE

```solidity
function COUNTING_MODE() public pure returns (string)
```

_Override required by Governor
Returns the vote counting mode

COUNTING MODE EXPLANATION:
- "support=for,against,abstain" means:
  - "for" votes count as support
  - "against" votes count as opposition
  - "abstain" votes are neutral (don't count for or against)
- This is defined by GovernorCountingSimple_

### state

```solidity
function state(uint256 proposalId) public view returns (enum IGovernor.ProposalState)
```

_Override required by Governor
Returns the current state of a proposal

PROPOSAL STATES:
- Pending: Proposal created, waiting for voting delay
- Active: Voting is open
- Canceled: Proposal was canceled
- Defeated: Voting ended, didn't reach quorum or majority
- Succeeded: Voting ended, reached quorum and majority
- Queued: Proposal succeeded, waiting for execution delay (if timelock)
- Expired: Proposal expired (if timelock)
- Executed: Proposal was executed_

