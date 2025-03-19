
import { useState, useEffect } from "react";
import { PlusCircle, Trash2, GripVertical, LayoutList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { menuItemsApi, contentTypesApi } from "@/lib/api";
import { MenuItem, ContentType} from "@/types"
import { v4 as uuidv4 } from "uuid";
import { useApp } from "@/contexts/AppContext";

export default function MenuBuilder() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedContentType, setSelectedContentType] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [items, types] = await Promise.all([
          menuItemsApi.getAll(),
          contentTypesApi.getAll()
        ]);
        // Sort by order and parentId
        items.sort((a: MenuItem, b: MenuItem) => {
          if (a.parentId !== b.parentId) {
            return (a.parentId || "").localeCompare(b.parentId || "");
          }
          return a.order - b.order;
        });
        setMenuItems(items);
        setContentTypes(types);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load menu items and content types",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const addMenuItem = (parentId?: string) => {
    const newItem: MenuItem = {
      id: uuidv4(),
      label: "",
      link: "#",
      order: getNextOrder(parentId),
      parentId
    };
    
    setMenuItems([...menuItems, newItem]);
  };

  const addContentTypeAsMenuItem = () => {
    if (!selectedContentType) {
      toast({
        title: "Selection Required",
        description: "Please select a content type to add",
        variant: "destructive",
      });
      return;
    }
    
    const contentType = contentTypes.find(ct => ct.id === selectedContentType);
    if (!contentType) return;
    
    const newItem: MenuItem = {
      id: uuidv4(),
      label: contentType.name,
      link: `/${contentType.slug}`,
      order: getNextOrder(),
    };
    
    setMenuItems([...menuItems, newItem]);
    setSelectedContentType("");
    
    toast({
      title: "Menu Item Added",
      description: `"${contentType.name}" added to menu`,
    });
  };

  const getNextOrder = (parentId?: string) => {
    const sameLevel = menuItems.filter(item => item.parentId === parentId);
    return sameLevel.length > 0 
      ? Math.max(...sameLevel.map(item => item.order)) + 1 
      : 0;
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems(menuItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const removeMenuItem = (id: string) => {
    // Also remove all children
    const idsToRemove = new Set<string>([id]);
    
    // Recursively find all children
    const findChildren = (parentId: string) => {
      menuItems.forEach(item => {
        if (item.parentId === parentId) {
          idsToRemove.add(item.id);
          findChildren(item.id);
        }
      });
    };
    
    findChildren(id);
    
    setMenuItems(menuItems.filter(item => !idsToRemove.has(item.id)));
  };

  const { menuItems: contextMenuItems, updateMenuItem: updateContextMenuItem, deleteMenuItem, addMenuItem: addContextMenuItem } = useApp();

  const saveMenu = async () => {
    setSaving(true);
    console.log("Saving menu items:", menuItems);
  
    try {
      // First, delete items that don't exist in our current state
      const existingItems = await menuItemsApi.getAll();
      const currentIds = new Set(menuItems.map(item => item.id));
      
      // Delete items that no longer exist in our state
      for (const item of existingItems) {
        if (!currentIds.has(item.id)) {
          await menuItemsApi.delete(item.id);
          deleteMenuItem(item.id);
        }
      }
      
      // Then update or create items
      for (const item of menuItems) {
        const exists = existingItems.some(existing => existing.id === item.id);
        
        if (exists) {
          await menuItemsApi.update(item.id, item);
          updateContextMenuItem(item);
        } else {
          const newItem = await menuItemsApi.create(item);
          addContextMenuItem(newItem);
        }
      }
      
      toast({
        title: "Success",
        description: "Menu has been saved",
      });
    } catch (error) {
      console.error("Error saving menu:", error);
      toast({
        title: "Error",
        description: "Failed to save menu",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Manual handling of reordering since react-beautiful-dnd is not being used
  const moveItemUp = (itemId: string) => {
    const itemIndex = menuItems.findIndex(item => item.id === itemId);
    if (itemIndex <= 0) return;
    
    const item = menuItems[itemIndex];
    const prevItem = menuItems[itemIndex - 1];
    
    // Only move up within the same parent
    if (item.parentId !== prevItem.parentId) return;
    
    // Swap orders
    const newItems = [...menuItems];
    newItems[itemIndex] = { ...item, order: prevItem.order };
    newItems[itemIndex - 1] = { ...prevItem, order: item.order };
    
    setMenuItems(newItems);
  };

  const moveItemDown = (itemId: string) => {
    const itemIndex = menuItems.findIndex(item => item.id === itemId);
    if (itemIndex >= menuItems.length - 1) return;
    
    const item = menuItems[itemIndex];
    const nextItem = menuItems[itemIndex + 1];
    
    // Only move down within the same parent
    if (item.parentId !== nextItem.parentId) return;
    
    // Swap orders
    const newItems = [...menuItems];
    newItems[itemIndex] = { ...item, order: nextItem.order };
    newItems[itemIndex + 1] = { ...nextItem, order: item.order };
    
    setMenuItems(newItems);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cms-primary"></div>
      </div>
    );
  }

  // Get the nesting level of a menu item
  const getItemLevel = (item: MenuItem): number => {
    let level = 0;
    let currentItem = item;
    
    while (currentItem.parentId) {
      level++;
      currentItem = menuItems.find(i => i.id === currentItem.parentId) || currentItem;
    }
    
    return level;
  };

  // Render menu items and their children
  const renderMenuItem = (item: MenuItem, level: number = 0) => (
    <div key={item.id} className={`mb-4 ml-${level * 8}`}>
      <div className="flex items-stretch mb-2">
        <div className="bg-muted p-3 flex items-center rounded-l-md">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <div className="border flex-1 p-4 rounded-r-md">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor={`menu-label-${item.id}`}>Label</Label>
              <Input
                id={`menu-label-${item.id}`}
                value={item.label}
                onChange={(e) => updateMenuItem(item.id, { label: e.target.value })}
                placeholder="e.g. Home"
              />
            </div>
            
            <div>
              <Label htmlFor={`menu-link-${item.id}`}>Link</Label>
              <Input
                id={`menu-link-${item.id}`}
                value={item.link}
                onChange={(e) => updateMenuItem(item.id, { link: e.target.value })}
                placeholder="e.g. /home"
              />
            </div>
            
            <div className="flex items-end justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => moveItemUp(item.id)}
                disabled={menuItems.findIndex(i => i.id === item.id) === 0}
              >
                ↑
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => moveItemDown(item.id)}
              >
                ↓
              </Button>
              {level < 4 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addMenuItem(item.id)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Child
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeMenuItem(item.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Group items by parent
  const parentItems = menuItems.filter(item => !item.parentId);
  const getChildItems = (parentId: string) => menuItems.filter(item => item.parentId === parentId);

  return (
    <Card>
           <CardContent>
        <div className="flex flex-col space-y-4 mb-6">
            <div className="flex justify-between items-end">
             <div className="space-y-2 flex-1 mr-2">
               <Select
                 value={selectedContentType}
                 onValueChange={setSelectedContentType}
               >
                 <SelectTrigger id="content-type-select">
                   <SelectValue placeholder="Select a content type" />
                 </SelectTrigger>
                 <SelectContent>
                   {contentTypes.map((type) => (
                     <SelectItem key={type.id} value={type.id}>
                       {type.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <Button 
               type="button" 
               onClick={addContentTypeAsMenuItem}
               disabled={!selectedContentType}
             >
               <LayoutList className="h-4 w-4 mr-2" />
               Add to Menu
             </Button>
           </div>
           
           <div className="flex justify-end">
             <Button
               type="button"
               onClick={() => addMenuItem()}
               variant="outline"
               size="sm"
             >
               <PlusCircle className="h-4 w-4 mr-2" />
               Add Custom Menu Item
             </Button>
           </div>
        </div>

        {menuItems.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-md">
            <p className="text-muted-foreground mb-2">No menu items yet</p>
            <Button type="button" size="sm" onClick={() => addMenuItem()}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add your first menu item
            </Button>
          </div>
        ) : (
          <div>
            {parentItems.map(item => {
              const renderChildren = (parentItem: MenuItem, currentLevel: number) => {
                if (currentLevel >= 5) return null;
                const children = getChildItems(parentItem.id);
                return children.map(child => (
                  <div key={child.id}>
                    {renderMenuItem(child, currentLevel)}
                    {renderChildren(child, currentLevel + 1)}
                  </div>
                ));
              };
              
              return (
                <div key={item.id}>
                  {renderMenuItem(item, 0)}
                  {renderChildren(item, 1)}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={saveMenu}
          disabled={saving}
          className="ml-auto"
        >
          {saving ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></div>
              Saving...
            </>
          ) : "Save Menu"}
        </Button>
      </CardFooter>
    </Card>
  );
}
