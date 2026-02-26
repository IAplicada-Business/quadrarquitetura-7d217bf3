import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import DashboardEscritorio from "./pages/DashboardEscritorio";
import DashboardObras from "./pages/DashboardObras";
import Clients from "./pages/Clients";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import LeadsPipeline from "./pages/LeadsPipeline";
import LeadsProposals from "./pages/LeadsProposals";
import LeadsContracts from "./pages/LeadsContracts";
import SiteTracking from "./pages/SiteTracking";
import ConstructionTasks from "./pages/ConstructionTasks";
import Suppliers from "./pages/Suppliers";
import Documents from "./pages/Documents";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/SettingsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import VoiceTasksPage from "./pages/VoiceTasksPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Navigate to="/dashboard/escritorio" replace />} />
              <Route path="/dashboard/escritorio" element={<DashboardEscritorio />} />
              <Route path="/dashboard/obras" element={<DashboardObras />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              {/* Leads */}
              <Route path="/leads/pipeline" element={<LeadsPipeline />} />
              <Route path="/leads/proposals" element={<LeadsProposals />} />
              <Route path="/leads/contracts" element={<LeadsContracts />} />
              {/* Obra */}
              <Route path="/construction/tracking" element={<SiteTracking />} />
              <Route path="/construction/tasks" element={<ConstructionTasks />} />
              <Route path="/construction/suppliers" element={<Suppliers />} />
              <Route path="/construction/voice-tasks" element={<VoiceTasksPage />} />
              <Route path="/construction/documents" element={<Documents />} />
              <Route path="/construction/reports" element={<Reports />} />
              {/* Administrativo */}
              <Route path="/admin/settings" element={<SettingsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              {/* Redirects de compatibilidade */}
              <Route path="/site-tracking" element={<Navigate to="/construction/tracking" replace />} />
              <Route path="/suppliers" element={<Navigate to="/construction/suppliers" replace />} />
              <Route path="/documents" element={<Navigate to="/construction/documents" replace />} />
              <Route path="/reports" element={<Navigate to="/construction/reports" replace />} />
              <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
              <Route path="/budgets" element={<Navigate to="/projects" replace />} />
              <Route path="/purchases" element={<Navigate to="/projects" replace />} />
              <Route path="/financial" element={<Navigate to="/projects" replace />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
