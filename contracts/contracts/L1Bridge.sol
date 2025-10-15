// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title L1Bridge
 * @dev Bridge contract for L1-L2 asset transfers
 */
contract L1Bridge is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    struct DepositRecord {
        address user;
        uint256 amount;
        address token;
        uint256 timestamp;
        bool processed;
    }

    struct WithdrawalRecord {
        address user;
        uint256 amount;
        address token;
        bytes32 merkleProof;
        uint256 timestamp;
        bool processed;
    }

    // State variables
    mapping(uint256 => DepositRecord) public deposits;
    mapping(bytes32 => WithdrawalRecord) public withdrawals;
    mapping(address => bool) public supportedTokens;

    uint256 public depositCounter;
    uint256 public withdrawalDelay;
    address public rollupContract;

    // Events
    event DepositInitiated(uint256 indexed depositId, address indexed user, uint256 amount, address token);
    event WithdrawalInitiated(bytes32 indexed withdrawalId, address indexed user, uint256 amount, address token);
    event WithdrawalCompleted(bytes32 indexed withdrawalId, address indexed user, uint256 amount, address token);

    constructor(address _rollupContract, uint256 _withdrawalDelay) {
        rollupContract = _rollupContract;
        withdrawalDelay = _withdrawalDelay;
    }

    /**
     * @dev Deposit ETH to L2
     */
    function depositETH() external payable nonReentrant {
        require(msg.value > 0, "Amount must be greater than 0");

        deposits[depositCounter] = DepositRecord({
            user: msg.sender,
            amount: msg.value,
            token: address(0), // ETH
            timestamp: block.timestamp,
            processed: false
        });

        emit DepositInitiated(depositCounter, msg.sender, msg.value, address(0));
        depositCounter++;
    }

    /**
     * @dev Deposit ERC20 tokens to L2
     */
    function depositToken(address _token, uint256 _amount) external nonReentrant {
        require(supportedTokens[_token], "Token not supported");
        require(_amount > 0, "Amount must be greater than 0");

        // Transfer tokens from user to bridge using SafeERC20
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        deposits[depositCounter] = DepositRecord({
            user: msg.sender,
            amount: _amount,
            token: _token,
            timestamp: block.timestamp,
            processed: false
        });

        emit DepositInitiated(depositCounter, msg.sender, _amount, _token);
        depositCounter++;
    }

    /**
     * @dev Initiate withdrawal from L2
     */
    function initiateWithdrawal(
        address _user,
        uint256 _amount,
        address _token,
        bytes32 _merkleProof
    ) external {
        require(msg.sender == rollupContract, "Only rollup contract can initiate withdrawals");

        bytes32 withdrawalId = keccak256(abi.encodePacked(_user, _amount, _token, block.timestamp));

        withdrawals[withdrawalId] = WithdrawalRecord({
            user: _user,
            amount: _amount,
            token: _token,
            merkleProof: _merkleProof,
            timestamp: block.timestamp,
            processed: false
        });

        emit WithdrawalInitiated(withdrawalId, _user, _amount, _token);
    }

    /**
     * @dev Complete withdrawal to L1
     */
    function completeWithdrawal(bytes32 _withdrawalId) external nonReentrant {
        WithdrawalRecord storage withdrawal = withdrawals[_withdrawalId];

        require(withdrawal.user != address(0), "Withdrawal does not exist");
        require(!withdrawal.processed, "Withdrawal already processed");
        require(
            block.timestamp >= withdrawal.timestamp + withdrawalDelay,
            "Withdrawal delay not met"
        );

        withdrawal.processed = true;

        if (withdrawal.token == address(0)) {
            // ETH withdrawal
            payable(withdrawal.user).transfer(withdrawal.amount);
        } else {
            // Token withdrawal
            IERC20(withdrawal.token).transfer(withdrawal.user, withdrawal.amount);
        }

        emit WithdrawalCompleted(_withdrawalId, withdrawal.user, withdrawal.amount, withdrawal.token);
    }

    /**
     * @dev Add supported token
     */
    function addSupportedToken(address _token) external onlyOwner {
        supportedTokens[_token] = true;
    }

    /**
     * @dev Remove supported token
     */
    function removeSupportedToken(address _token) external onlyOwner {
        supportedTokens[_token] = false;
    }

    /**
     * @dev Set withdrawal delay
     */
    function setWithdrawalDelay(uint256 _newDelay) external onlyOwner {
        withdrawalDelay = _newDelay;
    }

    /**
     * @dev Set rollup contract address
     */
    function setRollupContract(address _newRollup) external onlyOwner {
        rollupContract = _newRollup;
    }

    /**
     * @dev Update rollup contract address (alias for setRollupContract)
     */
    function updateRollupContract(address _newRollup) external onlyOwner {
        rollupContract = _newRollup;
    }

    /**
     * @dev Get deposit record
     */
    function getDeposit(uint256 _depositId) external view returns (DepositRecord memory) {
        return deposits[_depositId];
    }

    /**
     * @dev Get withdrawal record
     */
    function getWithdrawal(bytes32 _withdrawalId) external view returns (WithdrawalRecord memory) {
        return withdrawals[_withdrawalId];
    }
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}