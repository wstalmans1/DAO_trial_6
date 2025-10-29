# Solidity API

## MyToken20

A voting token that implements ERC20Votes for governance

_This token adds voting power tracking on top of standard ERC20

KEY CONCEPTS:
1. ERC20Votes adds "checkpoints" - snapshots of voting power at specific blocks
2. Delegation is MANDATORY - you must delegate to yourself or others to vote
3. Voting power = balance at the time of proposal creation (snapshot)
4. Past voting power is immutable - changes after snapshot don't affect old proposals_

### constructor

```solidity
constructor(string name, string symbol, uint256 initialSupply) public
```

_Constructor sets up the token with name, symbol, and initial supply_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | string | Token name (e.g., "MyDAO Token") |
| symbol | string | Token symbol (e.g., "MDT") |
| initialSupply | uint256 | Initial token supply to mint |

### _update

```solidity
function _update(address from, address to, uint256 value) internal
```

_Override required by ERC20Votes
This function is called whenever tokens are transferred or minted/burned
It updates the voting power checkpoints for both sender and receiver

WHY THIS MATTERS:
- When you transfer tokens, your voting power decreases
- When you receive tokens, your voting power increases
- These changes are recorded in checkpoints for historical lookups
- The Governor uses these checkpoints to determine voting power at proposal time_

### _getVotingUnits

```solidity
function _getVotingUnits(address account) internal view returns (uint256)
```

_Override required by ERC20Votes
This function returns the current voting power of an account

HOW IT WORKS:
- If you've delegated to yourself: returns your current balance
- If you've delegated to someone else: returns 0 (they get your votes)
- If you haven't delegated: returns 0 (you can't vote!)_

### nonces

```solidity
function nonces(address owner) public view returns (uint256)
```

_Override required due to multiple inheritance from ERC20Permit and ERC20Votes
Both define nonces() function, so we need to specify which one to use_

### mint

```solidity
function mint(address to, uint256 amount) external
```

Mint new tokens (only for testing/demo purposes)

_In production, you'd want access control here_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | Address to mint tokens to |
| amount | uint256 | Amount of tokens to mint |

### burn

```solidity
function burn(address from, uint256 amount) external
```

Burn tokens (only for testing/demo purposes)

_In production, you'd want access control here_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | Address to burn tokens from |
| amount | uint256 | Amount of tokens to burn |

