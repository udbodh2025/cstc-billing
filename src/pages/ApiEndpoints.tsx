
import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateApiCode } from "@/utils/api";
import { Code } from 'lucide-react';

const ApiEndpoints = () => {
  const { contentTypes, apiEndpoints } = useApp();
  
  const apiCode = generateApiCode(contentTypes, apiEndpoints);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Endpoints</h1>
        <p className="text-muted-foreground">
          Use these endpoints to interact with your content.
        </p>
      </div>
      
      <Tabs defaultValue="endpoints">
        <TabsList>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="client">TypeScript Client</TabsTrigger>
        </TabsList>
        <TabsContent value="endpoints" className="space-y-4">
          {apiEndpoints.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center text-center p-6">
                  <Code className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No API Endpoints Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-4">
                    Create a content type to automatically generate API endpoints.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {apiEndpoints.map((endpoint) => {
                const contentType = contentTypes.find(ct => ct.id === endpoint.contentTypeId);
                return (
                  <Card key={endpoint.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center">
                        <span className="text-sm font-mono bg-primary px-2 py-1 rounded text-primary-foreground mr-2">
                          {endpoint.method}
                        </span>
                        {endpoint.path}
                      </CardTitle>
                      <CardDescription>
                        {contentType ? contentType.name : 'Unknown content type'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-semibold">URL: </span>
                          <code className="bg-muted px-1 py-0.5 rounded">http://localhost:3001{endpoint.path}</code>
                        </div>
                        <div className="text-sm">
                          <span className="font-semibold">Description: </span>
                          {"{"}&gt; {endpoint.method === 'GET' ? 'Retrieve' : endpoint.method === 'POST' ? 'Create' : endpoint.method === 'PUT' ? 'Update' : 'Delete'} {contentType?.name}{"}"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        <TabsContent value="client">
          <Card>
            <CardHeader>
              <CardTitle>TypeScript API Client</CardTitle>
              <CardDescription>
                Copy and paste this code to use in your frontend application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[500px] text-sm">
                <code>{apiCode}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiEndpoints;
