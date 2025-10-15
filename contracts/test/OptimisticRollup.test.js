const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("OptimisticRollup", function () {
    let rollup;
    let owner;
    let sequencer;
    let challenger;
    let user;

    const CHALLENGE_PERIOD = 86400; // 1 day
    const BOND_AMOUNT = ethers.parseEther("1");

    beforeEach(async function () {
        [owner, sequencer, challenger, user] = await ethers.getSigners();

        const OptimisticRollup = await ethers.getContractFactory("OptimisticRollup");
        rollup = await upgrades.deployProxy(
            OptimisticRollup,
            [sequencer.address, CHALLENGE_PERIOD, BOND_AMOUNT],
            { initializer: 'initialize' }
        );
        await rollup.waitForDeployment();
    });

    describe("Initialization", function () {
        it("Should set the correct sequencer", async function () {
            expect(await rollup.sequencer()).to.equal(sequencer.address);
        });

        it("Should set the correct challenge period", async function () {
            expect(await rollup.challengePeriod()).to.equal(CHALLENGE_PERIOD);
        });

        it("Should set the correct bond amount", async function () {
            expect(await rollup.bondAmount()).to.equal(BOND_AMOUNT);
        });

        it("Should set the correct owner", async function () {
            expect(await rollup.owner()).to.equal(owner.address);
        });
    });

    describe("State Commitment", function () {
        beforeEach(async function () {
            // Sequencer needs to deposit bond
            await rollup.connect(sequencer).depositBond({ value: BOND_AMOUNT });
        });

        it("Should allow sequencer to commit state", async function () {
            const stateRoot = ethers.keccak256(ethers.toUtf8Bytes("test-state-root"));

            await expect(rollup.connect(sequencer).commitState(stateRoot))
                .to.emit(rollup, "StateCommitted")
                .withArgs(0, stateRoot, sequencer.address);

            const commitment = await rollup.stateCommitments(0);
            expect(commitment.stateRoot).to.equal(stateRoot);
            expect(commitment.proposer).to.equal(sequencer.address);
            expect(commitment.finalized).to.equal(false);
        });

        it("Should reject commitment from non-sequencer", async function () {
            const stateRoot = ethers.keccak256(ethers.toUtf8Bytes("test-state-root"));

            await expect(rollup.connect(user).commitState(stateRoot))
                .to.be.revertedWith("Only sequencer can commit states");
        });

        it("Should reject commitment without sufficient bond", async function () {
            const stateRoot = ethers.keccak256(ethers.toUtf8Bytes("test-state-root"));

            // Withdraw bond
            await rollup.connect(sequencer).withdrawBond();

            await expect(rollup.connect(sequencer).commitState(stateRoot))
                .to.be.revertedWith("Insufficient bond");
        });
    });

    describe("Fraud Proofs", function () {
        let stateRoot;

        beforeEach(async function () {
            // Setup: sequencer deposits bond and commits state
            await rollup.connect(sequencer).depositBond({ value: BOND_AMOUNT });
            stateRoot = ethers.keccak256(ethers.toUtf8Bytes("test-state-root"));
            await rollup.connect(sequencer).commitState(stateRoot);
        });

        it("Should allow challenging a state commitment", async function () {
            const preStateRoot = ethers.keccak256(ethers.toUtf8Bytes("pre-state"));
            const postStateRoot = ethers.keccak256(ethers.toUtf8Bytes("post-state"));
            const transitionProof = ethers.toUtf8Bytes("proof-data");

            await expect(
                rollup.connect(challenger).challengeState(
                    0,
                    preStateRoot,
                    postStateRoot,
                    transitionProof,
                    { value: BOND_AMOUNT }
                )
            ).to.emit(rollup, "ChallengeSubmitted");
        });

        it("Should reject challenge without sufficient bond", async function () {
            const preStateRoot = ethers.keccak256(ethers.toUtf8Bytes("pre-state"));
            const postStateRoot = ethers.keccak256(ethers.toUtf8Bytes("post-state"));
            const transitionProof = ethers.toUtf8Bytes("proof-data");

            await expect(
                rollup.connect(challenger).challengeState(
                    0,
                    preStateRoot,
                    postStateRoot,
                    transitionProof,
                    { value: ethers.parseEther("0.5") }
                )
            ).to.be.revertedWith("Insufficient challenge bond");
        });

        it("Should reject challenge after challenge period", async function () {
            // Move time forward past challenge period
            await time.increase(CHALLENGE_PERIOD + 1);

            const preStateRoot = ethers.keccak256(ethers.toUtf8Bytes("pre-state"));
            const postStateRoot = ethers.keccak256(ethers.toUtf8Bytes("post-state"));
            const transitionProof = ethers.toUtf8Bytes("proof-data");

            await expect(
                rollup.connect(challenger).challengeState(
                    0,
                    preStateRoot,
                    postStateRoot,
                    transitionProof,
                    { value: BOND_AMOUNT }
                )
            ).to.be.revertedWith("Challenge period expired");
        });
    });

    describe("State Finalization", function () {
        beforeEach(async function () {
            await rollup.connect(sequencer).depositBond({ value: BOND_AMOUNT });
            const stateRoot = ethers.keccak256(ethers.toUtf8Bytes("test-state-root"));
            await rollup.connect(sequencer).commitState(stateRoot);
        });

        it("Should finalize state after challenge period", async function () {
            await time.increase(CHALLENGE_PERIOD + 1);

            await expect(rollup.finalizeState(0))
                .to.emit(rollup, "StateFinalized")
                .withArgs(0, await (await rollup.stateCommitments(0)).stateRoot);

            const commitment = await rollup.stateCommitments(0);
            expect(commitment.finalized).to.equal(true);
        });

        it("Should not finalize state before challenge period", async function () {
            await expect(rollup.finalizeState(0))
                .to.be.revertedWith("Challenge period not expired");
        });
    });

    describe("Bond Management", function () {
        it("Should allow depositing bond", async function () {
            await expect(rollup.connect(sequencer).depositBond({ value: BOND_AMOUNT }))
                .to.changeEtherBalance(sequencer, -BOND_AMOUNT);

            expect(await rollup.bonds(sequencer.address)).to.equal(BOND_AMOUNT);
        });

        it("Should allow withdrawing bond", async function () {
            await rollup.connect(sequencer).depositBond({ value: BOND_AMOUNT });

            await expect(rollup.connect(sequencer).withdrawBond())
                .to.changeEtherBalance(sequencer, BOND_AMOUNT);

            expect(await rollup.bonds(sequencer.address)).to.equal(0);
        });
    });
});
