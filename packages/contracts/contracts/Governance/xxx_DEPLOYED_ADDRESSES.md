# Deployed Contract Addresses - Sepolia Testnet

## Membership-Based Governance System (Latest)

### Box Contract (Membership System)
- **Address**: `0xB25617eeD5F51d4CF9FB0730A8D25A9a093f09b7`
- **Network**: Sepolia (Chain ID: 11155111)
- **Explorer (Blockscout)**: https://eth-sepolia.blockscout.com/address/0xB25617eeD5F51d4CF9FB0730A8D25A9a093f09b7
- **Explorer (Etherscan)**: https://sepolia.etherscan.io/address/0xB25617eeD5F51d4CF9FB0730A8D25A9a093f09b7
- **Purpose**: Simple target contract for governance proposals
- **Current Owner**: MyGovernor contract (membership-based)

### MembershipAndVotes Contract
- **Address**: `0x656486Cc40eD0c96b29aCbC9045A27220871d80A`
- **Network**: Sepolia (Chain ID: 11155111)
- **Explorer (Blockscout)**: https://eth-sepolia.blockscout.com/address/0x656486Cc40eD0c96b29aCbC9045A27220871d80A
- **Explorer (Etherscan)**: https://sepolia.etherscan.io/address/0x656486Cc40eD0c96b29aCbC9045A27220871d80A
- **Purpose**: 1-person-1-vote membership registry with IVotes compatibility
- **Current Members**: 1 (deployer)
- **Owner**: 0xD78C12137087D394c0FA49634CAa80D0a1985A8A

### MyGovernor Contract (Membership-Based)
- **Address**: `0xe43912445ABcE9204e2cc774d29e4B9D6F58f09e`
- **Network**: Sepolia (Chain ID: 11155111)
- **Explorer (Blockscout)**: https://eth-sepolia.blockscout.com/address/0xe43912445ABcE9204e2cc774d29e4B9D6F58f09e
- **Explorer (Etherscan)**: https://sepolia.etherscan.io/address/0xe43912445ABcE9204e2cc774d29e4B9D6F58f09e
- **Purpose**: Governance contract with membership-based voting (1 person, 1 vote)
- **Voting Power Source**: MembershipAndVotes contract (`0x656486Cc40eD0c96b29aCbC9045A27220871d80A`)
- **Voting Delay**: 1 block
- **Voting Period**: 7 blocks
- **Proposal Threshold**: 1 member
- **Quorum Fraction**: 4%

### Configuration Summary (Membership System)

| Parameter | Value |
|-----------|-------|
| Voting Delay | 1 block |
| Voting Period | 7 blocks |
| Proposal Threshold | 1 member |
| Quorum Fraction | 4% |
| Voting Model | 1 person, 1 vote |
| Initial Members | 1 |

---

## Token-Based Governance System (Previous Deployment)

## Governance System Contracts

### Box Contract
- **Address**: `0xF48B6a410bF4C6A8Fe2B587b7BE626f0439f7237`
- **Network**: Sepolia (Chain ID: 11155111)
- **Explorer (Blockscout)**: https://eth-sepolia.blockscout.com/address/0xF48B6a410bF4C6A8Fe2B587b7BE626f0439f7237
- **Explorer (Etherscan)**: https://sepolia.etherscan.io/address/0xF48B6a410bF4C6A8Fe2B587b7BE626f0439f7237
- **Purpose**: Simple target contract for governance proposals
- **Current Owner**: MyGovernor contract

### MyToken20 Contract
- **Address**: `0x8fF0FF3CB9B904E911c0B8E0a5db9cBD6fa036d3`
- **Network**: Sepolia (Chain ID: 11155111)
- **Explorer (Blockscout)**: https://eth-sepolia.blockscout.com/address/0x8fF0FF3CB9B904E911c0B8E0a5db9cBD6fa036d3
- **Explorer (Etherscan)**: https://sepolia.etherscan.io/address/0x8fF0FF3CB9B904E911c0B8E0a5db9cBD6fa036d3
- **Purpose**: ERC20Votes token for governance voting
- **Token Name**: MyDAO Token
- **Symbol**: MDT
- **Total Supply**: 1,000,000 MDT
- **Deployer**: 0xD78C12137087D394c0FA49634CAa80D0a1985A8A

### MyGovernor Contract
- **Address**: `0xc5A92da165d3d017B13b4428E4d4fd4a59B287c4`
- **Network**: Sepolia (Chain ID: 11155111)
- **Explorer (Blockscout)**: https://eth-sepolia.blockscout.com/address/0xc5A92da165d3d017B13b4428E4d4fd4a59B287c4
- **Explorer (Etherscan)**: https://sepolia.etherscan.io/address/0xc5A92da165d3d017B13b4428E4d4fd4a59B287c4
- **Purpose**: Governance contract for managing proposals
- **Voting Delay**: 1 block
- **Voting Period**: 7 blocks
- **Proposal Threshold**: 1,000 MDT
- **Quorum Fraction**: 4% (40,000 MDT)

## Configuration Summary

| Parameter | Value |
|-----------|-------|
| Voting Delay | 1 block |
| Voting Period | 7 blocks |
| Proposal Threshold | 1,000 MDT |
| Quorum Fraction | 4% |
| Total Supply | 1,000,000 MDT |
| Initial Owner | 0xD78C12137087D394c0FA49634CAa80D0a1985A8A |

## Deployment Information

- **Deployed**: Phase 1 - Minimal Governor + ERC20Votes setup
- **Date**: Recently deployed to Sepolia
- **Status**: ✅ Verified on both Blockscout and Etherscan
- **Next Steps**: Create and execute test proposals

