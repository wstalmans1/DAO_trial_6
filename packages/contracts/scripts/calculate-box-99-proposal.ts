import { ethers } from "hardhat";

async function main() {
    console.log("🔢 Calculating Proposal to Set Box Value to 99...\n");

    const BOX_ADDRESS = "0xB25617eeD5F51d4CF9FB0730A8D25A9a093f09b7";
    const newValue = 99;
    
    // Connect to Box contract
    const Box = await ethers.getContractFactory("Box");
    const box = Box.attach(BOX_ADDRESS);
    
    // Encode the function call: store(uint256 newValue)
    const calldata = box.interface.encodeFunctionData("store", [newValue]);
    
    // Proposal parameters
    const targets = [BOX_ADDRESS];
    const values = [0]; // No ETH sent
    const calldatas = [calldata];
    const description = "Change Box value to 99";
    
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
    
    // Verify with Governor contract
    const GOVERNOR_ADDRESS = "0xe43912445ABcE9204e2cc774d29e4B9D6F58f09e";
    const MyGovernor = await ethers.getContractFactory("MyGovernor");
    const governor = MyGovernor.attach(GOVERNOR_ADDRESS);
    
    try {
        const contractProposalId = await governor.hashProposal(targets, values, calldatas, descriptionHash);
        console.log("✅ Contract hashProposal verification:");
        console.log(`   Match: ${contractProposalId.toString() === proposalId.toString() ? "✅ YES" : "❌ NO"}`);
    } catch (error: any) {
        console.log("   Could not verify with contract:", error.message);
    }
    
    console.log("\n📝 Summary:");
    console.log(`   This proposal will call store(${newValue}) on the Box contract.`);
    console.log(`   After execution, the Box value will be set to ${newValue}.`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

