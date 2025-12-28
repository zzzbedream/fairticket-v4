/**
 * OrganizerDashboard Component
 * 
 * Displays financial health of the event and allows organizer withdrawals.
 * Implements Bank Run Protection visibility by showing locked reserves vs available funds.
 */

import { useState, useEffect } from 'react';
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther, BaseError, ContractFunctionRevertedError } from 'viem';
import { contractAddress, contractABI } from '@/utils/evmConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wallet, Lock, TrendingUp, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function OrganizerDashboard() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Get Contract Balance (Real-time)
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: contractAddress,
  });

  // 2. Get Locked Reserve (20% of sales)
  const { data: lockedReserve, refetch: refetchReserve } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getLockedReserve',
  });

  // 3. Get Total Tickets Minted
  const { data: totalTickets } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getTotalTicketsMinted',
  });

  // 4. Get Ticket Price
  const { data: ticketPrice } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'ticketPrice',
  });

  // 5. Get Contract Owner to verify access
  const { data: owner } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'owner',
  });

  // Write Contract Hook
  const { writeContract, data: hash, error: writeError } = useWriteContract();

  // Wait for Transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Effect: Handle Success
  useEffect(() => {
    if (isSuccess && isProcessing) {
      setIsProcessing(false);
      setWithdrawAmount('');
      toast({
        title: 'Withdrawal Successful',
        description: `Successfully withdrew ${withdrawAmount} MATIC`,
        variant: 'default',
      });
      // Refresh data
      refetchBalance();
      refetchReserve();
    }
  }, [isSuccess, isProcessing, refetchBalance, refetchReserve, toast, withdrawAmount]);

  // Effect: Handle Errors
  useEffect(() => {
    if (writeError && isProcessing) {
      setIsProcessing(false);

      let errorMessage = writeError.message;

      if (writeError instanceof BaseError) {
        const revertError = writeError.walk(err => err instanceof ContractFunctionRevertedError);
        if (revertError instanceof ContractFunctionRevertedError) {
          errorMessage = revertError.data?.errorName || revertError.message;
        }
      }

      toast({
        title: 'Withdrawal Failed',
        description: errorMessage.slice(0, 100),
        variant: 'destructive',
      });
    }
  }, [writeError, isProcessing, toast]);

  // Handle Withdraw Action
  const handleWithdraw = () => {
    if (!withdrawAmount || isNaN(Number(withdrawAmount))) return;

    setIsProcessing(true);
    writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'withdrawOrganizer',
      args: [parseEther(withdrawAmount)],
    });
  };

  // Calculations
  const totalBalance = balanceData ? BigInt(balanceData.value) : 0n;
  const reserve = lockedReserve ? BigInt(lockedReserve as bigint) : 0n;
  const ticketsSold = totalTickets ? Number(totalTickets) : 0;
  const price = ticketPrice ? BigInt(ticketPrice) : 0n;
  const totalRevenue = price * BigInt(ticketsSold);

  // Available to withdraw = Balance - Reserve
  // If Balance < Reserve (Bank Run scenario), Available is 0
  let availableToWithdraw = totalBalance - reserve;
  if (availableToWithdraw < 0n) availableToWithdraw = 0n;

  const formattedBalance = balanceData ? formatEther(balanceData.value) : '0';
  const formattedReserve = lockedReserve ? formatEther(lockedReserve as bigint) : '0';
  const formattedAvailable = formatEther(availableToWithdraw);
  const formattedRevenue = formatEther(totalRevenue);

  // Access Control Check
  if (isConnected && owner && address && owner.toLowerCase() !== address.toLowerCase()) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto mt-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          Only the event organizer can access this dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  if (!isConnected) {
    return (
      <Card className="max-w-md mx-auto mt-8 text-center p-8">
        <h2 className="text-xl font-semibold mb-2">Connect Wallet</h2>
        <p className="text-muted-foreground">Please connect your wallet to view the organizer dashboard.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Organizer Dashboard</h2>
        <p className="text-muted-foreground">Manage event finances and liquidity reserves.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Vendidos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketsSold}</div>
            <p className="text-xs text-muted-foreground">Total tickets minted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parseFloat(formattedRevenue).toFixed(4)} ETH</div>
            <p className="text-xs text-muted-foreground">Tickets sold × price</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locked Reserve (20%)</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parseFloat(formattedReserve).toFixed(4)} ETH</div>
            <p className="text-xs text-muted-foreground">Reserved for refund liq.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available for Withdrawal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${availableToWithdraw > 0n ? 'text-green-600' : 'text-gray-500'}`}>
              {parseFloat(formattedAvailable).toFixed(4)} ETH
            </div>
            <p className="text-xs text-muted-foreground">Safe to withdraw</p>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Section */}
      <Card>
        <CardHeader>
          <CardTitle>Withdraw Revenue</CardTitle>
          <CardDescription>
            Withdraw ticket sales revenue. The 20% reserve remains locked in the contract until the event concludes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-sm items-center space-x-2">
            <div className="relative flex-1">
              <Input
                type="number"
                placeholder="0.0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                disabled={isProcessing || isConfirming || availableToWithdraw <= 0n}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setWithdrawAmount(formattedAvailable)}
                disabled={isProcessing || isConfirming || availableToWithdraw <= 0n}
              >
                MAX
              </Button>
            </div>
            <Button
              onClick={handleWithdraw}
              disabled={
                !withdrawAmount ||
                isProcessing ||
                isConfirming ||
                Number(withdrawAmount) <= 0 ||
                parseEther(withdrawAmount || '0') > availableToWithdraw
              }
            >
              {isProcessing || isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                'Withdraw'
              )}
            </Button>
          </div>
          {availableToWithdraw <= 0n && totalBalance > 0n && (
            <p className="text-sm text-yellow-600 mt-2">
              ⚠️ Funds are currently locked in reserve for potential refunds.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
