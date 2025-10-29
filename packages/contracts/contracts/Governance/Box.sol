// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Box
 * @notice A simple contract that stores a value and can only be changed by its owner.
 * @dev This is our "target contract" for governance proposals.
 *      The Governor will become the owner, so only governance proposals can change the value.
 *      This demonstrates how a DAO can control smart contract state through voting.
 */
contract Box is Ownable {
    // The stored value - this is what governance proposals will modify
    uint256 private _value;

    // Event emitted when the value changes (useful for tracking governance actions)
    event ValueChanged(uint256 newValue);

    /**
     * @dev Constructor sets the initial owner (will be the Governor contract)
     * @param initialOwner The address that can call store() - should be the Governor
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Store a new value in the box
     * @dev Only the owner (Governor) can call this
     * @param newValue The new value to store
     */
    function store(uint256 newValue) public onlyOwner {
        _value = newValue;
        emit ValueChanged(newValue);
    }

    /**
     * @notice Retrieve the stored value
     * @return The current value in the box
     */
    function retrieve() public view returns (uint256) {
        return _value;
    }
}

