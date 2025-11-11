import { ethers } from "hardhat";

async function main() {
    console.log("🔢 Calculating Proposal to Change Voting Period...\n");

    const GOVERNOR_ADDRESS = "0xe43912445ABcE9204e2cc774d29e4B9D6F58f09e";
    const newVotingPeriod = 15; // New voting period in blocks
    
    // Connect to Governor contract
    const MyGovernor = await ethers.getContractFactory("MyGovernor");
    const governor = MyGovernor.attach(GOVERNOR_ADDRESS);
    
    // Encode the function call: setVotingPeriod(uint32 newVotingPeriod)
    // The target is the Governor contract itself!
    const calldata = governor.interface.encodeFunctionData("setVotingPeriod", [newVotingPeriod]);
    
    // Proposal parameters
    const targets = [GOVERNOR_ADDRESS]; // Target is the Governor itself
    const values = [0]; // No ETH sent
    const calldatas = [calldata];
    const description = "Change voting period from 7 to 15 blocks";
    
    // Calculate description hash
    const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description));
    
    console.log("📋 Proposal Parameters:\n");
    console.log("targets (address[]):");
    console.log(`  ${targets[0]}`);
    console.log("\nvalues (uint256[]):");
    console.log(`  ${values[0]}`);
    console.log("\ncalldatas (bytes[]):");
    console.log(`  ${calldatas[0]}`);
    console.log("\ndescription (string):");
    console.log(`  ${description}`);
    console.log("\ndescriptionHash:");
    console.log(`  ${descriptionHash}`);
    console.log("");
    
    // Calculate proposal ID
    const proposalId = ethers.BigNumber.from(
        ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                ['address[]', 'uint256[]', 'bytes[]', 'bytes32'],
                [targets, values, calldatas, descriptionHash]
            )
        )
    );
    
    console.log("✅ Expected Proposal ID:");
    console.log(`   Decimal: ${proposalId.toString()}`);
    console.log(`   Hex: 0x${proposalId.toHexString().slice(2).padStart(64, '0')}`);
    console.log("");
    
    // Verify with contract
    try {
        const contractProposalId = await governor.hashProposal(targets, values, calldatas, descriptionHash);
        console.log("✅ Contract hashProposal verification:");
        console.log(`   Match: ${contractProposalId.toString() === proposalId.toString() ? "✅ YES" : "❌ NO"}`);
    } catch (error: any) {
        console.log("   Could not verify with contract:", error.message);
    }
    
    console.log("\n📝 Summary:");
    console.log("   This proposal will call setVotingPeriod(15) on the Governor contract.");
    console.log("   After the proposal passes and is executed, the voting period will change from 7 to 15 blocks.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

