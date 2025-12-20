import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from '@/pages/overview';
import { PlansPage } from '@/pages/plans';
import { SessionsPage } from '@/pages/sessions';
import { SettingsPage } from '@/pages/settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
