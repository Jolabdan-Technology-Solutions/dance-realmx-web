import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import AdminLayout from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Check,
  X,
  AlertTriangle,
  Info,
  FileText,
  Shield,
  Database,
  Code,
  Cpu,
  Settings,
  Layers,
  Archive,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Types for deployment test results
type TestResult = {
  success: boolean;
  message: string;
  details?: string;
  actionItems?: string[];
};

type ChecklistCategory = {
  id: string;
  title: string;
  icon: JSX.Element;
  items: ChecklistItem[];
};

type ChecklistItem = {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  description: string;
  result?: TestResult;
};

const initialCategories: ChecklistCategory[] = [
  {
    id: 'database',
    title: 'Database',
    icon: <Database className="h-5 w-5" />,
    items: [
      {
        id: 'database-1',
        title: 'Connection',
        status: 'pending',
        description: 'Verify database connection and credentials are working',
      },
      {
        id: 'database-2',
        title: 'Tables & Schema',
        status: 'pending',
        description: 'Check if all required database tables and schemas exist',
      },
      {
        id: 'database-3',
        title: 'Performance',
        status: 'pending',
        description: 'Test database query performance and optimization',
      },
    ],
  },
  {
    id: 'api',
    title: 'API Services',
    icon: <Code className="h-5 w-5" />,
    items: [
      {
        id: 'api-1',
        title: 'Endpoints',
        status: 'pending',
        description: 'Verify all API endpoints are accessible and return correct responses',
      },
      {
        id: 'api-2',
        title: 'Performance',
        status: 'pending',
        description: 'Check API response times and optimization',
      },
      {
        id: 'api-3',
        title: 'Security',
        status: 'pending',
        description: 'Test API security, authentication, and authorization',
      },
    ],
  },
  {
    id: 'frontend',
    title: 'Frontend',
    icon: <Layers className="h-5 w-5" />,
    items: [
      {
        id: 'frontend-1',
        title: 'Routes',
        status: 'pending',
        description: 'Verify all frontend routes are accessible and render correctly',
      },
      {
        id: 'frontend-2',
        title: 'Performance',
        status: 'pending',
        description: 'Test frontend performance, load times, and optimization',
      },
      {
        id: 'frontend-3',
        title: 'Browser Compatibility',
        status: 'pending',
        description: 'Check compatibility across different browsers and devices',
      },
      {
        id: 'frontend-4',
        title: 'Responsive Design',
        status: 'pending',
        description: 'Test responsive design on different screen sizes',
      },
    ],
  },
  {
    id: 'authentication',
    title: 'Authentication',
    icon: <Shield className="h-5 w-5" />,
    items: [
      {
        id: 'authentication-1',
        title: 'User Authentication',
        status: 'pending',
        description: 'Verify user login, registration, and session management',
      },
      {
        id: 'authentication-2',
        title: 'Admin Authentication',
        status: 'pending',
        description: 'Test admin login and permissions',
      },
      {
        id: 'authentication-3',
        title: 'Password Security',
        status: 'pending',
        description: 'Check password hashing, strength requirements, and reset functionality',
      },
    ],
  },
  {
    id: 'code-quality',
    title: 'Code Quality',
    icon: <Code className="h-5 w-5" />,
    items: [
      {
        id: 'code-quality-1',
        title: 'Linting',
        status: 'pending',
        description: 'Verify code meets linting standards',
      },
      {
        id: 'code-quality-2',
        title: 'Coding Standards',
        status: 'pending',
        description: 'Check adherence to project coding standards',
      },
      {
        id: 'code-quality-3',
        title: 'Code Documentation',
        status: 'pending',
        description: 'Verify code comments and documentation',
      },
    ],
  },
  {
    id: 'error-handling',
    title: 'Error Handling & Logging',
    icon: <AlertTriangle className="h-5 w-5" />,
    items: [
      {
        id: 'error-handling-1',
        title: 'Error Handling',
        status: 'pending',
        description: 'Test error handling throughout the application',
      },
      {
        id: 'error-handling-2',
        title: 'Logging',
        status: 'pending',
        description: 'Check logging functionality and coverage',
      },
      {
        id: 'error-handling-3',
        title: 'Monitoring',
        status: 'pending',
        description: 'Verify monitoring and alerting setup',
      },
    ],
  },
  {
    id: 'security',
    title: 'Security',
    icon: <Shield className="h-5 w-5" />,
    items: [
      {
        id: 'security-1',
        title: 'Security Headers',
        status: 'pending',
        description: 'Verify proper security headers are set',
      },
      {
        id: 'security-2',
        title: 'Input Validation',
        status: 'pending',
        description: 'Test input validation and sanitization',
      },
      {
        id: 'security-3',
        title: 'Dependency Security',
        status: 'pending',
        description: 'Check for vulnerable dependencies',
      },
    ],
  },
  {
    id: 'backup-restore',
    title: 'Backup & Restore',
    icon: <Archive className="h-5 w-5" />,
    items: [
      {
        id: 'backup-restore',
        title: 'Backup & Restore',
        status: 'pending',
        description: 'Verify backup and restore procedures',
      },
    ],
  },
  {
    id: 'testing',
    title: 'Testing',
    icon: <AlertTriangle className="h-5 w-5" />,
    items: [
      {
        id: 'testing-1',
        title: 'Test Coverage',
        status: 'pending',
        description: 'Check test coverage across the application',
      },
      {
        id: 'testing-2',
        title: 'Manual Tests',
        status: 'pending',
        description: 'Verify completion of manual test scenarios',
      },
      {
        id: 'testing-3',
        title: 'End-to-End Tests',
        status: 'pending',
        description: 'Test end-to-end workflows',
      },
    ],
  },
  {
    id: 'performance',
    title: 'Performance',
    icon: <Cpu className="h-5 w-5" />,
    items: [
      {
        id: 'performance-1',
        title: 'Performance Tests',
        status: 'pending',
        description: 'Verify application performance metrics',
      },
      {
        id: 'performance-2',
        title: 'Load Tests',
        status: 'pending',
        description: 'Test application under load',
      },
      {
        id: 'performance-3',
        title: 'Scalability',
        status: 'pending',
        description: 'Verify application can scale with increased load',
      },
    ],
  },
  {
    id: 'deployment',
    title: 'Deployment',
    icon: <Settings className="h-5 w-5" />,
    items: [
      {
        id: 'deployment-1',
        title: 'Deployment Pipeline',
        status: 'pending',
        description: 'Check deployment pipeline functionality',
      },
      {
        id: 'deployment-2',
        title: 'Rollback Process',
        status: 'pending',
        description: 'Verify rollback procedures',
      },
      {
        id: 'deployment-3',
        title: 'Zero Downtime',
        status: 'pending',
        description: 'Test zero-downtime deployment capability',
      },
    ],
  },
  {
    id: 'environment',
    title: 'Environment Management',
    icon: <Settings className="h-5 w-5" />,
    items: [
      {
        id: 'environment-1',
        title: 'Environment Config',
        status: 'pending',
        description: 'Verify environment configuration',
      },
      {
        id: 'environment-2',
        title: 'Secrets Management',
        status: 'pending',
        description: 'Check secrets management',
      },
      {
        id: 'environment-3',
        title: 'Third-Party Services',
        status: 'pending',
        description: 'Test integration with third-party services',
      },
    ],
  },
  {
    id: 'documentation',
    title: 'Documentation',
    icon: <FileText className="h-5 w-5" />,
    items: [
      {
        id: 'documentation-1',
        title: 'Project Documentation',
        status: 'pending',
        description: 'Check project documentation',
      },
      {
        id: 'documentation-2',
        title: 'API Documentation',
        status: 'pending',
        description: 'Verify API documentation',
      },
      {
        id: 'documentation-3',
        title: 'User Documentation',
        status: 'pending',
        description: 'Test user documentation',
      },
    ],
  },
];

