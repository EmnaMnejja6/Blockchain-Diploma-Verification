// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IUniversityRegistry {
    function isActiveUniversity(address wallet) external view returns (bool);
}

contract DiplomaRegistry {
    IUniversityRegistry public immutable registry;

    struct Diploma {
        address issuer;
        uint256 issuedAt;
        bool revoked;
        string revokeReason;
        bool exists;
    }

    mapping(bytes32 => Diploma) public diplomas; // Hash --> Data of Diploma

    //Log activities to the blockchain
    event DiplomaIssued(bytes32 indexed hash, address indexed issuer, uint256 issuedAt);
    event DiplomaRevoked(bytes32 indexed hash, address indexed issuer, string reason);

    //Takes the address of the university registry and stores it
    constructor(address registryAddress) {
        registry = IUniversityRegistry(registryAddress);
    }

    function issueDiploma(bytes32 hash) external {
        //Checks that the caller is an active university according to the registry
        require(registry.isActiveUniversity(msg.sender), "Not an active university");
        //Checks that this hash hasn’t already been registered
        require(!diplomas[hash].exists, "Diploma already registered");

        diplomas[hash] = Diploma(msg.sender, block.timestamp, false, "", true);
        emit DiplomaIssued(hash, msg.sender, block.timestamp);
    }

    function revokeDiploma(bytes32 hash, string calldata reason) external {
        Diploma storage d = diplomas[hash];
        require(d.exists, "Unknown diploma");
        require(d.issuer == msg.sender, "Only the issuer can revoke");
        require(!d.revoked, "Already revoked");

        d.revoked = true;
        d.revokeReason = reason;
        emit DiplomaRevoked(hash, msg.sender, reason);
    }
}