
import React, { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import CMSSidebar from "./CMSSidebar";
import CMSHeader from "./CMSHeader";
import { useAuth } from "@/contexts/AuthContext";
import { settingsApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export default function CMSLayout() {
  const { user, loading } = useAuth();
  
   // Fetch settings to apply theme and other settings
   const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get(),
    enabled: !!user, // Only fetch if logged in
  });
  
  // Apply settings when they change
  useEffect(() => {
    if (settings) {
      // Apply theme
      const html = document.documentElement;
      const theme = settings.appearance.theme;
      
      // Set document title based on site name
       if (settings.general.siteName) {
        document.title = `${settings.general.siteName} ` || 'Flex CMS';
      }
    }
  }, [settings]);
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cms-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to = "/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CMSSidebar />
        <div className="flex-1 flex flex-col min-h-screen max-h-screen overflow-hidden">
          <CMSHeader />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
