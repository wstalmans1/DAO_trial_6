# Solidity API

## Box

A simple contract that stores a value and can only be changed by its owner.

_This is our "target contract" for governance proposals.
     The Governor will become the owner, so only governance proposals can change the value.
     This demonstrates how a DAO can control smart contract state through voting._

### ValueChanged

```solidity
event ValueChanged(uint256 newValue)
```

### constructor

```solidity
constructor(address initialOwner) public
```

_Constructor sets the initial owner (will be the Governor contract)_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| initialOwner | address | The address that can call store() - should be the Governor |

### store

```solidity
function store(uint256 newValue) public
```

Store a new value in the box

_Only the owner (Governor) can call this_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newValue | uint256 | The new value to store |

### retrieve

```solidity
function retrieve() public view returns (uint256)
```

Retrieve the stored value

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The current value in the box |

