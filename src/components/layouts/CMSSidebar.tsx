
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Settings, FileText, Menu, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useApp } from '@/contexts/AppContext';
import * as Icons from 'lucide-react';

export default function CMSSidebar() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
    // Dynamic icon component lookup
    const getIcon = (iconName: string) => {
      const LucideIcon = (Icons as any)[iconName.charAt(0).toUpperCase() + iconName.slice(1)] || Icons.File;
      return <LucideIcon size={20} />;
    };

  // // Main navigation items
  const navigationItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      requiredRole: "viewer" as const,
    },
    {
      title: "Content Types",
      url: "/content-types",
      icon: FileText,
      requiredRole: "editor" as const,
    },
    {
      title: "Menu Builder",
      url: "/menu-builder",
      icon: Menu,
      requiredRole: "editor" as const,
    },
    {
      title: "Users",
      url: "/users",
      icon: Users,
      requiredRole: "admin" as const,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
      requiredRole: "admin" as const,
    },
  ];
 // const navigationItems = useApp();
  // Filter navigation items based on user role
  const filteredNavigationItems = navigationItems.filter(item => 
    hasPermission(item.requiredRole)
  );

  return (
    <Sidebar>
      <SidebarHeader className="flex justify-between items-center h-16 px-4">
        <div className="flex items-center">
          <div className="font-bold text-xl text-cms-primary">Billing Software</div>
        </div>
       
      </SidebarHeader>
      
      <SidebarContent>
        {user && (
          <div className="px-4 py-2 mb-4">
            <div className="flex items-center space-x-3 p-2 rounded-md bg-accent/50">
              <Avatar>
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-cms-primary text-white">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
              </div>
            </div>
          </div>
        )}
        
        <SidebarGroup>
          <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} onClick={(e) => {
                      e.preventDefault();
                      navigate(item.url);
                    }}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
