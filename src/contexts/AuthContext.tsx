
import React, { createContext, useContext, useState, useEffect } from "react";
import { usersApi, User, Role } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (requiredRole: Role) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("cms_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("cms_user");
      }
    }
    setLoading(false);
  }, []);

  // In a real app, this would verify credentials with the backend
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // This is a simplified mock authentication
      // In a real app, you would verify credentials with the backend
      const users = await usersApi.getAll();
      const foundUser = users.find((u: User) => u.email === email);
      
      if (foundUser) {
        // In a real app, you would validate the password here
        setUser(foundUser);
        localStorage.setItem("cms_user", JSON.stringify(foundUser));
        toast({
          title: "Login successful",
          description: `Welcome back, ${foundUser.name}!`,
        });
      } else {
        throw new Error("Invalid email or password");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("cms_user");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const hasPermission = (requiredRole: Role): boolean => {
    if (!user) return false;
    
    const roleHierarchy: Record<Role, number> = {
      admin: 3,
      editor: 2,
      viewer: 1
    };
    
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    hasPermission,
  };
  return (
    <AuthContext.Provider value={ value }>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
