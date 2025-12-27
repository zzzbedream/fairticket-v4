/**
 * useRefundStatus Hook
 * 
 * Pre-check logic for refund eligibility to prevent failed transactions.
 * Checks contract balance and time-based refund windows BEFORE allowing user to submit.
 */

import { useReadContract, useBlockNumber } from 'wagmi';
import { contractAddress, contractABI } from '@/utils/evmConfig';
import { formatEther } from 'viem';

export type RefundStatus =
  | 'OK'
  | 'TIME_PASSED'
  | 'RESERVE_EMPTY'
  | 'NOT_OWNER'
  | 'LOADING';

export interface RefundStatusResult {
  canRefund: boolean;
  reason: RefundStatus;
  estimatedRefund: string;
  estimatedRefundWei: bigint;
  contractBalance: string;
  contractBalanceWei: bigint;
  timeUntilEvent: number;
  refundPercentage: number;
}

interface UseRefundStatusParams {
  tokenId: bigint | undefined;
  userAddress: `0x${string}` | undefined;
}

export function useRefundStatus({ tokenId, userAddress }: UseRefundStatusParams): RefundStatusResult {
  // Get current block number to trigger re-renders
  const { data: blockNumber } = useBlockNumber({ watch: true });

  // Read contract balance
  const { data: contractBalance } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getContractBalance',
    query: {
      refetchInterval: 5000, // Refresh every 5 seconds
    },
  });

  // Read event timestamp
  const { data: eventTimestamp } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'eventTimestamp',
  });

  // Read ticket owner
  const { data: ticketOwner } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'ownerOf',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });

  // Read refund amount for this ticket
  const { data: refundAmount } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getRefundAmount',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });

  // Calculate refund status
  if (!tokenId || !userAddress || !contractBalance || !eventTimestamp || !refundAmount) {
    return {
      canRefund: false,
      reason: 'LOADING',
      estimatedRefund: '0',
      estimatedRefundWei: 0n,
      contractBalance: '0',
      contractBalanceWei: 0n,
      timeUntilEvent: 0,
      refundPercentage: 0,
    };
  }

  // Check ownership
  if (ticketOwner?.toLowerCase() !== userAddress.toLowerCase()) {
    return {
      canRefund: false,
      reason: 'NOT_OWNER',
      estimatedRefund: formatEther(refundAmount),
      estimatedRefundWei: refundAmount,
      contractBalance: formatEther(contractBalance),
      contractBalanceWei: contractBalance,
      timeUntilEvent: Number(eventTimestamp) - Math.floor(Date.now() / 1000),
      refundPercentage: 0,
    };
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const timeUntilEvent = Number(eventTimestamp) - currentTime;

  // Calculate refund percentage based on time
  let refundPercentage = 0;
  if (timeUntilEvent > 7 * 24 * 60 * 60) {
    refundPercentage = 90;
  } else if (timeUntilEvent > 48 * 60 * 60) {
    refundPercentage = 50;
  }

  // Check if refund window has closed
  if (refundAmount === 0n || refundPercentage === 0) {
    return {
      canRefund: false,
      reason: 'TIME_PASSED',
      estimatedRefund: '0',
      estimatedRefundWei: 0n,
      contractBalance: formatEther(contractBalance),
      contractBalanceWei: contractBalance,
      timeUntilEvent,
      refundPercentage: 0,
    };
  }

  // CRITICAL: Check if contract has sufficient balance (Bank Run Protection)
  if (contractBalance < refundAmount) {
    return {
      canRefund: false,
      reason: 'RESERVE_EMPTY',
      estimatedRefund: formatEther(refundAmount),
      estimatedRefundWei: refundAmount,
      contractBalance: formatEther(contractBalance),
      contractBalanceWei: contractBalance,
      timeUntilEvent,
      refundPercentage,
    };
  }

  // All checks passed
  return {
    canRefund: true,
    reason: 'OK',
    estimatedRefund: formatEther(refundAmount),
    estimatedRefundWei: refundAmount,
    contractBalance: formatEther(contractBalance),
    contractBalanceWei: contractBalance,
    timeUntilEvent,
    refundPercentage,
  };
}
