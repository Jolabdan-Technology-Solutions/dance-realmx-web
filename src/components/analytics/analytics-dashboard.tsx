import { useSubscription } from "@/hooks/use-subscription";
import { RequireSubscription } from "@/components/subscription/require-subscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, DollarSign, BookOpen, Crown, Star } from "lucide-react";

export function AnalyticsDashboard() {
  const { hasAccess, planName } = useSubscription();

  return (
    <RequireSubscription 
      requiredLevel={20} 
      featureName="Advanced Analytics"
      description="Access detailed insights about your courses, student progress, revenue tracking, and engagement metrics."
      upgradePrompt="Upgrade to Premium or higher to unlock advanced analytics and reporting features."
    >
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Advanced insights and reporting for your teaching business
            </p>
          </div>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <Crown className="h-3 w-3 mr-1" />
            {planName} Feature
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Revenue Analytics */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$12,543</div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>

          {/* Student Engagement */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">247</div>
              <p className="text-xs text-muted-foreground">
                +15 new this week
              </p>
            </CardContent>
          </Card>

          {/* Course Performance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Course Completion</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87%</div>
              <p className="text-xs text-muted-foreground">
                +5% from last month
              </p>
            </CardContent>
          </Card>

          {/* Growth Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+24%</div>
              <p className="text-xs text-muted-foreground">
                Monthly growth rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Premium Features Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Student Progress Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Monitor individual student progress, completion rates, and engagement levels across all your courses.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Course Completions</span>
                  <span className="font-medium">156 this month</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Average Progress</span>
                  <span className="font-medium">74%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Drop-off Rate</span>
                  <span className="font-medium">13%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Revenue Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Detailed breakdown of your earnings, subscription trends, and financial forecasting.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Course Sales</span>
                  <span className="font-medium">$8,420</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Resource Sales</span>
                  <span className="font-medium">$4,123</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Projected Growth</span>
                  <span className="font-medium">+18%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RequireSubscription>
  );
}

export default AnalyticsDashboard;
