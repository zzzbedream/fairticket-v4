/**
 * Wagmi Configuration for FairTicket V4
 */

import { http, createConfig } from 'wagmi';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { fairTicketChain } from '@/utils/evmConfig';

export const config = getDefaultConfig({
  appName: 'FairTicket V4',
  projectId: 'YOUR_PROJECT_ID', // Get from WalletConnect Cloud
  chains: [fairTicketChain as any],
  transports: {
    [fairTicketChain.id]: http(),
  },
  ssr: false,
});
