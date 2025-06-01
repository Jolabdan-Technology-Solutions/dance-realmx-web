import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
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
  PlayCircle,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  BarChart3,
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
        id: 'frontend-5',
        title: 'Route Accessibility',
        status: 'pending',
        description: 'Test critical routes to ensure no 404 errors occur in production',
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
  'dbConnectivity': 'database-1',
  'dbTables': 'database-2',
  'dbPerformance': 'database-3',
  'apiEndpoints': 'api-1',
  'apiPerformance': 'api-2',
  'apiSecurity': 'api-3',
  'frontendRoutes': 'frontend-1',
  'routeAccessibility': 'frontend-5',
  'frontendPerformance': 'frontend-2',
  'browserCompatibility': 'frontend-3',
  'responsiveDesign': 'frontend-4',
  'userAuth': 'authentication-1',
  'adminAuth': 'authentication-2',
  'passwordSecurity': 'authentication-3',
  'codeQuality': 'code-quality-1',
  'codeStandards': 'code-quality-2',
  'codeDocumentation': 'code-quality-3',
  'errorHandling': 'error-handling-1',
  'logging': 'error-handling-2',
  'monitoring': 'error-handling-3',
  'securityHeaders': 'security-1',
  'inputValidation': 'security-2',
  'dependencySecurity': 'security-3',
  'backupRestore': 'backup-restore',
  'testCoverage': 'testing-1',
  'test-coverage': 'testing-1',
  'manualTesting': 'testing-2',
  'manualTests': 'testing-2',
  'manual-tests': 'testing-2',
  'integrationTesting': 'testing-3',
  'integrationTests': 'testing-3',
  'integration-tests': 'testing-3',
  'e2eTests': 'testing-3',
  'e2e-tests': 'testing-3',
  'performanceTests': 'performance-1',
  'performance-tests': 'performance-1',
  'loadTests': 'performance-2',
  'load-tests': 'performance-2',
  'scalability': 'performance-3',
  'versionControl': 'deployment-1',
  'version-control': 'deployment-1',
  'ciCd': 'deployment-2',
  'ci-cd': 'deployment-2',
  'deploymentRollback': 'deployment-3',
  'deploymentPipeline': 'deployment-1',
  'deployment-pipeline': 'deployment-1',
  'rollbackProcess': 'deployment-3',
  'rollback-process': 'deployment-3',
  'environmentConfig': 'environment-1',
  'environment-config': 'environment-1',
  'secretsManagement': 'environment-2',
  'secrets-management': 'environment-2',
  'thirdPartyServices': 'environment-3',
  'third-party-services': 'environment-3',
  'systemDocumentation': 'documentation-1',
  'systemDocs': 'documentation-1',
  'system-docs': 'documentation-1',
  'apiDocumentation': 'documentation-2',
  'apiDocs': 'documentation-2',
  'api-docs': 'documentation-2',
  'userDocumentation': 'documentation-3',
  'userDocs': 'documentation-3',
  'user-docs': 'documentation-3',
};

