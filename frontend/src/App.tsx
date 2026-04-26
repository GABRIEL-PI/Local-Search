import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import AppLayout from '@/components/layout/AppLayout'
import LandingPage from '@/pages/LandingPage'
import Login from '@/pages/auth/Login'
import Dashboard from '@/pages/Dashboard'
import Prospecting from '@/pages/Prospecting'
import Queue from '@/pages/Queue'
import CRM from '@/pages/CRM'
import LeadDetail from '@/pages/LeadDetail'
import ProposalBuilder from '@/pages/ProposalBuilder'
import Reports from '@/pages/Reports'
import Settings from '@/pages/Settings'
import Onboarding from '@/pages/Onboarding'
import Outreach from '@/pages/Outreach'
import ToastContainer from '@/components/ui/ToastContainer'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Navigate to="/app" replace /> : <>{children}</>

}

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Protected app routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="prospecting" element={<Prospecting />} />
          <Route path="queue" element={<Queue />} />
          <Route path="crm" element={<CRM />} />
          <Route path="leads/:id" element={<LeadDetail />} />
          <Route path="proposals/:id" element={<ProposalBuilder />} />
          <Route path="outreach" element={<Outreach />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="onboarding" element={<Onboarding />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
