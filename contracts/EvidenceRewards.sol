// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title EvidenceRewards
 * @dev Contributor appraisal + rewards for high-quality eye-health evidence.
 *      Stores only hashes/metadata — never raw medical files.
 *      Excludes cosmetic procedures.
 */
contract EvidenceRewards is AccessControl {
    bytes32 public constant APPRAISER_ROLE = keccak256("APPRAISER_ROLE");

    enum PrivacyMode { PRIVATE, OPEN, NEGOTIABLE }
    enum DataClass { SUBJECTIVE_MONTHLY, EXAM_REPORT, INSPECTION_REPORT, MINOR_SURGERY, MAJOR_SURGERY }
    enum AppraisalStatus { PENDING, APPROVED, REJECTED }

    struct Contributor {
        bool registered;
        PrivacyMode privacy;
        uint256 bondDeposit;       // in wei
        uint256 claimableReward;   // in wei
        uint256 totalClaimed;
        uint256 registeredAt;
    }

    struct Evidence {
        uint256 id;
        address contributor;
        bytes32 contentHash;       // keccak256 of off-chain file
        DataClass dataClass;
        string metadataURI;        // IPFS or other off-chain pointer
        AppraisalStatus status;
        uint256 rewardWei;         // set after appraisal
        uint256 submittedAt;
        bool shareConsent;         // for NEGOTIABLE mode, per-upload consent
    }

    uint256 public bondAmount = 0.005 ether;  // ~10 USD equiv on testnet
    uint256 public baseRewardHigh = 0.001 ether;   // ~2.0 USD high-quality primary
    uint256 public baseRewardLow = 0.0005 ether;   // ~1.0 USD subjective/monthly
    uint256 private _nextEvidenceId = 1;

    mapping(address => Contributor) public contributors;
    mapping(uint256 => Evidence) public evidences;
    mapping(address => uint256[]) public userEvidenceIds;

    event ContributorRegistered(address indexed user, PrivacyMode privacy);
    event PrivacyChanged(address indexed user, PrivacyMode newMode);
    event EvidenceSubmitted(uint256 indexed evidenceId, address indexed contributor, DataClass dataClass);
    event EvidenceAppraised(uint256 indexed evidenceId, AppraisalStatus status, uint256 rewardWei);
    event RewardClaimed(address indexed user, uint256 amount);
    event BondRefunded(address indexed user, uint256 amount);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(APPRAISER_ROLE, admin);
    }

    // ─── Registration ─────────────────────────────────────────────
    function register(PrivacyMode _privacy) external payable {
        require(!contributors[msg.sender].registered, "Already registered");
        require(msg.value >= bondAmount, "Insufficient bond deposit");

        contributors[msg.sender] = Contributor({
            registered: true,
            privacy: _privacy,
            bondDeposit: msg.value,
            claimableReward: 0,
            totalClaimed: 0,
            registeredAt: block.timestamp
        });

        emit ContributorRegistered(msg.sender, _privacy);
    }

    // ─── Privacy Settings ─────────────────────────────────────────
    function setPrivacyMode(PrivacyMode _privacy) external {
        require(contributors[msg.sender].registered, "Not registered");
        contributors[msg.sender].privacy = _privacy;
        emit PrivacyChanged(msg.sender, _privacy);
    }

    // ─── Submit Evidence ──────────────────────────────────────────
    function submitEvidence(
        bytes32 _contentHash,
        DataClass _dataClass,
        string calldata _metadataURI,
        bool _shareConsent
    ) external {
        require(contributors[msg.sender].registered, "Not registered");
        PrivacyMode pm = contributors[msg.sender].privacy;
        // PRIVATE users cannot share
        require(pm != PrivacyMode.PRIVATE, "Privacy mode is PRIVATE");
        // NEGOTIABLE users must explicitly consent per upload
        if (pm == PrivacyMode.NEGOTIABLE) {
            require(_shareConsent, "Consent required for NEGOTIABLE mode");
        }

        uint256 eid = _nextEvidenceId++;
        evidences[eid] = Evidence({
            id: eid,
            contributor: msg.sender,
            contentHash: _contentHash,
            dataClass: _dataClass,
            metadataURI: _metadataURI,
            status: AppraisalStatus.PENDING,
            rewardWei: 0,
            submittedAt: block.timestamp,
            shareConsent: _shareConsent
        });
        userEvidenceIds[msg.sender].push(eid);

        emit EvidenceSubmitted(eid, msg.sender, _dataClass);
    }

    // ─── Appraise Evidence ────────────────────────────────────────
    function appraiseEvidence(
        uint256 _evidenceId,
        bool _approved,
        uint256 _rewardWei
    ) external onlyRole(APPRAISER_ROLE) {
        Evidence storage e = evidences[_evidenceId];
        require(e.id != 0, "Evidence not found");
        require(e.status == AppraisalStatus.PENDING, "Already appraised");

        if (_approved) {
            e.status = AppraisalStatus.APPROVED;
            e.rewardWei = _rewardWei;
            contributors[e.contributor].claimableReward += _rewardWei;
        } else {
            e.status = AppraisalStatus.REJECTED;
        }

        emit EvidenceAppraised(_evidenceId, e.status, e.rewardWei);
    }

    // ─── Claim Rewards ────────────────────────────────────────────
    function claim() external {
        Contributor storage c = contributors[msg.sender];
        require(c.registered, "Not registered");
        uint256 amount = c.claimableReward;
        require(amount > 0, "Nothing to claim");

        c.claimableReward = 0;
        c.totalClaimed += amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit RewardClaimed(msg.sender, amount);
    }

    // ─── Refund Bond ──────────────────────────────────────────────
    function refundBond() external {
        Contributor storage c = contributors[msg.sender];
        require(c.registered, "Not registered");
        uint256 bond = c.bondDeposit;
        require(bond > 0, "No bond to refund");

        c.bondDeposit = 0;
        c.registered = false;

        (bool success, ) = msg.sender.call{value: bond}("");
        require(success, "Transfer failed");

        emit BondRefunded(msg.sender, bond);
    }

    // ─── View helpers ─────────────────────────────────────────────
    function getUserEvidenceCount(address _user) external view returns (uint256) {
        return userEvidenceIds[_user].length;
    }

    function getUserEvidenceIds(address _user) external view returns (uint256[] memory) {
        return userEvidenceIds[_user];
    }

    receive() external payable {}
}
