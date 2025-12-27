import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import FairTicket from './pages/FairTicket';
import Placeholder from './pages/Placeholder';
import { OrganizerDashboard } from '@/components/OrganizerDashboard';

const App = () => (
  <TooltipProvider>
    <Toaster />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FairTicket />} />
        <Route path="/organizer" element={<div className="container mx-auto py-8"><OrganizerDashboard /></div>} />
        <Route path="*" element={<Placeholder />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
