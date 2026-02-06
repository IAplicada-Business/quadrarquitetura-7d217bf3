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
import Budgets from "./pages/Budgets";
import Purchases from "./pages/Purchases";
import Financial from "./pages/Financial";
import SiteTracking from "./pages/SiteTracking";
import Suppliers from "./pages/Suppliers";
import Documents from "./pages/Documents";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/SettingsPage";
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
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/financial" element={<Financial />} />
              <Route path="/site-tracking" element={<SiteTracking />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
