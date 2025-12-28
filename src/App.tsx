import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import FairTicket from './pages/FairTicket';
import Placeholder from './pages/Placeholder';
import OrganizerDashboardPage from './pages/OrganizerDashboard';
import CyberpunkTicket from './components/CyberpunkTicket';
import FairTicketMVP from './pages/FairTicketMVP';
import Verifier from './pages/Verifier';
import { ContractDiagnostic } from './components/ContractDiagnostic';

const App = () => (
  <TooltipProvider>
    <Toaster />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FairTicketMVP />} />
        <Route path="/my-ticket" element={<FairTicketMVP />} />
        <Route path="/diagnostic" element={<ContractDiagnostic />} />
        <Route path="/classic" element={<FairTicket />} />
        <Route path="/organizer" element={<OrganizerDashboardPage />} />
        <Route path="/cyberpunk" element={<CyberpunkTicket />} />
        <Route path="/verifier" element={<Verifier />} />
        <Route path="/scanner" element={<Verifier />} />
        <Route path="*" element={<Placeholder />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
