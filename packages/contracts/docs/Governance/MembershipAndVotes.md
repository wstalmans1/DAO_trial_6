# Solidity API

## MembershipAndVotes

Single-contract membership registry that implements IVotes via OpenZeppelin Votes

_Implements 1 person, 1 vote with checkpointed history for Governor compatibility_

### totalMembers

```solidity
uint256 totalMembers
```

### MemberAdded

```solidity
event MemberAdded(address account, uint256 newTotalMembers)
```

### MemberRemoved

```solidity
event MemberRemoved(address account, uint256 newTotalMembers)
```

### constructor

```solidity
constructor(address initialOwner) public
```

### addMember

```solidity
function addMember(address account) external
```

### removeMember

```solidity
function removeMember(address account) external
```

### isMember

```solidity
function isMember(address account) external view returns (bool)
```

### _getVotingUnits

```solidity
function _getVotingUnits(address account) internal view returns (uint256)
```

