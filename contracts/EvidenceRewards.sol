// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IEvidenceRegistry.sol";

contract EvidenceRewards is AccessControl, ReentrancyGuard, IEvidenceRegistry {
    bytes32 public constant APPRAISER_ROLE = keccak256("APPRAISER_ROLE");
    bytes32 public constant CREDITOR_ROLE = keccak256("CREDITOR_ROLE");

    uint256 public constant ONE_USD = 1e6; // assumes 6-decimal stablecoin

    enum PrivacyMode {
        PRIVATE,
        OPEN,
        NEGOTIABLE
    }

    enum DataClass {
        SUBJECTIVE_MONTHLY,
        EXAM_REPORT,
        INSPECTION_REPORT,
        MINOR_SURGERY,
        MAJOR_SURGERY
    }

    struct Profile {
        bool registered;
        PrivacyMode mode;
        uint64 registeredAt;
        bool bondRefunded;
    }

    struct Evidence {
        uint256 id;
        address user;
        DataClass dataClass;
        PrivacyMode privacyAtSubmit;
        bytes32 fileHash;
        bytes32 metadataHash;
        bytes32 appraisalHash;
        uint64 submittedAt;
        uint8 qualityScore;
        uint96 rewardAmount;
        bool shared;
        bool appraised;
    }

    IERC20 public immutable rewardToken;
    uint256 public registerBondWei;
    uint256 public nextEvidenceId;

    mapping(address => Profile) public profiles;
    mapping(uint256 => Evidence) public evidences;
    mapping(address => uint256[]) private _userEvidenceIds;
    mapping(address => uint256) public claimable;

    event Registered(address indexed user, PrivacyMode mode, uint256 bondPaid);
    event PrivacyChanged(address indexed user, PrivacyMode newMode);
    event EvidenceSubmitted(
        uint256 indexed evidenceId,
        address indexed user,
        DataClass dataClass,
        bool shared,
        bytes32 fileHash,
        bytes32 metadataHash
    );
    event EvidenceAppraised(
        uint256 indexed evidenceId,
        uint8 qualityScore,
        uint256 rewardAmount,
        bytes32 appraisalHash
    );
    event RewardCredited(address indexed user, uint256 amount, bytes32 indexed reason);
    event Claimed(address indexed user, uint256 amount);
    event BondRefunded(address indexed user, uint256 amount);
    event RegisterBondUpdated(uint256 oldAmount, uint256 newAmount);

    modifier onlyRegistered() {
        require(profiles[msg.sender].registered, "Not registered");
        _;
    }

    constructor(address admin, address rewardToken_, uint256 registerBondWei_) {
        require(admin != address(0), "admin=0");
        require(rewardToken_ != address(0), "token=0");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(APPRAISER_ROLE, admin);
        _grantRole(CREDITOR_ROLE, admin);
        rewardToken = IERC20(rewardToken_);
        registerBondWei = registerBondWei_;
    }

    function register(PrivacyMode mode) external payable {
        require(!profiles[msg.sender].registered, "Already registered");
        require(msg.value >= registerBondWei, "Bond too low");

        profiles[msg.sender] = Profile({
            registered: true,
            mode: mode,
            registeredAt: uint64(block.timestamp),
            bondRefunded: false
        });

        emit Registered(msg.sender, mode, msg.value);
    }

    function isRegistered(address user) external view returns (bool) {
        return profiles[user].registered;
    }

    function setPrivacyMode(PrivacyMode mode) external onlyRegistered {
        profiles[msg.sender].mode = mode;
        emit PrivacyChanged(msg.sender, mode);
    }

    function setRegisterBondWei(uint256 newAmount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 oldAmount = registerBondWei;
        registerBondWei = newAmount;
        emit RegisterBondUpdated(oldAmount, newAmount);
    }

    function submitEvidence(
        DataClass dataClass,
        bytes32 fileHash,
        bytes32 metadataHash,
        bool shareNow
    ) external onlyRegistered returns (uint256 evidenceId) {
        require(fileHash != bytes32(0), "fileHash=0");
        require(metadataHash != bytes32(0), "metadataHash=0");

        PrivacyMode mode = profiles[msg.sender].mode;
        bool shared = (mode == PrivacyMode.OPEN) || (mode == PrivacyMode.NEGOTIABLE && shareNow);

        evidenceId = nextEvidenceId;
        nextEvidenceId += 1;

        evidences[evidenceId] = Evidence({
            id: evidenceId,
            user: msg.sender,
            dataClass: dataClass,
            privacyAtSubmit: mode,
            fileHash: fileHash,
            metadataHash: metadataHash,
            appraisalHash: bytes32(0),
            submittedAt: uint64(block.timestamp),
            qualityScore: 0,
            rewardAmount: 0,
            shared: shared,
            appraised: false
        });

        _userEvidenceIds[msg.sender].push(evidenceId);

        emit EvidenceSubmitted(evidenceId, msg.sender, dataClass, shared, fileHash, metadataHash);
    }

    function appraiseEvidence(
        uint256 evidenceId,
        uint8 qualityScore,
        uint96 rewardAmount,
        bytes32 appraisalHash
    ) external onlyRole(APPRAISER_ROLE) {
        require(qualityScore <= 100, "Score > 100");

        Evidence storage ev = evidences[evidenceId];
        require(ev.user != address(0), "No evidence");
        require(!ev.appraised, "Already appraised");
        require(_rewardBandIsValid(ev.dataClass, qualityScore, rewardAmount), "Reward out of band");

        ev.qualityScore = qualityScore;
        ev.rewardAmount = rewardAmount;
        ev.appraisalHash = appraisalHash;
        ev.appraised = true;

        if (rewardAmount > 0) {
            claimable[ev.user] += rewardAmount;
            emit RewardCredited(ev.user, rewardAmount, keccak256(abi.encodePacked("APPRAISAL", evidenceId)));
        }

        emit EvidenceAppraised(evidenceId, qualityScore, rewardAmount, appraisalHash);
    }

    function creditReward(address user, uint256 amount, bytes32 reason)
        external
        onlyRole(CREDITOR_ROLE)
    {
        require(profiles[user].registered, "Recipient not registered");
        require(amount > 0, "amount=0");
        claimable[user] += amount;
        emit RewardCredited(user, amount, reason);
    }

    function claim() external nonReentrant onlyRegistered {
        uint256 amount = claimable[msg.sender];
        require(amount > 0, "Nothing to claim");

        claimable[msg.sender] = 0;
        require(rewardToken.transfer(msg.sender, amount), "Transfer failed");

        emit Claimed(msg.sender, amount);
    }

    function refundBond() external nonReentrant onlyRegistered {
        Profile storage p = profiles[msg.sender];
        require(!p.bondRefunded, "Already refunded");
        require(_hasAcceptedContribution(msg.sender), "No accepted contribution");

        p.bondRefunded = true;
        (bool ok, ) = payable(msg.sender).call{value: registerBondWei}("");
        require(ok, "Bond refund failed");

        emit BondRefunded(msg.sender, registerBondWei);
    }

    function getUserEvidenceIds(address user) external view returns (uint256[] memory) {
        return _userEvidenceIds[user];
    }

    function getEvidenceMeta(uint256 evidenceId)
        external
        view
        returns (
            address owner,
            bool shared,
            bool appraised,
            uint8 qualityScore,
            uint8 dataClass
        )
    {
        Evidence storage ev = evidences[evidenceId];
        require(ev.user != address(0), "No evidence");
        return (ev.user, ev.shared, ev.appraised, ev.qualityScore, uint8(ev.dataClass));
    }

    function _hasAcceptedContribution(address user) internal view returns (bool) {
        uint256[] memory ids = _userEvidenceIds[user];
        for (uint256 i = 0; i < ids.length; i++) {
            Evidence storage ev = evidences[ids[i]];
            if (ev.appraised && ev.rewardAmount > 0) {
                return true;
            }
        }
        return false;
    }

    function _rewardBandIsValid(
        DataClass dataClass,
        uint8 qualityScore,
        uint96 rewardAmount
    ) internal pure returns (bool) {
        if (qualityScore < 50) {
            return rewardAmount == 0;
        }

        uint256 minReward;
        uint256 maxReward;

        if (dataClass == DataClass.SUBJECTIVE_MONTHLY) {
            if (qualityScore < 70) {
                minReward = 1e5;      // $0.10
                maxReward = 4e5;      // $0.40
            } else if (qualityScore < 85) {
                minReward = 4e5;      // $0.40
                maxReward = 7e5;      // $0.70
            } else {
                minReward = 7e5;      // $0.70
                maxReward = 10e5;     // $1.00
            }
        } else {
            if (qualityScore < 70) {
                return rewardAmount == 0;
            } else if (qualityScore < 85) {
                minReward = 5e5;      // $0.50
                maxReward = 125e4;    // $1.25
            } else {
                minReward = 125e4;    // $1.25
                maxReward = 2e6;      // $2.00
            }
        }

        return rewardAmount >= minReward && rewardAmount <= maxReward;
    }

    receive() external payable {}
}
