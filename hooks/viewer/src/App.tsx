import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar, Header, PageContainer } from '@/components/layout';
import { OverviewPage } from '@/pages/overview';
import { PlansPage } from '@/pages/plans';
import { SessionsPage } from '@/pages/sessions';
import { SettingsPage } from '@/pages/settings';

export default function App() {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <PageContainer>
            <Routes>
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<OverviewPage />} />
              <Route path="/plans" element={<PlansPage />} />
              <Route path="/sessions" element={<SessionsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </PageContainer>
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </BrowserRouter>
  );
}
