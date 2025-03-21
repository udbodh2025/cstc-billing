import React, { createContext, useContext, useState, useEffect } from 'react';
import { ContentType, ContentField, ContentItem, ApiEndpoint, MenuItem } from "@/types";
import { LayoutDashboard, Users, Settings, FileText, Menu } from "lucide-react";

import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

interface AppContextType {
  contentTypes: ContentType[];
  contentItems: ContentItem[];
  apiEndpoints: ApiEndpoint[];
  menuItems: MenuItem[];
  addContentType: (contentType: Omit<ContentType, 'id'>) => void;
  updateContentType: (contentType: ContentType) => void;
  deleteContentType: (id: string) => void;
  addContentItem: (contentItem: Omit<ContentItem, 'id'>) => void;
  updateContentItem: (contentItem: ContentItem) => void;
  deleteContentItem: (id: string) => void;
  addApiEndpoint: (apiEndpoint: Omit<ApiEndpoint, 'id'>) => void;
  updateApiEndpoint: (apiEndpoint: ApiEndpoint) => void;
  deleteApiEndpoint: (id: string) => void;
  addMenuItem: (menuItem: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (menuItem: MenuItem) => void;
  deleteMenuItem: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(  // Main navigation items
[
    {
      id: "Dashboard",
      link: "/dashboard",
      icon: "LayoutDashboard",
      requiredRole: "viewer" as const,
    },
    {
      id: "Content Types",
      link: "/content-types",
      icon: "FileText",
      requiredRole: "editor" as const,
    },
    {
      id: "Menu Builder",
      link: "/menu-builder",
      icon: "Menu",
      requiredRole: "editor" as const,
    },
    {
      id: "Users",
      link: "/users",
      icon: "Users",
      requiredRole: "admin" as const,
    },
    {
      id: "Settings",
      link: "/settings",
      icon: "Settings",
      requiredRole: "admin" as const,
    },
  ]);

  // Load data from localStorage on component mount
  useEffect(() => {
    const storedContentTypes = localStorage.getItem('contentTypes');
    const storedContentItems = localStorage.getItem('contentItems');
    const storedApiEndpoints = localStorage.getItem('apiEndpoints');
    const storedMenuItems = localStorage.getItem('menuItems');

    if (storedContentTypes) setContentTypes(JSON.parse(storedContentTypes));
    if (storedContentItems) setContentItems(JSON.parse(storedContentItems));
    if (storedApiEndpoints) setApiEndpoints(JSON.parse(storedApiEndpoints));
    if (storedMenuItems) setMenuItems(JSON.parse(storedMenuItems));
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('contentTypes', JSON.stringify(contentTypes));
    localStorage.setItem('contentItems', JSON.stringify(contentItems));
    localStorage.setItem('apiEndpoints', JSON.stringify(apiEndpoints));
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
  }, [contentTypes, contentItems, apiEndpoints, menuItems]);

  // Helper function to fetch data from localStorage or mock data
  const fetchData = async (path: string) => {
    // Use localStorage as our primary data source since JSON Server might not be running
    const storedData = localStorage.getItem(path);
    if (storedData) {
      return JSON.parse(storedData);
    }
    return [];
  };

  // Helper function to save data
  const saveData = (path: string, data: any) => {
    try {
      // Save to localStorage
      localStorage.setItem(path, JSON.stringify(data));
      
      // Optionally attempt to save to JSON server, but don't depend on it
      fetch(`http://localhost:3001/${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }).catch(err => {
        console.info('JSON Server might not be running, using localStorage only');
      });
      
      return data;
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('Failed to save data. Please try again.');
      throw error;
    }
  };

  // Content Type operations
  const addContentType = async (contentType: Omit<ContentType, 'id'>) => {
    const newContentType: ContentType = {
      ...contentType,
      id: uuidv4(),
    };
    
    // Add to state
    setContentTypes([...contentTypes, newContentType]);
    
    // Save content type
    saveData('contentTypes', newContentType);
    
    // Create API endpoint
    const apiPath = contentType.name.toLowerCase().replace(/\s+/g, '-');
    const newApiEndpoint: ApiEndpoint = {
      id: uuidv4(),
      path: `/api/${apiPath}`,
      method: 'GET',
      contentTypeId: newContentType.id,
    };
    
    setApiEndpoints([...apiEndpoints, newApiEndpoint]);
    saveData('apiEndpoints', newApiEndpoint);
    
    // Create menu item
    const newMenuItem: MenuItem = {
      id: uuidv4(),
      label: contentType.name,
      link: `/${apiPath}`,
      icon: "FileText",
      contentTypeId: newContentType.id,
    };
    
    setMenuItems([...menuItems, newMenuItem]);
    saveData('menuItems', newMenuItem);
  };

  const updateContentType = (contentType: ContentType) => {
    setContentTypes(contentTypes.map(ct => ct.id === contentType.id ? contentType : ct));
  };

  const deleteContentType = (id: string) => {
    setContentTypes(contentTypes.filter(ct => ct.id !== id));
    // Also delete related content items
    setContentItems(contentItems.filter(item => item.contentTypeId !== id));
    // Delete related API endpoints
    setApiEndpoints(apiEndpoints.filter(api => api.contentTypeId !== id));
    // Delete related menu items
    setMenuItems(menuItems.filter(item => item.contentTypeId !== id));
  };

  // ContentItem Item operations
  const addContentItem = async (contentItem: Omit<ContentItem, 'id'>) => {
    try {
      if (!contentItem.contentTypeId) {
        throw new Error('Content Type ID is required');
      }
      
      const newContentItem: ContentItem = {
        ...contentItem,
        id: uuidv4(),
        contentTypeId: contentItem.contentTypeId
      };
      
      // Update state with new item
      const updatedItems = [...contentItems, newContentItem];
      setContentItems(updatedItems);
      
      // Save all items to localStorage in a single operation
      localStorage.setItem('contentItems', JSON.stringify(updatedItems));
      
      // Find the content type for reference
      const contentType = contentTypes.find(ct => ct.id === contentItem.contentTypeId);
      if (contentType) {
        toast.success(`${contentType.name} item created successfully`);
      }
      
      return newContentItem;
    } catch (error) {
      console.error('Error adding content item:', error);
      toast.error('Failed to add content item. Please try again.');
      throw error;
    }
  };

  const updateContentItem = async (contentItem: ContentItem) => {
    try {
      const updatedItems = contentItems.map(item => item.id === contentItem.id ? contentItem : item);
      setContentItems(updatedItems);
      
      // Save to localStorage
      localStorage.setItem('contentItems', JSON.stringify(updatedItems));
      
      // Find the content type for reference
      const contentType = contentTypes.find(ct => ct.id === contentItem.contentTypeId);
      if (contentType) {
        toast.success(`${contentType.name} item updated successfully`);
      }
      
      return contentItem;
    } catch (error) {
      console.error('Error updating content item:', error);
      toast.error('Failed to update content item. Please try again.');
      throw error;
    }
  };

  const deleteContentItem = (id: string) => {
    try {
      // Find the item to get its content type
      const itemToDelete = contentItems.find(item => item.id === id);
      
      if (!itemToDelete) {
        throw new Error('Content item not found');
      }

      // Find the content type
      const contentType = contentTypes.find(ct => ct.id === itemToDelete.contentTypeId);
      
      if (!contentType) {
        throw new Error('Content type not found');
      }

      // Remove from state
      setContentItems(contentItems.filter(item => item.id !== id));
      
      // Create a key for localStorage
      const storageKey = `contentItems_${contentType.name.toLowerCase().replace(/\s+/g, '-')}`;
      
      // Get existing items for this content type
      const existingItems = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Remove the item from the array
      const updatedItems = existingItems.filter((item: ContentItem) => item.id !== id);
      
      // Save back to localStorage
      localStorage.setItem(storageKey, JSON.stringify(updatedItems));
      
      toast.success(`${contentType.name} item deleted successfully`);
    } catch (error) {
      console.error('Error deleting content item:', error);
      toast.error('Failed to delete item. Please try again.');
      throw error;
    }
  };

  // API Endpoint operations
  const addApiEndpoint = (apiEndpoint: Omit<ApiEndpoint, 'id'>) => {
    const newApiEndpoint: ApiEndpoint = {
      ...apiEndpoint,
      id: uuidv4(),
    };
    setApiEndpoints([...apiEndpoints, newApiEndpoint]);
  };

  const updateApiEndpoint = (apiEndpoint: ApiEndpoint) => {
    setApiEndpoints(apiEndpoints.map(api => api.id === apiEndpoint.id ? apiEndpoint : api));
  };

  const deleteApiEndpoint = (id: string) => {
    setApiEndpoints(apiEndpoints.filter(api => api.id !== id));
  };

  // Menu Item operations
  const addMenuItem = (menuItem: Omit<MenuItem, 'id'>) => {
    const newMenuItem: MenuItem = {
      ...menuItem,
      id: uuidv4(),
    };
    setMenuItems([...menuItems, newMenuItem]);
  };

  const updateMenuItem = (menuItem: MenuItem) => {
    setMenuItems(menuItems.map(item => item.id === menuItem.id ? menuItem : item));
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems(menuItems.filter(item => item.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        contentTypes,
        contentItems,
        apiEndpoints,
        menuItems,
        addContentType,
        updateContentType,
        deleteContentType,
        addContentItem,
        updateContentItem,
        deleteContentItem,
        addApiEndpoint,
        updateApiEndpoint,
        deleteApiEndpoint,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
