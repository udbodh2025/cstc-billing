
import { v4 as uuidv4 } from 'uuid';
import React, { useState, useEffect } from 'react';
import { uploadFile, getFileUrl } from '@/lib/fileUpload';
import { DynamicField } from '@/components/content-types/DynamicField';
import { useParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit, Check, X, Download, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { exportToCSV, importFromCSV } from '@/lib/csvUtils';
import { toast } from 'sonner';
import { zodResolver } from "@hookform/resolvers/zod";
import { ControllerRenderProps, FieldValues, useForm } from "react-hook-form";
import * as z from "zod";
import { ContentType, ContentField, ContentItem } from "@/types";
import { Textarea } from "@/components/ui/textarea";

const DynamicContent = () => {
  const { contentTypeName } = useParams<{ contentTypeName: string }>();
  const { contentTypes, contentItems, addContentItem, updateContentItem, deleteContentItem } = useApp();
  
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<ContentItem | null>(null);

  // Find the content type and its items
  useEffect(() => {
    if (!contentTypeName) return;
    
    const foundType = contentTypes.find(type => 
      type.name.toLowerCase().replace(/\s+/g, '-') === contentTypeName.toLowerCase()
    );
    
    if (foundType) {
      setContentType(foundType);
      
      // Get the content items for this type from context
      const typeItems = contentItems.filter(item => item.contentTypeId === foundType.id);
      setItems(typeItems);
    }
  }, [contentTypeName, contentTypes]);

  // Update items when contentItems changes
  useEffect(() => {
    if (contentType) {
      const typeItems = contentItems.filter(item => item.contentTypeId === contentType.id);
      setItems(typeItems);
    }
  }, [contentItems, contentType]);

  // Ensure items are always in sync with context
  useEffect(() => {
    return () => setItems([]);
  }, []);

  // Create form schema dynamically based on content type fields
  const createFormSchema = (fields: ContentField[]) => {
    const schemaObj: Record<string, any> = {};
    
    fields?.forEach(field => {
      if (field.type === 'number') {
        if (field.required) {
          schemaObj[field.name] = z.number({ required_error: `${field.name} is required` });
        } else {
          schemaObj[field.name] = z.number().nullable();
        }
      } else if (field.type === 'boolean') {
        schemaObj[field.name] = z.boolean().optional().default(false);
      } else if (field.type === 'date' || field.type === 'datetime') {
        if (field.required) {
          schemaObj[field.name] = z.string()
            .transform((str) => new Date(str))
            .refine((date) => !isNaN(date.getTime()), {
              message: `${field.name} must be a valid date`
            });
        } else {
          schemaObj[field.name] = z.string()
            .transform((str) => str ? new Date(str) : undefined)
            .optional()
            .refine((date) => !date || !isNaN(date.getTime()), {
              message: `${field.name} must be a valid date`
            });
        }
      } else if (field.type === 'file' || field.type === 'image' || field.type === 'csv') {
        if (field.required) {
          schemaObj[field.name] = z.any().refine(
            (val) => val instanceof File || (typeof val === 'string' && val.length > 0),
            { message: `${field.name} is required` }
          );
        } else {
          schemaObj[field.name] = z.any().optional().refine(
            (val) => !val || val instanceof File || (typeof val === 'string' && val.length > 0),
            { message: `${field.name} must be a file or a valid file path` }
          );
        }
      } else {
        if (field.required) {
          schemaObj[field.name] = z.string().min(1, { message: `${field.name} is required` });
        } else {
          schemaObj[field.name] = z.string().optional();
        }
      }
    });
    
    return z.object(schemaObj);
  };

  const FormComponent = () => {
    if (!contentType) return null;

    const formSchema = createFormSchema(contentType.fields);
    type FormValues = z.infer<typeof formSchema>;
    
    // Initialize default values from existing item or empty
    const defaultValues: Record<string, any> = {};
    contentType.fields.forEach(field => {
      defaultValues[field.name] = currentItem?.[field.name] || '';
    });

    const form = useForm<FormValues>({
      resolver: zodResolver(formSchema),
      defaultValues
    });

    const onSubmit = async (data: FormValues) => {
      try {
        // Convert date objects to ISO strings
        const processedData = await Object.entries(data).reduce(async (accPromise, [key, value]) => {
          const acc = await accPromise;
          const field = contentType.fields.find(f => f.name === key);
          if (!field) return acc;

          if ((field.type === 'date' || field.type === 'datetime') && value instanceof Date) {
            acc[key] = value.toISOString();
          } else if (field.type === 'file' || field.type === 'image' || field.type === 'csv') {
            // Handle file uploads
            if (value instanceof File) {
              // Upload the file and get its path
              const uploadedFile = await uploadFile(value);
              acc[key] = uploadedFile.path;
            } else if (typeof value === 'string') {
              // Keep existing file path
              acc[key] = value;
            }
          } else if (field.type === 'number') {
            acc[key] = value === '' ? null : Number(value);
          } else {
            acc[key] = value;
          }
          return acc;
        }, Promise.resolve({} as Record<string, any>));

        let updatedItem;
        if (currentItem) {
          // Update existing item
          updatedItem = {
            ...currentItem,
            ...processedData
          };
          await updateContentItem(updatedItem);
          toast.success('Item updated successfully');
        } else {
          // Create new item
          updatedItem = {
            id: uuidv4(),
            contentTypeId: contentType.id,
            ...processedData
          };
          await addContentItem(updatedItem);
          toast.success('Item created successfully');
        }

        // Let the context handle the state update
        setIsDialogOpen(false);
        setCurrentItem(null);
        form.reset();
        
      } catch (error) {
        console.error('Error saving item:', error);
        toast.error('Failed to save item. Please try again.');
      }
    };

    const renderFieldInput = (field: ContentField, formField: ControllerRenderProps<FieldValues, string>) => {
      return (
        <DynamicField
          type={field.type}
          value={formField.value}
          onChange={formField.onChange}
          options={field.options}
          placeholder={`Enter ${field.name.toLowerCase()}`}
        />
      );
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
          {contentType.fields.map((field) => (
            <FormField
              key={field.id}
              control={form.control}
              name={field.name}
              render={({ field: formField }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-base">{field.name}{field.required ? ' *' : ''}</FormLabel>
                  <FormControl>
                    {renderFieldInput(field, formField)}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDialogOpen(false);
              setCurrentItem(null);
            }}>
              Cancel
            </Button>
            <Button type="submit">
              {currentItem ? `Update ${contentType.name}` : `Create ${contentType.name}`}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    );
  };

  const handleDelete = (item: ContentItem) => {
    if (window.confirm(`Are you sure you want to delete this item?`)) {
      deleteContentItem(item.id);
      toast.success('Item deleted successfully');
    }
  };

  const handleEdit = (item: ContentItem) => {
    setCurrentItem(item);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setCurrentItem(null);
    setIsDialogOpen(true);
  };

  // If no content type exists, show a message
  if (!contentType) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Content Not Found</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-6">
              <p>The requested content type was not found.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{contentType.name}</h1>
          <p className="text-muted-foreground">
            Manage your {contentType.name.toLowerCase()} content.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-1" onClick={() => {
            const csvContent = exportToCSV(items, contentType);
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${contentType.name.toLowerCase()}-export.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
          }}>
            <Download size={16} />
            <span>Export CSV</span>
          </Button>
          <Button variant="outline" className="flex items-center gap-1" onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.csv';
            input.onchange = async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                try {
                  const items = await importFromCSV(file, contentType);
                  items.forEach(async (item) => {
                    await addContentItem({
                      id: uuidv4(),
                      contentTypeId: contentType.id,
                      ...item
                    });
                  });
                  toast.success('Items imported successfully');
                } catch (error) {
                  toast.error('Failed to import CSV file');
                }
              }
            };
            input.click();
          }}>
            <Upload size={16} />
            <span>Import CSV</span>
          </Button>
          <Button className="flex items-center gap-1" onClick={handleCreate}>
            <Plus size={16} />
            <span>Add {contentType.name}</span>
          </Button>
        </div>
      </div>

      {currentItem || isDialogOpen ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{currentItem ? `Edit ${contentType.name}` : `Create new ${contentType.name}`}</CardTitle>
            <CardDescription>
              Fill in the details for this {contentType.name.toLowerCase()}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormComponent />
          </CardContent>
        </Card>
      ) : null}

      {items.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  {contentType.fields.map(field => (
                    <TableHead key={field.id}>{field.name}</TableHead>
                  ))}
                  <TableHead className="w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    {contentType.fields.map(field => (
                      <TableCell key={`${item.id}-${field.id}`}>
                        {field.type === 'boolean' ? (
                          <div className="flex justify-center">
                            {item[field.name] ? (
                              <Check className="h-5 w-5 text-green-500" />
                            ) : (
                              <X className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                        ) : field.type === 'date' ? (
                          new Date(item[field.name]).toLocaleString(undefined, {
                            dateStyle: 'medium'
                          })
                        ) : field.type === 'datetime' ? (
                          new Date(item[field.name]).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })
                        ) : field.type === 'image' ? (
                          item[field.name] ? (
                            <div className="relative w-16 h-16 overflow-hidden rounded">
                              <img
                                src={getFileUrl(item[field.name])}
                                alt={field.name}
                                className="object-cover w-full h-full"
                                loading="lazy"
                              />
                            </div>
                          ) : null
                        ) : (
                          item[field.name]
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-6">
              <p>No {contentType.name.toLowerCase()} items yet. Click the button above to create one.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DynamicContent;

