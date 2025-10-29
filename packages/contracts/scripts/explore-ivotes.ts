import { ethers } from "hardhat";

/**
 * @title IVotes Explorer Script
 * @notice Interactive exploration of IVotes mechanics
 * @dev This script demonstrates how Governor snapshot reads map to IVotes calls
 */
async function main() {
    console.log("🔍 IVotes Deep Dive Exploration\n");

    const [deployer, voter1, voter2] = await ethers.getSigners();
    
    // Use Sepolia contracts
    const TOKEN_ADDRESS = "0x8fF0FF3CB9B904E911c0B8E0a5db9cBD6fa036d3";
    const MyToken20 = await ethers.getContractFactory("MyToken20");
    const token = MyToken20.attach(TOKEN_ADDRESS);

    console.log("📊 Section 1: getVotes vs getPastVotes\n");

    // Get current voting power
    const currentVotes = await token.getVotes(deployer.address);
    const currentBlock = await deployer.provider.getBlockNumber();
    
    console.log(`Current Block: ${currentBlock}`);
    console.log(`getVotes(deployer): ${ethers.utils.formatEther(currentVotes)} MDT`);
    console.log(`   ⚠️  Returns voting power at LATEST block\n`);

    // Get past voting power
    const pastVotes = await token.getPastVotes(deployer.address, currentBlock - 1);
    console.log(`getPastVotes(deployer, ${currentBlock - 1}): ${ethers.utils.formatEther(pastVotes)} MDT`);
    console.log(`   ⚠️  Returns voting power at SPECIFIC block (snapshot)\n`);

    console.log("📦 Section 2: getPastTotalSupply\n");

    const totalSupply = await token.totalSupply();
    const pastTotalSupply = await token.getPastTotalSupply(currentBlock - 1);
    
    console.log(`totalSupply() (current): ${ethers.utils.formatEther(totalSupply)} MDT`);
    console.log(`getPastTotalSupply(${currentBlock - 1}): ${ethers.utils.formatEther(pastTotalSupply)} MDT`);
    console.log(`   ⚠️  Used by Governor to calculate quorum at proposal start block\n`);

    console.log("🔄 Section 3: Understanding Delegation\n");

    const deployerBalance = await token.balanceOf(deployer.address);
    const deployerDelegates = await token.delegates(deployer.address);
    
    console.log(`Deployer balance: ${ethers.utils.formatEther(deployerBalance)} MDT`);
    console.log(`Deployer delegates to: ${deployerDelegates}`);
    
    if (deployerDelegates === deployer.address) {
        console.log(`   ✅ Deployed to self - voting power = balance`);
    } else if (deployerDelegates === ethers.constants.AddressZero) {
        console.log(`   ❌ Not delegated - voting power = 0 (cannot vote!)`);
    } else {
        console.log(`   🔄 Delegated to ${deployerDelegates}`);
    }

    console.log("\n💡 Key Insights:\n");
    console.log("1. getVotes() queries checkpoints at LATEST block");
    console.log("2. getPastVotes() queries checkpoints at SPECIFIC block (snapshot)");
    console.log("3. Governor uses getPastVotes() to lock voting power at proposal start");
    console.log("4. Delegation is REQUIRED to have voting power");
    console.log("5. Transfers create checkpoints for historical queries");

    console.log("\n🔗 Checkpoint Internals:\n");
    
    // Try to understand checkpoint structure
    const checkpoints = await token.numCheckpoints(deployer.address);
    console.log(`Number of checkpoints for deployer: ${checkpoints}`);
    
    if (checkpoints > 0) {
        const latestCheckpoint = await token.checkpoints(deployer.address, checkpoints - 1);
        console.log(`Latest checkpoint:`);
        console.log(`   From block: ${latestCheckpoint.fromBlock.toString()}`);
        console.log(`   Votes: ${ethers.utils.formatEther(latestCheckpoint.votes)} MDT`);
        console.log(`   ⚠️  Each checkpoint = (block number, voting power) pair`);
    }

    console.log("\n📸 Snapshot Boundaries:\n");
    console.log("When Governor creates a proposal:");
    console.log("1. Captures voting power via getPastVotes(proposalStartBlock)");
    console.log("2. This snapshot is LOCKED - changes after don't affect this proposal");
    console.log("3. Quorum uses getPastTotalSupply(proposalStartBlock)");
    console.log("4. These values are immutable for that proposal");

    console.log("\n✅ Phase 2 Learning Complete!");
    console.log("\nNext: Run 'npm test -- ivotes-deep-dive' to see detailed tests");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

