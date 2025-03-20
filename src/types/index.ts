export type Role = "admin" | "editor" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  createdAt: string;
}

export interface ContentType {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
  fields: ContentField[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ContentField {
  id: string;
  name: string;
  type: "text" | "textarea" | "number" | "boolean" | "date" | "select" | "image" | "relation";
  required: boolean;
  options?: any;
}

export interface MenuItem {
  id: string;
  label?: string;
  link: string;
  parentId?: string;
  order?: number;
  icon?: string;
  moduleType?: string;
  contentTypeId?: string;
  requiredRole?: string;
}

export interface MenuModule {
  id: string;
  name: string;
  icon: string;
  description: string;
}


export interface ContentItem {
  id: string;
  contentTypeId: string;
  [key: string]: any;
}

export interface Settings {
  id: string;
  general: {
    siteName: string;
    siteUrl: string;
    adminEmail: string;
    maintenanceMode: boolean;
  };
  appearance: {
    theme: "light" | "dark" | "system";
    primaryColor: string;
    logo?: string;
  };
  api: {
    apiKey: string;
    enabled: boolean;
    allowedOrigins: string[];
  };
}

export interface ApiEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  contentTypeId: string;
}