// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {GovernorVotesQuorumFraction} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";

/**
 * @title MyGovernor
 * @notice A minimal Governor implementation for DAO governance
 * @dev This contract combines multiple Governor extensions to create a complete governance system
 * 
 * INHERITANCE CHAIN EXPLANATION:
 * 1. Governor - Core governance logic (proposal lifecycle, voting, execution)
 * 2. GovernorSettings - Configurable parameters (delays, thresholds)
 * 3. GovernorCountingSimple - Vote counting (for/against/abstain)
 * 4. GovernorVotes - Connects to IVotes contract for voting power (token or membership)
 * 5. GovernorVotesQuorumFraction - Quorum as percentage of total supply
 */
contract MyGovernor is 
    Governor, 
    GovernorSettings, 
    GovernorCountingSimple, 
    GovernorVotes, 
    GovernorVotesQuorumFraction 
{
    /**
     * @dev Constructor sets up the Governor with all required parameters
     * @param _name The name of the governance system
     * @param votingPowerSource The IVotes contract that provides voting power
     *                      - MyToken20: For token-based voting (more tokens = more votes)
     *                      - MembershipAndVotes: For 1-person-1-vote governance
     * @param _votingDelay Blocks to wait before voting starts (e.g., 1 block)
     * @param _votingPeriod Blocks voting is open (e.g., 45818 blocks ≈ 1 week)
     * @param _proposalThreshold Minimum voting power needed to create proposals
     *                      - For token-based: e.g., 1000 tokens
     *                      - For membership-based: e.g., 1 (one member)
     * @param _quorumFraction Quorum as fraction of total supply (e.g., 4 = 4%)
     *                      - For token-based: percentage of total token supply
     *                      - For membership-based: percentage of total members
     */
    constructor(
        string memory _name,
        IVotes votingPowerSource,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumFraction
    ) 
        Governor(_name)
        GovernorSettings(uint32(_votingDelay), uint32(_votingPeriod), _proposalThreshold)
        GovernorVotes(votingPowerSource)
        GovernorVotesQuorumFraction(_quorumFraction)
    {}

    /**
     * @dev Override required by Governor
     * Returns the name of the governance system
     */
    function name() public pure override(Governor) returns (string memory) {
        return "MyGovernor";
    }

    /**
     * @dev Override required by Governor
     * Returns the voting delay (blocks to wait before voting starts)
     * 
     * WHY VOTING DELAY MATTERS:
     * - Prevents flash loan attacks on proposal creation
     * - Gives time for community to review proposals
     * - Example: 1 block delay = ~12 seconds on Ethereum
     */
    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    /**
     * @dev Override required by Governor
     * Returns the voting period (how long voting is open)
     * 
     * WHY VOTING PERIOD MATTERS:
     * - Must be long enough for community participation
     * - Too short = rushed decisions, too long = governance paralysis
     * - Example: 45818 blocks ≈ 1 week on Ethereum
     */
    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    /**
     * @dev Override required by Governor
     * Returns the proposal threshold (minimum voting power to create proposals)
     * 
     * WHY PROPOSAL THRESHOLD MATTERS:
     * - Prevents spam proposals
     * - Ensures proposers have skin in the game
     * - Example: 1000 tokens = need 1000 voting power to propose
     */
    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    /**
     * @dev Override required by Governor
     * Returns the quorum required for a proposal to succeed
     * 
     * HOW QUORUM WORKS:
     * - Quorum = minimum percentage of total supply that must vote
     * - Calculated as: (total votes cast / total supply) >= quorum fraction
     * - Example: 4% quorum = at least 4% of total supply must vote
     * - This is calculated using getPastTotalSupply() at proposal creation time
     */
    function quorum(uint256 blockNumber) public view override(Governor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(blockNumber);
    }

    /**
     * @dev Override required by Governor
     * Returns the current voting power of an account
     * 
     * HOW VOTING POWER IS DETERMINED:
     * - Calls votingPowerSource.getVotes(account) to get current voting power
     * - This uses the checkpoints from ERC20Votes
     * - Only accounts with delegated voting power can vote
     */
    function _getVotes(address account, uint256 blockNumber, bytes memory) 
        internal 
        view 
        override(Governor, GovernorVotes) 
        returns (uint256) 
    {
        return super._getVotes(account, blockNumber, "");
    }

    /**
     * @dev Override required by Governor
     * Checks if quorum is reached for a proposal
     * 
     * CURRENT BEHAVIOR (inherited from GovernorCountingSimple):
     * - Quorum = For + Abstain (Against votes excluded)
     * 
     * ALTERNATIVE: If you want ALL votes to count toward quorum:
     * - Change to: forVotes + againstVotes + abstainVotes >= quorum
     * - This makes quorum truly about participation
     * 
     * WHY AGAINST VOTES ARE EXCLUDED (by default):
     * - Prevents strategic voting: Can't vote Against just to block proposals
     * - Encourages positive engagement: Must vote For/Abstain to meet quorum
     * - Prevents minority obstruction: Small groups can't block by voting Against
     */
    function _quorumReached(uint256 proposalId) internal view override(Governor, GovernorCountingSimple) returns (bool) {
        return super._quorumReached(proposalId);
    }

    /**
     * @dev Override required by Governor
     * Returns the vote counting mode
     * 
     * COUNTING MODE EXPLANATION:
     * - "support=bravo" means:
     *   - For votes count as support
     *   - Against votes count as opposition
     *   - Proposal succeeds if For > Against (simple majority)
     * - "quorum=for,abstain" means:
     *   - Quorum is calculated using For votes + Abstain votes
     *   - Against votes do NOT count toward quorum
     *   - Example: If quorum is 10, need For + Abstain >= 10
     * 
     * VOTE COUNTING:
     * - For (support=1): Supports the proposal
     * - Against (support=0): Opposes the proposal
     * - Abstain (support=2): Neutral, counts for quorum but doesn't affect For vs Against
     */
    function COUNTING_MODE() public pure override(IGovernor, GovernorCountingSimple) returns (string memory) {
        return "support=bravo&quorum=for,abstain";
    }

    /**
     * @dev Override required by Governor
     * Returns the current state of a proposal
     * 
     * PROPOSAL STATES:
     * - Pending: Proposal created, waiting for voting delay
     * - Active: Voting is open
     * - Canceled: Proposal was canceled
     * - Defeated: Voting ended, didn't reach quorum or majority
     * - Succeeded: Voting ended, reached quorum and majority
     * - Queued: Proposal succeeded, waiting for execution delay (if timelock)
     * - Expired: Proposal expired (if timelock)
     * - Executed: Proposal was executed
     */
    function state(uint256 proposalId) public view override(Governor) returns (ProposalState) {
        return super.state(proposalId);
    }
}
