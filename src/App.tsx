
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";

// Layout
import CMSLayout from "@/components/layouts/CMSLayout";

// Pages
import LoginPage from "@/pages/auth/LoginPage";
import Dashboard from "@/pages/Dashboard";
import ContentTypes from "@/pages/ContentTypes";
import ContentTypeForm from "@/components/content-types/ContentTypeForm";
import MenuBuilderPage from "@/pages/MenuBuilder";
import Users from "@/pages/Users";
import UserForm from "@/components/users/UserForm";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import { useAuth } from "@/contexts/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cms-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
        
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              <Route path="/" element={ 
               <ProtectedRoute>
                 <CMSLayout />
               </ProtectedRoute>
             }>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                
                <Route path="content-types" element={<ContentTypes />} />
                <Route path="content-types/create" element={
                  <div className="max-w-4xl mx-auto">
                    <ContentTypeForm />
                  </div>
                } />
                <Route path="content-types/:id" element={
                  <div className="max-w-4xl mx-auto">
                    <ContentTypeForm />
                  </div>
                } />
                
                <Route path="menu-builder" element={<MenuBuilderPage />} />
                
                <Route path="users" element={<Users />} />
                <Route path="users/create" element={
                  <div className="max-w-4xl mx-auto">
                    <UserForm />
                  </div>
                } />
                <Route path="users/:id" element={
                  <div className="max-w-4xl mx-auto">
                    <UserForm />
                  </div>
                } />
                
                <Route path="settings" element={<Settings />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
        </TooltipProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
