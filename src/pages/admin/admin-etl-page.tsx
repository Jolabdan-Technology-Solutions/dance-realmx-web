import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  AlertCircle, Upload, Download, RefreshCw, 
  Play, ArrowRight, Server, Database, Clock,
  FileText, CheckCircle, XCircle, AlertTriangle,
  Filter, Search, Table
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Define schemas for the ETL pipeline
const pipelineSchema = z.object({
  name: z.string().min(3, { message: "Pipeline name must be at least 3 characters" }),
  description: z.string().optional(),
  sourceType: z.enum(["csv", "json", "api", "database"]),
  sourceConfig: z.string(),
  targetType: z.enum(["database", "api", "file"]),
  targetConfig: z.string(),
  transformations: z.string(),
  schedule: z.enum(["manual", "hourly", "daily", "weekly"]),
  validationRules: z.string().optional(),
  isActive: z.boolean().default(true)
});

type PipelineType = z.infer<typeof pipelineSchema>;

// Mock data - in a real app this would come from the API
const etlPipelines = [
  {
    id: 1,
    name: "Course Import",
    description: "Import courses from external CSV",
    sourceType: "csv",
    sourceConfig: JSON.stringify({ path: "/imports/courses.csv", hasHeader: true }),
    targetType: "database",
    targetConfig: JSON.stringify({ table: "courses" }),
    transformations: JSON.stringify([
      { field: "title", transform: "trim" },
      { field: "price", transform: "toNumber" }
    ]),
    schedule: "daily",
    lastRun: "2023-06-15T10:30:00",
    status: "success",
    recordsProcessed: 125,
    validationRules: JSON.stringify([
      { field: "title", rule: "required" },
      { field: "price", rule: "number" }
    ]),
    isActive: true
  },
  {
    id: 2,
    name: "User Export",
    description: "Export users to external system",
    sourceType: "database",
    sourceConfig: JSON.stringify({ table: "users", query: "SELECT * FROM users WHERE role = 'student'" }),
    targetType: "api",
    targetConfig: JSON.stringify({ endpoint: "https://api.external.com/users", method: "POST" }),
    transformations: JSON.stringify([
      { field: "firstName", transform: "concat", args: ["lastName"] },
      { field: "email", transform: "lowercase" }
    ]),
    schedule: "weekly",
    lastRun: "2023-06-10T08:15:00",
    status: "failed",
    recordsProcessed: 0,
    error: "API endpoint unreachable",
    validationRules: JSON.stringify([
      { field: "email", rule: "email" }
    ]),
    isActive: false
  },
  {
    id: 3,
    name: "Resource Sync",
    description: "Synchronize resources with external database",
    sourceType: "api",
    sourceConfig: JSON.stringify({ endpoint: "https://api.resources.com/curriculum", method: "GET" }),
    targetType: "database",
    targetConfig: JSON.stringify({ table: "resources" }),
    transformations: JSON.stringify([
      { field: "tags", transform: "split", args: [","] },
      { field: "price", transform: "toNumber" }
    ]),
    schedule: "hourly",
    lastRun: "2023-06-16T09:45:00",
    status: "warning",
    recordsProcessed: 87,
    warnings: ["3 records skipped due to validation errors"],
    validationRules: JSON.stringify([
      { field: "title", rule: "required" },
      { field: "fileType", rule: "in", args: ["pdf,video,audio,image"] }
    ]),
    isActive: true
  }
];

// Helper function to format JSON
const formatJSON = (json: string): string => {
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch (e) {
    return json;
  }
};

export default function AdminETLPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pipelines");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<(typeof etlPipelines)[0] | null>(null);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [pipelineToRun, setPipelineToRun] = useState<(typeof etlPipelines)[0] | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [pipelineForHistory, setPipelineForHistory] = useState<(typeof etlPipelines)[0] | null>(null);
  
  // Setup form for creating/editing pipelines
  const form = useForm<PipelineType>({
    resolver: zodResolver(pipelineSchema),
    defaultValues: {
      name: "",
      description: "",
      sourceType: "csv",
      sourceConfig: "{}",
      targetType: "database",
      targetConfig: "{}",
      transformations: "[]",
      schedule: "manual",
      validationRules: "[]",
      isActive: true
    }
  });

  // Setup form for run parameters
  const runForm = useForm({
    defaultValues: {
      validateOnly: false,
      limitRecords: 0,
      parameters: "{}"
    }
  });

  // Load ETL pipelines from API
  const { data: pipelines = [], isLoading } = useQuery({
    queryKey: ["/api/etl/pipelines"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/etl/pipelines");
      if (!response.ok) {
        throw new Error("Failed to load ETL pipelines");
      }
      const data = await response.json();
      return data;
    }
  });

  // Get pipeline run history from API
  const { data: history = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ["/api/etl/pipelines", pipelineForHistory?.id, "runs"],
    enabled: showHistoryDialog && !!pipelineForHistory,
    queryFn: async () => {
      if (!pipelineForHistory?.id) return [];
      
      const response = await apiRequest("GET", `/api/etl/pipelines/${pipelineForHistory.id}/runs`);
      if (!response.ok) {
        throw new Error("Failed to load pipeline runs");
      }
      const data = await response.json();
      return data.map((run: any) => ({
        ...run,
        // Map API fields to UI fields
        startTime: run.startedAt || run.createdAt,
        endTime: run.completedAt,
        status: run.status,
        recordsProcessed: run.recordsProcessed || 0,
        recordsFailed: run.recordsFailed || 0,
      }));
    }
  });

  // Mock validation rules
  const { data: validationRules = [], isLoading: isLoadingValidation } = useQuery({
    queryKey: ["/api/admin/etl/validationRules"],
    queryFn: async () => {
      // Simulate API call
      return [
        { name: "required", description: "Field must have a value" },
        { name: "email", description: "Field must be a valid email address" },
        { name: "number", description: "Field must be a number" },
        { name: "min", description: "Field must be greater than or equal to the specified value", params: ["value"] },
        { name: "max", description: "Field must be less than or equal to the specified value", params: ["value"] },
        { name: "in", description: "Field must be one of the specified values", params: ["values"] },
        { name: "regex", description: "Field must match the specified regular expression", params: ["pattern"] },
        { name: "date", description: "Field must be a valid date" },
        { name: "unique", description: "Field must be unique in the target" }
      ];
    }
  });

  // Mock transformations
  const { data: transformations = [], isLoading: isLoadingTransformations } = useQuery({
    queryKey: ["/api/admin/etl/transformations"],
    queryFn: async () => {
      // Simulate API call
      return [
        { name: "trim", description: "Remove leading and trailing whitespace" },
        { name: "lowercase", description: "Convert text to lowercase" },
        { name: "uppercase", description: "Convert text to uppercase" },
        { name: "toNumber", description: "Convert to number" },
        { name: "toDate", description: "Convert to date", params: ["format"] },
        { name: "split", description: "Split text into array", params: ["delimiter"] },
        { name: "join", description: "Join array into text", params: ["delimiter"] },
        { name: "concat", description: "Concatenate with another field", params: ["field"] },
        { name: "replace", description: "Replace text", params: ["search", "replace"] },
        { name: "substring", description: "Extract part of text", params: ["start", "end"] },
        { name: "round", description: "Round number", params: ["decimals"] }
      ];
    }
  });

  // Save pipeline mutation
  const savePipelineMutation = useMutation({
    mutationFn: async (data: PipelineType & { id?: number }) => {
      if (editingPipeline?.id) {
        // Update existing pipeline
        const response = await apiRequest("PATCH", `/api/etl/pipelines/${editingPipeline.id}`, data);
        if (!response.ok) {
          throw new Error("Failed to update ETL pipeline");
        }
        return await response.json();
      } else {
        // Create new pipeline
        const response = await apiRequest("POST", "/api/etl/pipelines", data);
        if (!response.ok) {
          throw new Error("Failed to create ETL pipeline");
        }
        return await response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Pipeline saved",
        description: "The ETL pipeline has been saved successfully.",
      });
      setShowCreateDialog(false);
      setEditingPipeline(null);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/etl/pipelines"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save pipeline: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Run pipeline mutation
  const runPipelineMutation = useMutation({
    mutationFn: async (data: { pipelineId: number; options: any }) => {
      const response = await apiRequest("POST", `/api/etl/pipelines/${data.pipelineId}/runs`, data.options);
      if (!response.ok) {
        throw new Error("Failed to run ETL pipeline");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Pipeline executed",
        description: `Pipeline run started successfully.`,
      });
      setShowRunDialog(false);
      setPipelineToRun(null);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/etl/pipelines"] });
      
      // If we're viewing the history for this pipeline, also refresh the history
      if (pipelineForHistory?.id === pipelineToRun?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/etl/pipelines", pipelineForHistory.id, "runs"] });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to run pipeline: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Toggle pipeline active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/etl/pipelines/${id}`, { isActive });
      if (!response.ok) {
        throw new Error("Failed to update pipeline status");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/etl/pipelines"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update pipeline status: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Filter pipelines based on search query
  const filteredPipelines = pipelines.filter(pipeline => 
    pipeline.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pipeline.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle form submission
  const onSubmit = (data: PipelineType) => {
    if (editingPipeline) {
      // Update existing pipeline
      savePipelineMutation.mutate({
        ...data,
        // In a real app, you'd merge with the existing pipeline data
      });
    } else {
      // Create new pipeline
      savePipelineMutation.mutate(data);
    }
  };

  // Handle run form submission
  const onRunSubmit = runForm.handleSubmit((data) => {
    if (pipelineToRun) {
      runPipelineMutation.mutate({
        pipelineId: pipelineToRun.id,
        options: data
      });
    }
  });

  // Setup edit pipeline dialog
  const handleEditPipeline = (pipeline: typeof etlPipelines[0]) => {
    setEditingPipeline(pipeline);
    form.reset({
      name: pipeline.name,
      description: pipeline.description || "",
      sourceType: pipeline.sourceType as any,
      sourceConfig: formatJSON(pipeline.sourceConfig),
      targetType: pipeline.targetType as any,
      targetConfig: formatJSON(pipeline.targetConfig),
      transformations: formatJSON(pipeline.transformations),
      schedule: pipeline.schedule as any,
      validationRules: pipeline.validationRules ? formatJSON(pipeline.validationRules) : "[]",
      isActive: pipeline.isActive
    });
    setShowCreateDialog(true);
  };

  // Setup run pipeline dialog
  const handleRunPipeline = (pipeline: typeof etlPipelines[0]) => {
    setPipelineToRun(pipeline);
    runForm.reset({
      validateOnly: false,
      limitRecords: 0,
      parameters: "{}"
    });
    setShowRunDialog(true);
  };

  // Setup history dialog
  const handleViewHistory = (pipeline: typeof etlPipelines[0]) => {
    setPipelineForHistory(pipeline);
    setShowHistoryDialog(true);
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "bg-green-100 text-green-800";
      case "failed": return "bg-red-100 text-red-800";
      case "warning": return "bg-yellow-100 text-yellow-800";
      case "running": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="h-4 w-4" />;
      case "failed": return <XCircle className="h-4 w-4" />;
      case "warning": return <AlertTriangle className="h-4 w-4" />;
      case "running": return <RefreshCw className="h-4 w-4 animate-spin" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Redirect non-admin users
  if (!user || user.role !== "admin") {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 sm:mb-0">ETL Pipeline Management</h1>
        <Button
          className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
          onClick={() => {
            setEditingPipeline(null);
            form.reset({
              name: "",
              description: "",
              sourceType: "csv",
              sourceConfig: "{}",
              targetType: "database",
              targetConfig: "{}",
              transformations: "[]",
              schedule: "manual",
              validationRules: "[]",
              isActive: true
            });
            setShowCreateDialog(true);
          }}
        >
          Create New Pipeline
        </Button>
      </div>

      <Tabs defaultValue="pipelines" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="validations">Validation Rules</TabsTrigger>
          <TabsTrigger value="transformations">Transformations</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        {/* Pipelines Tab */}
        <TabsContent value="pipelines" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search pipelines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredPipelines.length === 0 ? (
            <div className="text-center py-16 bg-gray-100 rounded-lg">
              <Database className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-semibold mb-2">No Pipelines Found</h2>
              <p className="text-gray-600 mb-6">
                Create your first ETL pipeline to start importing and exporting data.
              </p>
              <Button
                className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
                onClick={() => {
                  setEditingPipeline(null);
                  form.reset();
                  setShowCreateDialog(true);
                }}
              >
                Create New Pipeline
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredPipelines.map((pipeline) => (
                <Card key={pipeline.id} className={pipeline.isActive ? "" : "opacity-70"}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          {pipeline.name}
                          <Badge className={`${getStatusColor(pipeline.status)} ml-2 flex items-center gap-1`}>
                            {getStatusIcon(pipeline.status)} {pipeline.status.charAt(0).toUpperCase() + pipeline.status.slice(1)}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-1">{pipeline.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={pipeline.isActive}
                          onCheckedChange={(checked) => {
                            toggleActiveMutation.mutate({ id: pipeline.id, isActive: checked });
                          }}
                        />
                        <span className="text-sm text-gray-500">
                          {pipeline.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Source:</span>
                        <span className="capitalize">{pipeline.sourceType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Target:</span>
                        <span className="capitalize">{pipeline.targetType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Schedule:</span>
                        <span className="capitalize">{pipeline.schedule}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Last Run:</span>
                        <span>{pipeline.lastRun ? formatDate(pipeline.lastRun) : "Never"}</span>
                      </div>
                    </div>
                    {pipeline.status === "failed" && pipeline.error && (
                      <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                        <span className="font-medium">Error:</span> {pipeline.error}
                      </div>
                    )}
                    {pipeline.status === "warning" && pipeline.warnings && (
                      <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 rounded-md text-sm">
                        <span className="font-medium">Warning:</span> {pipeline.warnings}
                      </div>
                    )}
                    {pipeline.status === "success" && (
                      <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
                        <span className="font-medium">Processed:</span> {pipeline.recordsProcessed} records
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewHistory(pipeline)}
                    >
                      View History
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPipeline(pipeline)}
                    >
                      Edit
                    </Button>
                    <Button
                      className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
                      size="sm"
                      onClick={() => handleRunPipeline(pipeline)}
                    >
                      Run Pipeline
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Validation Rules Tab */}
        <TabsContent value="validations" className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4">Available Validation Rules</h2>
            <p className="text-gray-600 mb-6">
              These validation rules can be applied to fields in your ETL pipelines to ensure data quality.
            </p>

            {isLoadingValidation ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {validationRules.map((rule) => (
                  <Card key={rule.name}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">{rule.description}</p>
                      {rule.params && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium">Parameters:</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600">
                            {rule.params.map((param) => (
                              <li key={param}>{param}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <code className="text-xs bg-gray-100 p-2 rounded w-full">
                        {`{ "field": "fieldName", "rule": "${rule.name}"${rule.params ? ', "args": [...] ' : ''} }`}
                      </code>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Transformations Tab */}
        <TabsContent value="transformations" className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4">Available Transformations</h2>
            <p className="text-gray-600 mb-6">
              These transformations can be applied to fields in your ETL pipelines to modify data during processing.
            </p>

            {isLoadingTransformations ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {transformations.map((transform) => (
                  <Card key={transform.name}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{transform.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">{transform.description}</p>
                      {transform.params && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium">Parameters:</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600">
                            {transform.params.map((param) => (
                              <li key={param}>{param}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <code className="text-xs bg-gray-100 p-2 rounded w-full">
                        {`{ "field": "fieldName", "transform": "${transform.name}"${transform.params ? ', "args": [...] ' : ''} }`}
                      </code>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4">Pipeline Monitoring</h2>
            <p className="text-gray-600 mb-6">
              Monitor the status and performance of your ETL pipelines.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Active Pipelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-[#00d4ff]">
                    {pipelines.filter(p => p.isActive).length}
                  </div>
                  <p className="text-sm text-gray-600">of {pipelines.length} total</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-green-500">
                    75%
                  </div>
                  <p className="text-sm text-gray-600">last 30 days</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Records Processed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-indigo-500">
                    12,452
                  </div>
                  <p className="text-sm text-gray-600">last 30 days</p>
                </CardContent>
              </Card>
            </div>

            <h3 className="text-lg font-semibold mb-4">Recent Pipeline Runs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">Pipeline</th>
                    <th className="px-4 py-2 text-left">Run Time</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Records</th>
                    <th className="px-4 py-2 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {pipelines.map((pipeline) => (
                    pipeline.lastRun && (
                      <tr key={pipeline.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{pipeline.name}</td>
                        <td className="px-4 py-3">{formatDate(pipeline.lastRun)}</td>
                        <td className="px-4 py-3">
                          <Badge className={`${getStatusColor(pipeline.status)} flex items-center gap-1`}>
                            {getStatusIcon(pipeline.status)} {pipeline.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{pipeline.recordsProcessed || 0}</td>
                        <td className="px-4 py-3">3m 12s</td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Pipeline Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingPipeline ? "Edit Pipeline" : "Create New Pipeline"}</DialogTitle>
            <DialogDescription>
              {editingPipeline 
                ? "Update the configuration for this ETL pipeline." 
                : "Configure a new ETL pipeline to import, transform, or export data."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Course Import" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="schedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schedule</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select schedule" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="manual">Manual (Run on demand)</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Import courses from external CSV file"
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sourceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select source type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="csv">CSV File</SelectItem>
                          <SelectItem value="json">JSON File</SelectItem>
                          <SelectItem value="api">API Endpoint</SelectItem>
                          <SelectItem value="database">Database</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select target type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="database">Database</SelectItem>
                          <SelectItem value="api">API Endpoint</SelectItem>
                          <SelectItem value="file">File Export</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="sourceConfig"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Configuration (JSON)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder='{"path": "/imports/courses.csv", "hasHeader": true}'
                        className="font-mono h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Configuration for the data source. Format depends on the source type.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetConfig"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Configuration (JSON)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder='{"table": "courses"}'
                        className="font-mono h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Configuration for the data target. Format depends on the target type.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transformations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transformations (JSON Array)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder='[{"field": "title", "transform": "trim"}, {"field": "price", "transform": "toNumber"}]'
                        className="font-mono h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      List of transformations to apply to the data.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validationRules"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validation Rules (JSON Array)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder='[{"field": "title", "rule": "required"}, {"field": "price", "rule": "number"}]'
                        className="font-mono h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      List of validation rules to apply to the data. Leave empty for no validation.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Inactive pipelines won't run on schedule.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
                >
                  {savePipelineMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingPipeline ? "Update Pipeline" : "Create Pipeline"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Run Pipeline Dialog */}
      <Dialog open={showRunDialog} onOpenChange={setShowRunDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Run Pipeline: {pipelineToRun?.name}</DialogTitle>
            <DialogDescription>
              Configure options for this pipeline run.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onRunSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="validateOnly" className="flex flex-col gap-1">
                  <span>Validate Only</span>
                  <span className="font-normal text-xs text-gray-500">
                    Run validation without modifying data
                  </span>
                </Label>
                <Switch
                  id="validateOnly"
                  checked={runForm.watch("validateOnly")}
                  onCheckedChange={(checked) => runForm.setValue("validateOnly", checked)}
                />
              </div>

              <div>
                <Label htmlFor="limitRecords">
                  Limit Records (0 = no limit)
                </Label>
                <Input
                  id="limitRecords"
                  type="number"
                  min="0"
                  {...runForm.register("limitRecords", { valueAsNumber: true })}
                />
              </div>

              <div>
                <Label htmlFor="parameters">Custom Parameters (JSON)</Label>
                <Textarea
                  id="parameters"
                  className="font-mono"
                  placeholder="{}"
                  {...runForm.register("parameters")}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional parameters to pass to the pipeline.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRunDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
                disabled={runPipelineMutation.isPending}
              >
                {runPipelineMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Run Pipeline
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pipeline History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Pipeline History: {pipelineForHistory?.name}</DialogTitle>
            <DialogDescription>
              View past runs of this pipeline.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[50vh] rounded-md border p-4">
            {isLoadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No history available for this pipeline.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {history.map((run) => (
                  <div key={run.id} className="border rounded-lg overflow-hidden">
                    <div className={`p-4 ${getStatusColor(run.status)}`}>
                      <div className="flex justify-between">
                        <div className="font-medium flex items-center gap-2">
                          {getStatusIcon(run.status)} Run #{run.id}
                        </div>
                        <div className="text-sm">
                          {formatDate(run.startTime)}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium">Records Processed</p>
                          <p className="text-xl">{run.recordsProcessed}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Failed Records</p>
                          <p className="text-xl">{run.recordsFailed}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Duration</p>
                          <p className="text-xl">
                            {new Date(new Date(run.endTime).getTime() - new Date(run.startTime).getTime())
                              .toISOString().substr(11, 8)}
                          </p>
                        </div>
                      </div>
                      <Separator />
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Logs</h4>
                        <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-40">
                          {run.logs}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button onClick={() => setShowHistoryDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}