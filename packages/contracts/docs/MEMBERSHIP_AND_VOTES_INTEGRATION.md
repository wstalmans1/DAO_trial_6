# Using MembershipAndVotes with MyGovernor

## Quick Answer

✅ **No code changes needed!** `MyGovernor` already accepts any `IVotes` contract.

Just deploy `MembershipAndVotes` instead of `MyToken20` and pass it to `MyGovernor`.

---

## What You Don't Need Anymore

If you're using `MembershipAndVotes` for **1 person, 1 vote** governance:

- ❌ **MyToken20.sol** - Not needed (unless you want token-based voting)
- ✅ **MembershipAndVotes.sol** - Use this instead

---

## How MyGovernor Works with Both

`MyGovernor` constructor accepts:
```solidity
constructor(
    string memory _name,
    IVotes token,  // <-- Can be MyToken20 OR MembershipAndVotes!
    ...
)
```

Both contracts implement `IVotes`:
- `MyToken20` implements `IVotes` via `ERC20Votes`
- `MembershipAndVotes` implements `IVotes` via `Votes` base contract

**So `MyGovernor` works with both - zero code changes needed!**

---

## Deployment Comparison

### Token-Based Governance (MyToken20)

```typescript
// 1. Deploy token
const MyToken20 = await ethers.getContractFactory("MyToken20");
const token = await MyToken20.deploy(
    "MyDAO Token",
    "MDT",
    ethers.utils.parseEther("1000000") // 1M tokens
);

// 2. Deploy Governor with token
const MyGovernor = await ethers.getContractFactory("MyGovernor");
const governor = await MyGovernor.deploy(
    "MyGovernor",
    token.address,           // <-- Token address
    1,                       // votingDelay
    7,                       // votingPeriod
    ethers.utils.parseEther("1000"), // proposalThreshold (1000 tokens)
    4                        // quorumFraction (4%)
);

// 3. Delegate voting power to self
await token.delegate(deployer.address);
```

**Voting Power:**
- Each token = 1 vote
- Total supply = 1,000,000 tokens = 1,000,000 votes
- Proposal threshold = 1,000 tokens
- Quorum = 40,000 tokens (4% of supply)

---

### Membership-Based Governance (MembershipAndVotes)

```typescript
// 1. Deploy membership registry
const MembershipAndVotes = await ethers.getContractFactory("MembershipAndVotes");
const membership = await MembershipAndVotes.deploy(deployer.address);

// 2. Deploy Governor with membership
const MyGovernor = await ethers.getContractFactory("MyGovernor");
const governor = await MyGovernor.deploy(
    "MyGovernor",
    membership.address,      // <-- Membership address (NOT token!)
    1,                       // votingDelay
    7,                       // votingPeriod
    1,                       // proposalThreshold (1 member!)
    4                        // quorumFraction (4% of members)
);

// 3. Add members (auto-delegates to self)
await membership.addMember(deployer.address);
await membership.addMember(voter1.address);
await membership.addMember(voter2.address);
// ... add all members
```

**Voting Power:**
- Each member = 1 vote
- Total members = number of members added
- Proposal threshold = 1 member
- Quorum = (totalMembers * 4) / 100 (4% of members)

---

## Key Differences

| Aspect | MyToken20 | MembershipAndVotes |
|--------|-----------|-------------------|
| **Voting Unit** | Token balance | Member status (1 or 0) |
| **Proposal Threshold** | e.g., 1000 tokens | e.g., 1 member |
| **Quorum** | % of total token supply | % of total members |
| **Delegation** | Manual (must call `delegate()`) | Automatic (on `addMember()`) |
| **Flexibility** | Transferable tokens | Fixed membership |
| **1 Person, 1 Vote** | ❌ No (more tokens = more votes) | ✅ Yes (each member = 1 vote) |

---

## Complete Deployment Script for Membership

```typescript
import { ethers } from "hardhat";

async function main() {
    const [deployer, member1, member2, member3] = await ethers.getSigners();

    // 1. Deploy MembershipAndVotes
    console.log("Deploying MembershipAndVotes...");
    const MembershipAndVotes = await ethers.getContractFactory("MembershipAndVotes");
    const membership = await MembershipAndVotes.deploy(deployer.address);
    await membership.deployed();
    console.log("Membership deployed to:", membership.address);

    // 2. Deploy MyGovernor
    console.log("\nDeploying MyGovernor...");
    const MyGovernor = await ethers.getContractFactory("MyGovernor");
    const governor = await MyGovernor.deploy(
        "MyGovernor",
        membership.address,  // Pass membership, not token!
        1,                    // votingDelay
        7,                    // votingPeriod (7 blocks for testing)
        1,                    // proposalThreshold (1 member)
        4                     // quorumFraction (4%)
    );
    await governor.deployed();
    console.log("Governor deployed to:", governor.address);

    // 3. Add members
    console.log("\nAdding members...");
    await membership.addMember(deployer.address);
    await membership.addMember(member1.address);
    await membership.addMember(member2.address);
    await membership.addMember(member3.address);
    
    const totalMembers = await membership.totalMembers();
    console.log(`Total members: ${totalMembers}`);

    // 4. Verify voting power
    console.log("\nVerifying voting power...");
    const deployerVotes = await membership.getVotes(deployer.address);
    console.log(`Deployer voting power: ${deployerVotes}`); // Should be 1

    // 5. Deploy Box for proposals
    console.log("\nDeploying Box...");
    const Box = await ethers.getContractFactory("Box");
    const box = await Box.deploy(governor.address);
    await box.deployed();
    console.log("Box deployed to:", box.address);

    console.log("\n✅ Setup complete!");
    console.log("   Membership:", membership.address);
    console.log("   Governor:", governor.address);
    console.log("   Box:", box.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

---

## Summary

✅ **MyGovernor doesn't need changes** - it already accepts `IVotes`  
✅ **Just pass `MembershipAndVotes` address** instead of `MyToken20`  
✅ **Use threshold of 1** for membership (one member can propose)  
✅ **Members automatically delegated** when added (no manual `delegate()` needed)

**That's it!** Your governance is now 1 person, 1 vote! 🎉

