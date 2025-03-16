
import { Button } from "@/components/ui/button";
import { Bell, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
export default function CMSHeader() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [pageTitle, setPageTitle] = useState("Dashboard");

  // Set page title based on current route
  useEffect(() => {
    const path = window.location.pathname;
    let title = "Dashboard";

    if (path.includes("content-types")) title = "Content Types";
    else if (path.includes("menu-builder")) title = "Menu Builder";
    else if (path.includes("users")) title = "Users";
    else if (path.includes("settings")) title = "Settings";
    else if (path === "/dashboard") title = "Dashboard";

    setPageTitle(title);
  }, [navigate]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    setIsDark(!isDark);
  };

  return (
    
    <header className="border-b border-border h-16 px-4 flex items-center justify-between bg-background">
      <SidebarTrigger />
      <h1 className="text-xl font-semibold">{pageTitle}</h1>
      
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
                2
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex justify-between items-center px-4 py-2 border-b">
              <h4 className="font-medium">Notifications</h4>
              <Button variant="ghost" size="sm">Mark all as read</Button>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              <DropdownMenuItem className="p-3 cursor-pointer">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <p className="font-medium">New user registered</p>
                    <span className="text-xs text-muted-foreground">1h ago</span>
                  </div>
                  <p className="text-sm text-muted-foreground">John Doe has registered as an editor</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-3 cursor-pointer">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <p className="font-medium">Content type updated</p>
                    <span className="text-xs text-muted-foreground">3h ago</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Blog post schema was modified by admin</p>
                </div>
              </DropdownMenuItem>
            </div>
            <div className="border-t p-2">
              <Button variant="ghost" className="w-full" size="sm" onClick={() => navigate("/notifications")}>
                View all notifications
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
