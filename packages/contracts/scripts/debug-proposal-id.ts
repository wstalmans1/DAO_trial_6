import { ethers } from "hardhat";

async function main() {
    console.log("🔍 Debugging Proposal ID Calculation...\n");

    const targets = ["0xB25617eeD5F51d4CF9FB0730A8D25A9a093f09b7"];
    const values = [0];
    const calldatas = ["0x6057361d000000000000000000000000000000000000000000000000000000000000006f"];
    const blockscoutId = "114304715747243871376125024714126039464430818643962859926503580860147047885264";
    
    console.log("📋 Input Parameters:");
    console.log("   Targets:", targets);
    console.log("   Values:", values);
    console.log("   Calldatas:", calldatas);
    console.log("   Blockscout Proposal ID:", blockscoutId);
    console.log("");

    // Try different description variations
    const descriptions = [
        "Change Box value to 111",
        '"Change Box value to 111"',
        'Change Box value to 111',
        "Change Box value to 111\n",
        "Change Box value to 111 ",
    ];

    console.log("🧪 Testing different description encodings:\n");

    for (const description of descriptions) {
        // Method 1: keccak256(toUtf8Bytes(description)) - standard way
        const hash1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description));
        
        // Method 2: keccak256(hexlify(toUtf8Bytes(description)))
        const hash2 = ethers.utils.keccak256(ethers.utils.hexlify(ethers.utils.toUtf8Bytes(description)));

        const proposals = [
            { name: "toUtf8Bytes (standard)", hash: hash1 },
            { name: "hexlify+toUtf8Bytes", hash: hash2 },
        ];

        for (const prop of proposals) {
            const proposalId = ethers.BigNumber.from(
                ethers.utils.keccak256(
                    ethers.utils.defaultAbiCoder.encode(
                        ['address[]', 'uint256[]', 'bytes[]', 'bytes32'],
                        [targets, values, calldatas, prop.hash]
                    )
                )
            );

            const matches = proposalId.toString() === blockscoutId;
            console.log(`   Description: "${description}"`);
            console.log(`   Method: ${prop.name}`);
            console.log(`   Hash: ${prop.hash}`);
            console.log(`   Proposal ID: ${proposalId.toString()}`);
            console.log(`   Match: ${matches ? "✅ YES" : "❌ NO"}`);
            if (matches) {
                console.log(`   🎯 FOUND MATCH!`);
            }
            console.log("");
        }
    }

    // Also try using the Governor contract's hashProposal function if it exists
    console.log("🔍 Checking Governor contract for hashProposal function...\n");
    try {
        const GOVERNOR_ADDRESS = "0xe43912445ABcE9204e2cc774d29e4B9D6F58f09e";
        const MyGovernor = await ethers.getContractFactory("MyGovernor");
        const governor = MyGovernor.attach(GOVERNOR_ADDRESS);
        
        // Try to call hashProposal if it exists
        const description = "Change Box value to 111";
        const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description));
        
        try {
            const contractProposalId = await governor.hashProposal(targets, values, calldatas, descriptionHash);
            console.log("   Contract hashProposal result:", contractProposalId.toString());
            console.log("   Match:", contractProposalId.toString() === blockscoutId ? "✅ YES" : "❌ NO");
        } catch (e: any) {
            console.log("   hashProposal not available or error:", e.message);
        }
    } catch (e: any) {
        console.log("   Could not connect to Governor:", e.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