// Map test IDs to checklist item IDs
const testToChecklistIdMap: Record<string, string> = {
  'db-connectivity': 'database-1',
  'db-tables': 'database-2',
  'db-performance': 'database-3',
  'api-endpoints': 'api-1',
  'api-performance': 'api-2',
  'api-security': 'api-3',
  'frontend-routes': 'frontend-1',
  'frontend-performance': 'frontend-2',
  'frontend-compatibility': 'frontend-3',
  'responsive-design': 'frontend-4',
  'user-auth': 'authentication-1',
  'admin-auth': 'authentication-2',
  'password-security': 'authentication-3',
  'code-quality': 'code-quality-1',
  'code-standards': 'code-quality-2',
  'code-documentation': 'code-quality-3',
  'error-handling': 'error-handling-1',
  'logging': 'error-handling-2',
  'monitoring': 'error-handling-3',
  'security-headers': 'security-1',
  'input-validation': 'security-2',
  'dependency-security': 'security-3',
  'backup-restore': 'backup-restore',
  'test-coverage': 'testing-1',
  'manual-tests': 'testing-2',
  'e2e-tests': 'testing-3',
  'performance-tests': 'performance-1',
  'load-tests': 'performance-2',
  'scalability': 'performance-3',
  'deployment-pipeline': 'deployment-1',
  'rollback-process': 'deployment-2',
  'zero-downtime': 'deployment-3',
  'environment-config': 'environment-1',
  'secrets-management': 'environment-2',
  'third-party-services': 'environment-3',
  'system-docs': 'documentation-1',
  'api-docs': 'documentation-2',
  'user-docs': 'documentation-3',
};

export default function AdminDeploymentPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<ChecklistCategory[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState('database');
  const [isRunningAll, setIsRunningAll] = useState(false);

  // Calculate overall progress
  const totalItems = categories.flatMap((category) => category.items).length;
  const passedItems = categories
    .flatMap((category) => category.items)
    .filter((item) => item.status === 'passed').length;
  const failedItems = categories
    .flatMap((category) => category.items)
    .filter((item) => item.status === 'failed').length;
  const warningItems = categories
    .flatMap((category) => category.items)
    .filter((item) => item.status === 'warning').length;

  const progressPercentage = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 0;

  // Query to get test results (if they were previously run)
  const { data: savedResults, isLoading: isLoadingResults } = useQuery({
    queryKey: ['/api/admin/deployment/results'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/admin/deployment/results');
        return await res.json();
      } catch (error) {
        console.error('Failed to fetch test results:', error);
        return null;
      }
    },
    onSuccess: (data) => {
      if (data && Object.keys(data).length > 0) {
        // Update checklist items with saved results
        const updatedCategories = [...categories];
        
        for (const testId in data) {
          const checklistId = testToChecklistIdMap[testId];
          if (checklistId) {
            for (const category of updatedCategories) {
              const item = category.items.find((item) => item.id === checklistId);
              if (item) {
                item.status = data[testId].success ? 'passed' : 'failed';
                item.result = data[testId];
              }
            }
          }
        }
        
        setCategories(updatedCategories);
      }
    },
  });

  // Mutation to run a single test
  const runTestMutation = useMutation({
    mutationFn: async ({ testId }: { testId: string }) => {
      const res = await apiRequest('POST', '/api/admin/deployment/run-test', { testId });
      return await res.json();
    },
    onMutate: ({ testId }) => {
      // Update the status of the checklist item to 'running'
      const updatedCategories = [...categories];
      const checklistId = testToChecklistIdMap[testId];
      
      if (checklistId) {
        for (const category of updatedCategories) {
          const item = category.items.find((item) => item.id === checklistId);
          if (item) {
            item.status = 'running';
          }
        }
      }
      
      setCategories(updatedCategories);
    },
    onSuccess: (data, { testId }) => {
      // Update the status and result of the checklist item
      const updatedCategories = [...categories];
      const checklistId = testToChecklistIdMap[testId];
      
      if (checklistId) {
        for (const category of updatedCategories) {
          const item = category.items.find((item) => item.id === checklistId);
          if (item) {
            item.status = data.success ? 'passed' : 'failed';
            item.result = data;
          }
        }
      }
      
      setCategories(updatedCategories);
      
      toast({
        title: data.success ? 'Test passed!' : 'Test failed',
        description: data.message,
        variant: data.success ? 'default' : 'destructive',
      });
      
      // Invalidate the results query to refresh saved results
      queryClient.invalidateQueries({ queryKey: ['/api/admin/deployment/results'] });
    },
    onError: (error, { testId }) => {
      console.error(`Error running test ${testId}:`, error);
      toast({
        title: 'Test failed',
        description: 'An error occurred while running the test. Please try again.',
        variant: 'destructive',
      });
      
      // Update the status of the checklist item back to 'pending'
      const updatedCategories = [...categories];
      const checklistId = testToChecklistIdMap[testId];
      
      if (checklistId) {
        for (const category of updatedCategories) {
          const item = category.items.find((item) => item.id === checklistId);
          if (item) {
            item.status = 'pending';
          }
        }
      }
      
      setCategories(updatedCategories);
    },
  });

  // Mutation to run all tests
  const runAllTestsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/deployment/run-all-tests');
      return await res.json();
    },
    onMutate: () => {
      setIsRunningAll(true);
      
      // Update the status of all checklist items to 'running'
      const updatedCategories = [...categories];
      
      for (const category of updatedCategories) {
        for (const item of category.items) {
          item.status = 'running';
        }
      }
      
      setCategories(updatedCategories);
    },
    onSuccess: (data) => {
      // Update the status and result of all checklist items
      const updatedCategories = [...categories];
      
      for (const testId in data) {
        const checklistId = testToChecklistIdMap[testId];
        if (checklistId) {
          for (const category of updatedCategories) {
            const item = category.items.find((item) => item.id === checklistId);
            if (item) {
              item.status = data[testId].success ? 'passed' : 'failed';
              item.result = data[testId];
            }
          }
        }
      }
      
      setCategories(updatedCategories);
      setIsRunningAll(false);
      
      toast({
        title: 'All tests completed',
        description: `Passed: ${passedItems}, Failed: ${failedItems}, Warnings: ${warningItems}`,
      });
      
      // Invalidate the results query to refresh saved results
      queryClient.invalidateQueries({ queryKey: ['/api/admin/deployment/results'] });
    },
    onError: (error) => {
      console.error('Error running all tests:', error);
      toast({
        title: 'Tests failed',
        description: 'An error occurred while running all tests. Please try again.',
        variant: 'destructive',
      });
      
      setIsRunningAll(false);
      
      // Update the status of all checklist items back to 'pending'
      const updatedCategories = [...categories];
      
      for (const category of updatedCategories) {
        for (const item of category.items) {
          if (item.status === 'running') {
            item.status = 'pending';
          }
        }
      }
      
      setCategories(updatedCategories);
    },
  });

  // Function to run a single test
  const handleRunTest = async (itemId: string, categoryId: string) => {
    // Find the test ID for the checklist item
    const testId = Object.keys(testToChecklistIdMap).find(
      (key) => testToChecklistIdMap[key] === itemId
    );
    
    if (testId) {
      runTestMutation.mutate({ testId });
    } else {
      toast({
        title: 'Test not found',
        description: `No test implementation found for "${categoryId}/${itemId}"`,
        variant: 'destructive',
      });
    }
  };

  // Function to run all tests
  const handleRunAllTests = async () => {
    runAllTestsMutation.mutate();
  };

  // Get status icon based on item status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <X className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'running':
        return <Cpu className="h-5 w-5 text-blue-500 animate-pulse" />;
      default:
        return <Info className="h-5 w-5 text-gray-400" />;
    }
  };

  // Get status text color based on item status
  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'running':
        return 'text-blue-500';
      default:
        return 'text-gray-400';
    }
  };

  // Fix links in action items
  const processActionItem = (text: string) => {
    // Look for markdown-style links with regex: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    
    // Replace markdown links with HTML links that have proper text-blue-400 coloring
    let processedText = text.replace(linkRegex, '<a href="$2" class="text-blue-400 hover:text-blue-300 underline" target="_blank">$1</a>');
    
    // Highlight URL paths with special coloring (e.g., /api/something)
    const urlPathRegex = /\b\/(api|admin|auth|docs|documentation|public|css|assets)\/[a-zA-Z0-9\/_-]+\b/g;
    processedText = processedText.replace(urlPathRegex, '<span class="text-emerald-400 font-mono">$&</span>');
    
    return processedText;
  };

  return (
    <AdminLayout>
      <div className="space-y-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Deployment Readiness</h1>
            <p className="text-gray-300">
              Check if your application is ready for production deployment
            </p>
          </div>
          <Button
            onClick={handleRunAllTests}
            disabled={isRunningAll || runTestMutation.isPending}
            className="flex items-center"
          >
            {isRunningAll ? 'Running Tests...' : 'Run All Tests'}
          </Button>
        </div>

        <Card className="bg-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Deployment Readiness Overview</CardTitle>
            <CardDescription className="text-gray-300">
              Current status of your application's readiness for deployment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-lg font-medium text-white">{progressPercentage}% Complete</p>
                  <p className="text-sm text-gray-300">
                    {passedItems} passed, {failedItems} failed, {warningItems} warnings
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500 mr-1"></div>
                    <span className="text-sm text-white">Passed</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-red-500 mr-1"></div>
                    <span className="text-sm text-white">Failed</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-yellow-500 mr-1"></div>
                    <span className="text-sm text-white">Warning</span>
                  </div>
                </div>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Tabs
          defaultValue={selectedCategory}
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          className="space-y-4"
        >
          <div className="overflow-x-auto pb-2">
            <TabsList className="flex w-max space-x-2 bg-gray-700">
              {categories.map((category) => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id} 
                  className="flex items-center gap-2 text-white data-[state=active]:bg-gray-600"
                >
                  {category.icon}
                  <span>{category.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="space-y-4">
              {category.items.map((item) => (
                <Card key={item.id} className="bg-gray-800">
                  <CardHeader className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <div className="mt-1">{getStatusIcon(item.status)}</div>
                        <div>
                          <CardTitle className="text-lg text-white">{item.title}</CardTitle>
                          <CardDescription className="text-gray-300">{item.description}</CardDescription>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleRunTest(item.id, category.id)}
                        disabled={item.status === 'running' || isRunningAll || runTestMutation.isPending}
                      >
                        {item.status === 'running' ? 'Running...' : 'Run Test'}
                      </Button>
                    </div>
                  </CardHeader>
                  {item.result && (
                    <CardContent className="pt-0">
                      <Accordion type="single" collapsible>
                        <AccordionItem value="details" className="border-gray-700">
                          <AccordionTrigger className="text-sm font-medium text-white">
                            View Details
                          </AccordionTrigger>
                          <AccordionContent className="text-white">
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <span className={`font-medium ${getStatusTextColor(item.status)}`}>
                                  {item.status === 'passed' ? 'Passed' : item.status === 'failed' ? 'Failed' : 'Warning'}
                                </span>
                                <span className="mx-2 text-white">-</span>
                                <span className="text-white">{item.result.message}</span>
                              </div>
                              {item.result.details && (
                                <div className="text-sm text-gray-300">
                                  {item.result.details}
                                </div>
                              )}
                              {item.result.actionItems && item.result.actionItems.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-white">Action Items:</p>
                                  <ul className="list-disc pl-5 text-sm text-gray-300">
                                    {item.result.actionItems.map((actionItem, index) => (
                                      <li
                                        key={index}
                                        dangerouslySetInnerHTML={{
                                          __html: processActionItem(actionItem),
                                        }}
                                      />
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  )}
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
}