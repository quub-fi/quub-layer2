// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/**
 * @title OptimisticRollup
 * @dev Core rollup contract managing state roots and fraud proofs
 */
contract OptimisticRollup is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    struct StateCommitment {
        bytes32 stateRoot;
        uint256 blockNumber;
        uint256 timestamp;
        address proposer;
        bool finalized;
    }

    struct FraudProof {
        uint256 commitmentIndex;
        bytes32 preStateRoot;
        bytes32 postStateRoot;
        bytes transitionProof;
        address challenger;
        uint256 challengeTime;
        bool resolved;
    }

    // State variables
    mapping(uint256 => StateCommitment) public stateCommitments;
    mapping(uint256 => FraudProof) public fraudProofs;

    uint256 public currentCommitmentIndex;
    uint256 public currentProofIndex;
    uint256 public challengePeriod;
    uint256 public bondAmount;

    address public sequencer;
    mapping(address => uint256) public bonds;

    // Events
    event StateCommitted(uint256 indexed index, bytes32 stateRoot, address proposer);
    event ChallengeSubmitted(uint256 indexed proofIndex, uint256 indexed commitmentIndex, address challenger);
    event ChallengeResolved(uint256 indexed proofIndex, bool fraudulent);
    event StateFinalized(uint256 indexed index, bytes32 stateRoot);

    /**
     * @dev Initialize the rollup contract
     */
    function initialize(
        address _sequencer,
        uint256 _challengePeriod,
        uint256 _bondAmount
    ) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();

        sequencer = _sequencer;
        challengePeriod = _challengePeriod;
        bondAmount = _bondAmount;
    }

    /**
     * @dev Submit a new state commitment
     */
    function commitState(bytes32 _stateRoot) external {
        require(msg.sender == sequencer, "Only sequencer can commit states");
        require(bonds[msg.sender] >= bondAmount, "Insufficient bond");

        stateCommitments[currentCommitmentIndex] = StateCommitment({
            stateRoot: _stateRoot,
            blockNumber: block.number,
            timestamp: block.timestamp,
            proposer: msg.sender,
            finalized: false
        });

        emit StateCommitted(currentCommitmentIndex, _stateRoot, msg.sender);
        currentCommitmentIndex++;
    }

    /**
     * @dev Submit a fraud proof challenge
     */
    function challengeState(
        uint256 _commitmentIndex,
        bytes32 _preStateRoot,
        bytes32 _postStateRoot,
        bytes calldata _transitionProof
    ) external payable nonReentrant {
        require(msg.value >= bondAmount, "Insufficient challenge bond");
        require(_commitmentIndex < currentCommitmentIndex, "Invalid commitment index");
        require(!stateCommitments[_commitmentIndex].finalized, "State already finalized");
        require(
            block.timestamp <= stateCommitments[_commitmentIndex].timestamp + challengePeriod,
            "Challenge period expired"
        );

        fraudProofs[currentProofIndex] = FraudProof({
            commitmentIndex: _commitmentIndex,
            preStateRoot: _preStateRoot,
            postStateRoot: _postStateRoot,
            transitionProof: _transitionProof,
            challenger: msg.sender,
            challengeTime: block.timestamp,
            resolved: false
        });

        emit ChallengeSubmitted(currentProofIndex, _commitmentIndex, msg.sender);
        currentProofIndex++;
    }

    /**
     * @dev Resolve a fraud proof
     */
    function resolveChallenge(uint256 _proofIndex, bool _fraudulent) external onlyOwner {
        require(_proofIndex < currentProofIndex, "Invalid proof index");
        require(!fraudProofs[_proofIndex].resolved, "Challenge already resolved");

        FraudProof storage proof = fraudProofs[_proofIndex];
        StateCommitment storage commitment = stateCommitments[proof.commitmentIndex];

        proof.resolved = true;

        if (_fraudulent) {
            // Slash the sequencer's bond and reward challenger
            uint256 slashAmount = bonds[commitment.proposer];
            bonds[commitment.proposer] = 0;

            // Reward challenger
            payable(proof.challenger).transfer(bondAmount);
            if (slashAmount > bondAmount) {
                payable(proof.challenger).transfer(slashAmount - bondAmount);
            }
        } else {
            // Return bond to sequencer and forfeit challenger's bond
            payable(commitment.proposer).transfer(bondAmount);
        }

        emit ChallengeResolved(_proofIndex, _fraudulent);
    }

    /**
     * @dev Finalize state commitments after challenge period
     */
    function finalizeStates() external {
        for (uint256 i = 0; i < currentCommitmentIndex; i++) {
            StateCommitment storage commitment = stateCommitments[i];

            if (!commitment.finalized &&
                block.timestamp > commitment.timestamp + challengePeriod) {
                commitment.finalized = true;
                emit StateFinalized(i, commitment.stateRoot);
            }
        }
    }

    /**
     * @dev Finalize a single state commitment after challenge period
     */
    function finalizeState(uint256 _index) external {
        require(_index < currentCommitmentIndex, "Invalid commitment index");
        StateCommitment storage commitment = stateCommitments[_index];
        
        require(!commitment.finalized, "State already finalized");
        require(
            block.timestamp > commitment.timestamp + challengePeriod,
            "Challenge period not expired"
        );

        commitment.finalized = true;
        emit StateFinalized(_index, commitment.stateRoot);
    }

    /**
     * @dev Deposit bond for sequencer
     */
    function depositBond() external payable {
        bonds[msg.sender] += msg.value;
    }

    /**
     * @dev Withdraw bond (if not slashed)
     */
    function withdrawBond(uint256 _amount) external nonReentrant {
        require(bonds[msg.sender] >= _amount, "Insufficient bond balance");
        bonds[msg.sender] -= _amount;
        payable(msg.sender).transfer(_amount);
    }

    /**
     * @dev Withdraw all bond (convenience function)
     */
    function withdrawBond() external nonReentrant {
        uint256 amount = bonds[msg.sender];
        require(amount > 0, "No bond to withdraw");
        bonds[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    /**
     * @dev Set new sequencer
     */
    function setSequencer(address _newSequencer) external onlyOwner {
        sequencer = _newSequencer;
    }

    /**
     * @dev Set challenge period
     */
    function setChallengePeriod(uint256 _newPeriod) external onlyOwner {
        challengePeriod = _newPeriod;
    }

    /**
     * @dev Get state commitment details
     */
    function getStateCommitment(uint256 _index) external view returns (StateCommitment memory) {
        return stateCommitments[_index];
    }

    /**
     * @dev Get fraud proof details
     */
    function getFraudProof(uint256 _index) external view returns (FraudProof memory) {
        return fraudProofs[_index];
    }
}