// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title FairTicket V4 - Soulbound Event Ticket NFT with Refund Protection
/// @notice Non-transferable ERC-721 tickets with time-based refunds and reserve protection
contract FairTicketV4 is ERC721, Ownable {

    // ============ Custom Errors ============
    error ReserveDepleted(uint256 currentBalance, uint256 requestedAmount);
    error RefundWindowClosed();
    error NotTicketOwner();
    error InsufficientPayment();
    error InvalidEventTime();
    error WithdrawalExceedsLimit();
    error SoulboundTransfer();

    // ============ State Variables ============
    uint256 public ticketPrice;
    uint256 public eventTimestamp;
    address public organizer;

    uint256 private tokenIdCounter;

    // Mapping from tokenId to purchase timestamp
    mapping(uint256 => uint256) public purchaseTimestamp;

    // ============ Events ============
    event TicketMinted(uint256 indexed tokenId, address indexed buyer, uint256 timestamp);
    event TicketReturned(uint256 indexed tokenId, address indexed owner, uint256 refundAmount);
    event ReserveDeposited(address indexed depositor, uint256 amount);
    event OrganizerWithdrawal(address indexed organizer, uint256 amount);

    // ============ Constructor ============
    constructor(
        uint256 _ticketPrice,
        uint256 _eventTimestamp,
        address _organizer
    ) ERC721("FairTicket V4", "FTV4") Ownable(msg.sender) {
        if (_eventTimestamp <= block.timestamp) {
            revert InvalidEventTime();
        }
        ticketPrice = _ticketPrice;
        eventTimestamp = _eventTimestamp;
        organizer = _organizer;
    }

    // ============ Mint Function ============
    /// @notice Mint a ticket NFT with payment
    /// @dev Stores purchase timestamp for refund calculation
    function mintTicket() external payable {
        if (msg.value < ticketPrice) {
            revert InsufficientPayment();
        }

        uint256 tokenId = tokenIdCounter;
        tokenIdCounter++;

        purchaseTimestamp[tokenId] = block.timestamp;
        _safeMint(msg.sender, tokenId);

        emit TicketMinted(tokenId, msg.sender, block.timestamp);

        // Refund excess payment
        if (msg.value > ticketPrice) {
            (bool success, ) = msg.sender.call{value: msg.value - ticketPrice}("");
            require(success, "Refund failed");
        }
    }

    // ============ Refund Functions ============
    /// @notice Calculate refund amount based on time until event
    /// @param tokenId The ticket ID to calculate refund for
    /// @return refundAmount The calculated refund in wei
    function getRefundAmount(uint256 tokenId) public view returns (uint256) {
        if (!_exists(tokenId)) {
            return 0;
        }

        uint256 timeUntilEvent = eventTimestamp > block.timestamp
            ? eventTimestamp - block.timestamp
            : 0;

        // 90% refund if more than 7 days before event
        if (timeUntilEvent > 7 days) {
            return (ticketPrice * 90) / 100;
        }

        // 50% refund if more than 48 hours before event
        if (timeUntilEvent > 48 hours) {
            return (ticketPrice * 50) / 100;
        }

        // 0% refund otherwise (event started or within 48 hours)
        return 0;
    }

    /// @notice Return a ticket and receive refund
    /// @param tokenId The ticket ID to return
    function returnTicket(uint256 tokenId) external {
        // Check ownership
        if (ownerOf(tokenId) != msg.sender) {
            revert NotTicketOwner();
        }

        // Calculate refund amount
        uint256 refundAmount = getRefundAmount(tokenId);

        // Check if refund window is still open
        if (refundAmount == 0) {
            revert RefundWindowClosed();
        }

        // CRITICAL: Check if contract has sufficient balance
        if (address(this).balance < refundAmount) {
            revert ReserveDepleted(address(this).balance, refundAmount);
        }

        // Burn the ticket
        _burn(tokenId);

        // Transfer refund to ticket owner
        (bool success, ) = msg.sender.call{value: refundAmount}("");
        require(success, "Refund transfer failed");

        emit TicketReturned(tokenId, msg.sender, refundAmount);
    }

    // ============ Reserve Management ============
    /// @notice Deposit funds to contract reserve
    function depositReserve() external payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        emit ReserveDeposited(msg.sender, msg.value);
    }

    /// @notice Get current contract balance
    /// @return Current balance in wei
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Calculate locked reserve (20% of total ticket value for active tickets)
    /// @return lockedReserve The amount that must remain in contract
    function getLockedReserve() public view returns (uint256) {
        uint256 totalTicketValue = tokenIdCounter * ticketPrice;
        return (totalTicketValue * 20) / 100;
    }

    /// @notice Organizer withdrawal with reserve protection
    /// @param amount Amount to withdraw
    function withdrawOrganizer(uint256 amount) external onlyOwner {
        uint256 lockedReserve = getLockedReserve();
        uint256 availableBalance = address(this).balance;

        // Calculate maximum withdrawable amount
        uint256 maxWithdrawable = availableBalance > lockedReserve
            ? availableBalance - lockedReserve
            : 0;

        if (amount > maxWithdrawable) {
            revert WithdrawalExceedsLimit();
        }

        (bool success, ) = organizer.call{value: amount}("");
        require(success, "Withdrawal failed");

        emit OrganizerWithdrawal(organizer, amount);
    }

    // ============ Soulbound Override Functions ============
    /// @notice Override transferFrom to prevent ticket transfers (soulbound)
    function transferFrom(
        address,
        address,
        uint256
    ) public pure override {
        revert SoulboundTransfer();
    }

    /// @notice Override safeTransferFrom (with data) to prevent ticket transfers (soulbound)
    function safeTransferFrom(
        address,
        address,
        uint256,
        bytes memory
    ) public pure override {
        revert SoulboundTransfer();
    }

    /// @notice Override approve to prevent ticket approvals
    function approve(address, uint256) public pure override {
        revert SoulboundTransfer();
    }

    /// @notice Override setApprovalForAll to prevent ticket approvals
    function setApprovalForAll(address, bool) public pure override {
        revert SoulboundTransfer();
    }

    // ============ Helper Functions ============
    /// @notice Check if a token exists
    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId < tokenIdCounter && _ownerOf(tokenId) != address(0);
    }

    /// @notice Get total number of tickets minted
    function getTotalTicketsMinted() external view returns (uint256) {
        return tokenIdCounter;
    }
}
