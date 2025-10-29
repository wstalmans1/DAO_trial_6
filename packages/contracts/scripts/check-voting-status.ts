import { ethers } from "hardhat";

async function main() {
    const TOKEN_ADDRESS = "0x8fF0FF3CB9B904E911c0B8E0a5db9cBD6fa036d3";
    const GOVERNOR_ADDRESS = "0xc5A92da165d3d017B13b4428E4d4fd4a59B287c4";
    
    const [deployer] = await (ethers as any).getSigners();
    console.log("Account:", deployer.address);
    console.log("ETH balance:", ethers.utils.formatEther(await deployer.getBalance()), "\n");
    
    const MyToken20 = await ethers.getContractFactory("MyToken20");
    const token = MyToken20.attach(TOKEN_ADDRESS);
    
    const MyGovernor = await ethers.getContractFactory("MyGovernor");
    const governor = MyGovernor.attach(GOVERNOR_ADDRESS);
    
    const balance = await token.balanceOf(deployer.address);
    const delegated = await token.delegates(deployer.address);
    const votingPower = await token.getVotes(deployer.address);
    const proposalThreshold = await governor.proposalThreshold();
    
    console.log("📊 Voting Status:");
    console.log("   Token balance:", ethers.utils.formatEther(balance));
    console.log("   Delegated to:", delegated);
    console.log("   Voting power:", ethers.utils.formatEther(votingPower));
    console.log("   Proposal threshold:", ethers.utils.formatEther(proposalThreshold));
    console.log("   Can propose:", votingPower.gte(proposalThreshold) ? "✅ YES" : "❌ NO");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });


