// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

/**
 * @title MyToken20
 * @notice A voting token that implements ERC20Votes for governance
 * @dev This token adds voting power tracking on top of standard ERC20
 * 
 * KEY CONCEPTS:
 * 1. ERC20Votes adds "checkpoints" - snapshots of voting power at specific blocks
 * 2. Delegation is MANDATORY - you must delegate to yourself or others to vote
 * 3. Voting power = balance at the time of proposal creation (snapshot)
 * 4. Past voting power is immutable - changes after snapshot don't affect old proposals
 */
contract MyToken20 is ERC20, ERC20Permit, ERC20Votes {
    /**
     * @dev Constructor sets up the token with name, symbol, and initial supply
     * @param name Token name (e.g., "MyDAO Token")
     * @param symbol Token symbol (e.g., "MDT")
     * @param initialSupply Initial token supply to mint
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) ERC20Permit(name) {
        // Mint initial supply to the deployer
        _mint(msg.sender, initialSupply);
    }

    /**
     * @dev Override required by ERC20Votes
     * This function is called whenever tokens are transferred or minted/burned
     * It updates the voting power checkpoints for both sender and receiver
     * 
     * WHY THIS MATTERS:
     * - When you transfer tokens, your voting power decreases
     * - When you receive tokens, your voting power increases
     * - These changes are recorded in checkpoints for historical lookups
     * - The Governor uses these checkpoints to determine voting power at proposal time
     */
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        // Call parent implementations to handle both ERC20 and ERC20Votes logic
        super._update(from, to, value);
    }

    /**
     * @dev Override required by ERC20Votes
     * This function returns the current voting power of an account
     * 
     * HOW IT WORKS:
     * - If you've delegated to yourself: returns your current balance
     * - If you've delegated to someone else: returns 0 (they get your votes)
     * - If you haven't delegated: returns 0 (you can't vote!)
     */
    function _getVotingUnits(address account) internal view override returns (uint256) {
        return balanceOf(account);
    }

    /**
     * @dev Override required due to multiple inheritance from ERC20Permit and ERC20Votes
     * Both define nonces() function, so we need to specify which one to use
     */
    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }

    /**
     * @notice Mint new tokens (only for testing/demo purposes)
     * @dev In production, you'd want access control here
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Burn tokens (only for testing/demo purposes)
     * @dev In production, you'd want access control here
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}
