import { ethers } from "hardhat";

/**
 * @title Create and Execute Governance Proposal
 * @notice Demonstrates the complete proposal lifecycle
 * @dev This script shows how to create, vote on, and execute a governance proposal
 */
async function main() {
    console.log("🗳️ Starting governance proposal demonstration...\n");

    // Get the deployer account
    const [deployer] = await (ethers as any).getSigners();
    console.log("Using account:", deployer.address);
    console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");

    // Get contract addresses from Sepolia deployment
    const BOX_ADDRESS = "0xF48B6a410bF4C6A8Fe2B587b7BE626f0439f7237";
    const TOKEN_ADDRESS = "0x8fF0FF3CB9B904E911c0B8E0a5db9cBD6fa036d3";
    const GOVERNOR_ADDRESS = "0xc5A92da165d3d017B13b4428E4d4fd4a59B287c4";

    // Connect to contracts
    const Box = await ethers.getContractFactory("Box");
    const box = Box.attach(BOX_ADDRESS);
    
    const MyToken20 = await ethers.getContractFactory("MyToken20");
    const token = MyToken20.attach(TOKEN_ADDRESS);
    
    const MyGovernor = await ethers.getContractFactory("MyGovernor");
    const governor = MyGovernor.attach(GOVERNOR_ADDRESS);

    // Step 1: Check current state
    console.log("📊 Current state:");
    const currentBlock = await deployer.provider.getBlockNumber();
    const currentValue = await box.retrieve();
    const votingPower = await token.getVotes(deployer.address);
    const totalSupply = await token.totalSupply();
    // Calculate quorum manually (4% of total supply)
    const quorum = totalSupply.mul(4).div(100);
    
    console.log("   Current block:", currentBlock);
    console.log("   Box value:", currentValue.toString());
    console.log("   Deployer voting power:", ethers.utils.formatEther(votingPower), "MDT");
    console.log("   Total supply:", ethers.utils.formatEther(totalSupply), "MDT");
    console.log("   Required quorum:", ethers.utils.formatEther(quorum), "MDT");
    console.log("   Can create proposals:", votingPower >= await governor.proposalThreshold() ? "✅ YES" : "❌ NO");
    console.log("");

    // Step 2: Create a proposal to change Box value
    console.log("📝 Creating proposal to change Box value...");
    
    // Prepare the proposal data
    const newValue = 100; // New value to store in Box (changed from 42 to create different proposal)
    const calldata = box.interface.encodeFunctionData("store", [newValue]);
    
    const description = "Change Box value to 100";
    const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description));
    
    console.log("   Target:", BOX_ADDRESS);
    console.log("   Calldata:", calldata);
    console.log("   Description:", description);
    console.log("   Description hash:", descriptionHash);
    console.log("");

    // Create the proposal (catch errors to debug)
    let proposeTx;
    try {
        proposeTx = await governor.propose(
            [BOX_ADDRESS], // targets
            [0], // values (0 ETH)
            [calldata], // calldatas
            description
        );
    } catch (error: any) {
        console.error("❌ Proposal creation failed:", error.message);
        if (error.reason) {
            console.error("   Reason:", error.reason);
        }
        throw error;
    }
    
    const proposeReceipt = await proposeTx.wait();
    console.log("✅ Proposal created!");
    console.log("   Transaction hash:", proposeReceipt.hash);
    
    // Extract proposal ID from events
    const eventSignature = "ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,uint256,string,bytes32)";
    const proposalCreatedEvent = proposeReceipt.logs.find(
        (log: any) => log.topics[0] === ethers.utils.id(eventSignature)
    );
    
    let proposalId;
    if (!proposalCreatedEvent) {
        console.log("   Available events:", proposeReceipt.logs.map((log: any) => log.topics[0]));
        // Try to extract from first event as fallback
        proposalId = ethers.BigNumber.from(proposeReceipt.logs[0].topics[1]);
        console.log("   Proposal ID:", proposalId.toString());
    } else {
        proposalId = ethers.BigNumber.from(proposalCreatedEvent.topics[1]);
        console.log("   Proposal ID:", proposalId.toString());
    }
    console.log("");

    // Step 3: Check proposal state
    console.log("🔍 Checking proposal state...");
    const proposalState = await governor.state(proposalId);
    console.log("   Current state:", proposalState);
    console.log("   State meaning:", getStateMeaning(proposalState));
    console.log("");

    // Step 4: Wait for voting to start (if needed)
    if (proposalState === 0) { // Pending
        console.log("⏳ Waiting for voting to start...");
        const votingDelay = await governor.votingDelay();
        console.log("   Voting delay:", votingDelay.toString(), "blocks");
        
        // Wait for the required number of blocks
        console.log("   Current block:", currentBlock);
        console.log("   Voting starts at block:", (currentBlock + votingDelay + 1).toString());
        console.log("   Waiting for", votingDelay.toString(), "more blocks...");
        
        // In a real scenario, you'd wait for blocks to be mined
        // For demo purposes, we'll assume voting has started
        console.log("   (In production, you'd wait for blocks to be mined)");
        console.log("");
    }

    // Step 5: Vote on the proposal
    console.log("🗳️ Voting on proposal...");
    
    // Check if we can vote
    const canVote = await governor.hasVoted(proposalId, deployer.address);
    if (canVote) {
        console.log("   ❌ Already voted on this proposal");
    } else {
        console.log("   ✅ Can vote on this proposal");
        
        // Vote FOR the proposal (1 = For, 0 = Against, 2 = Abstain)
        const voteTx = await governor.castVote(proposalId, 1); // Vote FOR
        await voteTx.wait();
        console.log("   ✅ Voted FOR the proposal");
    }
    console.log("");

    // Step 6: Check proposal state after voting
    console.log("🔍 Checking proposal state after voting...");
    const newProposalState = await governor.state(proposalId);
    console.log("   Current state:", newProposalState);
    console.log("   State meaning:", getStateMeaning(newProposalState));
    console.log("");

    // Step 7: Wait for voting to end (if needed)
    if (newProposalState === 1) { // Active
        console.log("⏳ Waiting for voting to end...");
        const votingPeriod = await governor.votingPeriod();
        console.log("   Voting period:", votingPeriod.toString(), "blocks");
        console.log("   (In production, you'd wait for blocks to be mined)");
        console.log("");
    }

    // Step 8: Execute the proposal (if it succeeded)
    if (newProposalState === 4) { // Succeeded
        console.log("⚡ Executing proposal...");
        
        try {
            const executeTx = await governor.execute(
                [BOX_ADDRESS], // targets
                [0], // values
                [calldata], // calldatas
                descriptionHash
            );
            await executeTx.wait();
            console.log("   ✅ Proposal executed successfully!");
            
            // Check the new Box value
            const newBoxValue = await box.retrieve();
            console.log("   New Box value:", newBoxValue.toString());
            console.log("   Expected value:", newValue.toString());
            console.log("   Values match:", newBoxValue.toString() === newValue.toString() ? "✅ YES" : "❌ NO");
            
        } catch (error) {
            console.log("   ❌ Proposal execution failed:", error);
        }
    } else {
        console.log("   ⏳ Proposal not ready for execution (state:", newProposalState, ")");
    }
    console.log("");

    console.log("🎉 Governance proposal demonstration complete!");
    console.log("   This shows the complete lifecycle: Pending → Active → Succeeded → Executed");
}

/**
 * Helper function to get human-readable proposal state
 */
function getStateMeaning(state: number): string {
    const states = [
        "Pending",    // 0
        "Active",     // 1
        "Canceled",   // 2
        "Defeated",   // 3
        "Succeeded",  // 4
        "Queued",     // 5
        "Expired",    // 6
        "Executed"    // 7
    ];
    return states[state] || "Unknown";
}

// Execute the script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });
