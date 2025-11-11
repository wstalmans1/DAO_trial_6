import { ethers } from "hardhat";

async function main() {
    console.log("🔢 Calculating Proposal ID...\n");

    // Proposal parameters
    const targets = ["0xB25617eeD5F51d4CF9FB0730A8D25A9a093f09b7"];
    const values = [0];
    const calldatas = ["0x6057361d000000000000000000000000000000000000000000000000000000000000006f"];
    const description = "Change Box value to 111";
    
    // Calculate description hash
    const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description));
    
    console.log("📋 Proposal Parameters:");
    console.log("   Targets:", targets);
    console.log("   Values:", values);
    console.log("   Calldatas:", calldatas);
    console.log("   Description:", description);
    console.log("   Description Hash:", descriptionHash);
    console.log("");
    
    // Calculate proposal ID
    // Proposal ID = keccak256(abi.encode(targets, values, calldatas, descriptionHash))
    const proposalId = ethers.BigNumber.from(
        ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                ['address[]', 'uint256[]', 'bytes[]', 'bytes32'],
                [targets, values, calldatas, descriptionHash]
            )
        )
    );
    
    console.log("✅ Expected Proposal ID:");
    console.log("   " + proposalId.toString());
    console.log("");
    console.log("📝 Full details:");
    console.log("   Proposal ID (decimal):", proposalId.toString());
    console.log("   Proposal ID (hex):", "0x" + proposalId.toHexString().slice(2).padStart(64, '0'));
    console.log("");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

