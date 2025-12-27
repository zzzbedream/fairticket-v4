// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Test.sol";
import "../src/FairTicketV4.sol";

contract FairTicketV4Test is Test {
    FairTicketV4 public fairTicket;
    address public organizer;
    address public buyer1;
    address public buyer2;
    address public buyer3;

    uint256 public ticketPrice = 0.1 ether;
    uint256 public eventTimestamp;

    function setUp() public {
        organizer = address(0x1);
        buyer1 = address(0x2);
        buyer2 = address(0x3);
        buyer3 = address(0x4);

        // Event in 30 days
        eventTimestamp = block.timestamp + 30 days;

        // Deploy with organizer as owner
        vm.prank(organizer);
        fairTicket = new FairTicketV4(ticketPrice, eventTimestamp, organizer);

        // Fund test addresses
        vm.deal(buyer1, 10 ether);
        vm.deal(buyer2, 10 ether);
        vm.deal(buyer3, 10 ether);
        vm.deal(organizer, 10 ether);
    }

    // ============ Basic Mint Tests ============
    function testMintTicket() public {
        vm.prank(buyer1);
        fairTicket.mintTicket{value: ticketPrice}();

        assertEq(fairTicket.balanceOf(buyer1), 1);
        assertEq(fairTicket.ownerOf(0), buyer1);
    }

    function testMintMultipleTickets() public {
        vm.prank(buyer1);
        fairTicket.mintTicket{value: ticketPrice}();

        vm.prank(buyer2);
        fairTicket.mintTicket{value: ticketPrice}();

        assertEq(fairTicket.balanceOf(buyer1), 1);
        assertEq(fairTicket.balanceOf(buyer2), 1);
        assertEq(fairTicket.getTotalTicketsMinted(), 2);
    }

    function testMintWithExcessPayment() public {
        uint256 excessAmount = 0.05 ether;
        uint256 initialBalance = buyer1.balance;

        vm.prank(buyer1);
        fairTicket.mintTicket{value: ticketPrice + excessAmount}();

        // Check that excess was refunded
        assertEq(buyer1.balance, initialBalance - ticketPrice);
    }

    function testMintFailsWithInsufficientPayment() public {
        vm.prank(buyer1);
        vm.expectRevert(FairTicketV4.InsufficientPayment.selector);
        fairTicket.mintTicket{value: ticketPrice - 0.01 ether}();
    }

    // ============ Refund Calculation Tests ============
    function testRefund90PercentMoreThan7Days() public {
        vm.prank(buyer1);
        fairTicket.mintTicket{value: ticketPrice}();

        // Check refund amount (should be 90%)
        uint256 refundAmount = fairTicket.getRefundAmount(0);
        assertEq(refundAmount, (ticketPrice * 90) / 100);
    }

    function testRefund50PercentBetween48HoursAnd7Days() public {
        vm.prank(buyer1);
        fairTicket.mintTicket{value: ticketPrice}();

        // Fast forward to 3 days before event
        vm.warp(eventTimestamp - 3 days);

        uint256 refundAmount = fairTicket.getRefundAmount(0);
        assertEq(refundAmount, (ticketPrice * 50) / 100);
    }

    function testRefund0PercentWithin48Hours() public {
        vm.prank(buyer1);
        fairTicket.mintTicket{value: ticketPrice}();

        // Fast forward to 24 hours before event
        vm.warp(eventTimestamp - 24 hours);

        uint256 refundAmount = fairTicket.getRefundAmount(0);
        assertEq(refundAmount, 0);
    }

    function testRefund0PercentAfterEvent() public {
        vm.prank(buyer1);
        fairTicket.mintTicket{value: ticketPrice}();

        // Fast forward past event
        vm.warp(eventTimestamp + 1 days);

        uint256 refundAmount = fairTicket.getRefundAmount(0);
        assertEq(refundAmount, 0);
    }

    // ============ Return Ticket Tests ============
    function testReturnTicketWithin7Days() public {
        vm.prank(buyer1);
        fairTicket.mintTicket{value: ticketPrice}();

        uint256 expectedRefund = (ticketPrice * 90) / 100;
        uint256 initialBalance = buyer1.balance;

        vm.prank(buyer1);
        fairTicket.returnTicket(0);

        // Check refund was received
        assertEq(buyer1.balance, initialBalance + expectedRefund);

        // Check ticket was burned
        vm.expectRevert();
        fairTicket.ownerOf(0);
    }

    function testReturnTicketFailsIfNotOwner() public {
        vm.prank(buyer1);
        fairTicket.mintTicket{value: ticketPrice}();

        vm.prank(buyer2);
        vm.expectRevert(FairTicketV4.NotTicketOwner.selector);
        fairTicket.returnTicket(0);
    }

    function testReturnTicketFailsAfterRefundWindow() public {
        vm.prank(buyer1);
        fairTicket.mintTicket{value: ticketPrice}();

        // Fast forward past refund window
        vm.warp(eventTimestamp + 1 days);

        vm.prank(buyer1);
        vm.expectRevert(FairTicketV4.RefundWindowClosed.selector);
        fairTicket.returnTicket(0);
    }

    // ============ Reserve Protection Tests ============
    function testReserveDepleted() public {
        // Mint 3 tickets
        vm.prank(buyer1);
        fairTicket.mintTicket{value: ticketPrice}();

        vm.prank(buyer2);
        fairTicket.mintTicket{value: ticketPrice}();

        vm.prank(buyer3);
        fairTicket.mintTicket{value: ticketPrice}();

        // Contract has 0.3 MATIC
        assertEq(address(fairTicket).balance, 0.3 ether);

        // Withdraw most of the balance, leaving insufficient funds
        vm.prank(organizer);
        fairTicket.withdrawOrganizer(0.2 ether);

        // Now contract has 0.1 MATIC
        assertEq(address(fairTicket).balance, 0.1 ether);
    }

    function testBankRunScenario() public {
        // Mint 10 tickets
        for (uint256 i = 0; i < 10; i++) {
            address buyer = address(uint160(0x100 + i));
            vm.deal(buyer, 10 ether);
            vm.prank(buyer);
            fairTicket.mintTicket{value: ticketPrice}();
        }

        // Contract has 1 MATIC
        assertEq(address(fairTicket).balance, 1 ether);

        // Organizer withdraws too much, leaving insufficient reserve
        vm.prank(organizer);
        fairTicket.withdrawOrganizer(0.5 ether);

        // Now contract has 0.5 MATIC
        assertEq(address(fairTicket).balance, 0.5 ether);

        // Multiple refund requests should fail when balance depletes
        address buyer0 = address(uint160(0x100));
        address buyer1Addr = address(uint160(0x101));

        // First refund should succeed (0.09 MATIC)
        vm.prank(buyer0);
        fairTicket.returnTicket(0);

        // Second refund should succeed (0.09 MATIC)
        vm.prank(buyer1Addr);
        fairTicket.returnTicket(1);

        // Continue until balance is depleted
        for (uint256 i = 2; i < 10; i++) {
            address buyer = address(uint160(0x100 + i));
            uint256 refundAmount = fairTicket.getRefundAmount(i);

            if (address(fairTicket).balance < refundAmount) {
                vm.prank(buyer);
                vm.expectRevert(
                    abi.encodeWithSelector(
                        FairTicketV4.ReserveDepleted.selector,
                        address(fairTicket).balance,
                        refundAmount
                    )
                );
                fairTicket.returnTicket(i);
                break;
            } else {
                vm.prank(buyer);
                fairTicket.returnTicket(i);
            }
        }
    }

    // ============ Reserve Management Tests ============
    function testDepositReserve() public {
        uint256 depositAmount = 0.5 ether;
        uint256 initialBalance = address(fairTicket).balance;

        vm.prank(buyer1);
        fairTicket.depositReserve{value: depositAmount}();

        assertEq(address(fairTicket).balance, initialBalance + depositAmount);
    }

    function testGetContractBalance() public {
        vm.prank(buyer1);
        fairTicket.mintTicket{value: ticketPrice}();

        assertEq(fairTicket.getContractBalance(), ticketPrice);
    }

    function testLockedReserveCalculation() public {
        // Mint 5 tickets
        for (uint256 i = 0; i < 5; i++) {
            address buyer = address(uint160(0x100 + i));
            vm.deal(buyer, 10 ether);
            vm.prank(buyer);
            fairTicket.mintTicket{value: ticketPrice}();
        }

        // Locked reserve should be 20% of total ticket value
        uint256 expectedLockedReserve = (5 * ticketPrice * 20) / 100;
        assertEq(fairTicket.getLockedReserve(), expectedLockedReserve);
    }

    function testWithdrawalRespectLockedReserve() public {
        // Mint 5 tickets (0.5 MATIC total)
        for (uint256 i = 0; i < 5; i++) {
            address buyer = address(uint160(0x100 + i));
            vm.deal(buyer, 10 ether);
            vm.prank(buyer);
            fairTicket.mintTicket{value: ticketPrice}();
        }

        // Locked reserve is 20% of 0.5 = 0.1 MATIC
        // Available for withdrawal is 0.5 - 0.1 = 0.4 MATIC
        uint256 lockedReserve = fairTicket.getLockedReserve();
        assertEq(lockedReserve, 0.1 ether);

        // Try to withdraw more than available
        vm.expectRevert(FairTicketV4.WithdrawalExceedsLimit.selector);
        vm.prank(organizer);
        fairTicket.withdrawOrganizer(0.5 ether);

        // Withdraw within limit should succeed
        vm.prank(organizer);
        fairTicket.withdrawOrganizer(0.4 ether);

        assertEq(address(fairTicket).balance, 0.1 ether);
    }

    // ============ Soulbound Tests ============
    function testTransferFromReverts() public {
        vm.prank(buyer1);
        fairTicket.mintTicket{value: ticketPrice}();

        vm.prank(buyer1);
        vm.expectRevert(FairTicketV4.SoulboundTransfer.selector);
        fairTicket.transferFrom(buyer1, buyer2, 0);
    }

    function testApproveReverts() public {
        vm.prank(buyer1);
        fairTicket.mintTicket{value: ticketPrice}();

        vm.prank(buyer1);
        vm.expectRevert(FairTicketV4.SoulboundTransfer.selector);
        fairTicket.approve(buyer2, 0);
    }

    function testSetApprovalForAllReverts() public {
        vm.prank(buyer1);
        vm.expectRevert(FairTicketV4.SoulboundTransfer.selector);
        fairTicket.setApprovalForAll(buyer2, true);
    }

    // ============ Edge Cases ============
    function testInvalidEventTimestamp() public {
        vm.expectRevert(FairTicketV4.InvalidEventTime.selector);
        vm.prank(organizer);
        new FairTicketV4(ticketPrice, block.timestamp - 1 days, organizer);
    }

    function testGetRefundAmountForNonExistentToken() public {
        uint256 refundAmount = fairTicket.getRefundAmount(999);
        assertEq(refundAmount, 0);
    }
}
