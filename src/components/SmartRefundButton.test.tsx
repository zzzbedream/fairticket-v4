import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SmartRefundButton } from './SmartRefundButton';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';

// Mock wagmi hooks
vi.mock('wagmi', () => ({
    useReadContract: vi.fn(),
    useWriteContract: vi.fn(),
    useWaitForTransactionReceipt: vi.fn(),
    useBlockNumber: vi.fn().mockReturnValue({ data: 123n }), // Add useBlockNumber mock
}));

// Mock utils/evmConfig
vi.mock('@/utils/evmConfig', () => ({
    contractAddress: '0x123',
    contractABI: [],
}));

// Mock useToast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({ toast: mockToast }),
}));

// Tooltip helper
vi.mock('@/components/ui/tooltip', () => ({
    TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('SmartRefundButton Component', () => {
    const mockWriteContract = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useWriteContract as any).mockReturnValue({
            writeContract: mockWriteContract,
            data: undefined,
            error: null
        });
        (useWaitForTransactionReceipt as any).mockReturnValue({ isSuccess: false, isLoading: false });

        // Default system time
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-01T12:00:00Z')); // Base time
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // Helper to mock contract reads based on function name
    const setupContractMocks = ({
        eventTimestamp = BigInt(new Date('2024-01-15T12:00:00Z').getTime() / 1000), // Default: 14 days later
        contractBalance = parseEther('100'),
        refundAmount = parseEther('10'),
        ownerOf = '0xuser',
        userAddress = '0xuser',
    }) => {
        (useReadContract as any).mockImplementation(({ functionName }: { functionName: string }) => {
            switch (functionName) {
                case 'eventTimestamp':
                    return { data: eventTimestamp };
                case 'getContractBalance':
                    return { data: contractBalance };
                case 'getRefundAmount':
                    return { data: refundAmount };
                case 'ownerOf':
                    return { data: ownerOf };
                default:
                    return { data: undefined };
            }
        });

        return { userAddress };
    };

    it('Scenario A: > 7 days left (90% Refund)', () => {
        // Current Time: Jan 1. Event: Jan 15 (14 days diff)
        setupContractMocks({
            eventTimestamp: BigInt(new Date('2024-01-15T12:00:00Z').getTime() / 1000),
        });

        render(
            <SmartRefundButton
                tokenId={1n}
                userAddress="0xuser"
            />
        );

        // Assert: Button should show 90% refund
        const button = screen.getByRole('button');
        expect(button).toBeEnabled();
        expect(button).toHaveTextContent(/90% refund/i);
    });

    it('Scenario B: < 7 days but > 48h left (50% Penalty)', () => {
        // Current Time: Jan 1. Event: Jan 4 (3 days diff)
        setupContractMocks({
            eventTimestamp: BigInt(new Date('2024-01-04T12:00:00Z').getTime() / 1000),
        });

        render(
            <SmartRefundButton
                tokenId={1n}
                userAddress="0xuser"
            />
        );

        // Assert: Button should show 50% refund
        const button = screen.getByRole('button');
        expect(button).toBeEnabled();
        expect(button).toHaveTextContent(/50% refund/i);
    });

    it('Scenario C: < 48h left (Closed)', () => {
        // Current Time: Jan 1. Event: Jan 1 + 2 hours
        setupContractMocks({
            eventTimestamp: BigInt(new Date('2024-01-01T14:00:00Z').getTime() / 1000),
        });

        render(
            <SmartRefundButton
                tokenId={1n}
                userAddress="0xuser"
            />
        );

        // Assert: Button should be disabled and show "Refund Window Closed"
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button).toHaveTextContent(/Refund Window Closed/i);
    });

    it('Scenario D: Bank Run (Reserve Low)', () => {
        // Event is far away (valid refund window) but balance is low
        // Refund Amount: 10 MATIC, Contract Balance: 5 MATIC
        setupContractMocks({
            eventTimestamp: BigInt(new Date('2024-01-15T12:00:00Z').getTime() / 1000),
            refundAmount: parseEther('10'),
            contractBalance: parseEther('5'),
            userAddress: '0xuser',
        });

        render(
            <SmartRefundButton
                tokenId={1n}
                userAddress="0xuser"
            />
        );

        // Assert: Button disabled due to low reserve
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button).toHaveTextContent(/Reserve Liquidity Low/i);
    });

    it('Refuses if User is not Owner', () => {
        setupContractMocks({
            ownerOf: '0xother',
            userAddress: '0xuser',
        });

        render(
            <SmartRefundButton
                tokenId={1n}
                userAddress="0xuser"
            />
        );

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button).toHaveTextContent(/Not Your Ticket/i);
    });
});
