// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IEvidenceRegistry.sol";

contract RecoveryMissions is AccessControl, ReentrancyGuard {
    bytes32 public constant REVIEWER_ROLE = keccak256("REVIEWER_ROLE");

    IEvidenceRegistry public immutable registry;
    IERC20 public immutable rewardToken;

    struct Mission {
        address sponsor;
        bool active;
        uint32 maxParticipants;
        uint32 participants;
        uint128 totalBudget;
        uint128 remainingBudget;
        bytes32 missionHash;
    }

    struct Milestone {
        uint128 rewardAmount;
        bytes32 milestoneHash;
    }

    uint256 public nextMissionId;
    mapping(uint256 => Mission) public missions;
    mapping(uint256 => Milestone[]) private _milestones;
    mapping(uint256 => mapping(address => bool)) public joined;
    mapping(uint256 => mapping(address => mapping(uint256 => bytes32))) public submittedProofs;
    mapping(uint256 => mapping(address => mapping(uint256 => bool))) public milestoneApproved;

    event MissionCreated(uint256 indexed missionId, address indexed sponsor, bytes32 missionHash, uint256 totalBudget);
    event MissionJoined(uint256 indexed missionId, address indexed user);
    event ProofSubmitted(uint256 indexed missionId, address indexed user, uint256 indexed milestoneIndex, bytes32 proofHash);
    event MilestoneApproved(uint256 indexed missionId, address indexed user, uint256 indexed milestoneIndex, uint256 rewardAmount);
    event MissionCancelled(uint256 indexed missionId, uint256 refundAmount);

    constructor(address admin, address registry_, address rewardToken_) {
        require(admin != address(0), "admin=0");
        require(registry_ != address(0), "registry=0");
        require(rewardToken_ != address(0), "token=0");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REVIEWER_ROLE, admin);
        registry = IEvidenceRegistry(registry_);
        rewardToken = IERC20(rewardToken_);
    }

    function createMission(
        bytes32 missionHash,
        uint32 maxParticipants,
        uint128[] calldata rewardAmounts,
        bytes32[] calldata milestoneHashes
    ) external nonReentrant returns (uint256 missionId) {
        require(maxParticipants > 0, "max=0");
        require(rewardAmounts.length > 0, "no milestones");
        require(rewardAmounts.length == milestoneHashes.length, "length mismatch");

        uint256 rewardPerParticipant;
        for (uint256 i = 0; i < rewardAmounts.length; i++) {
            require(rewardAmounts[i] > 0, "reward=0");
            rewardPerParticipant += rewardAmounts[i];
        }

        uint128 totalBudget = uint128(rewardPerParticipant * maxParticipants);
        require(rewardToken.transferFrom(msg.sender, address(this), totalBudget), "Funding failed");

        missionId = nextMissionId;
        nextMissionId += 1;

        missions[missionId] = Mission({
            sponsor: msg.sender,
            active: true,
            maxParticipants: maxParticipants,
            participants: 0,
            totalBudget: totalBudget,
            remainingBudget: totalBudget,
            missionHash: missionHash
        });

        for (uint256 i = 0; i < rewardAmounts.length; i++) {
            _milestones[missionId].push(Milestone({
                rewardAmount: rewardAmounts[i],
                milestoneHash: milestoneHashes[i]
            }));
        }

        emit MissionCreated(missionId, msg.sender, missionHash, totalBudget);
    }

    function joinMission(uint256 missionId) external {
        Mission storage m = missions[missionId];
        require(m.active, "Mission inactive");
        require(registry.isRegistered(msg.sender), "Not registered");
        require(!joined[missionId][msg.sender], "Already joined");
        require(m.participants < m.maxParticipants, "Mission full");

        joined[missionId][msg.sender] = true;
        m.participants += 1;

        emit MissionJoined(missionId, msg.sender);
    }

    function submitProof(uint256 missionId, uint256 milestoneIndex, bytes32 proofHash) external {
        Mission memory m = missions[missionId];
        require(m.active, "Mission inactive");
        require(joined[missionId][msg.sender], "Not joined");
        require(milestoneIndex < _milestones[missionId].length, "Bad milestone");
        require(proofHash != bytes32(0), "proof=0");
        require(!milestoneApproved[missionId][msg.sender][milestoneIndex], "Already approved");

        submittedProofs[missionId][msg.sender][milestoneIndex] = proofHash;
        emit ProofSubmitted(missionId, msg.sender, milestoneIndex, proofHash);
    }

    function approveMilestone(
        uint256 missionId,
        address user,
        uint256 milestoneIndex
    ) external nonReentrant {
        Mission storage m = missions[missionId];
        require(msg.sender == m.sponsor || hasRole(REVIEWER_ROLE, msg.sender), "Not reviewer");
        require(m.active, "Mission inactive");
        require(joined[missionId][user], "User not joined");
        require(milestoneIndex < _milestones[missionId].length, "Bad milestone");
        require(!milestoneApproved[missionId][user][milestoneIndex], "Already approved");
        require(submittedProofs[missionId][user][milestoneIndex] != bytes32(0), "No proof");

        Milestone memory ms = _milestones[missionId][milestoneIndex];
        require(m.remainingBudget >= ms.rewardAmount, "Budget exhausted");

        milestoneApproved[missionId][user][milestoneIndex] = true;
        m.remainingBudget -= ms.rewardAmount;

        require(rewardToken.transfer(address(registry), ms.rewardAmount), "Registry transfer failed");
        registry.creditReward(user, ms.rewardAmount, keccak256(abi.encodePacked("MISSION", missionId, milestoneIndex)));

        emit MilestoneApproved(missionId, user, milestoneIndex, ms.rewardAmount);
    }

    function cancelMission(uint256 missionId) external nonReentrant {
        Mission storage m = missions[missionId];
        require(msg.sender == m.sponsor || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not authorized");
        require(m.active, "Mission inactive");

        m.active = false;
        uint256 refundAmount = m.remainingBudget;
        m.remainingBudget = 0;

        if (refundAmount > 0) {
            require(rewardToken.transfer(m.sponsor, refundAmount), "Refund failed");
        }

        emit MissionCancelled(missionId, refundAmount);
    }

    function milestoneCount(uint256 missionId) external view returns (uint256) {
        return _milestones[missionId].length;
    }

    function getMilestone(uint256 missionId, uint256 milestoneIndex)
        external
        view
        returns (uint128 rewardAmount, bytes32 milestoneHash)
    {
        Milestone memory ms = _milestones[missionId][milestoneIndex];
        return (ms.rewardAmount, ms.milestoneHash);
    }
}
