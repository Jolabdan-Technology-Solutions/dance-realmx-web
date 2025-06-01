import { Link } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Course } from "@shared/schema";
import { API_ENDPOINTS } from "@/lib/constants";

export default function FeaturedCourses() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  
  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: [API_ENDPOINTS.COURSES.BASE],
  });

  const { data: categories = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: [API_ENDPOINTS.CATEGORIES.BASE],
  });

  const filteredCourses = selectedCategory 
    ? courses.filter(course => course.categoryId === selectedCategory)
    : courses;

  return (
    <section className="py-12 bg-slate-900 text-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">Featured Certification Courses</h2>
        
        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <Button 
            variant={selectedCategory === null ? "default" : "outline"}
            className={selectedCategory === null ? "bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90" : ""}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              className={selectedCategory === category.id ? "bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90" : ""}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
        
        {/* Course Cards */}
        {isLoading ? (
          <div className="text-center">Loading courses...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center">
            <p className="text-xl">No courses found</p>
            <p className="mt-2 text-gray-300">Please check back later or try a different category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
        
        <div className="mt-10 text-center">
          <Link href="/courses">
            <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 px-8 py-3">
              View All Courses
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function CourseCard({ course }: { course: Course }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="h-48 overflow-hidden">
        <img 
          src={course.imageUrl ? 
            (course.imageUrl.includes('?') ? course.imageUrl : `${course.imageUrl}?t=${Date.now()}`) : 
            "/assets/images/default-course.jpg"} 
          alt={course.title} 
          className="w-full h-full object-cover transition-transform hover:scale-105"
          onError={(e) => {
            console.error("Error loading featured course image:", course.title, course.imageUrl);
            const parent = e.currentTarget.parentElement;
            if (parent) {
              e.currentTarget.style.display = 'none';
              parent.innerHTML = `
                <div class="w-full h-full bg-primary/10 flex items-center justify-center">
                  <span class="text-primary text-5xl">
                    ${course.title?.[0] || "D"}
                  </span>
                </div>
              `;
            }
          }}
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-3">{course.title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-3">{course.description}</p>
        <div className="flex justify-between items-center">
          <span className="font-bold text-[#00d4ff]">${typeof course.price === 'number' ? course.price.toFixed(2) : course.price || '0.00'}</span>
          <Link href={`/courses/${course.id}`}>
            <Button variant="outline" className="border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff] hover:text-white">
              View Course
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}