import { Link } from "wouter";
import { Course } from "../../../../shared/schema";
import { Button } from "../../components/ui/button";
import { useState } from "react";
import { normalizeImageUrl } from "../../lib/utils";

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const [imageError, setImageError] = useState(false);

  // Limit description to a reasonable length
  const truncatedDescription =
    course.description && course.description.length > 100
      ? course.description.substring(0, 100) + "..."
      : course.description;

  // Use a fallback image from our assets if imageUrl is missing
  const defaultImageUrl = `/images/thumbnails/ballet-techniques.jpg`;

  // Try to get a valid image URL
  let imageUrl = course.image_url
    ? normalizeImageUrl(course.image_url)
    : defaultImageUrl;

  // If the image is already showing an error, use the fallback
  if (imageError) {
    imageUrl = defaultImageUrl;
  }

  // Add cache busting to avoid stale cached images
  const finalImageUrl = imageUrl.includes("?")
    ? `${imageUrl}&t=${Date.now()}`
    : `${imageUrl}?t=${Date.now()}`;

  return (
    <div className="bg-white text-black rounded-lg shadow-lg overflow-hidden">
      {imageError ? (
        // Fallback display when image fails to load
        <div className="w-full h-48 bg-primary/10 flex items-center justify-center">
          <span className="text-primary text-5xl">
            {course.title?.[0] || "D"}
          </span>
        </div>
      ) : (
        <img
          src={finalImageUrl}
          alt={course.title}
          className="w-full h-48 object-cover"
          onError={(e) => {
            console.error(
              "Error loading course image:",
              course.title,
              imageUrl
            );
            setImageError(true);
          }}
        />
      )}
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{course.title}</h3>
        <p className="text-gray-700 mb-4 line-clamp-3">
          {truncatedDescription || "No description available."}
        </p>
        <div className="flex justify-between items-center">
          <span className="font-bold text-lg">
            {Number(course.price) > 0
              ? `$${Number(course.price).toFixed(2)}`
              : "Free"}
          </span>
          <Button
            asChild
            className="bg-[#00d4ff] text-black font-bold rounded-full px-4 py-2 text-sm hover:bg-[#00d4ff]/90 transition"
          >
            <Link href={`/courses/${course.id}`}>
              {Number(course.price) > 0 ? "View Details" : "Enroll Now"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
