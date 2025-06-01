import EnrolledCourses from "@/components/dashboard/enrolled-courses";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function MyCoursesPage() {
  return (
    <div className="container max-w-screen-xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-extrabold mb-8 text-center">My Courses</h1>
      
      <Card className="bg-card border shadow-sm p-6">
        <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
          <EnrolledCourses />
        </Suspense>
      </Card>
    </div>
  );
}