import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ScrollToTop } from "./components/ScrollToTop";
import Dashboard from "./pages/Dashboard";
import Trainees from "./pages/Trainees";
import Coaches from "./pages/Coaches";
import Sessions from "./pages/Sessions";
import Employees from "./pages/Employees";
import Branches from "./pages/Branches";
import Sports from "./pages/Sports";
import Enrollments from "./pages/Enrollments";
import Attendance from "./pages/Attendance";
import Profiles from "./pages/Profiles";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/trainees" element={<Trainees />} />
            <Route path="/coaches" element={<Coaches />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/branches" element={<Branches />} />
            <Route path="/sports" element={<Sports />} />
            <Route path="/enrollments" element={<Enrollments />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/profiles" element={<Profiles />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