export default function DeploymentChecklist() {
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
  });

  // Use effect replacement to update categories when savedResults changes
  if (savedResults && Object.keys(savedResults).length > 0 && !isLoadingResults) {
    // Update checklist items with saved results
    const updatedCategories = [...categories];
    
    for (const testId in savedResults) {
      const checklistId = testToChecklistIdMap[testId];
      if (checklistId) {
        for (const category of updatedCategories) {
          const item = category.items.find((item) => item.id === checklistId);
          if (item) {
            if (item.status !== (savedResults[testId].success ? 'passed' : 'failed')) {
              item.status = savedResults[testId].success ? 'passed' : 'failed';
              item.result = savedResults[testId];
              setCategories(updatedCategories);
            }
          }
        }
      }
    }
  }

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
        description: `${Object.values(data).filter((result: any) => result.success).length} passed, ${
          Object.values(data).filter((result: any) => !result.success).length
        } failed`,
        variant: 'default',
      });
      
      // Invalidate the results query to refresh saved results
      queryClient.invalidateQueries({ queryKey: ['/api/admin/deployment/results'] });
    },
    onError: (error) => {
      console.error('Error running all tests:', error);
      toast({
        title: 'Tests failed',
        description: 'An error occurred while running the tests. Please try again.',
        variant: 'destructive',
      });
      
      // Reset the status of all checklist items to their previous state
      queryClient.invalidateQueries({ queryKey: ['/api/admin/deployment/results'] });
      setIsRunningAll(false);
    },
  });

  // Helper function to get the icon for a test status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <X className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'running':
        return (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-dashed border-blue-500" />
        );
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-500" />;
    }
  };

  // Helper function to get the color for a test status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'border-green-500 bg-green-500/10';
      case 'failed':
        return 'border-red-500 bg-red-500/10';
      case 'warning':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'running':
        return 'border-blue-500 bg-blue-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

  // Helper function to find test ID from checklist ID
  const findTestId = (checklistId: string) => {
    for (const [testId, mappedChecklistId] of Object.entries(testToChecklistIdMap)) {
      if (mappedChecklistId === checklistId) {
        return testId;
      }
    }
    return null;
  };

  // Generate ID of the tests to run for a category
  const findTestsForCategory = (categoryId: string) => {
    const result: string[] = [];
    
    for (const category of categories) {
      if (category.id === categoryId) {
        for (const item of category.items) {
          const testId = findTestId(item.id);
          if (testId) {
            result.push(testId);
          }
        }
      }
    }
    
    return result;
  };

  // Mutation to run tests for a category
  const runCategoryTestsMutation = useMutation({
    mutationFn: async ({ categoryId }: { categoryId: string }) => {
      const testIds = findTestsForCategory(categoryId);
      const res = await apiRequest('POST', '/api/admin/deployment/run-tests', { testIds });
      return await res.json();
    },
    onMutate: ({ categoryId }) => {
      // Update the status of the category items to 'running'
      const updatedCategories = [...categories];
      
      for (const category of updatedCategories) {
        if (category.id === categoryId) {
          for (const item of category.items) {
            item.status = 'running';
          }
        }
      }
      
      setCategories(updatedCategories);
    },
    onSuccess: (data, { categoryId }) => {
      // Update the status and result of the category items
      const updatedCategories = [...categories];
      
      for (const testId in data) {
        const checklistId = testToChecklistIdMap[testId];
        
        if (checklistId) {
          for (const category of updatedCategories) {
            if (category.id === categoryId) {
              const item = category.items.find((item) => item.id === checklistId);
              
              if (item) {
                item.status = data[testId].success ? 'passed' : 'failed';
                item.result = data[testId];
              }
            }
          }
        }
      }
      
      setCategories(updatedCategories);
      
      const passedCount = Object.values(data).filter((result: any) => result.success).length;
      const failedCount = Object.values(data).filter((result: any) => !result.success).length;
      
      toast({
        title: 'Category tests completed',
        description: `${passedCount} passed, ${failedCount} failed`,
        variant: 'default',
      });
      
      // Invalidate the results query to refresh saved results
      queryClient.invalidateQueries({ queryKey: ['/api/admin/deployment/results'] });
    },
    onError: (error, { categoryId }) => {
      console.error(`Error running tests for category ${categoryId}:`, error);
      toast({
        title: 'Tests failed',
        description: 'An error occurred while running the tests. Please try again.',
        variant: 'destructive',
      });
      
      // Reset the status of the category items to their previous state
      queryClient.invalidateQueries({ queryKey: ['/api/admin/deployment/results'] });
    },
  });

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center">
            <Shield className="h-6 w-6 mr-2 text-blue-400" />
            Deployment Readiness
          </h2>
          <p className="text-gray-400 mt-1">Verify your application's production deployment readiness</p>
        </div>

        <Button
          variant="default"
          onClick={() => runAllTestsMutation.mutate()}
          disabled={isRunningAll || runAllTestsMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-md w-full md:w-auto"
        >
          {isRunningAll || runAllTestsMutation.isPending ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-dashed border-current" />
              Running All Tests...
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              Run All Tests
            </>
          )}
        </Button>
      </div>

      <Card className="border-gray-700 bg-gradient-to-b from-gray-800 to-gray-900 shadow-lg overflow-hidden">
        <CardHeader className="pb-2 border-b border-gray-700">
          <CardTitle className="text-lg flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-blue-400" />
            Deployment Readiness Progress
          </CardTitle>
          <CardDescription className="text-gray-400">
            {totalItems > 0
              ? `${passedItems} of ${totalItems} tests passed (${progressPercentage}%)`
              : 'No tests have been run yet. Run tests to check deployment readiness.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-2 mb-6 rounded-full bg-gray-800 relative overflow-hidden">
            <div 
              className={`h-full absolute left-0 top-0 transition-all duration-500 rounded-full ${
                progressPercentage > 75 ? 'bg-green-500' : 
                progressPercentage > 40 ? 'bg-yellow-500' : 
                'bg-red-500'
              }`} 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex flex-col items-center justify-center p-3 rounded-md bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 hover:shadow-md transition-all duration-200">
              <BarChart3 className="h-6 w-6 mb-1.5 text-blue-400" />
              <div className="text-xl font-semibold">{totalItems}</div>
              <div className="text-xs text-gray-400">Total Tests</div>
            </div>

            <div className="flex flex-col items-center justify-center p-3 rounded-md bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 hover:shadow-md transition-all duration-200">
              <CheckCircle className="h-6 w-6 mb-1.5 text-green-400" />
              <div className="text-xl font-semibold text-green-400">{passedItems}</div>
              <div className="text-xs text-gray-400">Passed</div>
            </div>

            <div className="flex flex-col items-center justify-center p-3 rounded-md bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 hover:shadow-md transition-all duration-200">
              <AlertCircle className="h-6 w-6 mb-1.5 text-red-400" />
              <div className="text-xl font-semibold text-red-400">{failedItems}</div>
              <div className="text-xs text-gray-400">Failed</div>
            </div>

            <div className="flex flex-col items-center justify-center p-3 rounded-md bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 hover:shadow-md transition-all duration-200">
              <AlertTriangle className="h-6 w-6 mb-1.5 text-yellow-400" />
              <div className="text-xl font-semibold text-yellow-400">{warningItems}</div>
              <div className="text-xs text-gray-400">Warnings</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <div className="mb-4 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
          <TabsList className="inline-flex whitespace-nowrap mb-6 w-auto bg-gray-900 p-1 border border-gray-700 rounded-lg gap-1">
            {categories.map((category) => {
              const passedCount = category.items.filter(item => item.status === 'passed').length;
              const totalCount = category.items.length;
              const passPercentage = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
              
              return (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id} 
                  className="gap-2 px-4 data-[state=active]:bg-gray-800 data-[state=active]:shadow-md relative"
                >
                  <div className="flex items-center">
                    {category.icon}
                    <span className="ml-2">{category.title}</span>
                  </div>
                  <div 
                    className={`absolute -bottom-1 left-0 h-1 rounded-full ${
                      passPercentage > 75 ? 'bg-green-500' : 
                      passPercentage > 40 ? 'bg-yellow-500' : 
                      'bg-red-500'
                    }`} 
                    style={{ width: `${passPercentage}%`, opacity: selectedCategory === category.id ? 1 : 0 }}
                  />
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <Card className="border-gray-700 bg-gradient-to-b from-gray-800 to-gray-900">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-700 pb-4">
                <div className="flex items-center">
                  <div className="mr-4 p-2 rounded-lg bg-gray-900/50">
                    {category.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl mb-1">{category.title}</CardTitle>
                    <CardDescription className="text-gray-400">
                      {category.items.filter((item) => item.status === 'passed').length} of {category.items.length} tests passed
                    </CardDescription>
                    <div className="flex mt-1 gap-3 text-xs">
                      <span className="text-green-400 flex items-center">
                        <Check className="h-3 w-3 mr-1" /> 
                        {category.items.filter(item => item.status === 'passed').length}
                      </span>
                      {category.items.filter(item => item.status === 'failed').length > 0 && 
                        <span className="text-red-400 flex items-center">
                          <X className="h-3 w-3 mr-1" /> 
                          {category.items.filter(item => item.status === 'failed').length}
                        </span>
                      }
                    </div>
                    <div className="flex mt-1 gap-3 text-xs">
                      {category.items.filter(item => item.status === 'warning').length > 0 && 
                        <span className="text-yellow-400 flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" /> 
                          {category.items.filter(item => item.status === 'warning').length}
                        </span>
                      }
                      {category.items.filter(item => item.status === 'pending' || item.status === 'running').length > 0 && 
                        <span className="text-blue-400 flex items-center">
                          <Info className="h-3 w-3 mr-1" /> 
                          {category.items.filter(item => item.status === 'pending' || item.status === 'running').length}
                        </span>
                      }
                    </div>
                  </div>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => runCategoryTestsMutation.mutate({ categoryId: category.id })}
                  disabled={runCategoryTestsMutation.isPending}
                  className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                >
                  {runCategoryTestsMutation.isPending &&
                  runCategoryTestsMutation.variables?.categoryId === category.id ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-dashed border-current" />
                      Running Tests...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Run All Tests
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.items.map((item) => (
                    <Card
                      key={item.id}
                      className={`border ${getStatusColor(item.status)} transition-colors hover:shadow-md`}
                    >
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-md font-medium flex items-center justify-between">
                          <div className="flex items-center">
                            {getStatusIcon(item.status)}
                            <span className="ml-2">{item.title}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const testId = findTestId(item.id);
                              if (testId) {
                                runTestMutation.mutate({ testId });
                              }
                            }}
                            disabled={runTestMutation.isPending}
                            className="ml-2"
                          >
                            {runTestMutation.isPending &&
                            testToChecklistIdMap[runTestMutation.variables?.testId || ''] ===
                              item.id ? (
                              <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-dashed border-current" />
                                Running...
                              </>
                            ) : (
                              'Run Test'
                            )}
                          </Button>
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-400 mt-1">{item.description}</CardDescription>
                      </CardHeader>
                      {item.result && (
                        <CardContent className="p-4 pt-0">
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="details" className="border-b-0">
                              <AccordionTrigger className="text-sm py-1 hover:no-underline">
                                <span className="text-xs font-medium text-gray-400 hover:text-white">Test Details</span>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="text-sm space-y-3 mt-2 bg-gray-800 p-3 rounded-md">
                                  <div className="flex items-center">
                                    <span className="font-medium text-gray-400 w-20">Status:</span>
                                    <span
                                      className={
                                        item.result.success ? 'text-green-500' : 'text-red-500'
                                      }
                                    >
                                      {item.result.success ? 'Passed' : 'Failed'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-400">Message:</span>
                                    <p className="mt-1">{item.result.message}</p>
                                  </div>
                                  {item.result.details && (
                                    <div>
                                      <span className="font-medium text-gray-400">Details:</span>
                                      <pre className="mt-1 text-xs bg-gray-900 p-2 rounded overflow-x-auto">
                                        {item.result.details}
                                      </pre>
                                    </div>
                                  )}
                                  {item.result.actionItems && item.result.actionItems.length > 0 && (
                                    <div>
                                      <span className="font-medium text-gray-400">Action Items:</span>
                                      <ul className="list-disc pl-5 mt-1 space-y-1">
                                        {item.result.actionItems.map((action, index) => (
                                          <li key={index}>{action}</li>
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Deployment Checklist Summary</CardTitle>
          <CardDescription>
            Overall summary of system readiness for production deployment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className={progressPercentage === 100 ? 'bg-green-900/20' : 'bg-yellow-900/20'}>
            <div className="flex items-center gap-2">
              {progressPercentage === 100 ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              <AlertTitle>
                {progressPercentage === 100
                  ? 'System is ready for deployment'
                  : 'System is not fully ready for deployment'}
              </AlertTitle>
            </div>
            <AlertDescription className="mt-2">
              {progressPercentage === 100 ? (
                'All tests have passed. Your system is ready to be deployed to production.'
              ) : (
                <>
                  {failedItems} tests are failing. Please address the issues before deploying to
                  production. Click on each test to see more details and action items.
                </>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
        {progressPercentage === 100 && (
          <CardFooter className="flex justify-center">
            <Button className="w-full md:w-auto">Deploy to Production</Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}