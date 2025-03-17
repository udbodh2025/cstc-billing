
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PlusCircle, Trash2, GripVertical, X, Save } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ContentType, Field} from "@/types";
import { contentTypesApi } from "@/lib/api";
import { v4 as uuidv4 } from "uuid";
import fs from 'fs/promises';
import path from 'path';

interface ContentTypeFormProps {
  contentType?: ContentType;
  onSuccess?: () => void;
}

const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "select", label: "Select" },
  { value: "image", label: "Image" },
  { value: "relation", label: "Relation" },
];

export default function ContentTypeForm({ contentType: propContentType, onSuccess }: ContentTypeFormProps) {
  const navigate = useNavigate();
  
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [contentType, setContentType] = useState<ContentType | null>(propContentType || null);
  
  const [name, setName] = useState(contentType?.name || "");
  const [slug, setSlug] = useState(contentType?.slug || "");
  const [fields, setFields] = useState<Field[]>(contentType?.fields || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch content type if we have an ID but no content type data
  useEffect(() => {
    if (id && !contentType) {
      fetchContentType(id);
    }
  }, [id, contentType]);

  const fetchContentType = async (contentTypeId: string) => {
    setIsLoading(true);
    try {
      const data = await contentTypesApi.getById(contentTypeId);
      setContentType(data);
      setName(data.name);
      setSlug(data.slug);
      setFields(data.fields);
    } catch (error) {
      console.error("Error fetching content type:", error);
      toast({
        title: "Error",
        description: "Failed to load content type data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = () => {
    setSlug(name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
  };

  const addField = () => {
    const newField: Field = {
      id: uuidv4(),
      name: "",
      type: "text",
      required: false,
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<Field>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= fields.length) return;
    
    const newFields = [...fields];
    const [moved] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, moved);
    setFields(newFields);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !slug) {
      toast({
        title: "Validation Error",
        description: "Name and slug are required",
        variant: "destructive",
      });
      return;
    }
    
    if (fields.some(field => !field.name)) {
      toast({
        title: "Validation Error",
        description: "All fields must have a name",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const contentTypeData = {
        name,
        slug,
        fields,
      };
      
      let savedContentType;
      if (contentType && contentType.id) {
        savedContentType = await contentTypesApi.update(contentType.id, contentTypeData);
        toast({
          title: "Success",
          description: `Content type "${name}" has been updated`,
        });
      } else {
        savedContentType = await contentTypesApi.create(contentTypeData);
        toast({
          title: "Success",
          description: `Content type "${name}" has been created`,
        });
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/content-types");
      }
    } catch (error) {
      console.error("Error saving content type:", error);
      toast({
        title: "Error",
        description: "Failed to save content type",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cms-primary"></div>
      </div>
    );
  }
  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{contentType ? "Edit Content Type" : "Create Content Type"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={generateSlug}
                placeholder="e.g. Blog Post"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. blog-post"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Fields</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addField}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>

            {fields.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-md">
                <p className="text-muted-foreground mb-2">No fields defined yet</p>
                <Button type="button" size="sm" onClick={addField}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add your first field
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id} className="relative p-0 overflow-hidden">
                    <div className="flex items-stretch">
                      <div className="bg-muted p-3 flex items-center drag-handle">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                      </div>
                      
                      <CardContent className="flex-1 p-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label htmlFor={`field-name-${field.id}`}>Field Name</Label>
                            <Input
                              id={`field-name-${field.id}`}
                              value={field.name}
                              onChange={(e) => updateField(field.id, { name: e.target.value })}
                              placeholder="e.g. Title"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`field-type-${field.id}`}>Field Type</Label>
                            <Select
                              value={field.type}
                              onValueChange={(value) => updateField(field.id, { 
                                type: value as Field["type"] 
                              })}
                            >
                              <SelectTrigger id={`field-type-${field.id}`}>
                                <SelectValue placeholder="Select field type" />
                              </SelectTrigger>
                              <SelectContent>
                                {fieldTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="flex items-end space-x-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id={`field-required-${field.id}`}
                                checked={field.required}
                                onCheckedChange={(checked) => 
                                  updateField(field.id, { required: checked === true })
                                }
                              />
                              <Label htmlFor={`field-required-${field.id}`}>Required</Label>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      
                      <div className="p-3 flex items-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeField(field.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/content-types")}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {contentType ? "Update" : "Create"} Content Type
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

// Helper functions for code generation
const generateApiEndpoints = async (contentType: ContentType) => {
  const apiTemplate = `
import { api } from '@/lib/axios';
import { ${contentType.name} } from '@/types';

export const ${contentType.slug}Api = {
  getAll: async () => {
    const response = await api.get<${contentType.name}[]>('/${contentType.slug}');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get<${contentType.name}>(\`/${contentType.slug}/\${id}\`);
    return response.data;
  },
  
  create: async (data: Omit<${contentType.name}, 'id'>) => {
    const response = await api.post<${contentType.name}>('/${contentType.slug}', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<${contentType.name}>) => {
    const response = await api.patch<${contentType.name}>(\`/${contentType.slug}/\${id}\`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    await api.delete(\`/${contentType.slug}/\${id}\`);
  },
};`;

  // Write to api.ts
  await fs.appendFile(
    path.join(process.cwd(), 'src/lib/api.ts'),
    apiTemplate
  );
};

const generateComponent = async (contentType: ContentType) => {
  const componentTemplate = `
import { useState, useEffect } from 'react';
import { ${contentType.slug}Api } from '@/lib/api';
import { ${contentType.name} } from '@/types';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './${contentType.slug}-columns';

export default function ${contentType.name}List() {
  const [data, setData] = useState<${contentType.name}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const items = await ${contentType.slug}Api.getAll();
      setData(items);
    } catch (error) {
      console.error('Error loading ${contentType.name}:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>${contentType.name} List</h1>
      <DataTable columns={columns} data={data} />
    </div>
  );
}`;

  // Create component directory and file
  const componentDir = path.join(process.cwd(), `src/components/${contentType.slug}`);
  await fs.mkdir(componentDir, { recursive: true });
  await fs.writeFile(
    path.join(componentDir, `${contentType.slug}-list.tsx`),
    componentTemplate
  );
};

const updateMenu = async (contentType: ContentType) => {
  // Add to navigation menu
  const menuItem = {
    title: contentType.name,
    href: `/${contentType.slug}`,
    icon: 'Layout', // Default icon, can be customized
  };

  // Update your menu configuration
  // This depends on how you manage your menu items
  // Example: updating a menu.ts file
  const menuPath = path.join(process.cwd(), 'src/config/menu.ts');
  const menuContent = await fs.readFile(menuPath, 'utf-8');
  const updatedMenuContent = menuContent.replace(
    'export const menuItems = [',
    `export const menuItems = [\n  ${JSON.stringify(menuItem)},`
  );
  await fs.writeFile(menuPath, updatedMenuContent);
};
