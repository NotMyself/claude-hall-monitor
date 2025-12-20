import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar, Header, PageContainer } from '@/components/layout';
import { ErrorBoundary } from '@/components/shared';
import { OverviewPage } from '@/pages/overview';
import { PlansPage } from '@/pages/plans';
import { SessionsPage } from '@/pages/sessions';
import { SettingsPage } from '@/pages/settings';
import { useNavigationShortcuts, useTheme } from '@/hooks';

function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  useNavigationShortcuts();
  return <>{children}</>;
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  useTheme();
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <KeyboardShortcutsProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <Header />
              <PageContainer>
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<Navigate to="/overview" replace />} />
                    <Route path="/overview" element={<OverviewPage />} />
                    <Route path="/plans" element={<PlansPage />} />
                    <Route path="/sessions" element={<SessionsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Routes>
                </ErrorBoundary>
              </PageContainer>
            </SidebarInset>
          </SidebarProvider>
          <Toaster />
        </KeyboardShortcutsProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
