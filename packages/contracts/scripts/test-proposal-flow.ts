import { ethers } from "hardhat";

async function main() {
    console.log("🧪 Testing proposal flow...\n");

    const [deployer] = await (ethers as any).getSigners();
    console.log("Account:", deployer.address);

    // Contract addresses
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

    // Test 1: Check voting power
    console.log("\n📊 Step 1: Check voting power");
    const votingPower = await token.getVotes(deployer.address);
    const proposalThreshold = await governor.proposalThreshold();
    console.log("   Voting power:", ethers.utils.formatEther(votingPower));
    console.log("   Threshold:", ethers.utils.formatEther(proposalThreshold));
    console.log("   Can propose:", votingPower.gte(proposalThreshold) ? "✅" : "❌");

    // Test 2: Check current Box value
    console.log("\n📦 Step 2: Check current Box value");
    const currentValue = await box.retrieve();
    console.log("   Current value:", currentValue.toString());

    // Test 3: Prepare proposal for value 500
    console.log("\n📝 Step 3: Prepare proposal to change Box to 500");
    const newValue = 500;
    const calldata = box.interface.encodeFunctionData("store", [newValue]);
    const description = "Change Box value to 500";
    const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description));
    
    console.log("   Target:", BOX_ADDRESS);
    console.log("   Calldata:", calldata);
    console.log("   Description:", description);
    console.log("   Description hash:", descriptionHash);
    
    // Calculate proposal ID
    const proposalId = await governor.getProposalId(
        [BOX_ADDRESS],
        [0],
        [calldata],
        descriptionHash
    );
    console.log("   Proposal ID:", proposalId.toString());

    // Test 4: Try to create proposal
    console.log("\n🗳️ Step 4: Create proposal");
    try {
        const proposeTx = await governor.propose([BOX_ADDRESS], [0], [calldata], description);
        const receipt = await proposeTx.wait();
        console.log("   ✅ Proposal created!");
        console.log("   Transaction hash:", receipt.hash);
        console.log("   Proposal ID:", proposalId.toString());
    } catch (error: any) {
        console.log("   ❌ Failed:", error.message);
    }

    // Test 5: Check proposal state
    console.log("\n🔍 Step 5: Check proposal state");
    try {
        const state = await governor.state(proposalId);
        const states = ["Pending", "Active", "Canceled", "Defeated", "Succeeded", "Queued", "Expired", "Executed"];
        console.log("   State:", states[state] || "Unknown");
        console.log("   State number:", state);
    } catch (error: any) {
        console.log("   ⚠️  Could not check state (proposal might not exist yet)");
    }

    console.log("\n✅ Test complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });


