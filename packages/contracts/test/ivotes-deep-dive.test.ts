import { expect } from "chai";
import { ethers } from "hardhat";
import { MyToken20, MyGovernor, Box } from "../typechain-types";

/**
 * @title IVotes Deep Dive Tests
 * @notice Phase 2: Understanding how Governor snapshot reads map to IVotes calls
 * @dev These tests explore:
 * - getVotes, getPastVotes, getPastTotalSupply
 * - Votes base internals: checkpoints, delegation, move delegates, supply checkpoints
 * - COUNTING_MODE via GovernorCountingSimple
 * - Edge cases around snapshot boundaries
 */
describe("Phase 2: IVotes and Votes Deep Dive", function () {
    let token: MyToken20;
    let governor: MyGovernor;
    let box: Box;
    let owner: any;
    let voter1: any;
    let voter2: any;
    let voter3: any;

    beforeEach(async function () {
        // Get signers
        [owner, voter1, voter2, voter3] = await ethers.getSigners();

        // Deploy Box contract
        const Box = await ethers.getContractFactory("Box");
        box = await Box.deploy(owner.address);
        await box.deployed();

        // Deploy MyToken20 contract
        const MyToken20 = await ethers.getContractFactory("MyToken20");
        token = await MyToken20.deploy(
            "MyDAO Token",
            "MDT",
            ethers.utils.parseEther("1000000") // 1M tokens
        );
        await token.deployed();

        // Deploy MyGovernor contract
        const MyGovernor = await ethers.getContractFactory("MyGovernor");
        governor = await MyGovernor.deploy(
            "MyGovernor",
            token.address,
            1, // votingDelay (1 block)
            7, // votingPeriod (7 blocks for faster testing)
            ethers.utils.parseEther("1000"), // proposalThreshold (1000 MDT)
            4 // quorumFraction (4%)
        );
        await governor.deployed();

        // Transfer Box ownership to Governor
        await box.transferOwnership(governor.address);

        // Delegate voting power to self (CRITICAL!)
        await token.delegate(owner.address);
    });

    describe("1. Understanding getVotes vs getPastVotes", function () {
        it("Should show different results for current vs past voting power", async function () {
            const currentBlock = await ethers.provider.getBlockNumber();
            
            // Get current voting power
            const currentVotes = await token.getVotes(owner.address);
            
            // Mint new tokens (this creates a new checkpoint)
            await token.mint(owner.address, ethers.utils.parseEther("100000"));
            
            // Get past voting power (at the block before minting)
            const pastVotes = await token.getPastVotes(owner.address, currentBlock);
            
            // Current votes should be higher
            expect(currentVotes).to.equal(pastVotes.add(ethers.utils.parseEther("100000")));
            
            console.log("\n📊 Voting Power Comparison:");
            console.log(`   Current block: ${currentBlock}`);
            console.log(`   Past votes (block ${currentBlock}): ${ethers.utils.formatEther(pastVotes)} MDT`);
            console.log(`   Current votes: ${ethers.utils.formatEther(currentVotes)} MDT`);
        });

        it("Should demonstrate snapshot immutability", async function () {
            // Get voting power at current block
            const block1 = await ethers.provider.getBlockNumber();
            const votesBlock1 = await token.getVotes(owner.address);
            
            // Transfer tokens away
            await token.transfer(voter1.address, ethers.utils.parseEther("500000"));
            await token.connect(voter1).delegate(voter1.address);
            
            // Get past voting power at original block (should be unchanged)
            const pastVotesBlock1 = await token.getPastVotes(owner.address, block1);
            
            // Past voting power should match original
            expect(pastVotesBlock1).to.equal(votesBlock1);
            
            // Current voting power should be reduced
            const currentVotes = await token.getVotes(owner.address);
            expect(currentVotes).to.be.lt(pastVotesBlock1);
        });
    });

    describe("2. Exploring getPastTotalSupply", function () {
        it("Should track historical total supply", async function () {
            const block1 = await ethers.provider.getBlockNumber();
            const supplyBlock1 = await token.totalSupply();
            
            // Mint new tokens
            await token.mint(owner.address, ethers.utils.parseEther("200000"));
            
            // Get past total supply
            const pastSupply = await token.getPastTotalSupply(block1);
            const currentSupply = await token.totalSupply();
            
            expect(pastSupply).to.equal(supplyBlock1);
            expect(currentSupply).to.equal(pastSupply.add(ethers.utils.parseEther("200000")));
            
            console.log("\n📦 Total Supply Comparison:");
            console.log(`   Supply at block ${block1}: ${ethers.utils.formatEther(pastSupply)} MDT`);
            console.log(`   Current supply: ${ethers.utils.formatEther(currentSupply)} MDT`);
        });

        it("Should show how quorum is calculated from past supply", async function () {
            const block = await ethers.provider.getBlockNumber();
            
            // Get past total supply
            const pastSupply = await token.getPastTotalSupply(block);
            
            // Calculate quorum (4% of total supply)
            const quorum = await governor.quorum(block);
            const expectedQuorum = pastSupply.mul(4).div(100);
            
            expect(quorum).to.equal(expectedQuorum);
            
            console.log("\n🔢 Quorum Calculation:");
            console.log(`   Total supply: ${ethers.utils.formatEther(pastSupply)} MDT`);
            console.log(`   Quorum (4%): ${ethers.utils.formatEther(quorum)} MDT`);
        });
    });

    describe("3. Delegation Mechanisms", function () {
        it("Should allow delegation to self", async function () {
            // Transfer tokens to voter1
            await token.transfer(voter1.address, ethers.utils.parseEther("100000"));
            
            // Initially, voter1 has no voting power (not delegated)
            let votingPower = await token.getVotes(voter1.address);
            expect(votingPower).to.equal(0);
            
            // Delegate to self
            await token.connect(voter1).delegate(voter1.address);
            
            // Now voter1 has voting power
            votingPower = await token.getVotes(voter1.address);
            expect(votingPower).to.equal(ethers.utils.parseEther("100000"));
            
            console.log("\n👤 Delegation to Self:");
            console.log(`   Before delegation: ${ethers.utils.formatEther(await token.getVotes(voter1.address))} MDT`);
            console.log(`   After delegation: ${ethers.utils.formatEther(votingPower)} MDT`);
        });

        it("Should allow delegation to others", async function () {
            // Transfer tokens to voter1
            await token.transfer(voter1.address, ethers.utils.parseEther("100000"));
            
            // Delegate to voter2
            await token.connect(voter1).delegate(voter2.address);
            
            // voter1 has no voting power
            const voter1Power = await token.getVotes(voter1.address);
            expect(voter1Power).to.equal(0);
            
            // voter2 has the voting power
            const voter2Power = await token.getVotes(voter2.address);
            expect(voter2Power).to.equal(ethers.utils.parseEther("100000"));
            
            console.log("\n🔄 Delegation to Others:");
            console.log(`   voter1 voting power: ${ethers.utils.formatEther(voter1Power)} MDT`);
            console.log(`   voter2 voting power: ${ethers.utils.formatEther(voter2Power)} MDT`);
        });

        it("Should demonstrate move delegates on transfer", async function () {
            // Delegate voter1's tokens to voter2
            await token.transfer(voter1.address, ethers.utils.parseEther("100000"));
            await token.connect(voter1).delegate(voter2.address);
            
            // Check initial delegation
            const voter2InitialPower = await token.getVotes(voter2.address);
            expect(voter2InitialPower).to.equal(ethers.utils.parseEther("100000"));
            
            // Transfer tokens back to owner
            await token.connect(voter1).transfer(owner.address, ethers.utils.parseEther("100000"));
            
            // voter2's voting power should decrease
            const voter2NewPower = await token.getVotes(voter2.address);
            expect(voter2NewPower).to.equal(0);
            
            // Owner's voting power should increase (but not double-count)
            // Owner already has delegated tokens, so this adds to the delegation
            const ownerPower = await token.getVotes(owner.address);
            
            console.log("\n🚚 Move Delegates on Transfer:");
            console.log(`   Initial voter2 power: ${ethers.utils.formatEther(voter2InitialPower)} MDT`);
            console.log(`   After transfer voter2 power: ${ethers.utils.formatEther(voter2NewPower)} MDT`);
            console.log(`   Owner voting power: ${ethers.utils.formatEther(ownerPower)} MDT`);
        });
    });

    describe("4. Proposal Snapshot Boundaries", function () {
        it("Should capture voting power at proposal start block", async function () {
            // Distribute tokens and delegate
            await token.transfer(voter1.address, ethers.utils.parseEther("200000"));
            await token.connect(voter1).delegate(voter1.address);
            
            const blockBeforeProposal = await ethers.provider.getBlockNumber();
            
            // Create proposal
            const calldata = box.interface.encodeFunctionData("store", [42]);
            const description = "Change Box value to 42";
            
            const proposeTx = await governor.propose(
                [box.address],
                [0],
                [calldata],
                description
            );
            const receipt = await proposeTx.wait();
            
            // Extract proposal ID
            const proposalCreatedEvent = receipt.logs.find(
                (log: any) => log.topics[0] === ethers.utils.id("ProposalCreated(uint256,address,uint256,string,uint256,uint256,uint256,uint8,string,bytes32)")
            );
            const proposalId = ethers.BigNumber.from(proposalCreatedEvent!.topics[1]);
            
            // Mine one block to activate proposal
            await ethers.provider.send("evm_mine", []);
            
            // Transfer tokens after proposal (should not affect proposal voting)
            await token.transfer(voter2.address, ethers.utils.parseEther("300000"));
            await token.connect(voter2).delegate(voter2.address);
            
            // Check voting power at proposal start
            const votingPowerAtStart = await token.getPastVotes(
                owner.address,
                blockBeforeProposal + 1
            );
            
            console.log("\n📸 Snapshot Boundary Test:");
            console.log(`   Proposal ID: ${proposalId.toString()}`);
            console.log(`   Proposal start block: ${blockBeforeProposal + 1}`);
            console.log(`   Voting power at snapshot: ${ethers.utils.formatEther(votingPowerAtStart)} MDT`);
        });

        it("Should use snapshot voting power for voting, not current", async function () {
            // Create proposal while owner has 1M tokens
            const calldata = box.interface.encodeFunctionData("store", [42]);
            const description = "Change Box value to 42";
            
            const proposeTx = await governor.propose(
                [box.address],
                [0],
                [calldata],
                description
            );
            const receipt = await proposeTx.wait();
            
            const proposalCreatedEvent = receipt.logs.find(
                (log: any) => log.topics[0] === ethers.utils.id("ProposalCreated(uint256,address,uint256,string,uint256,uint256,uint256,uint8,string,bytes32)")
            );
            const proposalId = ethers.BigNumber.from(proposalCreatedEvent!.topics[1]);
            
            // Transfer most tokens away AFTER proposal is created
            await token.transfer(voter1.address, ethers.utils.parseEther("990000"));
            
            // Mine one block to activate
            await ethers.provider.send("evm_mine", []);
            
            // Vote should still have original voting power
            await governor.castVote(proposalId, 1);
            
            const proposal = await governor.proposalVotes(proposalId);
            // Should have 1M votes, not 10k
            expect(proposal.forVotes).to.equal(ethers.utils.parseEther("1000000"));
            
            console.log("\n🎯 Snapshot Voting Power:");
            console.log(`   Votes counted: ${ethers.utils.formatEther(proposal.forVotes)} MDT`);
            console.log(`   Current voting power: ${ethers.utils.formatEther(await token.getVotes(owner.address))} MDT`);
        });
    });

    describe("5. COUNTING_MODE Validation", function () {
        it("Should return correct COUNTING_MODE", async function () {
            const countingMode = await governor.COUNTING_MODE();
            expect(countingMode).to.equal("support=bravo");
            
            console.log("\n📊 Counting Mode:");
            console.log(`   Mode: ${countingMode}`);
            console.log(`   Meaning: For (1), Against (0), Abstain (2)`);
        });

        it("Should count votes correctly according to COUNTING_MODE", async function () {
            // Distribute tokens
            await token.transfer(voter1.address, ethers.utils.parseEther("100000"));
            await token.transfer(voter2.address, ethers.utils.parseEther("100000"));
            await token.connect(voter1).delegate(voter1.address);
            await token.connect(voter2).delegate(voter2.address);
            
            // Create proposal
            const calldata = box.interface.encodeFunctionData("store", [42]);
            const description = "Change Box value to 42";
            
            const proposeTx = await governor.propose(
                [box.address],
                [0],
                [calldata],
                description
            );
            const receipt = await proposeTx.wait();
            
            const proposalCreatedEvent = receipt.logs.find(
                (log: any) => log.topics[0] === ethers.utils.id("ProposalCreated(uint256,address,uint256,string,uint256,uint256,uint256,uint8,string,bytes32)")
            );
            const proposalId = ethers.BigNumber.from(proposalCreatedEvent!.topics[1]);
            
            // Mine one block to activate
            await ethers.provider.send("evm_mine", []);
            
            // Vote with different options
            await governor.castVote(proposalId, 1); // For
            await governor.connect(voter1).castVote(proposalId, 0); // Against
            await governor.connect(voter2).castVote(proposalId, 2); // Abstain
            
            const proposal = await governor.proposalVotes(proposalId);
            
            console.log("\n🗳️ Vote Counting:");
            console.log(`   For votes: ${ethers.utils.formatEther(proposal.forVotes)} MDT`);
            console.log(`   Against votes: ${ethers.utils.formatEther(proposal.againstVotes)} MDT`);
            console.log(`   Abstain votes: ${ethers.utils.formatEther(proposal.abstainVotes)} MDT`);
            
            expect(proposal.forVotes).to.equal(ethers.utils.parseEther("1000000")); // Owner
            expect(proposal.againstVotes).to.equal(ethers.utils.parseEther("100000")); // voter1
            expect(proposal.abstainVotes).to.equal(ethers.utils.parseEther("100000")); // voter2
        });
    });

    describe("6. Edge Cases Around Snapshot Boundaries", function () {
        it("Should handle checkpoint lookup for future blocks", async function () {
            const currentBlock = await ethers.provider.getBlockNumber();
            const futureBlock = currentBlock + 100;
            
            // Should revert for future blocks
            await expect(
                token.getPastVotes(owner.address, futureBlock)
            ).to.be.reverted;
        });

        it("Should handle checkpoint lookup for current block", async function () {
            const currentBlock = await ethers.provider.getBlockNumber();
            const currentVotes = await token.getVotes(owner.address);
            
            // getPastVotes at current block should equal getVotes
            const pastVotes = await token.getPastVotes(owner.address, currentBlock);
            expect(currentVotes).to.equal(pastVotes);
        });

        it("Should handle multiple delegation changes within proposal period", async function () {
            // Create proposal
            const calldata = box.interface.encodeFunctionData("store", [42]);
            const description = "Change Box value to 42";
            
            const proposeTx = await governor.propose(
                [box.address],
                [0],
                [calldata],
                description
            );
            const receipt = await proposeTx.wait();
            
            const proposalCreatedEvent = receipt.logs.find(
                (log: any) => log.topics[0] === ethers.utils.id("ProposalCreated(uint256,address,uint256,string,uint256,uint256,uint256,uint8,string,bytes32)")
            );
            const proposalId = ethers.BigNumber.from(proposalCreatedEvent!.topics[1]);
            
            const block1 = await ethers.provider.getBlockNumber();
            
            // Transfer tokens and change delegation during proposal period
            await token.transfer(voter1.address, ethers.utils.parseEther("200000"));
            await token.connect(voter1).delegate(voter1.address);
            
            await ethers.provider.send("evm_mine", []);
            
            // Vote should use voting power at proposal start, not after delegation change
            await governor.castVote(proposalId, 1);
            
            const proposal = await governor.proposalVotes(proposalId);
            // Should have 1M votes (from snapshot)
            expect(proposal.forVotes).to.equal(ethers.utils.parseEther("1000000"));
        });
    });

    describe("7. Integration: Full Proposal Flow with Deep Insights", function () {
        it("Should demonstrate complete flow with voting power insights", async function () {
            // Step 1: Check initial state
            const block0 = await ethers.provider.getBlockNumber();
            const votingPower0 = await token.getVotes(owner.address);
            
            console.log("\n🎬 Complete Proposal Flow:");
            console.log(`   Initial block: ${block0}`);
            console.log(`   Initial voting power: ${ethers.utils.formatEther(votingPower0)} MDT`);
            
            // Step 2: Create proposal
            const calldata = box.interface.encodeFunctionData("store", [42]);
            const description = "Change Box value to 42";
            
            const proposeTx = await governor.propose(
                [box.address],
                [0],
                [calldata],
                description
            );
            const receipt = await proposeTx.wait();
            
            const proposalCreatedEvent = receipt.logs.find(
                (log: any) => log.topics[0] === ethers.utils.id("ProposalCreated(uint256,address,uint256,string,uint256,uint256,uint256,uint8,string,bytes32)")
            );
            const proposalId = ethers.BigNumber.from(proposalCreatedEvent!.topics[1]);
            
            const snapshotBlock = block0 + 1; // votingDelay
            
            console.log(`\n   ✅ Proposal created: ${proposalId.toString()}`);
            console.log(`   Snapshot block (for voting): ${snapshotBlock}`);
            
            // Step 3: Wait for activation
            await ethers.provider.send("evm_mine", []);
            const stateBeforeVote = await governor.state(proposalId);
            console.log(`   State: ${stateBeforeVote} (Active)`);
            
            // Step 4: Vote with snapshot voting power
            await governor.castVote(proposalId, 1);
            
            // Step 5: Wait for voting period
            for (let i = 0; i < 7; i++) {
                await ethers.provider.send("evm_mine", []);
            }
            
            const stateAfterVote = await governor.state(proposalId);
            console.log(`   State: ${stateAfterVote} (Succeeded)`);
            
            // Step 6: Execute
            const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description));
            const executeTx = await governor.execute(
                [box.address],
                [0],
                [calldata],
                descriptionHash
            );
            await executeTx.wait();
            
            const finalState = await governor.state(proposalId);
            const boxValue = await box.retrieve();
            
            console.log(`   ✅ Executed!`);
            console.log(`   Final state: ${finalState} (Executed)`);
            console.log(`   Box value: ${boxValue.toString()}`);
            
            expect(stateAfterVote).to.equal(4); // Succeeded
            expect(finalState).to.equal(7); // Executed
            expect(boxValue).to.equal(42);
        });
    });
});

