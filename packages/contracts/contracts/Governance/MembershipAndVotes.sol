// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Votes} from "@openzeppelin/contracts/governance/utils/Votes.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title MembershipAndVotes
 * @notice Single-contract membership registry that implements IVotes via OpenZeppelin Votes
 * @dev Implements 1 person, 1 vote with checkpointed history for Governor compatibility
 */
contract MembershipAndVotes is Ownable, Votes {
    // Tracks whether an address is a member
    mapping(address => bool) private _isMember;

    // Total number of members (also equals total voting units)
    uint256 public totalMembers;

    event MemberAdded(address indexed account, uint256 newTotalMembers);
    event MemberRemoved(address indexed account, uint256 newTotalMembers);

    constructor(address initialOwner) Ownable(initialOwner) EIP712("MembershipAndVotes", "1") {
    }

    // -------------------------
    // Membership management
    // -------------------------

    function addMember(address account) external onlyOwner {
        require(account != address(0), "Invalid account");
        require(!_isMember[account], "Already member");

        _isMember[account] = true;
        totalMembers += 1;

        // Mint 1 voting unit to the new member (from address(0))
        _transferVotingUnits(address(0), account, 1);
        
        // CRITICAL: Delegate to self so votes are counted
        // Without delegation, _getVotingUnits returns 1 but checkpoints aren't updated
        // because _transferVotingUnits calls _moveDelegateVotes with delegates(account)
        // which is address(0) until delegation happens
        if (delegates(account) == address(0)) {
            _delegate(account, account);
        }

        emit MemberAdded(account, totalMembers);
    }

    function removeMember(address account) external onlyOwner {
        require(_isMember[account], "Not a member");

        _isMember[account] = false;
        totalMembers -= 1;

        // Burn 1 voting unit from the member (to address(0))
        _transferVotingUnits(account, address(0), 1);

        emit MemberRemoved(account, totalMembers);
    }

    function isMember(address account) external view returns (bool) {
        return _isMember[account];
    }

    // -------------------------
    // Votes overrides
    // -------------------------

    // Define how many voting units an account has (1 if member, else 0)
    function _getVotingUnits(address account) internal view override returns (uint256) {
        return _isMember[account] ? 1 : 0;
    }
}
