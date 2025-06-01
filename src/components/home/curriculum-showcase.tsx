import { useState } from "react";
import { Link } from "wouter";
import { 
  FileText, 
  ArrowRight, 
  Download,
  CheckCircle, ThumbsUp,
  Search,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const curriculumResources = [
  {
    id: 1,
    title: "Ballet Basics Curriculum Plan",
    description: "Complete curriculum for teaching ballet fundamentals to beginners, including class plans, music recommendations, and assessment rubrics.",
    imageSrc: "/assets/images/curriculum/Curriculm image section.png",
    category: "Ballet",
    price: "$29.99",
    verified: true,
    author: "Emma Davis",
    authorId: 2,
    downloadCount: 312,
    isFeatured: true,
    ageRange: "Ages 5-9"
  },
  {
    id: 2,
    title: "Contemporary Dance Technique Workbook",
    description: "Comprehensive workbook with exercises, combinations, and teaching strategies for contemporary dance across multiple levels.",
    imageSrc: "/assets/images/curriculum/Curriculm image section.png",
    category: "Contemporary",
    price: "$34.99",
    verified: true,
    author: "James Wilson",
    authorId: 4,
    downloadCount: 187,
    isFeatured: true,
    ageRange: "Ages 12-18"
  },
  {
    id: 3,
    title: "Hip-Hop Dance Class Bundle",
    description: "Complete class plans, music playlists, and video tutorials for hip-hop dance education at beginner through advanced levels.",
    imageSrc: "/assets/images/curriculum/Curriculm image section.png",
    category: "Hip-Hop",
    price: "$39.99",
    verified: true,
    author: "Marcus Thompson",
    authorId: 1,
    downloadCount: 235,
    isFeatured: false,
    ageRange: "Ages 8-16"
  },
  {
    id: 4,
    title: "Dance Studio Business Templates",
    description: "Full set of business documents including waivers, registration forms, progress reports, and financial planning worksheets for dance studios.",
    imageSrc: "/assets/images/curriculum/Curriculm image section.png",
    category: "Business",
    price: "$49.99",
    verified: true,
    author: "Jessica Williams",
    authorId: 5,
    downloadCount: 156,
    isFeatured: true,
    ageRange: "All ages"
  }
];

export default function CurriculumShowcase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  const categories = ["All", "Ballet", "Contemporary", "Hip-Hop", "Jazz", "Business"];
  
  const filteredResources = curriculumResources
    .filter(resource => 
      searchQuery === "" || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(resource => 
      selectedCategory === "All" || resource.category === selectedCategory
    );

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              Curriculum Resources
            </h2>
            <p className="text-gray-600 mt-2 max-w-2xl">
              Access high-quality teaching materials created by experienced dance educators. Save time in your planning and enhance your students' learning experience.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button asChild>
              <Link href="/curriculum" className="flex items-center gap-2">
                Explore All Resources <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input 
              className="pl-10" 
              placeholder="Search for resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Select category" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
              <div className="relative h-48 overflow-hidden bg-gray-100">
                <img
                  src={resource.imageSrc}
                  alt={resource.title}
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                />
                
                {resource.isFeatured && (
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-green-500 text-white flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Verified</span>
                    </Badge>
                  </div>
                )}
                
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="bg-white/90 text-gray-800">
                    {resource.category}
                  </Badge>
                </div>
              </div>
              
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg line-clamp-1">{resource.title}</CardTitle>
                </div>
                {resource.verified && (
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-xs text-green-500 font-medium">Verified Professional</span>
                  </div>
                )}
                <CardDescription className="line-clamp-2 mt-1">{resource.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="pb-2 flex-grow">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">By: {resource.author}</span>
                  <span className="text-gray-600">{resource.ageRange}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <Download className="h-3.5 w-3.5 mr-1" />
                  <span>{resource.downloadCount} downloads</span>
                </div>
              </CardContent>
              
              <CardFooter className="pt-2 flex justify-between items-center border-t">
                <div className="font-semibold text-primary text-lg">{resource.price}</div>
                <Button asChild size="sm">
                  <Link href={`/curriculum/${resource.id}`}>View Details</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="mt-10 bg-primary/10 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-3 text-black">Share Your Expertise</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Are you a dance educator with valuable teaching materials? Join our community and sell your curriculum resources to dance teachers worldwide.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild variant="default" size="lg">
              <Link href="/curriculum">Browse Resources</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/subscription">Become a Seller</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}