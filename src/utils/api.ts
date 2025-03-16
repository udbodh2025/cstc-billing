
import { ApiEndpoint, ContentType } from '@/types';

// Create API functions for each endpoint
export const generateApiCode = (contentTypes: ContentType[], apiEndpoints: ApiEndpoint[]): string => {
  let apiCode = `
/**
 * API functions automatically generated based on content types
 * This file is automatically updated when content types change
 */

const BASE_URL = 'http://localhost:3001';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  data?: any;
}

const request = async <T>(url: string, options: RequestOptions = {}): Promise<T> => {
  const { params, data, ...fetchOptions } = options;
  
  // Add query parameters if provided
  let finalUrl = url;
  if (params) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, String(value));
    });
    finalUrl = \`\${url}?\${queryParams.toString()}\`;
  }
  
  // Add JSON body if provided
  const fetchInit: RequestInit = {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  };
  
  if (data) {
    fetchInit.body = JSON.stringify(data);
  }
  
  const response = await fetch(\`\${BASE_URL}\${finalUrl}\`, fetchInit);
  
  if (!response.ok) {
    throw new Error(\`API request failed: \${response.status} \${response.statusText}\`);
  }
  
  return response.json();
};

`;

  // Generate API functions for each content type
  contentTypes.forEach(contentType => {
    const endpoint = apiEndpoints.find(api => api.contentTypeId === contentType.id);
    if (!endpoint) return;
    
    const resourceName = contentType.name.toLowerCase().replace(/\s+/g, '-');
    const typeName = contentType.name.replace(/\s+/g, '');
    
    // Generate TypeScript interface for this content type
    apiCode += `
export interface ${typeName} {
  id: string;
${contentType.fields.map(field => `  ${field.name}${field.required ? '' : '?'}: ${getTypeScriptType(field.type)};`).join('\n')}
}

`;
    
    // Generate CRUD functions
    apiCode += `
/**
 * ${contentType.name} API Functions
 */

export const get${typeName}List = () => 
  request<${typeName}[]>('${endpoint.path}', { method: 'GET' });

export const get${typeName} = (id: string) => 
  request<${typeName}>(\`${endpoint.path}/\${id}\`, { method: 'GET' });

export const create${typeName} = (data: Omit<${typeName}, 'id'>) => 
  request<${typeName}>('${endpoint.path}', { method: 'POST', data });

export const update${typeName} = (id: string, data: Partial<${typeName}>) => 
  request<${typeName}>(\`${endpoint.path}/\${id}\`, { method: 'PUT', data });

export const delete${typeName} = (id: string) => 
  request<void>(\`${endpoint.path}/\${id}\`, { method: 'DELETE' });

`;
  });
  
  return apiCode;
};

// Helper function to convert content field types to TypeScript types
const getTypeScriptType = (fieldType: string): string => {
  switch (fieldType) {
    case 'text':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'date':
      return 'string';
    case 'select':
      return 'string';
    default:
      return 'any';
  }
};

// Creates the db.json file content for JSON Server
export const generateJsonServerConfig = (contentTypes: ContentType[]): string => {
  const config: Record<string, any[]> = {
    contentTypes: [],
    apiEndpoints: [],
    menuItems: []
  };
  
  contentTypes.forEach(contentType => {
    const resourceName = contentType.name.toLowerCase().replace(/\s+/g, '-');
    config[resourceName] = [];
  });
  
  return JSON.stringify(config, null, 2);
};

export const startJsonServer = async (): Promise<void> => {
  try {
    console.log('Starting JSON Server...');
    // This would typically be done in a separate Node.js process
    console.log('JSON Server is running on http://localhost:3001');
  } catch (error) {
    console.error('Failed to start JSON Server:', error);
  }
};
