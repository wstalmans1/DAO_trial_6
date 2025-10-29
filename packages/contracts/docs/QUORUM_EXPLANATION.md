# Understanding Quorum in OpenZeppelin Governor

## What is Quorum?

**Quorum = Minimum participation required for a proposal to be valid**

Think of it like a meeting: you need enough people to show up before decisions can be made.

---

## How Quorum is Calculated

### Step 1: Calculate the Quorum Threshold

In your setup (`quorumFraction = 4%`):

```solidity
quorum = totalSupply * 4 / 100
```

**Example with your setup:**
- Total Supply = 1,000,000 MDT (or 20 members in MembershipAndVotes)
- Quorum Fraction = 4%
- **Quorum Threshold = 40,000 MDT** (or ~1 member if using membership)

This threshold is set at proposal creation time using `getPastTotalSupply(proposalStartBlock)`.

### Step 2: Check if Quorum is Reached

After voting ends, the check is:

```solidity
quorumReached = (For Votes + Abstain Votes) >= Quorum Threshold
```

**Important:** Against votes **DO NOT** count toward quorum!

---

## Why Two Separate Checks?

A proposal needs **BOTH** conditions to succeed:

1. **Quorum Reached:** Enough people participated
2. **Majority Wins:** More For than Against votes

Think of it as:
- Quorum = "Did enough people show up to vote?"
- Majority = "Do the voters want this proposal?"

---

## Concrete Examples

### Example 1: ✅ Proposal Succeeds

**Setup:**
- Total Supply: 1,000,000 MDT
- Quorum Threshold: 40,000 MDT (4%)

**Vote Results:**
- For: 30,000 MDT
- Against: 15,000 MDT  
- Abstain: 20,000 MDT
- Didn't vote: 935,000 MDT

**Check 1: Quorum**
```
For + Abstain = 30,000 + 20,000 = 50,000 MDT
Quorum Threshold = 40,000 MDT
50,000 >= 40,000 ✅ QUORUM REACHED
```

**Check 2: Majority**
```
For (30,000) > Against (15,000) ✅ MAJORITY WINS
```

**Result: ✅ Proposal SUCCEEDS** (can be executed)

---

### Example 2: ❌ Quorum NOT Reached

**Setup:**
- Total Supply: 1,000,000 MDT
- Quorum Threshold: 40,000 MDT (4%)

**Vote Results:**
- For: 25,000 MDT
- Against: 5,000 MDT
- Abstain: 8,000 MDT
- Didn't vote: 962,000 MDT

**Check 1: Quorum**
```
For + Abstain = 25,000 + 8,000 = 33,000 MDT
Quorum Threshold = 40,000 MDT
33,000 < 40,000 ❌ QUORUM NOT REACHED
```

**Check 2: Majority** (doesn't matter, quorum failed)
```
For (25,000) > Against (5,000) ✅ Would win, but...
```

**Result: ❌ Proposal DEFEATED** (quorum not reached, cannot execute)

---

### Example 3: ❌ Quorum Reached but Majority Lost

**Setup:**
- Total Supply: 1,000,000 MDT
- Quorum Threshold: 40,000 MDT (4%)

**Vote Results:**
- For: 20,000 MDT
- Against: 35,000 MDT
- Abstain: 25,000 MDT
- Didn't vote: 920,000 MDT

**Check 1: Quorum**
```
For + Abstain = 20,000 + 25,000 = 45,000 MDT
Quorum Threshold = 40,000 MDT
45,000 >= 40,000 ✅ QUORUM REACHED
```

**Check 2: Majority**
```
For (20,000) < Against (35,000) ❌ MAJORITY LOST
```

**Result: ❌ Proposal DEFEATED** (quorum reached but majority lost)

---

## Why Against Votes Don't Count Toward Quorum?

This is a design choice in `GovernorCountingSimple`:

- **Quorum** = "Did enough people participate?" 
  - Uses: For + Abstain (people who engaged)
  
- **Majority** = "Do voters support this?"
  - Compares: For vs Against

The idea: Abstain means "I showed up but don't have an opinion" → counts for participation.
Against means "I showed up and oppose this" → counts for majority but not participation.

In practice, this means:
- You can't block proposals by voting Against with low participation
- You must actually show up and vote For/Abstain to meet quorum

---

## With MembershipAndVotes (1 person, 1 vote)

The same logic applies, but simpler:

**Example:**
- Total Members: 20
- Quorum Threshold: 1 member (if quorumFraction = 5%)

**Vote Results:**
- For: 8 members
- Against: 10 members
- Abstain: 1 member
- Didn't vote: 1 member

**Check 1: Quorum**
```
For + Abstain = 8 + 1 = 9 members
Quorum Threshold = 1 member
9 >= 1 ✅ QUORUM REACHED
```

**Check 2: Majority**
```
For (8) < Against (10) ❌ MAJORITY LOST
```

**Result: ❌ Proposal DEFEATED**

---

## Summary

| Concept | What It Means | Formula |
|---------|---------------|---------|
| **Quorum Threshold** | Minimum votes needed | `totalSupply * quorumFraction / 100` |
| **Quorum Reached** | Enough people voted | `(For + Abstain) >= Quorum Threshold` |
| **Majority** | More support than opposition | `For > Against` |
| **Proposal Succeeds** | Both conditions met | `Quorum Reached AND Majority Wins` |

**Key Insight:** Quorum is about **participation**, not about winning. You can have quorum but still lose the vote!

