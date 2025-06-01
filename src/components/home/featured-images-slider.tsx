import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Eye, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { ResourceDetailsModal } from "@/components/curriculum/resource-details-modal";

interface FeaturedResource {
  id: number;
  src: string;
  alt: string;
  title?: string;
  price?: string;
  description?: string;
  resourceId?: number;
  link?: string;
  previewVideoUrl?: string;
  fullVideoUrl?: string;
}

interface FeaturedImagesSliderProps {
  images: FeaturedResource[];
  autoSlide?: boolean;
  autoSlideInterval?: number;
}

export default function FeaturedImagesSlider({
  images,
  autoSlide = true,
  autoSlideInterval = 5000,
}: FeaturedImagesSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedResource, setSelectedResource] = useState<FeaturedResource | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();
  const { toast } = useToast();
  
  // Calculate how many slides we need based on showing 3 images per slide
  const imagesPerSlide = 3;
  const totalSlides = Math.ceil(images.length / imagesPerSlide);
  
  // Group images in sets of 3
  const imageGroups = Array.from({ length: totalSlides }, (_, i) => 
    images.slice(i * imagesPerSlide, (i + 1) * imagesPerSlide)
  );

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  useEffect(() => {
    if (!autoSlide) return;
    
    const slideInterval = setInterval(nextSlide, autoSlideInterval);
    return () => clearInterval(slideInterval);
  }, [autoSlide, autoSlideInterval]);

  const handleAddToCart = (resource: FeaturedResource) => {
    // Extract resource ID from the link if available
    const resourceId = resource.id;
    const title = resource.title || resource.alt;
    const price = resource.price || "0";
    
    addItem({
      id: resourceId,
      title,
      price,
      itemType: "resource",
      itemId: resourceId,
      quantity: 1,
      imageUrl: resource.src
    });

    toast({
      title: "Added to cart",
      description: `${title} has been added to your cart.`,
    });
  };

  // Open resource details modal
  const handleViewDetails = (resource: FeaturedResource) => {
    setSelectedResource(resource);
    setIsModalOpen(true);
  };

  // Function to extract resource ID from link
  const getResourceIdFromLink = (link: string | undefined): number => {
    if (!link) return 0;
    
    // Try to extract ID from URL pattern like "/curriculum/123" or "/curriculum?category=123"
    const matches = link.match(/\/curriculum\/(\d+)/) || link.match(/category=(\w+)/);
    if (matches && matches[1]) {
      return isNaN(Number(matches[1])) ? 0 : Number(matches[1]);
    }
    return 0;
  };

  return (
    <>
      <div className="relative overflow-hidden">
        {/* Main slider container */}
        <div className="relative overflow-hidden">
          {/* Slider wrapper with transition */}
          <div 
            ref={sliderRef}
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {/* Each slide container */}
            {imageGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="w-full flex-shrink-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Images in each slide - stacked on mobile, 3 per row on larger screens */}
                  {group.map((resource) => (
                    <div 
                      key={resource.id} 
                      className="w-full sm:w-1/2 md:w-1/3 px-2 mb-4 sm:mb-0" // Full width on mobile, 1/2 on small screens, 1/3 on medium and up
                    >
                      <div className="h-auto sm:h-[450px] bg-gray-800 rounded-lg overflow-hidden flex flex-col">
                        <div className="h-[200px] sm:h-[280px] overflow-hidden">
                          <img
                            src={resource.src}
                            alt={resource.alt}
                            className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://placehold.co/600x400/00d4ff/000000?text=Dance+Resource';
                            }}
                          />
                        </div>
                        <div className="p-4 flex flex-col flex-grow">
                          <h3 className="font-bold text-white text-lg mb-1 truncate">{resource.title || resource.alt}</h3>
                          <p className="text-gray-300 text-sm mb-2 line-clamp-2">{resource.alt}</p>
                          
                          <div className="mt-auto">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-[#00d4ff] font-bold">
                                {resource.price ? `$${resource.price}` : 'Free'}
                              </span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button 
                                size="sm" 
                                className="w-full sm:flex-1 bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 mb-2 sm:mb-0"
                                onClick={() => handleViewDetails(resource)}
                              >
                                <Eye className="h-4 w-4 mr-1" /> View Details
                              </Button>
                              <Button 
                                size="sm" 
                                className="w-full sm:flex-1 bg-black hover:bg-gray-900 text-white"
                                onClick={() => handleAddToCart(resource)}
                              >
                                <ShoppingCart className="h-4 w-4 mr-1" /> Add to Cart
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add empty placeholders if the last group has fewer than 3 images */}
                  {group.length < imagesPerSlide && 
                    Array.from({ length: imagesPerSlide - group.length }, (_, i) => (
                      <div key={`empty-${i}`} className="hidden sm:block sm:w-1/2 md:w-1/3 px-2">
                        <div className="h-[450px] bg-gray-800 rounded-lg"></div>
                      </div>
                    ))
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Navigation controls */}
        {totalSlides > 1 && (
          <>
            <Button 
              onClick={prevSlide}
              size="icon"
              variant="ghost"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/40 hover:bg-black/60 text-white z-10"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            
            <Button 
              onClick={nextSlide}
              size="icon"
              variant="ghost"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/40 hover:bg-black/60 text-white z-10"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
            
            {/* Slide indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
              {imageGroups.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    idx === currentSlide ? "bg-white" : "bg-white/50"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Resource Details Modal */}
      {selectedResource && (
        <ResourceDetailsModal
          resource={{
            id: selectedResource.id,
            title: selectedResource.title || selectedResource.alt,
            description: selectedResource.description || selectedResource.alt,
            price: selectedResource.price || "0",
            imageUrl: selectedResource.src,
            previewVideoUrl: selectedResource.previewVideoUrl || null,
            fullVideoUrl: selectedResource.fullVideoUrl || null,
            createdAt: new Date().toISOString()
          }}
          resourceId={selectedResource.id}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onAddToCart={() => handleAddToCart(selectedResource)}
        />
      )}
    </>
  );
}