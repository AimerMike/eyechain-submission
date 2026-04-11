// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IEvidenceRegistry {
    function isRegistered(address user) external view returns (bool);

    function getEvidenceMeta(uint256 evidenceId)
        external
        view
        returns (
            address owner,
            bool shared,
            bool appraised,
            uint8 qualityScore,
            uint8 dataClass
        );

    function creditReward(address user, uint256 amount, bytes32 reason) external;
}
