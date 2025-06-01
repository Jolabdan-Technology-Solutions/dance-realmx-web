import { useState } from "react";
import { Link } from "wouter";
import { 
  Calendar, 
  MapPin, 
  ArrowRight, 
  CheckCircle,
  Clock
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const instructors = [
  {
    id: 1,
    name: "Marcus Thompson",
    specialty: "Hip-Hop, Urban Dance",
    description: "Award-winning dancer and choreographer with 15+ years teaching experience. Specializes in urban dance styles and innovative choreography.",
    imageSrc: "/assets/images/instructors/profile image.png",
    location: "New York, NY",
    featured: true,
    price: "$75/hour",
    available: true,
    expertise: ["Hip-Hop", "Breaking", "Popping", "Locking", "House"],
    nextAvailable: "Tomorrow"
  },
  {
    id: 2,
    name: "Emma Davis",
    specialty: "Ballet, Contemporary",
    description: "Former principal dancer with extensive teaching experience in both classical ballet and contemporary techniques. Focuses on proper technique and expressive movement.",
    imageSrc: "/assets/images/instructors/profile image.png",
    location: "Chicago, IL",
    featured: true,
    price: "$85/hour",
    available: true,
    expertise: ["Ballet", "Contemporary", "Pointe", "Partnering"],
    nextAvailable: "Thursday"
  },
  {
    id: 3,
    name: "Alicia Wong",
    specialty: "Jazz, Musical Theatre",
    description: "Broadway performer and certified dance educator with a passion for jazz and musical theatre. Brings performance quality and industry expertise to every lesson.",
    imageSrc: "/assets/images/instructors/profile image.png",
    location: "Los Angeles, CA",
    featured: true,
    price: "$70/hour",
    available: true,
    expertise: ["Jazz", "Tap", "Musical Theatre", "Lyrical"],
    nextAvailable: "Today"
  }
];

export default function ConnectShowcase() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  
  const categories = ["All", "Ballet", "Contemporary", "Hip-Hop", "Jazz", "Tap", "Ballroom"];
  
  const filteredInstructors = activeCategory === "All" 
    ? instructors 
    : instructors.filter(instructor => 
        instructor.expertise.some(exp => exp === activeCategory)
      );

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary" />
              Connect with Instructors
            </h2>
            <p className="text-gray-600 mt-2 max-w-2xl">
              Book private lessons, workshops, and consultations with top dance professionals. Find the perfect instructor for your specific goals and skill level.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button asChild>
              <Link href="/connect" className="flex items-center gap-2">
                Find More Instructors <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-8 justify-center md:justify-start">
          {categories.map(category => (
            <Badge 
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              className={`cursor-pointer text-sm px-4 py-2 ${
                activeCategory === category 
                  ? "bg-primary text-white" 
                  : "hover:bg-primary/10"
              }`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInstructors.map((instructor) => (
            <Card key={instructor.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="relative">
                <CardHeader className="pt-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary">
                      <AvatarImage src={instructor.imageSrc} alt={instructor.name} />
                      <AvatarFallback>{instructor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl">{instructor.name}</CardTitle>
                      <CardDescription>{instructor.specialty}</CardDescription>
                      <div className="flex items-center mt-1 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-gray-500 mr-1" />
                        <span className="text-gray-500">{instructor.location}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/90 px-2 py-1 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-sm text-green-500">Verified Professional</span>
                </div>
              </div>
              
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {instructor.description}
                </p>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {instructor.expertise.slice(0, 3).map((skill, i) => (
                    <Badge key={i} variant="outline" className="bg-gray-50">
                      {skill}
                    </Badge>
                  ))}
                  {instructor.expertise.length > 3 && (
                    <Badge variant="outline" className="bg-gray-50">
                      +{instructor.expertise.length - 3} more
                    </Badge>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Available {instructor.nextAvailable}</span>
                  </div>
                  <div className="font-semibold text-primary">{instructor.price}</div>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" asChild className="flex-1">
                  <Link href={`/instructor-profile/${instructor.id}`}>View Profile</Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link href={`/book/${instructor.id}`}>Book Now</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="mt-10 text-center">
          <Button asChild variant="outline" size="lg" className="mx-auto">
            <Link href="/connect" className="flex items-center gap-2">
              Explore All Instructors <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <p className="text-sm text-gray-500 mt-2">
            Join as an instructor to offer your teaching services
          </p>
        </div>
      </div>
    </section>
  );
}