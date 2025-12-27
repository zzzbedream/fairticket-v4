/**
 * FairTicket V4 - Main DApp Interface
 * 
 * Features:
 * - Mint tickets with payment
 * - View owned tickets
 * - Return tickets with bank run protection
 * - Organizer controls (deposit reserve, withdraw)
 * - Real-time contract balance monitoring
 */

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatEther, parseEther } from 'viem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { SmartRefundButton } from '@/components/SmartRefundButton';
import { contractAddress, contractABI } from '@/utils/evmConfig';
import { Ticket, Wallet, AlertTriangle, TrendingUp, Clock, Shield } from 'lucide-react';

export default function FairTicket() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Read contract data
  const { data: ticketPrice } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'ticketPrice',
  });

  const { data: eventTimestamp } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'eventTimestamp',
  });

  const { data: contractBalance, refetch: refetchBalance } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getContractBalance',
    query: {
      refetchInterval: 5000,
    },
  });

  const { data: lockedReserve } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getLockedReserve',
    query: {
      refetchInterval: 5000,
    },
  });

  const { data: totalTickets } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getTotalTicketsMinted',
    query: {
      refetchInterval: 5000,
    },
  });

  const { data: userBalance } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  });

  const { data: organizer } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'organizer',
  });

  // Mint ticket
  const { writeContract: mintTicket, data: mintHash } = useWriteContract();
  const { isLoading: isMinting, isSuccess: mintSuccess } = useWaitForTransactionReceipt({
    hash: mintHash,
  });

  // Deposit reserve
  const { writeContract: depositReserve, data: depositHash } = useWriteContract();
  const { isLoading: isDepositing, isSuccess: depositSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  // Withdraw organizer
  const { writeContract: withdrawOrganizer, data: withdrawHash } = useWriteContract();
  const { isLoading: isWithdrawing, isSuccess: withdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  // Handle mint success
  useEffect(() => {
    if (mintSuccess) {
      toast({
        title: 'Ticket Minted!',
        description: 'Your ticket has been successfully purchased.',
      });
      refetchBalance();
    }
  }, [mintSuccess]);

  // Handle deposit success
  useEffect(() => {
    if (depositSuccess) {
      toast({
        title: 'Reserve Deposited',
        description: `Successfully deposited ${depositAmount} MATIC to contract reserve.`,
      });
      setDepositAmount('');
      refetchBalance();
    }
  }, [depositSuccess]);

  // Handle withdraw success
  useEffect(() => {
    if (withdrawSuccess) {
      toast({
        title: 'Withdrawal Successful',
        description: `Successfully withdrew ${withdrawAmount} MATIC.`,
      });
      setWithdrawAmount('');
      refetchBalance();
    }
  }, [withdrawSuccess]);

  const handleMintTicket = () => {
    if (!ticketPrice) return;
    mintTicket({
      address: contractAddress,
      abi: contractABI,
      functionName: 'mintTicket',
      value: ticketPrice,
    });
  };

  const handleDepositReserve = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount to deposit.',
        variant: 'destructive',
      });
      return;
    }
    depositReserve({
      address: contractAddress,
      abi: contractABI,
      functionName: 'depositReserve',
      value: parseEther(depositAmount),
    });
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount to withdraw.',
        variant: 'destructive',
      });
      return;
    }
    withdrawOrganizer({
      address: contractAddress,
      abi: contractABI,
      functionName: 'withdrawOrganizer',
      args: [parseEther(withdrawAmount)],
    });
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const isOrganizer = address && organizer && address.toLowerCase() === organizer.toLowerCase();

  // Calculate reserve health
  const reserveHealth = contractBalance && lockedReserve && lockedReserve > 0n
    ? Number((contractBalance * 100n) / lockedReserve)
    : 100;

  const isReserveHealthy = reserveHealth >= 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              FairTicket V4
            </h1>
            <p className="text-muted-foreground mt-1">Soulbound Event Tickets with Bank Run Protection</p>
          </div>
          <ConnectButton />
        </div>

        {/* Reserve Health Alert */}
        {!isReserveHealthy && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Reserve Liquidity Warning</AlertTitle>
            <AlertDescription>
              Contract balance is below the required 20% reserve. Some refunds may fail until liquidity is restored.
              Current health: {reserveHealth.toFixed(0)}%
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Event Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Event Information
              </CardTitle>
              <CardDescription>Blockchain Music Festival 2025</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Price</p>
                  <p className="text-2xl font-bold">
                    {ticketPrice ? formatEther(ticketPrice) : '0'} MATIC
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Event Date</p>
                  <p className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {eventTimestamp ? formatDate(eventTimestamp) : 'Loading...'}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Refund Policy</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">90%</Badge>
                    <span>More than 7 days before event</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">50%</Badge>
                    <span>More than 48 hours before event</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">0%</Badge>
                    <span>Less than 48 hours before event</span>
                  </div>
                </div>
              </div>

              <Separator />

              {isConnected ? (
                <div className="space-y-3">
                  <Button 
                    onClick={handleMintTicket} 
                    disabled={isMinting}
                    className="w-full"
                    size="lg"
                  >
                    {isMinting ? 'Minting...' : `Buy Ticket (${ticketPrice ? formatEther(ticketPrice) : '0'} MATIC)`}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Tickets are soulbound (non-transferable) and can be returned for partial refund
                  </p>
                </div>
              ) : (
                <Alert>
                  <Wallet className="h-4 w-4" />
                  <AlertTitle>Connect Wallet</AlertTitle>
                  <AlertDescription>
                    Please connect your wallet to purchase tickets
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Contract Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Contract Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets Sold</p>
                <p className="text-3xl font-bold">{totalTickets?.toString() || '0'}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">Contract Balance</p>
                <p className="text-2xl font-bold">
                  {contractBalance ? parseFloat(formatEther(contractBalance)).toFixed(4) : '0'} MATIC
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Locked Reserve (20%)
                </p>
                <p className="text-lg font-semibold">
                  {lockedReserve ? parseFloat(formatEther(lockedReserve)).toFixed(4) : '0'} MATIC
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Reserve Health</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${isReserveHealthy ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(reserveHealth, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">{reserveHealth.toFixed(0)}%</span>
                </div>
              </div>

              {isConnected && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Your Tickets</p>
                    <p className="text-2xl font-bold">{userBalance?.toString() || '0'}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* My Tickets */}
          {isConnected && userBalance && userBalance > 0n && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>My Tickets</CardTitle>
                <CardDescription>Manage your purchased tickets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: Number(userBalance) }, (_, i) => (
                    <Card key={i}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">Ticket #{i + 1}</h3>
                            <p className="text-sm text-muted-foreground">Blockchain Music Festival 2025</p>
                          </div>
                          <Badge>Soulbound</Badge>
                        </div>
                        <Separator className="my-4" />
                        <SmartRefundButton 
                          tokenId={BigInt(i + 1)} 
                          userAddress={address}
                          onSuccess={refetchBalance}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Crisis Recovery - Deposit Reserve */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Crisis Recovery
              </CardTitle>
              <CardDescription>Top up contract reserve</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Bank Run Protection</AlertTitle>
                <AlertDescription className="text-xs">
                  Anyone can deposit to restore liquidity and enable refunds
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Amount in MATIC"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  step="0.01"
                />
                <Button 
                  onClick={handleDepositReserve}
                  disabled={isDepositing || !isConnected}
                  className="w-full"
                  variant="outline"
                >
                  {isDepositing ? 'Depositing...' : 'Deposit Reserve'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Organizer Controls */}
          {isOrganizer && (
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Organizer Controls</CardTitle>
                <CardDescription>Manage contract funds (20% reserve protected)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Withdraw Funds</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Amount in MATIC"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        step="0.01"
                      />
                      <Button 
                        onClick={handleWithdraw}
                        disabled={isWithdrawing}
                      >
                        {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Maximum withdrawable: {contractBalance && lockedReserve 
                        ? parseFloat(formatEther(contractBalance > lockedReserve ? contractBalance - lockedReserve : 0n)).toFixed(4)
                        : '0'} MATIC
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
