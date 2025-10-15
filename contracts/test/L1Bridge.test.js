const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("L1Bridge", function () {
  let bridge;
  let rollup;
  let owner;
  let user;
  let rollupContract;

  const WITHDRAWAL_DELAY = 3600; // 1 hour

  beforeEach(async function () {
    [owner, user, rollupContract] = await ethers.getSigners();

    const L1Bridge = await ethers.getContractFactory("L1Bridge");
    bridge = await L1Bridge.deploy(rollupContract.address, WITHDRAWAL_DELAY);
    await bridge.waitForDeployment();
  });

  describe("Initialization", function () {
    it("Should set the correct rollup contract", async function () {
      expect(await bridge.rollupContract()).to.equal(rollupContract.address);
    });

    it("Should set the correct withdrawal delay", async function () {
      expect(await bridge.withdrawalDelay()).to.equal(WITHDRAWAL_DELAY);
    });

    it("Should set the correct owner", async function () {
      expect(await bridge.owner()).to.equal(owner.address);
    });
  });

  describe("ETH Deposits", function () {
    it("Should allow depositing ETH", async function () {
      const depositAmount = ethers.parseEther("1.0");

      await expect(bridge.connect(user).depositETH({ value: depositAmount }))
        .to.emit(bridge, "DepositInitiated")
        .withArgs(0, user.address, depositAmount, ethers.ZeroAddress);

      const deposit = await bridge.deposits(0);
      expect(deposit.user).to.equal(user.address);
      expect(deposit.amount).to.equal(depositAmount);
      expect(deposit.token).to.equal(ethers.ZeroAddress);
      expect(deposit.processed).to.equal(false);
    });

    it("Should reject zero ETH deposits", async function () {
      await expect(bridge.connect(user).depositETH({ value: 0 }))
        .to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should increment deposit counter", async function () {
      await bridge.connect(user).depositETH({ value: ethers.parseEther("1.0") });
      expect(await bridge.depositCounter()).to.equal(1);

      await bridge.connect(user).depositETH({ value: ethers.parseEther("0.5") });
      expect(await bridge.depositCounter()).to.equal(2);
    });
  });

  describe("Token Support", function () {
    let token;

    beforeEach(async function () {
      // Deploy a mock ERC20 token
      const MockERC20 = await ethers.getContractFactory("contracts/test/MockERC20.sol:MockERC20");
      token = await MockERC20.deploy("Test Token", "TEST", ethers.parseEther("1000000"));
      await token.waitForDeployment();

      // Transfer some tokens to user
      await token.transfer(user.address, ethers.parseEther("1000"));
    });

    it("Should allow owner to add supported token", async function () {
      await bridge.addSupportedToken(await token.getAddress());
      expect(await bridge.supportedTokens(await token.getAddress())).to.equal(true);
    });

    it("Should allow depositing supported tokens", async function () {
      const tokenAddress = await token.getAddress();
      await bridge.addSupportedToken(tokenAddress);

      const depositAmount = ethers.parseEther("100");
      await token.connect(user).approve(await bridge.getAddress(), depositAmount);

      await expect(bridge.connect(user).depositToken(tokenAddress, depositAmount))
        .to.emit(bridge, "DepositInitiated")
        .withArgs(0, user.address, depositAmount, tokenAddress);

      expect(await token.balanceOf(await bridge.getAddress())).to.equal(depositAmount);
    });

    it("Should reject unsupported tokens", async function () {
      const depositAmount = ethers.parseEther("100");
      await token.connect(user).approve(await bridge.getAddress(), depositAmount);

      await expect(bridge.connect(user).depositToken(await token.getAddress(), depositAmount))
        .to.be.revertedWith("Token not supported");
    });
  });

  describe("Withdrawals", function () {
    it("Should allow rollup contract to initiate withdrawal", async function () {
      const withdrawalAmount = ethers.parseEther("1.0");

      await expect(
        bridge.connect(rollupContract).initiateWithdrawal(
          user.address,
          withdrawalAmount,
          ethers.ZeroAddress,
          ethers.keccak256(ethers.toUtf8Bytes("proof"))
        )
      ).to.emit(bridge, "WithdrawalInitiated");
    });

    it("Should reject withdrawal from non-rollup address", async function () {
      const withdrawalAmount = ethers.parseEther("1.0");

      await expect(
        bridge.connect(user).initiateWithdrawal(
          user.address,
          withdrawalAmount,
          ethers.ZeroAddress,
          ethers.keccak256(ethers.toUtf8Bytes("proof"))
        )
      ).to.be.revertedWith("Only rollup contract can initiate withdrawals");
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to add supported tokens", async function () {
      const tokenAddress = ethers.Wallet.createRandom().address;

      await expect(bridge.connect(user).addSupportedToken(tokenAddress))
        .to.be.reverted;
    });

    it("Should only allow owner to update rollup contract", async function () {
      const newRollup = ethers.Wallet.createRandom().address;

      await expect(bridge.connect(user).updateRollupContract(newRollup))
        .to.be.reverted;
    });
  });
});
