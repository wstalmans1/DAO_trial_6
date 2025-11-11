import { ethers } from "hardhat";

async function main() {
    console.log("🔢 Calculating Proposal ID with EMPTY description...\n");

    // Exact values from Blockscout
    const targets = ["0xB25617eeD5F51d4CF9FB0730A8D25A9a093f09b7"];
    const values = [0];
    const calldatas = ["0x6057361d000000000000000000000000000000000000000000000000000000000000006f"];
    const description = ""; // EMPTY description!
    
    // Calculate description hash for empty string
    const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description));
    
    console.log("📋 Proposal Parameters (as entered in Blockscout):");
    console.log("   Targets:", targets);
    console.log("   Values:", values);
    console.log("   Calldatas:", calldatas);
    console.log("   Description: \"\" (EMPTY)");
    console.log("   Description Hash:", descriptionHash);
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
    
    console.log("✅ Proposal ID with EMPTY description:");
    console.log("   Decimal:", proposalId.toString());
    console.log("   Hex:", "0x" + proposalId.toHexString().slice(2).padStart(64, '0'));
    console.log("");
    
    // Also query the contract
    const GOVERNOR_ADDRESS = "0xe43912445ABcE9204e2cc774d29e4B9D6F58f09e";
    const MyGovernor = await ethers.getContractFactory("MyGovernor");
    const governor = MyGovernor.attach(GOVERNOR_ADDRESS);
    
    try {
        const contractProposalId = await governor.hashProposal(targets, values, calldatas, descriptionHash);
        console.log("✅ Contract hashProposal result:");
        console.log("   Decimal:", contractProposalId.toString());
        console.log("   Match:", contractProposalId.toString() === proposalId.toString() ? "✅ YES" : "❌ NO");
    } catch (error: any) {
        console.log("   Error querying contract:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

