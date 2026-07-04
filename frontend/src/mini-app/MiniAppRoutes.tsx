import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { MiniAppLayout } from './components/layout/MiniAppLayout';
import { LoadingState } from './components/ui/StateBlocks';
import { SettingsProvider } from './context/SettingsProvider';
import { TelegramProvider } from './context/TelegramProvider';
import { MiniAppHomePage } from './pages/HomePage';
import './styles/mini-app-theme.css';

const FundingPage = lazy(() =>
  import('./pages/FundingPage').then((m) => ({ default: m.FundingPage })),
);
const CashCarryPage = lazy(() =>
  import('./pages/CashCarryPage').then((m) => ({ default: m.CashCarryPage })),
);
const OpportunityDetailPage = lazy(() =>
  import('./pages/OpportunityDetailPage').then((m) => ({ default: m.OpportunityDetailPage })),
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);

function LazyMiniPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingState />}>{children}</Suspense>;
}

/** Корневой роутер Telegram Mini App */
export function MiniAppRoutes() {
  return (
    <TelegramProvider>
      <SettingsProvider>
        <Routes>
          <Route element={<MiniAppLayout />}>
            <Route index element={<MiniAppHomePage />} />
            <Route
              path="funding"
              element={
                <LazyMiniPage>
                  <FundingPage />
                </LazyMiniPage>
              }
            />
            <Route
              path="cash-carry"
              element={
                <LazyMiniPage>
                  <CashCarryPage />
                </LazyMiniPage>
              }
            />
            <Route
              path="settings"
              element={
                <LazyMiniPage>
                  <SettingsPage />
                </LazyMiniPage>
              }
            />
            <Route
              path="opportunity/:id"
              element={
                <LazyMiniPage>
                  <OpportunityDetailPage />
                </LazyMiniPage>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/mini-app" replace />} />
        </Routes>
      </SettingsProvider>
    </TelegramProvider>
  );
}
