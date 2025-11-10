import { ethers } from "hardhat";

/**
 * @title Deploy Membership-Based Governance System
 * @notice Deploys Box, MembershipAndVotes, and MyGovernor contracts
 * @dev This script sets up a 1-person-1-vote governance system
 */
async function main() {
    console.log("🚀 Starting membership-based governance system deployment...\n");

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

    // Step 2: Deploy MembershipAndVotes contract
    console.log("👥 Deploying MembershipAndVotes contract...");
    const MembershipAndVotes = await ethers.getContractFactory("MembershipAndVotes");
    const membership = await MembershipAndVotes.deploy(deployer.address);
    await membership.deployed();
    const membershipAddress = membership.address;
    console.log("✅ MembershipAndVotes deployed to:", membershipAddress);
    console.log("   Owner:", await membership.owner());
    console.log("   Initial members:", await membership.totalMembers());
    console.log("");

    // Step 3: Deploy MyGovernor contract with MembershipAndVotes
    console.log("🏛️ Deploying MyGovernor contract with MembershipAndVotes...");
    const MyGovernor = await ethers.getContractFactory("MyGovernor");
    const governor = await MyGovernor.deploy(
        "MyGovernor",           // name
        membershipAddress,      // IVotes votingPowerSource (MembershipAndVotes)
        1,                      // votingDelay (1 block)
        7,                      // votingPeriod (7 blocks for testing)
        1,                      // proposalThreshold (1 member)
        4                       // quorumFraction (4%)
    );
    await governor.deployed();
    const governorAddress = governor.address;
    console.log("✅ MyGovernor deployed to:", governorAddress);
    console.log("   Name:", await governor.name());
    console.log("   Voting delay:", await governor.votingDelay(), "blocks");
    console.log("   Voting period:", await governor.votingPeriod(), "blocks");
    console.log("   Proposal threshold:", await governor.proposalThreshold(), "members");
    console.log("");

    // Step 4: Transfer Box ownership to Governor
    console.log("🔄 Transferring Box ownership to Governor...");
    const transferTx = await box.transferOwnership(governorAddress);
    await transferTx.wait();
    console.log("✅ Box ownership transferred to Governor");
    console.log("   New owner:", await box.owner());
    console.log("");

    // Step 5: Add members (starts with deployer)
    console.log("👥 Adding members to MembershipAndVotes...");
    
    // Add deployer as first member
    const addDeployerTx = await membership.addMember(deployer.address);
    await addDeployerTx.wait();
    console.log("✅ Added deployer as member:", deployer.address);
    
    const totalMembers = await membership.totalMembers();
    console.log("   Total members:", totalMembers.toString());
    console.log("");

    // Step 6: Verify voting power
    console.log("🗳️ Verifying voting power...");
    const deployerVotingPower = await membership.getVotes(deployer.address);
    const currentBlock = await deployer.provider.getBlockNumber();
    // Use a past block for quorum calculation to avoid ERC5805FutureLookup errors
    const pastBlock = currentBlock - 1;
    let quorumAtBlock;
    try {
        quorumAtBlock = await governor.quorum(pastBlock);
    } catch (error) {
        // If quorum calculation fails, just show total supply
        const totalSupply = await membership.getPastTotalSupply(pastBlock > 0 ? pastBlock : currentBlock);
        quorumAtBlock = totalSupply.mul(4).div(100);
        console.log("   Note: Using calculated quorum from total supply");
    }
    
    console.log("   Deployer voting power:", deployerVotingPower.toString(), "votes");
    console.log("   Total members:", totalMembers.toString());
    console.log("   Quorum (4%):", quorumAtBlock.toString(), "votes");
    console.log("   Can create proposals:", deployerVotingPower.gte(await governor.proposalThreshold()) ? "✅ YES" : "❌ NO");
    console.log("");

    // Summary
    console.log("📋 DEPLOYMENT SUMMARY:\n");
    console.log("Contract Addresses:");
    console.log("   Box:", boxAddress);
    console.log("   MembershipAndVotes:", membershipAddress);
    console.log("   MyGovernor:", governorAddress);
    console.log("");
    console.log("Configuration:");
    console.log("   Voting Delay: 1 block");
    console.log("   Voting Period: 7 blocks");
    console.log("   Proposal Threshold: 1 member");
    console.log("   Quorum Fraction: 4%");
    console.log("   Total Members:", totalMembers.toString());
    console.log("");
    console.log("🎉 Membership-based governance system deployed successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });


