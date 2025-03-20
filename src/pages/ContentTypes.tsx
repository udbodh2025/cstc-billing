
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit, FileText, Database, List } from 'lucide-react';
import { ContentType, ContentField } from '@/types';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const ContentTypes = () => {
  const navigate = useNavigate();
  const { contentTypes, addContentType, updateContentType, deleteContentType } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table'); // Default to table view
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [currentContentType, setCurrentContentType] = useState<ContentType | null>(null);
  const [fields, setFields] = useState<Omit<ContentField, 'id'>[]>([
    { name: '', type: 'text', required: false }
  ]);

  const handleAddField = () => {
    setFields([...fields, { name: '', type: 'text', required: false }]);
  };

  const handleFieldChange = (index: number, field: Partial<ContentField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...field };
    setFields(newFields);
  };

  const handleRemoveField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Content type name is required');
      return;
    }

    if (!slug.trim()) {
      toast.error('Slug is required');
      return;
    }

    if (fields.some(field => !field.name.trim())) {
      toast.error('All fields must have a name');
      return;
    }

    // Add IDs to fields
    const fieldsWithIds: ContentField[] = fields.map(field => ({
      ...field,
      id: crypto.randomUUID(),
    }));

    // Use the manually entered slug or the generated one
    const finalSlug = slug.trim();

    const contentType = {
      name,
      slug: finalSlug,
      fields: fieldsWithIds,
      createdAt: new Date().toISOString()
    };

    if (currentContentType) {
      updateContentType({
        ...currentContentType,
        ...contentType
      });
      toast.success('Content type updated successfully');
    } else {
      addContentType(contentType);
      toast.success('Content type created successfully');
    }
    
    // Reset form
    setName('');
    setSlug('');
    setFields([{ name: '', type: 'text', required: false }]);
    setIsDialogOpen(false);
    setCurrentContentType(null);
  };

  const handleDelete = (contentType: ContentType) => {
    if (window.confirm(`Are you sure you want to delete "${contentType.name}"? This will also delete all content of this type.`)) {
      deleteContentType(contentType.id);
      toast.success('Content type deleted successfully');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Types</h1>
          <p className="text-muted-foreground">
            Define the structure of your content.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center rounded-md border p-1">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'ghost'} 
              size="sm" 
              className="size-8 p-0"
              onClick={() => setViewMode('grid')}
            >
              <Database className="h-4 w-4" />
              <span className="sr-only">Grid view</span>
            </Button>
            <Button 
              variant={viewMode === 'table' ? 'default' : 'ghost'} 
              size="sm" 
              className="size-8 p-0"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
              <span className="sr-only">Table view</span>
            </Button>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-1">
                <Plus size={16} />
                <span>New Type</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Create new content type</DialogTitle>
                <DialogDescription>
                  Define the structure of your content type. You can add fields to store different types of data.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Content Type Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setName(newName);
                      if (!isSlugManuallyEdited) {
                        setSlug(newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
                      }
                    }}
                    placeholder="e.g. Article, Product, User"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">slug</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setIsSlugManuallyEdited(true);
                    }}
                    placeholder="e.g. article, product, user"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Fields</Label>
                    <Button variant="outline" size="sm" onClick={handleAddField} className="h-8">
                      <Plus size={14} className="mr-1" />
                      Add Field
                    </Button>
                  </div>
                  
                  {fields.map((field, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <Label htmlFor={`field-${index}-name`} className="text-xs">Name</Label>
                        <Input
                          id={`field-${index}-name`}
                          value={field.name}
                          onChange={(e) => handleFieldChange(index, { name: e.target.value })}
                          placeholder="Field name"
                        />
                      </div>
                      <div className="col-span-4">
                        <Label htmlFor={`field-${index}-type`} className="text-xs">Type</Label>
                        <select
                          id={`field-${index}-type`}
                          value={field.type}
                          onChange={(e) => handleFieldChange(index, { type: e.target.value as any })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean</option>
                          <option value="date">Date</option>
                          <option value="select">Select</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Required</Label>
                        <div className="flex items-center h-10">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => handleFieldChange(index, { required: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </div>
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveField(index)}
                          disabled={fields.length === 1}
                          className="h-10 w-10"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit}>Create Content Type</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && contentTypes.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>No.</TableHead>
                  <TableHead>Fields</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-48">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contentTypes.map((contentType) => (
                  <TableRow key={contentType.id}>
                    <TableCell className="font-medium">{contentType.name}</TableCell>
                    <TableCell>{contentType.slug}</TableCell>
                    <TableCell>{contentType.fields.length}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {contentType.fields.map((field) => (
                          <span key={field.id} className="inline-flex items-center px-2 py-1 text-xs bg-muted rounded-md">
                            {field.name}
                            {field.required && <span className="ml-1 text-red-500">*</span>}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                     <TableCell>{contentType.createdAt ? new Date(contentType.createdAt).toLocaleString() : 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCurrentContentType(contentType);
                          setName(contentType.name);
                          setSlug(contentType.slug);
                          setFields(contentType.fields);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                        <Link 
                          to={`/${contentType.slug}`}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                        >
                          <FileText size={14} className="mr-1" />
                          Manage
                        </Link>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(contentType)}
                        >
                          <Trash2 size={14} className="mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Grid View (Original) */}
      {viewMode === 'grid' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contentTypes.map((contentType) => (
            <Card key={contentType.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle>{contentType.name}</CardTitle>
                <CardDescription>{contentType.fields.length} field{contentType.fields.length !== 1 ? 's' : ''}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <ul className="space-y-1">
                  {contentType.fields.map((field) => (
                    <li key={field.id} className="flex items-center justify-between">
                      <span className="font-medium">{field.name}</span>
                      <span className="text-xs bg-muted px-2 py-1 rounded">{field.type}{field.required ? ' *' : ''}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex justify-between border-t p-3 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDelete(contentType)}
                >
                  <Trash2 size={14} className="mr-1" />
                  Delete
                </Button>
                <Link 
                  to={`/content/${contentType.id}`} 
                  className="inline-flex items-center justify-center flex-1 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                >
                  <FileText size={14} className="mr-1" />
                  Manage Content
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {contentTypes.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center p-6">
              <Database className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Content Types Yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                Content types define the structure of your data. Create your first one to get started.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus size={16} className="mr-1" />
                Create Content Type
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContentTypes;
