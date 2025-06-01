import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { generateDanceImage, DANCE_IMAGE_PROMPTS } from "@/lib/image-generator";

export default function EventSection() {
  const [eventImage, setEventImage] = useState("/assets/images/7.png");
  
  useEffect(() => {
    const fetchImage = async () => {
      try {
        const imageUrl = await generateDanceImage(DANCE_IMAGE_PROMPTS.event);
        if (imageUrl) {
          setEventImage(imageUrl);
        }
      } catch (error) {
        console.error("Error loading event image:", error);
      }
    };
    
    fetchImage();
  }, []);
  
  return (
    <section className="py-16 bg-dark">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold">Dance Teachers Conference 2025</h2>
          <p className="text-xl mt-2">Explore the future of dance education at the most anticipated event for dance professionals.</p>
        </div>
        
        <div className="flex flex-col-reverse lg:flex-row items-center">
          <div className="lg:w-1/2 mt-8 lg:mt-0">
            <h3 className="text-2xl font-bold mb-2">Discover the Realm of Possibilities</h3>
            <h4 className="text-xl font-bold mb-4">Event Details</h4>
            <p className="text-lg mb-4">
              Calling all studio owners, dance teachers, and dance educators! Join us at the Dance Teachers Conference 2025 to connect, discuss, and discover endless possibilities. Learn from industry professionals and network with peers.
            </p>
            <p className="text-lg mb-6">
              <strong>Location:</strong> Meridian Convention Center, Greensboro, NC<br />
              <strong>Dates:</strong> July 29–31, 2025
            </p>
            <Button 
              className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full font-bold" 
              asChild
            >
              <Link href="/events/register">Register Now</Link>
            </Button>
          </div>
          <div className="lg:w-1/2 lg:pl-10 flex justify-center">
            <img 
              src={eventImage}
              alt="Dance Teachers Conference" 
              className="rounded-lg max-h-[500px] object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
