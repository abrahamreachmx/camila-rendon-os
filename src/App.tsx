import { QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { ConfigScreen } from '@/components/ConfigScreen'
import { AppShell } from '@/components/layout/AppShell'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider, RequireAuth } from '@/lib/auth'
import { queryClient } from '@/lib/queryClient'
import { isSupabaseConfigured } from '@/lib/supabase'
import LoginPage from '@/routes/login/LoginPage'

const HomePage = lazy(() => import('@/routes/home/HomePage'))
const CampaignsPage = lazy(() => import('@/routes/campaigns/CampaignsPage'))
const CampaignNewPage = lazy(() => import('@/routes/campaigns/CampaignNewPage'))
const CampaignDetailPage = lazy(() => import('@/routes/campaigns/CampaignDetailPage'))
const PaymentsPage = lazy(() => import('@/routes/payments/PaymentsPage'))
const CompaniesPage = lazy(() => import('@/routes/companies/CompaniesPage'))
const CompanyDetailPage = lazy(() => import('@/routes/companies/CompanyDetailPage'))
const GiftingPage = lazy(() => import('@/routes/gifting/GiftingPage'))
const ReportsPage = lazy(() => import('@/routes/reports/ReportsPage'))
const SettingsPage = lazy(() => import('@/routes/settings/SettingsPage'))

function PageFallback() {
  return <div className="py-16 text-center text-ink-muted">Cargando…</div>
}

export default function App() {
  if (!isSupabaseConfigured) return <ConfigScreen />

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                element={
                  <RequireAuth>
                    <AppShell />
                  </RequireAuth>
                }
              >
                <Route index element={<HomePage />} />
                <Route path="campanas" element={<CampaignsPage />} />
                <Route path="campanas/nueva" element={<CampaignNewPage />} />
                <Route path="campanas/:id" element={<CampaignDetailPage />} />
                <Route path="cobros" element={<PaymentsPage />} />
                <Route path="marcas" element={<CompaniesPage />} />
                <Route path="marcas/:id" element={<CompanyDetailPage />} />
                <Route path="gifting" element={<GiftingPage />} />
                <Route path="reportes" element={<ReportsPage />} />
                <Route path="configuracion" element={<SettingsPage />} />
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
