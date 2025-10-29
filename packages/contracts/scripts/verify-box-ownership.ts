import { ethers } from "hardhat";

async function main() {
    const BOX_ADDRESS = "0xF48B6a410bF4C6A8Fe2B587b7BE626f0439f7237";
    const GOVERNOR_ADDRESS = "0xc5A92da165d3d017B13b4428E4d4fd4a59B287c4";
    
    const [deployer] = await (ethers as any).getSigners();
    
    const Box = await ethers.getContractFactory("Box");
    const box = Box.attach(BOX_ADDRESS);
    
    const owner = await box.owner();
    console.log("📦 Box ownership:");
    console.log("   Box address:", BOX_ADDRESS);
    console.log("   Current owner:", owner);
    console.log("   Governor address:", GOVERNOR_ADDRESS);
    console.log("   Owner is Governor:", owner.toLowerCase() === GOVERNOR_ADDRESS.toLowerCase() ? "✅ YES" : "❌ NO");
    
    if (owner.toLowerCase() !== GOVERNOR_ADDRESS.toLowerCase()) {
        console.log("\n⚠️  Box is NOT owned by the Governor!");
        console.log("   This needs to be fixed before creating proposals.");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });


