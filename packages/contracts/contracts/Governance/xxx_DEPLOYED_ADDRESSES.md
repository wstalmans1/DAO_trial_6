# Deployed Contract Addresses - Sepolia Testnet

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

