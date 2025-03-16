
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ContentType, Field, Content } from "@/types";
import { Textarea } from "@/components/ui/textarea";

const DynamicContent = () => {
  const { contentTypeName } = useParams<{ contentTypeName: string }>();
  const { contentTypes, contentItems, addContentItem, updateContentItem, deleteContentItem } = useApp();
  
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [items, setItems] = useState<Content[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Content | null>(null);

  // Find the content type and its items
  useEffect(() => {
    if (!contentTypeName) return;
    
    const foundType = contentTypes.find(type => 
      type.name.toLowerCase().replace(/\s+/g, '-') === contentTypeName.toLowerCase()
    );
    
    if (foundType) {
      setContentType(foundType);
      
      // Get the content items for this type
      const typeItems = contentItems.filter(item => item.contentTypeId === foundType.id);
      setItems(typeItems);
      
      // Also check localStorage for items specific to this content type
      const storageKey = `contentItems_${contentTypeName.toLowerCase()}`;
      try {
        const storedItems = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (storedItems.length > 0) {
          // Merge with state items, avoiding duplicates
          const allItems = [...typeItems];
          storedItems.forEach((storedItem: Content) => {
            if (!allItems.some(item => item.id === storedItem.id)) {
              allItems.push(storedItem);
            }
          });
          setItems(allItems);
        }
      } catch (error) {
        console.error('Error loading items from localStorage:', error);
      }
    }
  }, [contentTypeName, contentTypes, contentItems]);

  // Create form schema dynamically based on content type fields
  const createFormSchema = (fields: Field[]) => {
    const schemaObj: Record<string, any> = {};
    
    fields?.forEach(field => {
      if (field.type === 'number') {
        if (field.required) {
          schemaObj[field.name] = z.string().min(1, { message: `${field.name} is required` }).regex(/^\d+$/, { message: `${field.name} must be a number` });
        } else {
          schemaObj[field.name] = z.string().optional().refine(val => !val || /^\d+$/.test(val), { message: `${field.name} must be a number` });
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
        if (currentItem) {
          // Update existing item
          updateContentItem({
            ...currentItem,
            ...data
          });
        } else {
          // Create new item
          await addContentItem({
            contentTypeId: contentType.id,
            ...data
          });
          
          // Specifically save this item to localStorage for this content type
          const storageKey = `contentItems_${contentTypeName?.toLowerCase()}`;
          const storedItems = JSON.parse(localStorage.getItem(storageKey) || '[]');
          const newItem = {
            id: uuidv4(),
            contentTypeId: contentType.id,
            ...data
          };
          localStorage.setItem(storageKey, JSON.stringify([...storedItems, newItem]));
        }
        
        setIsDialogOpen(false);
        setCurrentItem(null);
        form.reset();
        
        // Refresh items list
        const updatedItems = contentItems.filter(item => item.contentTypeId === contentType.id);
        setItems(updatedItems);
        
      } catch (error) {
        console.error('Error saving item:', error);
        toast.error('Failed to save item. Please try again.');
      }
    };

    const renderFieldInput = (field: Field, formField: any) => {
      if (field.type === 'text' && field.name.toLowerCase().includes('description')) {
        return (
          <Textarea
            placeholder={`Enter ${field.name.toLowerCase()}`}
            {...formField}
          />
        );
      }
      
      return (
        <Input
          placeholder={`Enter ${field.name.toLowerCase()}`}
          {...formField}
          type={field.type === 'number' ? 'number' : 'text'}
        />
      );
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {contentType.fields.map((field) => (
            <FormField
              key={field.id}
              control={form.control}
              name={field.name}
              render={({ field: formField }) => (
                <FormItem>
                  <FormLabel>{field.name}{field.required ? ' *' : ''}</FormLabel>
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

  const handleDelete = (item: Content) => {
    if (window.confirm(`Are you sure you want to delete this item?`)) {
      deleteContentItem(item.id);
      setItems(items.filter(i => i.id !== item.id));
      
      // Also remove from localStorage
      if (contentTypeName) {
        const storageKey = `contentItems_${contentTypeName.toLowerCase()}`;
        try {
          const storedItems = JSON.parse(localStorage.getItem(storageKey) || '[]');
          const updatedItems = storedItems.filter((i: Content) => i.id !== item.id);
          localStorage.setItem(storageKey, JSON.stringify(updatedItems));
        } catch (error) {
          console.error('Error updating localStorage:', error);
        }
      }
      
      toast.success('Item deleted successfully');
    }
  };

  const handleEdit = (item: Content) => {
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-1" onClick={handleCreate}>
              <Plus size={16} />
              <span>Add {contentType.name}</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>{currentItem ? `Edit ${contentType.name}` : `Create new ${contentType.name}`}</DialogTitle>
              <DialogDescription>
                Fill in the details for this {contentType.name.toLowerCase()}.
              </DialogDescription>
            </DialogHeader>
            <FormComponent />
          </DialogContent>
        </Dialog>
      </div>

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
                      <TableCell key={`${item.id}-${field.id}`}>{item[field.name]}</TableCell>
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
function uuidv4() {
  throw new Error('Function not implemented.');
}

