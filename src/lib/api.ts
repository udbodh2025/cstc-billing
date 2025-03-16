
import { toast } from "@/hooks/use-toast";
import {User, ContentType, MenuModule, MenuItem, Content, Settings } from "@/types";
// Base API URL for JSON Server
const API_URL = "http://localhost:3001";

// Generic fetch function with error handling
async function fetchWithErrorHandling(url: string, options: RequestInit = {}) {
  try {
    console.log(`API Request: ${options.method || 'GET'} ${url}`);
     if (options.body) {
       console.log('Request Body:', options.body);
     }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
     const data = await response.json();
     console.log('Response:', data);
     return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    toast({
      title: "API Error",
      description: message,
      variant: "destructive",
    });
    console.error("API Error:", message);
    throw error;
  }
}

// Type definitions


// API Services
export const usersApi = {
  getAll: () => fetchWithErrorHandling(`${API_URL}/users`),
  getById: (id: string) => fetchWithErrorHandling(`${API_URL}/users/${id}`),
  create: (user: Omit<User, "id" | "createdAt">) => 
    fetchWithErrorHandling(`${API_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        ...user, 
        createdAt: new Date().toISOString() 
      }),
    }),
  update: (id: string, user: Partial<User>) => 
    fetchWithErrorHandling(`${API_URL}/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    }),
  delete: (id: string) => 
    fetchWithErrorHandling(`${API_URL}/users/${id}`, { method: "DELETE" }),
};

export const contentTypesApi = {
  getAll: () => fetchWithErrorHandling(`${API_URL}/contentTypes`),
  getById: (id: string) => fetchWithErrorHandling(`${API_URL}/contentTypes/${id}`),
  create: (contentType: Omit<ContentType, "id" | "createdAt" | "updatedAt">) => 
    fetchWithErrorHandling(`${API_URL}/contentTypes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...contentType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    }),
  update: (id: string, contentType: Partial<ContentType>) => 
    fetchWithErrorHandling(`${API_URL}/contentTypes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...contentType,
        updatedAt: new Date().toISOString(),
      }),
    }),
  delete: (id: string) => 
    fetchWithErrorHandling(`${API_URL}/contentTypes/${id}`, { method: "DELETE" }),
};

export const menuModulesApi = {
  getAll: () => fetchWithErrorHandling(`${API_URL}/menuModules`),
  getById: (id: string) => fetchWithErrorHandling(`${API_URL}/menuModules/${id}`),
  create: (menuModule: Omit<MenuModule, "id">) => 
    fetchWithErrorHandling(`${API_URL}/menuModules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(menuModule),
    }),
  update: (id: string, menuModule: Partial<MenuModule>) => 
    fetchWithErrorHandling(`${API_URL}/menuModules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(menuModule),
    }),
  delete: (id: string) => 
    fetchWithErrorHandling(`${API_URL}/menuModules/${id}`, { method: "DELETE" }),
};

export const menuItemsApi = {
  getAll: () => fetchWithErrorHandling(`${API_URL}/menuItems`),
  getById: (id: string) => fetchWithErrorHandling(`${API_URL}/menuItems/${id}`),
  create: (menuItem: Omit<MenuItem, "id">) => 
    fetchWithErrorHandling(`${API_URL}/menuItems`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(menuItem),
    }),
  update: (id: string, menuItem: Partial<MenuItem>) => 
    fetchWithErrorHandling(`${API_URL}/menuItems/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(menuItem),
    }),
  delete: (id: string) => 
    fetchWithErrorHandling(`${API_URL}/menuItems/${id}`, { method: "DELETE" }),
};

export const contentApi = {
  getAll: (contentTypeId: string) => 
    fetchWithErrorHandling(`${API_URL}/content?contentTypeId=${contentTypeId}`),
  getById: (id: string) => fetchWithErrorHandling(`${API_URL}/content/${id}`),
  create: (content: Omit<Content, "id">) => 
    fetchWithErrorHandling(`${API_URL}/content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    }),
  update: (id: string, content: Partial<Content>) => 
    fetchWithErrorHandling(`${API_URL}/content/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...content,
        updatedAt: new Date().toISOString(),
      }),
    }),
  delete: (id: string) => 
    fetchWithErrorHandling(`${API_URL}/content/${id}`, { method: "DELETE" }),
};

export const settingsApi = {
  get: () => fetchWithErrorHandling(`${API_URL}/settings/1`),
  update: (settings: Partial<Settings>) => 
    fetchWithErrorHandling(`${API_URL}/settings/1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    }),
};
