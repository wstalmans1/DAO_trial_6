import { ethers } from "hardhat";

async function main() {
    console.log("⚡ Executing governance proposal...\n");

    const [deployer] = await (ethers as any).getSigners();
    console.log("Account:", deployer.address);

    // Contract addresses
    const BOX_ADDRESS = "0xF48B6a410bF4C6A8Fe2B587b7BE626f0439f7237";
    const GOVERNOR_ADDRESS = "0xc5A92da165d3d017B13b4428E4d4fd4a59B287c4";

    // Connect to contracts
    const Box = await ethers.getContractFactory("Box");
    const box = Box.attach(BOX_ADDRESS);
    
    const MyGovernor = await ethers.getContractFactory("MyGovernor");
    const governor = MyGovernor.attach(GOVERNOR_ADDRESS);

    // Proposal parameters
    const targets = [BOX_ADDRESS];
    const values = [0];
    const calldatas = ["0x6057361d00000000000000000000000000000000000000000000000000000000000001f4"];
    
    // Use the quoted description to match the proposal
    const description = "Change Box value to 500";
    const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description));

    console.log("📋 Proposal details:");
    console.log("   Target:", targets[0]);
    console.log("   Calldata:", calldatas[0]);
    console.log("   Description hash:", descriptionHash);

    // Calculate proposal ID to check state
    const proposalId = ethers.BigNumber.from(
        ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                ['address[]', 'uint256[]', 'bytes[]', 'bytes32'],
                [targets, values, calldatas, descriptionHash]
            )
        )
    );
    console.log("   Proposal ID:", proposalId.toString());

    // Check current Box value before
    const currentValue = await box.retrieve();
    console.log("\n📦 Current Box value:", currentValue.toString());

    // Check proposal state
    console.log("\n🔍 Checking proposal state...");
    try {
        const state = await governor.state(proposalId);
        const states = ["Pending", "Active", "Canceled", "Defeated", "Succeeded", "Queued", "Expired", "Executed"];
        console.log("   State:", states[state]);
        console.log("   State number:", state);

        if (state === 4) { // Succeeded
            console.log("\n✅ Proposal succeeded, attempting execution...");
            
            try {
                const executeTx = await governor.execute(targets, values, calldatas, descriptionHash);
                console.log("   📝 Transaction sent:", executeTx.hash);
                const receipt = await executeTx.wait();
                console.log("   ✅ Executed in block:", receipt.blockNumber);
                
                // Check new Box value
                const newValue = await box.retrieve();
                console.log("   📦 New Box value:", newValue.toString());
                console.log("   Expected: 500");
                console.log("   Match:", newValue.toString() === "500" ? "✅ YES" : "❌ NO");
            } catch (error: any) {
                console.log("   ❌ Execution failed:", error.message);
                if (error.reason) {
                    console.log("   Reason:", error.reason);
                }
            }
        } else {
            console.log("   ⏳ Proposal not ready for execution");
            console.log("   Required state: Succeeded (4)");
        }
    } catch (error: any) {
        console.log("   ⚠️  Could not check proposal state");
        console.log("   Error:", error.message);
    }

    console.log("\n✅ Script complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });


