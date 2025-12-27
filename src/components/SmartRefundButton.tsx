/**
 * SmartRefundButton Component
 * 
 * Demonstrates "Graceful Degradation" UX pattern:
 * - Pre-checks contract balance BEFORE enabling button
 * - Shows specific error messages for different failure scenarios
 * - Handles custom ReserveDepleted error with user-friendly messaging
 * - Prevents users from submitting transactions that will fail
 */

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { BaseError, ContractFunctionRevertedError } from 'viem';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useRefundStatus } from '@/hooks/useRefundStatus';
import { contractAddress, contractABI } from '@/utils/evmConfig';
import { Loader2, AlertCircle, Clock, Wallet } from 'lucide-react';

interface SmartRefundButtonProps {
  tokenId: bigint;
  userAddress: `0x${string}` | undefined;
  onSuccess?: () => void;
}

export function SmartRefundButton({ tokenId, userAddress, onSuccess }: SmartRefundButtonProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Get refund status with pre-checks
  const refundStatus = useRefundStatus({ tokenId, userAddress });

  // Write contract hook
  const { writeContract, data: hash, error: writeError } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle transaction success
  if (isSuccess && isProcessing) {
    setIsProcessing(false);
    toast({
      title: 'Refund Successful',
      description: `You received ${refundStatus.estimatedRefund} MATIC back.`,
      variant: 'default',
    });
    onSuccess?.();
  }

  // Handle write errors with custom error parsing
  if (writeError && isProcessing) {
    setIsProcessing(false);
    
    // Parse custom contract errors
    if (writeError instanceof BaseError) {
      const revertError = writeError.walk(err => err instanceof ContractFunctionRevertedError);
      
      if (revertError instanceof ContractFunctionRevertedError) {
        const errorName = revertError.data?.errorName ?? '';
        
        // CRITICAL: Handle ReserveDepleted error specifically
        if (errorName === 'ReserveDepleted') {
          toast({
            title: 'Reserve Liquidity Depleted',
            description: 'The contract does not have enough funds for your refund. Please wait for new ticket sales or organizer top-up.',
            variant: 'destructive',
          });
          return null;
        }
        
        // Handle RefundWindowClosed error
        if (errorName === 'RefundWindowClosed') {
          toast({
            title: 'Refund Window Closed',
            description: 'The refund period has ended. Refunds are only available more than 48 hours before the event.',
            variant: 'destructive',
          });
          return null;
        }

        // Handle NotTicketOwner error
        if (errorName === 'NotTicketOwner') {
          toast({
            title: 'Not Ticket Owner',
            description: 'You do not own this ticket.',
            variant: 'destructive',
          });
          return null;
        }
      }
    }

    // Generic error fallback
    toast({
      title: 'Transaction Failed',
      description: writeError.message.slice(0, 100),
      variant: 'destructive',
    });
  }

  // Handle refund click
  const handleRefund = () => {
    if (!refundStatus.canRefund) return;

    setIsProcessing(true);
    writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'returnTicket',
      args: [tokenId],
    });
  };

  // Format time remaining
  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return 'Event has passed';
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    if (days > 0) return `${days}d ${hours}h until event`;
    return `${hours}h until event`;
  };

  // Render different states based on refund status
  const renderButton = () => {
    // Loading state
    if (refundStatus.reason === 'LOADING') {
      return (
        <Button disabled className="w-full">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </Button>
      );
    }

    // Not owner
    if (refundStatus.reason === 'NOT_OWNER') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button disabled className="w-full" variant="outline">
                <AlertCircle className="mr-2 h-4 w-4" />
                Not Your Ticket
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>You do not own this ticket</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Time passed - refund window closed
    if (refundStatus.reason === 'TIME_PASSED') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button disabled className="w-full" variant="outline">
                <Clock className="mr-2 h-4 w-4" />
                Refund Window Closed
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refunds are only available more than 48 hours before the event</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatTimeRemaining(refundStatus.timeUntilEvent)}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // CRITICAL: Reserve empty - Bank Run scenario
    if (refundStatus.reason === 'RESERVE_EMPTY') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button disabled className="w-full" variant="destructive">
                <Wallet className="mr-2 h-4 w-4" />
                Reserve Liquidity Low
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold">Contract Balance Too Low</p>
              <p className="text-xs mt-1">
                Contract: {parseFloat(refundStatus.contractBalance).toFixed(4)} MATIC
              </p>
              <p className="text-xs">
                Required: {parseFloat(refundStatus.estimatedRefund).toFixed(4)} MATIC
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Wait for new ticket sales or organizer top-up to restore liquidity.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // All checks passed - can refund
    return (
      <Button 
        onClick={handleRefund} 
        disabled={isConfirming || isProcessing}
        className="w-full"
      >
        {isConfirming || isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            Return Ticket ({refundStatus.refundPercentage}% refund)
          </>
        )}
      </Button>
    );
  };

  return (
    <div className="space-y-2">
      {renderButton()}
      
      {refundStatus.canRefund && (
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Refund: {parseFloat(refundStatus.estimatedRefund).toFixed(4)} MATIC ({refundStatus.refundPercentage}%)</p>
          <p className="text-xs">{formatTimeRemaining(refundStatus.timeUntilEvent)}</p>
        </div>
      )}
    </div>
  );
}
