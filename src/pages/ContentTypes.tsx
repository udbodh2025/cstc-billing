
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Edit, Trash2, FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { ContentType } from "@/types";
import { contentTypesApi } from "@/lib/api";

export default function ContentTypes() {
  const navigate = useNavigate();
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentTypeToDelete, setContentTypeToDelete] = useState<ContentType | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table'); // Default to table view

  useEffect(() => {
    fetchContentTypes();
  }, []);

  const fetchContentTypes = async () => {
    try {
      const data = await contentTypesApi.getAll();
      setContentTypes(data);
    } catch (error) {
      console.error("Error fetching content types:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!contentTypeToDelete) return;
    
    try {
      await contentTypesApi.delete(contentTypeToDelete.id);
      setContentTypes(contentTypes.filter(ct => ct.id !== contentTypeToDelete.id));
      toast({
        title: "Content Type Deleted",
        description: `"${contentTypeToDelete.name}" has been deleted`,
      });
    } catch (error) {
      console.error("Error deleting content type:", error);
      toast({
        title: "Error",
        description: "Failed to delete content type",
        variant: "destructive",
      });
    } finally {
      setContentTypeToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cms-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        heading="Content Types"
        description="Define the structure of your content"
        action={{
          label: "Create Content Type",
          onClick: () => navigate("/content-types/create"),
          icon: <PlusCircle className="h-4 w-4" />,
        }}
      />
      
      {contentTypes.length === 0 ? (
        <EmptyState
          title="No content types found"
          description="Get started by creating your first content type"
          icon={<FileText className="h-12 w-12" />}
          action={{
            label: "Create Content Type",
            onClick: () => navigate("/content-types/create"),
          }}
          className="h-[400px]"
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Fields</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contentTypes.map((contentType) => (
                <TableRow key={contentType.id}>
                  <TableCell className="font-medium">{contentType.name}</TableCell>
                  <TableCell>{contentType.slug}</TableCell>
                  <TableCell>{contentType.fields.length}</TableCell>
                  <TableCell>{new Date(contentType.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/content-types/${contentType.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setContentTypeToDelete(contentType)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the "{contentType.name}" content type and all its content.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setContentTypeToDelete(null)}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
