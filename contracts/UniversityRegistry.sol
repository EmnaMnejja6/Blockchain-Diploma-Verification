// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract UniversityRegistry {
    address public admin;

    struct University {
        address wallet;
        bool active;
        bool exists;
    }

    mapping(string => University) private universities;
    mapping(address => bool) private walletUsed;
    mapping(address => string) private nameOfWallet;

    string[] private names;

    event UniversityAdded(string name, address wallet);
    event UniversityRevoked(string name, address wallet);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
    }
}
