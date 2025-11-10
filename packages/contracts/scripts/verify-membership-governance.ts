import hre from "hardhat";

/**
 * @title Verify Membership Governance Contracts
 * @notice Verifies MembershipAndVotes and MyGovernor on Blockscout (and Etherscan if possible)
 */

async function main() {
    console.log("🔍 Verifying membership-based governance contracts...\n");

    // Contract addresses from latest deployment
    const MEMBERSHIP_ADDRESS = "0x656486Cc40eD0c96b29aCbC9045A27220871d80A";
    const GOVERNOR_ADDRESS = "0xe43912445ABcE9204e2cc774d29e4B9D6F58f09e";
    
    // Deployer address (initialOwner for MembershipAndVotes)
    const DEPLOYER_ADDRESS = "0xD78C12137087D394c0FA49634CAa80D0a1985A8A";

    // Constructor arguments
    const membershipConstructorArgs = [DEPLOYER_ADDRESS];
    const governorConstructorArgs = [
        "MyGovernor",                              // name
        MEMBERSHIP_ADDRESS,                        // votingPowerSource (IVotes)
        1,                                         // votingDelay
        7,                                         // votingPeriod
        1,                                         // proposalThreshold
        4                                          // quorumFraction
    ];

    // Verify MembershipAndVotes
    console.log("📋 Verifying MembershipAndVotes contract...");
    console.log("   Address:", MEMBERSHIP_ADDRESS);
    console.log("   Constructor args:", membershipConstructorArgs);
    
    console.log("\n   Verifying on Blockscout...");
    try {
        await hre.run("verify:verify", {
            address: MEMBERSHIP_ADDRESS,
            network: "sepolia-blockscout",
            constructorArguments: membershipConstructorArgs
        });
        console.log("   ✅ MembershipAndVotes verified on Blockscout");
    } catch (e: any) {
        console.log("   ❌ Blockscout failed:", e.message || e);
    }

    console.log("\n   Verifying on Etherscan...");
    try {
        await hre.run("verify:verify", {
            address: MEMBERSHIP_ADDRESS,
            constructorArguments: membershipConstructorArgs
        });
        console.log("   ✅ MembershipAndVotes verified on Etherscan");
    } catch (e: any) {
        console.log("   ⚠️  Etherscan:", e.message || e);
    }

    // Verify MyGovernor
    console.log("\n📋 Verifying MyGovernor contract...");
    console.log("   Address:", GOVERNOR_ADDRESS);
    console.log("   Constructor args:", governorConstructorArgs);
    
    console.log("\n   Verifying on Blockscout...");
    try {
        await hre.run("verify:verify", {
            address: GOVERNOR_ADDRESS,
            network: "sepolia-blockscout",
            constructorArguments: governorConstructorArgs
        });
        console.log("   ✅ MyGovernor verified on Blockscout");
    } catch (e: any) {
        console.log("   ❌ Blockscout failed:", e.message || e);
    }

    console.log("\n   Verifying on Etherscan...");
    try {
        await hre.run("verify:verify", {
            address: GOVERNOR_ADDRESS,
            constructorArguments: governorConstructorArgs
        });
        console.log("   ✅ MyGovernor verified on Etherscan");
    } catch (e: any) {
        console.log("   ⚠️  Etherscan:", e.message || e);
    }

    console.log("\n🎉 Verification complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Verification failed:", error);
        process.exit(1);
    });




