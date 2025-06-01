import { useState } from "react";
import { useLocation } from "wouter";
import { Settings, Server, Shield, Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DeploymentChecklist from "@/components/admin/DeploymentChecklist";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [, setLocation] = useLocation();
  
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto px-2 sm:px-4 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-gray-400">Configure system-wide settings and preferences</p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto no-scrollbar">
          <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="deployment">Deployment</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic system-wide settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center p-12 bg-gray-800 rounded-lg">
                <Settings className="h-12 w-12 text-gray-400 mb-4" />
                <h2 className="text-xl font-bold mb-2">Settings Management</h2>
                <p className="text-gray-400 text-center max-w-md mb-4">
                  This section is currently under development. General settings functionality will be available soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security and access control settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center p-12 bg-gray-800 rounded-lg">
                <Shield className="h-12 w-12 text-gray-400 mb-4" />
                <h2 className="text-xl font-bold mb-2">Security Configuration</h2>
                <p className="text-gray-400 text-center max-w-md mb-4">
                  This section is currently under development. Security settings functionality will be available soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="deployment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Settings</CardTitle>
              <CardDescription>Verify and configure deployment readiness</CardDescription>
            </CardHeader>
            <CardContent>
              <DeploymentChecklist />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}