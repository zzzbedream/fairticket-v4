// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "./FairTicketV4.sol";

/// @title TemporaryDeployFactory - EIP-6780 Self-Destructing Factory
/// @notice Deploys FairTicketV4 with chain-specific configuration and emits deployment event
contract TemporaryDeployFactory {
    /// @notice Emitted when contracts are deployed
    /// @param deployer Address of the deployer
    /// @param contractNames Array of deployed contract names
    /// @param contractAddresses Array of deployed contract addresses
    event ContractsDeployed(
        address indexed deployer,
        string[] contractNames,
        address[] contractAddresses
    );

    constructor() {
        uint256 chainId = block.chainid;

        // Chain-specific configuration
        uint256 ticketPrice;
        uint256 eventTimestamp;
        address organizer;

        if (chainId == 80002) {
            // Polygon Amoy Testnet
            ticketPrice = 0.1 ether; // 0.1 MATIC
            eventTimestamp = block.timestamp + 30 days; // Event in 30 days
            organizer = msg.sender;
        } else if (chainId == 137) {
            // Polygon Mainnet
            ticketPrice = 0.1 ether; // 0.1 MATIC
            eventTimestamp = block.timestamp + 30 days;
            organizer = msg.sender;
        } else if (chainId == 1) {
            // Ethereum Mainnet
            ticketPrice = 0.05 ether; // 0.05 ETH
            eventTimestamp = block.timestamp + 30 days;
            organizer = msg.sender;
        } else if (chainId == 11155111) {
            // Ethereum Sepolia
            ticketPrice = 0.05 ether;
            eventTimestamp = block.timestamp + 30 days;
            organizer = msg.sender;
        } else {
            // Default configuration for other chains
            ticketPrice = 0.1 ether;
            eventTimestamp = block.timestamp + 30 days;
            organizer = msg.sender;
        }

        // Deploy FairTicketV4
        FairTicketV4 fairTicket = new FairTicketV4(
            ticketPrice,
            eventTimestamp,
            organizer
        );

        // Build contract info arrays
        string[] memory contractNames = new string[](1);
        contractNames[0] = "FairTicketV4";

        address[] memory contractAddresses = new address[](1);
        contractAddresses[0] = address(fairTicket);

        // Emit deployment event
        emit ContractsDeployed(msg.sender, contractNames, contractAddresses);

        // Self-destruct to clean up
        selfdestruct(payable(msg.sender));
    }
}
