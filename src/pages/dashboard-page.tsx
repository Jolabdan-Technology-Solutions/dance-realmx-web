import EnrolledCourses from "../components/dashboard/enrolled-courses";
import CurriculumMaterials from "../components/dashboard/curriculum-materials"; // Updated component name and path
import CourseAnalytics from "../components/dashboard/course-analytics"; // New analytics component
import UpcomingEvents from "../components/dashboard/upcoming-events";
import { useFirebaseAuth } from "../hooks/use-firebase-auth-new";
import { useQuery } from "@tanstack/react-query";
import { Certificate, Event } from "../../../shared/schema";
import {
  Award,
  BookOpen,
  Calendar,
  Gem,
  Grid2X2,
  MapPin,
  ShoppingBag,
  BarChart,
  Activity,
} from "lucide-react";
import { Link } from "wouter";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

export function DashboardPage() {
  const { user } = useFirebaseAuth();

  // Fetch upcoming events
  const { data: rawEvents = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });
  const events = Array.isArray(rawEvents) ? rawEvents : [];

  // Fetch user's certificates
  const { data: certificates = [] } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates", { userId: user?.id }],
    enabled: !!user?.id,
  });

  // Filter to only upcoming events and sort by date
  const upcomingEvents = events
    .filter((event) => new Date(event.startDate) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

  // Get subscription status using subscription_tier
  const subscriptionLevel = user?.subscription_tier?.toLowerCase() || "free";

  return (
    <>
      <main className="flex-grow py-12">
        <div className="container mx-auto px-4">
          {/* Welcome Banner with Quick Stats */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg overflow-hidden mb-8 p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center mb-4">
                  {user?.profile_image_url ? (
                    <div
                      className="w-12 h-12 rounded-full overflow-hidden mr-4 border-2 border-primary/30"
                      key={`profile-image-${Date.now()}`}
                    >
                      <img
                        src={`${user.profile_image_url.split("?")[0]}?t=${Date.now()}`}
                        alt={user.first_name || user.username}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error(
                            "Error loading profile image in dashboard:",
                            user.profile_image_url
                          );

                          // Replace with fallback initials
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full bg-primary/10 flex items-center justify-center">
                                <span class="text-primary font-bold text-lg">
                                  ${user?.first_name?.[0] || user?.username?.[0] || "U"}
                                </span>
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full mr-4 bg-primary/10 flex items-center justify-center border-2 border-primary/30">
                      <span className="text-primary font-bold text-lg">
                        {user?.first_name?.[0] || user?.username?.[0] || "U"}
                      </span>
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-bold">
                      Welcome, {user?.first_name || user?.username}!
                    </h1>
                    <p className="text-lg text-muted-foreground">
                      Your dance education journey continues here.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  {subscriptionLevel !== "free" && (
                    <Badge variant="secondary" className="text-xs py-1">
                      <Gem className="h-3 w-3 mr-1" />
                      {subscriptionLevel.charAt(0).toUpperCase() +
                        subscriptionLevel.slice(1)}{" "}
                      Plan
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs py-1">
                    <BookOpen className="h-3 w-3 mr-1" />
                    {user?.role || "Student"}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button asChild size="sm" variant="outline">
                  <Link href="/courses">
                    <Grid2X2 className="mr-2 h-4 w-4" />
                    Browse Courses
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/curriculum">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Shop Curriculum
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/connect">
                    <MapPin className="mr-2 h-4 w-4" />
                    Connect with Teachers
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <Tabs defaultValue="courses" className="mb-12">
            <TabsList className="mb-6">
              <TabsTrigger value="courses">My Courses</TabsTrigger>
              <TabsTrigger value="curriculum">My Curriculum</TabsTrigger>
              <TabsTrigger value="events">Upcoming Events</TabsTrigger>
              <TabsTrigger value="certificates">My Certificates</TabsTrigger>
            </TabsList>

            <TabsContent value="courses">
              <EnrolledCourses />
            </TabsContent>

            <TabsContent value="curriculum">
              <CurriculumMaterials />
            </TabsContent>

            <TabsContent value="events">
              <div className="flex flex-wrap -mx-4">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="w-full px-4 mb-8 sm:w-1/2 lg:w-1/3"
                    >
                      <Card className="h-full flex flex-col">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xl">
                            {event.name}
                          </CardTitle>
                          <CardDescription>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(event.startDate).toLocaleDateString(
                                  undefined,
                                  {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </span>
                            </div>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="line-clamp-2">{event.description}</p>
                          {event.location && (
                            <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                          >
                            View Details
                          </Button>
                        </CardFooter>
                      </Card>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 flex flex-col items-center justify-center py-12 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium mb-2">
                      No Upcoming Events
                    </h3>
                    <p className="text-muted-foreground">
                      Check back soon for upcoming workshops, masterclasses, and
                      performances.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="certificates">
              <div className="flex flex-wrap -mx-4">
                {certificates.length > 0 ? (
                  certificates.map((certificate) => (
                    <div
                      key={certificate.id}
                      className="w-full px-4 mb-8 sm:w-1/2 lg:w-1/3"
                    >
                      <Card className="border-2 border-primary/10 h-full flex flex-col">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-xl">
                              Course Certificate
                            </CardTitle>
                            <Award className="h-6 w-6 text-primary" />
                          </div>
                          <CardDescription>
                            Certificate ID: {certificate.certificateId}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="text-sm mb-2">
                            Issued on:{" "}
                            {certificate.issuedAt
                              ? new Date(
                                  certificate.issuedAt
                                ).toLocaleDateString()
                              : "N/A"}
                          </p>
                          {/* This would need to be fetched from the course data */}
                          <p className="font-medium">
                            Advanced Salsa Techniques
                          </p>
                        </CardContent>
                        <CardFooter className="pt-2 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            Verify
                          </Button>
                          <Button size="sm" className="flex-1">
                            Download
                          </Button>
                        </CardFooter>
                      </Card>
                    </div>
                  ))
                ) : (
                  <div className="w-full flex flex-col items-center justify-center py-12 text-center">
                    <Award className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium mb-2">
                      No Certificates Yet
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Complete a course to earn your first certificate!
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/courses">Browse Courses</Link>
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Progress Overview with Moodle-like Analytics */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Your Learning Progress</h2>
              <div className="flex items-center">
                <span className="text-muted-foreground text-sm mr-2">
                  Detailed analytics
                </span>
                <Badge variant="outline" className="flex items-center">
                  <Activity className="h-3 w-3 mr-1 text-primary" />
                  Moodle-Compatible
                </Badge>
              </div>
            </div>
            <CourseAnalytics />
          </div>
        </div>
      </main>
    </>
  );
}

export default DashboardPage;
