import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Journal from "./pages/Journal";
import NewEntry from "./pages/NewEntry";
import VisionBoard from "./pages/VisionBoard";
import MoodTracker from "./pages/MoodTracker";
import Affirmations from "./pages/Affirmations";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { useSupabaseAuth } from "./hooks/useSupabaseAuth";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading } = useSupabaseAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-soul-purple mx-auto"></div>
          <p className="text-muted-foreground">Loading your sanctuary...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/journal/new" element={<NewEntry />} />
        <Route path="/journal/edit" element={<NewEntry />} />
        <Route path="/vision" element={<VisionBoard />} />
        <Route path="/mood" element={<MoodTracker />} />
        <Route path="/affirmations" element={<Affirmations />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
