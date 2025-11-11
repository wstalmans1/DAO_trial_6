import { ethers } from "hardhat";

async function main() {
    console.log("🔍 Querying Governor contract's hashProposal function...\n");

    const GOVERNOR_ADDRESS = "0xe43912445ABcE9204e2cc774d29e4B9D6F58f09e";
    const targets = ["0xB25617eeD5F51d4CF9FB0730A8D25A9a093f09b7"];
    const values = [0];
    const calldatas = ["0x6057361d000000000000000000000000000000000000000000000000000000000000006f"];
    const blockscoutId = "114304715747243871376125024714126039464430818643962859926503580860147047885264";
    
    const MyGovernor = await ethers.getContractFactory("MyGovernor");
    const governor = MyGovernor.attach(GOVERNOR_ADDRESS);

    // Try different description formats
    const descriptions = [
        "Change Box value to 111",
        '"Change Box value to 111"',
    ];

    for (const description of descriptions) {
        console.log(`\n📝 Testing description: "${description}"`);
        
        // Calculate description hash
        const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description));
        console.log(`   Description hash: ${descriptionHash}`);
        
        try {
            // Query the contract's hashProposal function
            const proposalId = await governor.hashProposal(targets, values, calldatas, descriptionHash);
            console.log(`   Contract hashProposal: ${proposalId.toString()}`);
            console.log(`   Blockscout ID: ${blockscoutId}`);
            console.log(`   Match: ${proposalId.toString() === blockscoutId ? "✅ YES" : "❌ NO"}`);
            
            if (proposalId.toString() === blockscoutId) {
                console.log(`   🎯 FOUND MATCH! Use description: "${description}"`);
            }
        } catch (error: any) {
            console.log(`   Error: ${error.message}`);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

