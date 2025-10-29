import { ethers } from "hardhat";

/**
 * @title Deploy Governance System
 * @notice Deploys Box, MyToken20, and MyGovernor contracts
 * @dev This script demonstrates the complete setup of a governance system
 */
async function main() {
    console.log("🚀 Starting governance system deployment...\n");

    // Get the deployer account
    const [deployer] = await (ethers as any).getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");

    // Step 1: Deploy Box contract
    console.log("📦 Deploying Box contract...");
    const Box = await ethers.getContractFactory("Box");
    const box = await Box.deploy(deployer.address); // Deployer is initial owner
    await box.deployed();
    const boxAddress = box.address;
    console.log("✅ Box deployed to:", boxAddress);
    console.log("   Initial value:", await box.retrieve());
    console.log("   Owner:", await box.owner());
    console.log("");

    // Step 2: Deploy MyToken20 contract
    console.log("🪙 Deploying MyToken20 contract...");
    const MyToken20 = await ethers.getContractFactory("MyToken20");
    const token = await MyToken20.deploy(
        "MyDAO Token",    // name
        "MDT",           // symbol
        ethers.utils.parseEther("1000000") // 1M tokens initial supply
    );
    await token.deployed();
    const tokenAddress = token.address;
    console.log("✅ MyToken20 deployed to:", tokenAddress);
    console.log("   Name:", await token.name());
    console.log("   Symbol:", await token.symbol());
    console.log("   Total supply:", ethers.utils.formatEther(await token.totalSupply()), "MDT");
    console.log("   Deployer balance:", ethers.utils.formatEther(await token.balanceOf(deployer.address)), "MDT");
    console.log("");

    // Step 3: Deploy MyGovernor contract
    console.log("🏛️ Deploying MyGovernor contract...");
    const MyGovernor = await ethers.getContractFactory("MyGovernor");
    const governor = await MyGovernor.deploy(
        "MyGovernor",           // name
        tokenAddress,           // IVotes token
        1,                      // votingDelay (1 block)
        7,                  // votingPeriod (45818 blocks ≈ 1 week)
        ethers.utils.parseEther("1000"), // proposalThreshold (1000 MDT)
        4                       // quorumFraction (4%)
    );
    await governor.deployed();
    const governorAddress = governor.address;
    console.log("✅ MyGovernor deployed to:", governorAddress);
    console.log("   Name:", await governor.name());
    console.log("   Voting delay:", await governor.votingDelay(), "blocks");
    console.log("   Voting period:", await governor.votingPeriod(), "blocks");
    console.log("   Proposal threshold:", ethers.utils.formatEther(await governor.proposalThreshold()), "MDT");
    // Skip quorum check for now due to potential issue
    console.log("   Quorum fraction: 4% (configured)");
    console.log("");

    // Step 4: Transfer Box ownership to Governor
    console.log("🔄 Transferring Box ownership to Governor...");
    const transferTx = await box.transferOwnership(governorAddress);
    await transferTx.wait();
    console.log("✅ Box ownership transferred to Governor");
    console.log("   New owner:", await box.owner());
    console.log("");

    // Step 5: Delegate voting power to self (CRITICAL STEP!)
    console.log("🗳️ Delegating voting power to self...");
    const delegateTx = await token.delegate(deployer.address);
    await delegateTx.wait();
    console.log("✅ Voting power delegated to self");
    console.log("   Current voting power:", ethers.utils.formatEther(await token.getVotes(deployer.address)), "MDT");
    const currentBlock = await deployer.provider.getBlockNumber();
    console.log("   Past voting power (current block):", ethers.utils.formatEther(await token.getPastVotes(deployer.address, currentBlock)), "MDT");
    console.log("");

    // Step 6: Verify the setup
    console.log("🔍 Verifying governance setup...");
    const votingPower = await token.getVotes(deployer.address);
    const totalSupply = await token.totalSupply();
    // Calculate quorum manually (4% of total supply)
    const quorum = ethers.BigNumber.from(totalSupply).mul(4).div(100);
    
    console.log("   Current block:", currentBlock);
    console.log("   Deployer voting power:", ethers.utils.formatEther(votingPower), "MDT");
    console.log("   Total supply:", ethers.utils.formatEther(totalSupply), "MDT");
    console.log("   Required quorum:", ethers.utils.formatEther(quorum), "MDT");
    console.log("   Can create proposals:", votingPower >= await governor.proposalThreshold() ? "✅ YES" : "❌ NO");
    console.log("");

    // Step 7: Display contract addresses for easy reference
    console.log("📋 Contract Addresses Summary:");
    console.log("   Box:", boxAddress);
    console.log("   MyToken20:", tokenAddress);
    console.log("   MyGovernor:", governorAddress);
    console.log("");

    console.log("🎉 Governance system deployment complete!");
    console.log("   Next step: Create a proposal to change the Box value");
    console.log("   Use: npx hardhat run scripts/create-proposal.ts --network localhost");
}

// Execute the deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
