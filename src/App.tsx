import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { ScrollToTop } from "./components/ScrollToTop";
import Dashboard from "./pages/Dashboard";
import Trainees from "./pages/Trainees";
import Coaches from "./pages/Coaches";
import TraineeGroups from "./pages/TraineeGroups";
import SessionOccurrences from "./pages/SessionOccurrences";
import Employees from "./pages/Employees";
import Branches from "./pages/Branches";
import Sports from "./pages/Sports";
import Enrollments from "./pages/Enrollments";
import Attendance from "./pages/Attendance";
import Profiles from "./pages/Profiles";
import UsersRoles from "./pages/UsersRoles";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/trainees" element={<Trainees />} />
                      <Route path="/coaches" element={<Coaches />} />
                      <Route
                        path="/trainee-groups"
                        element={<TraineeGroups />}
                      />
                      <Route
                        path="/session-occurrences"
                        element={<SessionOccurrences />}
                      />
                      <Route path="/employees" element={<Employees />} />
                      <Route path="/branches" element={<Branches />} />
                      <Route path="/sports" element={<Sports />} />
                      <Route path="/enrollments" element={<Enrollments />} />
                      <Route path="/attendance" element={<Attendance />} />
                      <Route path="/profiles" element={<Profiles />} />
                      <Route path="/users-roles" element={<UsersRoles />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
