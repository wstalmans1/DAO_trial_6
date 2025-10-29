# Why Against Votes Don't Count Toward Quorum (And How to Change It)

## Your Point is Valid! 🤔

**If quorum is about participation, then Against votes SHOULD count!**

You're absolutely right. This is a **design choice**, not a logical necessity.

---

## Current Behavior (OpenZeppelin Default)

```solidity
quorumReached = (For Votes + Abstain Votes) >= Quorum Threshold
// Against votes are EXCLUDED
```

## Why OpenZeppelin Excluded Against Votes

This follows the **Compound Governor Bravo** pattern. The reasoning:

### 1. **Prevents Strategic Blocking**
**Problem it solves:**
- A small group of voters could vote Against on every proposal just to meet quorum and then defeat it
- This makes governance easier to block by obstructionists

**Example:**
```
Quorum: 10%
Strategy: Vote Against on everything
Result: Quorum met (Because Against counts), then proposal defeated
```

### 2. **Encourages Positive Engagement**
**Idea:** 
- To meet quorum, people must vote For or Abstain (showing up with an opinion)
- This filters out pure obstructionist behavior

### 3. **Prevents Minority Obstruction**
**Scenario:**
- Small minority opposes all proposals
- They vote Against to meet quorum, then proposals fail
- With Against excluded, they can't block proposals alone

---

## The Alternative: True Participation-Based Quorum

If you want **ALL votes** to count toward quorum:

```solidity
function _quorumReached(uint256 proposalId) 
    internal 
    view 
    override(Governor, GovernorCountingSimple) 
    returns (bool) 
{
    ProposalVote storage proposalVote = _proposalVotes[proposalId];
    
    // Count ALL votes toward quorum (true participation metric)
    uint256 totalVotes = proposalVote.forVotes + 
                         proposalVote.againstVotes + 
                         proposalVote.abstainVotes;
    
    return quorum(proposalSnapshot(proposalId)) <= totalVotes;
}
```

This makes quorum truly about: **"Did enough people vote?"**

---

## Comparison Example

### Scenario:
- Total Supply: 1,000,000 MDT
- Quorum Threshold: 40,000 MDT (4%)
- For: 20,000
- Against: 25,000
- Abstain: 5,000

### Current Behavior (Against excluded):
```
Quorum Check: (20,000 + 5,000) = 25,000 < 40,000 ❌
Result: Quorum NOT reached, proposal DEFEATED
```

### With Against included:
```
Quorum Check: (20,000 + 25,000 + 5,000) = 50,000 >= 40,000 ✅
Majority Check: 20,000 < 25,000 ❌
Result: Quorum reached, but majority lost → DEFEATED
```

**Key difference:** With Against included, quorum is reached, but proposal still fails due to majority loss.

---

## Which Should You Use?

### Use Current (Against excluded) if:
- You want to prevent obstructionist voting
- You want to encourage positive engagement (For/Abstain)
- You follow Compound/Governor Bravo patterns

### Use All Votes Count if:
- You want quorum to truly measure participation
- You're okay with obstructionist tactics
- You prefer simpler logic: "participation = all votes"

---

## Recommendation

For a **1 person, 1 vote** system (like `MembershipAndVotes`), **includng Against votes** might make more sense because:
- Memberships are harder to game than tokens
- Participation is the key metric
- It's more intuitive: "Did enough people show up to vote?"

**However:** Consider both approaches and choose based on your DAO's needs!

