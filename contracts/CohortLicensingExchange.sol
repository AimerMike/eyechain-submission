// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IEvidenceRegistry.sol";

contract CohortLicensingExchange is AccessControl, ReentrancyGuard {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    IEvidenceRegistry public immutable registry;
    IERC20 public immutable rewardToken;

    address public treasury;
    address public reserveVault;
    uint16 public userShareBps = 7500;
    uint16 public treasuryShareBps = 1500;
    uint16 public reserveShareBps = 1000;

    struct Cohort {
        bool active;
        uint96 pricePerLicense;
        uint8 minQualityScore;
        bytes32 descriptorHash;
        uint64 createdAt;
    }

    uint256 public nextCohortId;
    mapping(uint256 => Cohort) public cohorts;
    mapping(uint256 => uint256[]) private _cohortEvidenceIds;

    event CohortCreated(uint256 indexed cohortId, bytes32 descriptorHash, uint256 pricePerLicense);
    event CohortEvidenceAdded(uint256 indexed cohortId, uint256 indexed evidenceId);
    event CohortPurchased(uint256 indexed cohortId, address indexed buyer, uint256 pricePaid, bytes32 useCaseHash);
    event CohortShareConfigUpdated(uint16 userShareBps, uint16 treasuryShareBps, uint16 reserveShareBps);
    event TreasuryUpdated(address treasury, address reserveVault);

    constructor(
        address admin,
        address registry_,
        address rewardToken_,
        address treasury_,
        address reserveVault_
    ) {
        require(admin != address(0), "admin=0");
        require(registry_ != address(0), "registry=0");
        require(rewardToken_ != address(0), "token=0");
        require(treasury_ != address(0), "treasury=0");
        require(reserveVault_ != address(0), "reserve=0");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MANAGER_ROLE, admin);
        registry = IEvidenceRegistry(registry_);
        rewardToken = IERC20(rewardToken_);
        treasury = treasury_;
        reserveVault = reserveVault_;
    }

    function createCohort(
        bytes32 descriptorHash,
        uint96 pricePerLicense,
        uint8 minQualityScore
    ) external onlyRole(MANAGER_ROLE) returns (uint256 cohortId) {
        require(pricePerLicense > 0, "price=0");
        cohortId = nextCohortId;
        nextCohortId += 1;

        cohorts[cohortId] = Cohort({
            active: true,
            pricePerLicense: pricePerLicense,
            minQualityScore: minQualityScore,
            descriptorHash: descriptorHash,
            createdAt: uint64(block.timestamp)
        });

        emit CohortCreated(cohortId, descriptorHash, pricePerLicense);
    }

    function addEvidenceToCohort(uint256 cohortId, uint256 evidenceId) external onlyRole(MANAGER_ROLE) {
        Cohort memory c = cohorts[cohortId];
        require(c.createdAt != 0, "No cohort");

        (address owner, bool shared, bool appraised, uint8 qualityScore, ) = registry.getEvidenceMeta(evidenceId);
        require(owner != address(0), "No owner");
        require(shared, "Evidence private");
        require(appraised, "Not appraised");
        require(qualityScore >= c.minQualityScore, "Below min quality");

        _cohortEvidenceIds[cohortId].push(evidenceId);
        emit CohortEvidenceAdded(cohortId, evidenceId);
    }

    function purchaseLicense(uint256 cohortId, bytes32 useCaseHash) external nonReentrant {
        Cohort memory c = cohorts[cohortId];
        require(c.active, "Cohort inactive");

        uint256[] memory ids = _cohortEvidenceIds[cohortId];
        require(ids.length > 0, "Empty cohort");
        require(rewardToken.transferFrom(msg.sender, address(this), c.pricePerLicense), "Payment failed");

        uint256 totalWeight;
        for (uint256 i = 0; i < ids.length; i++) {
            (, bool shared, bool appraised, uint8 qualityScore, uint8 dataClass) = registry.getEvidenceMeta(ids[i]);
            if (shared && appraised && qualityScore >= c.minQualityScore) {
                totalWeight += _weightFor(dataClass, qualityScore);
            }
        }
        require(totalWeight > 0, "No eligible evidence");

        uint256 userPool = (uint256(c.pricePerLicense) * userShareBps) / 10_000;
        uint256 treasuryCut = (uint256(c.pricePerLicense) * treasuryShareBps) / 10_000;
        uint256 reserveCut = uint256(c.pricePerLicense) - userPool - treasuryCut;

        require(rewardToken.transfer(address(registry), userPool), "Registry transfer failed");
        require(rewardToken.transfer(treasury, treasuryCut), "Treasury transfer failed");
        require(rewardToken.transfer(reserveVault, reserveCut), "Reserve transfer failed");

        for (uint256 i = 0; i < ids.length; i++) {
            (address owner, bool shared, bool appraised, uint8 qualityScore, uint8 dataClass) = registry.getEvidenceMeta(ids[i]);
            if (!shared || !appraised || qualityScore < c.minQualityScore) {
                continue;
            }
            uint256 weight = _weightFor(dataClass, qualityScore);
            uint256 payout = (userPool * weight) / totalWeight;
            if (payout > 0) {
                registry.creditReward(owner, payout, keccak256(abi.encodePacked("COHORT", cohortId, ids[i])));
            }
        }

        emit CohortPurchased(cohortId, msg.sender, c.pricePerLicense, useCaseHash);
    }

    function cohortEvidenceIds(uint256 cohortId) external view returns (uint256[] memory) {
        return _cohortEvidenceIds[cohortId];
    }

    function setShareConfig(
        uint16 newUserShareBps,
        uint16 newTreasuryShareBps,
        uint16 newReserveShareBps
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            uint256(newUserShareBps) + uint256(newTreasuryShareBps) + uint256(newReserveShareBps) == 10_000,
            "Bad share config"
        );
        userShareBps = newUserShareBps;
        treasuryShareBps = newTreasuryShareBps;
        reserveShareBps = newReserveShareBps;
        emit CohortShareConfigUpdated(newUserShareBps, newTreasuryShareBps, newReserveShareBps);
    }

    function setTreasuryAddresses(address treasury_, address reserveVault_)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(treasury_ != address(0), "treasury=0");
        require(reserveVault_ != address(0), "reserve=0");
        treasury = treasury_;
        reserveVault = reserveVault_;
        emit TreasuryUpdated(treasury_, reserveVault_);
    }

    function _weightFor(uint8 dataClass, uint8 qualityScore) internal pure returns (uint256) {
        uint256 classWeight;
        if (dataClass == 0) {
            classWeight = 100;
        } else if (dataClass == 1 || dataClass == 2) {
            classWeight = 150;
        } else if (dataClass == 3) {
            classWeight = 180;
        } else {
            classWeight = 250;
        }
        return classWeight * uint256(qualityScore);
    }
}
