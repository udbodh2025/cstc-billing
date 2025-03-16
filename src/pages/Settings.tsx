
import { useEffect, useState } from "react";
import { Save, Copy, RefreshCw, PlusCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Settings as SettingsType, settingsApi } from "@/lib/api";
import { v4 as uuidv4 } from "uuid";
import { useQueryClient } from "@tanstack/react-query";

export default function Settings() {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newOrigin, setNewOrigin] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsApi.get();
        setSettings(data);
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    
    try {
      await settingsApi.update(settings);
       // Invalidate any queries that might use settings data
       queryClient.invalidateQueries({ queryKey: ['settings'] });
       
       // Apply theme change if it's changing
       if (settings.appearance.theme) {
         const html = document.documentElement;
         if (settings.appearance.theme === 'dark') {
           html.classList.add('dark');
         } else if (settings.appearance.theme === 'light') {
           html.classList.remove('dark');
         }
       }
      toast({
        title: "Settings saved",
        description: "Your settings have been saved successfully",
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  const regenerateApiKey = () => {
    if (!settings) return;
    
    const newApiKey = `api_${uuidv4().replace(/-/g, '')}`;
    setSettings({
      ...settings,
      api: {
        ...settings.api,
        apiKey: newApiKey,
      },
    });
    
    toast({
      title: "API Key Regenerated",
      description: "Don't forget to save your changes",
    });
  };

  const addOrigin = () => {
    if (!settings || !newOrigin) return;
    
    if (settings.api.allowedOrigins.includes(newOrigin)) {
      toast({
        title: "Origin already exists",
        description: "This origin is already in the list",
        variant: "destructive",
      });
      return;
    }
    
    setSettings({
      ...settings,
      api: {
        ...settings.api,
        allowedOrigins: [...settings.api.allowedOrigins, newOrigin],
      },
    });
    
    setNewOrigin("");
  };

  const removeOrigin = (origin: string) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      api: {
        ...settings.api,
        allowedOrigins: settings.api.allowedOrigins.filter(o => o !== origin),
      },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error Loading Settings</h2>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <PageHeader
        heading="Settings"
        description="Configure your CMS"
      />
      
      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="api">API Access</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general settings for your CMS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site-name">Site Name</Label>
                <Input 
                  id="site-name" 
                  value={settings.general.siteName}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: {
                      ...settings.general,
                      siteName: e.target.value
                    }
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="site-url">Site URL</Label>
                <Input 
                  id="site-url" 
                  value={settings.general.siteUrl}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: {
                      ...settings.general,
                      siteUrl: e.target.value
                    }
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin Email</Label>
                <Input 
                  id="admin-email" 
                  type="email" 
                  value={settings.general.adminEmail}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: {
                      ...settings.general,
                      adminEmail: e.target.value
                    }
                  })}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="maintenance-mode" 
                  checked={settings.general.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    general: {
                      ...settings.general,
                      maintenanceMode: checked
                    }
                  })}
                />
                <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of your CMS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div 
                    className={`border rounded-md p-2 flex flex-col items-center cursor-pointer ${
                      settings.appearance.theme === 'light' ? 'border-primary' : 'hover:border-primary'
                    } bg-background`}
                    onClick={() => setSettings({
                      ...settings,
                      appearance: {
                        ...settings.appearance,
                        theme: 'light'
                      }
                    })}
                  >
                    <div className="w-full h-20 bg-background border rounded-md mb-2"></div>
                    <span className="text-sm">Light</span>
                  </div>
                  <div 
                    className={`border rounded-md p-2 flex flex-col items-center cursor-pointer ${
                      settings.appearance.theme === 'dark' ? 'border-primary' : 'hover:border-primary'
                    }`}
                    onClick={() => setSettings({
                      ...settings,
                      appearance: {
                        ...settings.appearance,
                        theme: 'dark'
                      }
                    })}
                  >
                    <div className="w-full h-20 bg-zinc-800 border rounded-md mb-2"></div>
                    <span className="text-sm">Dark</span>
                  </div>
                  <div 
                    className={`border rounded-md p-2 flex flex-col items-center cursor-pointer ${
                      settings.appearance.theme === 'system' ? 'border-primary' : 'hover:border-primary'
                    }`}
                    onClick={() => setSettings({
                      ...settings,
                      appearance: {
                        ...settings.appearance,
                        theme: 'system'
                      }
                    })}
                  >
                    <div className="w-full h-20 bg-gradient-to-b from-background to-zinc-800 border rounded-md mb-2"></div>
                    <span className="text-sm">System</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={settings.appearance.primaryColor}
                    onChange={(e) => setSettings({
                      ...settings,
                      appearance: {
                        ...settings.appearance,
                        primaryColor: e.target.value
                      }
                    })}
                    className="w-12 h-12 p-1 rounded-md"
                  />
                  <Input 
                    value={settings.appearance.primaryColor}
                    onChange={(e) => setSettings({
                      ...settings,
                      appearance: {
                        ...settings.appearance,
                        primaryColor: e.target.value
                      }
                    })}
                    className="flex-1" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="logo-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/40 hover:bg-muted">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        SVG, PNG, JPG or GIF (MAX. 800×400px)
                      </p>
                    </div>
                    <input id="logo-upload" type="file" className="hidden" />
                  </label>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Access</CardTitle>
              <CardDescription>
                Manage API keys and access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex space-x-2">
                  <Input
                    id="api-key"
                    value={settings.api.apiKey}
                    readOnly
                    className="flex-1 font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => copyToClipboard(settings.api.apiKey)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={regenerateApiKey}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Be careful when regenerating API keys, as it will invalidate existing keys
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="api-enabled">API Access</Label>
                  <Switch 
                    id="api-enabled" 
                    checked={settings.api.enabled}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      api: {
                        ...settings.api,
                        enabled: checked
                      }
                    })}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Enable or disable API access to your content
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Allowed Origins</Label>
                <div className="border rounded-md divide-y">
                  {settings.api.allowedOrigins.map((origin, index) => (
                    <div key={index} className="p-3 flex justify-between items-center">
                      <span>{origin}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeOrigin(origin)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex mt-2 space-x-2">
                  <Input
                    placeholder="https://your-domain.com"
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value)}
                  />
                  <Button 
                    variant="outline" 
                    onClick={addOrigin}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
