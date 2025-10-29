import { expect } from "chai";
import { ethers } from "hardhat";
import { Box, MyToken20, MyGovernor } from "../typechain-types";

/**
 * @title Governance System Tests
 * @notice Comprehensive tests for the governance system
 * @dev Tests cover proposal lifecycle, voting mechanics, and IVotes integration
 */
describe("Governance System", function () {
    let box: Box;
    let token: MyToken20;
    let governor: MyGovernor;
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
        await box.waitForDeployment();

        // Deploy MyToken20 contract
        const MyToken20 = await ethers.getContractFactory("MyToken20");
        token = await MyToken20.deploy(
            "MyDAO Token",
            "MDT",
            ethers.parseEther("1000000") // 1M tokens
        );
        await token.waitForDeployment();

        // Deploy MyGovernor contract
        const MyGovernor = await ethers.getContractFactory("MyGovernor");
        governor = await MyGovernor.deploy(
            "MyGovernor",
            await token.getAddress(),
            1, // votingDelay (1 block)
            45818, // votingPeriod (45818 blocks ≈ 1 week)
            ethers.parseEther("1000"), // proposalThreshold (1000 MDT)
            4 // quorumFraction (4%)
        );
        await governor.waitForDeployment();

        // Transfer Box ownership to Governor
        await box.transferOwnership(await governor.getAddress());

        // Delegate voting power to self (CRITICAL!)
        await token.delegate(owner.address);
    });

    describe("Contract Deployment", function () {
        it("Should deploy all contracts successfully", async function () {
            expect(await box.getAddress()).to.be.properAddress;
            expect(await token.getAddress()).to.be.properAddress;
            expect(await governor.getAddress()).to.be.properAddress;
        });

        it("Should set correct initial values", async function () {
            expect(await box.retrieve()).to.equal(0);
            expect(await token.name()).to.equal("MyDAO Token");
            expect(await token.symbol()).to.equal("MDT");
            expect(await token.totalSupply()).to.equal(ethers.parseEther("1000000"));
            expect(await governor.name()).to.equal("MyGovernor");
        });

        it("Should set correct governance parameters", async function () {
            expect(await governor.votingDelay()).to.equal(1);
            expect(await governor.votingPeriod()).to.equal(45818);
            expect(await governor.proposalThreshold()).to.equal(ethers.parseEther("1000"));
            expect(await governor.quorum(await ethers.provider.getBlockNumber())).to.equal(ethers.parseEther("40000")); // 4% of 1M
        });
    });

    describe("Token Voting Power", function () {
        it("Should track voting power correctly", async function () {
            const currentBlock = await ethers.provider.getBlockNumber();
            const votingPower = await token.getVotes(owner.address);
            const balance = await token.balanceOf(owner.address);
            
            expect(votingPower).to.equal(balance);
            expect(votingPower).to.equal(ethers.parseEther("1000000"));
        });

        it("Should update voting power on transfers", async function () {
            // Transfer tokens to voter1
            await token.transfer(voter1.address, ethers.parseEther("100000"));
            
            // Delegate voting power to self
            await token.connect(voter1).delegate(voter1.address);
            
            // Check voting power
            const ownerVotingPower = await token.getVotes(owner.address);
            const voter1VotingPower = await token.getVotes(voter1.address);
            
            expect(ownerVotingPower).to.equal(ethers.parseEther("900000"));
            expect(voter1VotingPower).to.equal(ethers.parseEther("100000"));
        });

        it("Should require delegation to vote", async function () {
            // Transfer tokens to voter1 but don't delegate
            await token.transfer(voter1.address, ethers.parseEther("100000"));
            
            // Check voting power (should be 0 without delegation)
            const votingPower = await token.getVotes(voter1.address);
            expect(votingPower).to.equal(0);
        });
    });

    describe("Proposal Creation", function () {
        it("Should create proposal successfully", async function () {
            const calldata = box.interface.encodeFunctionData("store", [42]);
            const description = "Change Box value to 42";
            
            const proposeTx = await governor.propose(
                [await box.getAddress()],
                [0],
                [calldata],
                description
            );
            
            const receipt = await proposeTx.wait();
            expect(receipt).to.not.be.null;
            
            // Check proposal state (should be Pending)
            const proposalCreatedEvent = receipt?.logs.find(
                log => log.topics[0] === ethers.id("ProposalCreated(uint256,address,uint256,string,uint256,uint256,uint256,uint8,string,bytes32)")
            );
            
            expect(proposalCreatedEvent).to.not.be.undefined;
        });

        it("Should require sufficient voting power to propose", async function () {
            // Transfer most tokens away, leaving less than threshold
            await token.transfer(voter1.address, ethers.parseEther("999500")); // Leave 500 MDT
            await token.connect(voter1).delegate(voter1.address);
            
            const calldata = box.interface.encodeFunctionData("store", [42]);
            const description = "Change Box value to 42";
            
            // Should fail because voting power < threshold
            await expect(
                governor.propose(
                    [await box.getAddress()],
                    [0],
                    [calldata],
                    description
                )
            ).to.be.revertedWith("Governor: proposer votes below proposal threshold");
        });
    });

    describe("Proposal Lifecycle", function () {
        let proposalId: bigint;

        beforeEach(async function () {
            // Create a proposal
            const calldata = box.interface.encodeFunctionData("store", [42]);
            const description = "Change Box value to 42";
            
            const proposeTx = await governor.propose(
                [await box.getAddress()],
                [0],
                [calldata],
                description
            );
            
            const receipt = await proposeTx.wait();
            const proposalCreatedEvent = receipt?.logs.find(
                log => log.topics[0] === ethers.id("ProposalCreated(uint256,address,uint256,string,uint256,uint256,uint256,uint8,string,bytes32)")
            );
            
            proposalId = ethers.getBigInt(proposalCreatedEvent!.data);
        });

        it("Should start in Pending state", async function () {
            const state = await governor.state(proposalId);
            expect(state).to.equal(0); // Pending
        });

        it("Should transition to Active state after voting delay", async function () {
            // Mine one block to pass voting delay
            await ethers.provider.send("evm_mine", []);
            
            const state = await governor.state(proposalId);
            expect(state).to.equal(1); // Active
        });

        it("Should allow voting when active", async function () {
            // Mine one block to pass voting delay
            await ethers.provider.send("evm_mine", []);
            
            // Vote FOR the proposal
            const voteTx = await governor.castVote(proposalId, 1); // 1 = For
            await voteTx.wait();
            
            // Check that vote was recorded
            const hasVoted = await governor.hasVoted(proposalId, owner.address);
            expect(hasVoted).to.be.true;
        });

        it("Should calculate quorum correctly", async function () {
            const currentBlock = await ethers.provider.getBlockNumber();
            const totalSupply = await token.getPastTotalSupply(currentBlock);
            const quorum = await governor.quorum(currentBlock);
            
            // Quorum should be 4% of total supply
            expect(quorum).to.equal(totalSupply * 4n / 100n);
            expect(quorum).to.equal(ethers.parseEther("40000")); // 4% of 1M
        });

        it("Should succeed with sufficient votes", async function () {
            // Mine one block to pass voting delay
            await ethers.provider.send("evm_mine", []);
            
            // Vote FOR the proposal
            await governor.castVote(proposalId, 1);
            
            // Mine blocks to pass voting period
            for (let i = 0; i < 45818; i++) {
                await ethers.provider.send("evm_mine", []);
            }
            
            const state = await governor.state(proposalId);
            expect(state).to.equal(4); // Succeeded
        });

        it("Should execute successfully when succeeded", async function () {
            // Mine one block to pass voting delay
            await ethers.provider.send("evm_mine", []);
            
            // Vote FOR the proposal
            await governor.castVote(proposalId, 1);
            
            // Mine blocks to pass voting period
            for (let i = 0; i < 45818; i++) {
                await ethers.provider.send("evm_mine", []);
            }
            
            // Execute the proposal
            const calldata = box.interface.encodeFunctionData("store", [42]);
            const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes("Change Box value to 42"));
            
            const executeTx = await governor.execute(
                [await box.getAddress()],
                [0],
                [calldata],
                descriptionHash
            );
            await executeTx.wait();
            
            // Check that Box value was changed
            const newValue = await box.retrieve();
            expect(newValue).to.equal(42);
            
            // Check final state
            const state = await governor.state(proposalId);
            expect(state).to.equal(7); // Executed
        });
    });

    describe("Vote Counting", function () {
        it("Should count votes correctly", async function () {
            // Distribute tokens to multiple voters
            await token.transfer(voter1.address, ethers.parseEther("200000"));
            await token.transfer(voter2.address, ethers.parseEther("200000"));
            await token.transfer(voter3.address, ethers.parseEther("200000"));
            
            // Delegate voting power
            await token.connect(voter1).delegate(voter1.address);
            await token.connect(voter2).delegate(voter2.address);
            await token.connect(voter3).delegate(voter3.address);
            
            // Create proposal
            const calldata = box.interface.encodeFunctionData("store", [42]);
            const description = "Change Box value to 42";
            
            const proposeTx = await governor.propose(
                [await box.getAddress()],
                [0],
                [calldata],
                description
            );
            
            const receipt = await proposeTx.wait();
            const proposalCreatedEvent = receipt?.logs.find(
                log => log.topics[0] === ethers.id("ProposalCreated(uint256,address,uint256,string,uint256,uint256,uint256,uint8,string,bytes32)")
            );
            
            const proposalId = ethers.getBigInt(proposalCreatedEvent!.data);
            
            // Mine one block to pass voting delay
            await ethers.provider.send("evm_mine", []);
            
            // Vote on proposal
            await governor.castVote(proposalId, 1); // For
            await governor.connect(voter1).castVote(proposalId, 1); // For
            await governor.connect(voter2).castVote(proposalId, 0); // Against
            await governor.connect(voter3).castVote(proposalId, 2); // Abstain
            
            // Check vote counts
            const proposal = await governor.proposalVotes(proposalId);
            expect(proposal.forVotes).to.equal(ethers.parseEther("700000")); // 500k + 200k
            expect(proposal.againstVotes).to.equal(ethers.parseEther("200000")); // 200k
            expect(proposal.abstainVotes).to.equal(ethers.parseEther("200000")); // 200k
        });
    });
});

