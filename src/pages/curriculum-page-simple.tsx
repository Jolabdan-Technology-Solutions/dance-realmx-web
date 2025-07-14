import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import Navbar from "../components/layout/navbar";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  ResourcePlaceholderGrid,
  ResourceErrorCard,
} from "../components/ui/resource-placeholder";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import { useCart } from "../hooks/use-cart";
import { useGuestCart } from "../hooks/use-guest-cart";
import { api } from "../lib/api";
import { ResourceDetailsModal } from "../components/curriculum/resource-details-modal";

// Filter options (could be fetched from API in real app)
const AGE_OPTIONS = ["Preschool", "5-7", "8-12", "13-18", "18+"];
const STYLE_OPTIONS = ["Ballet", "Hip Hop", "Contemporary", "Jazz", "Tap"];
const PRICE_OPTIONS = ["Free", "$0-10", "$10-20", "$20-30", "$30+"];
const FORMAT_OPTIONS = [
  "Video",
  "PDF",
  "Audio",
  "Interactive",
  "Lesson Plan",
  "Choreography",
];

export default function CurriculumPageSimple() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [resources, setResources] = useState<any[]>([]);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    age: "",
    style: "",
    price: "",
    format: "",
  });
  // Dropdown open state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  // All filters modal state
  const [showAllFilters, setShowAllFilters] = useState(false);

  // Cart logic
  let user = null;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch {}
  const authCart = useCart();
  const guestCart = useGuestCart();
  const addToAuthCart = (item: any) => authCart.addItem(item);
  const addToGuestCart = (item: any) => guestCart.addItem(item);
  const addToCart = (resource: any) => {
    if (user) {
      addToAuthCart(resource);
    } else {
      addToGuestCart(resource);
    }
  };

  // Fetch resources
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await api.get("/api/resources");
        setResources(response.data || []);
      } catch (error) {
        setError(true);
        toast({
          title: "Error",
          description: "Failed to load resources. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, [toast]);

  // Filtering logic
  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      !searchTerm ||
      resource.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAge = !filters.age || resource.ageRange === filters.age;
    const matchesStyle =
      !filters.style || resource.danceStyle === filters.style;
    // Price filter logic (mock, adjust as needed)
    let matchesPrice = true;
    if (filters.price) {
      if (filters.price === "Free")
        matchesPrice = resource.price === 0 || resource.price === "0";
      else if (filters.price === "$0-10")
        matchesPrice = resource.price > 0 && resource.price <= 10;
      else if (filters.price === "$10-20")
        matchesPrice = resource.price > 10 && resource.price <= 20;
      else if (filters.price === "$20-30")
        matchesPrice = resource.price > 20 && resource.price <= 30;
      else if (filters.price === "$30+") matchesPrice = resource.price > 30;
    }
    const matchesFormat = !filters.format || resource.format === filters.format;
    return (
      matchesSearch &&
      matchesAge &&
      matchesStyle &&
      matchesPrice &&
      matchesFormat
    );
  });

  // Dropdown close on outside click
  const dropdownRefs = {
    age: useRef<HTMLDivElement>(null),
    style: useRef<HTMLDivElement>(null),
    price: useRef<HTMLDivElement>(null),
    format: useRef<HTMLDivElement>(null),
  };
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      Object.entries(dropdownRefs).forEach(([key, ref]) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          if (openDropdown === key) setOpenDropdown(null);
        }
      });
    }
    if (openDropdown)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  // Remove filter
  const removeFilter = (key: keyof typeof filters) =>
    setFilters((prev) => ({ ...prev, [key]: "" }));

  // Dropdown render helper
  function renderDropdown(key: string, options: string[]) {
    return (
      <div
        ref={dropdownRefs[key as keyof typeof dropdownRefs]}
        className="relative inline-block"
      >
        <Button
          variant="outline"
          className={`rounded-full border-gray-600 text-white bg-black hover:bg-gray-800 ${filters[key as keyof typeof filters] ? "ring-2 ring-blue-400" : ""}`}
          onClick={() => setOpenDropdown(openDropdown === key ? null : key)}
        >
          {key.charAt(0).toUpperCase() + key.slice(1)}
        </Button>
        {openDropdown === key && (
          <div className="absolute z-30 mt-2 w-40 bg-gray-900 border border-gray-700 rounded shadow-lg">
            {options.map((option) => (
              <div
                key={option}
                className={`px-4 py-2 cursor-pointer hover:bg-gray-800 ${filters[key as keyof typeof filters] === option ? "bg-blue-700 text-white" : "text-gray-200"}`}
                onClick={() => {
                  setFilters((prev) => ({ ...prev, [key]: option }));
                  setOpenDropdown(null);
                }}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <Input
            type="text"
            placeholder="Search curriculum resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 text-white border-gray-700 placeholder-gray-400"
          />
        </div>
        {/* Filter Pills */}
        <div className="flex justify-between mb-4">
          {renderDropdown("age", AGE_OPTIONS)}
          {renderDropdown("style", STYLE_OPTIONS)}
          {renderDropdown("price", PRICE_OPTIONS)}
          {renderDropdown("format", FORMAT_OPTIONS)}
          <Button
            variant="outline"
            className="rounded-full border-gray-600 text-white bg-black hover:bg-gray-800"
            onClick={() => setShowAllFilters(true)}
          >
            All filters
          </Button>
        </div>
        {/* Active Filters as removable pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(filters).map(
            ([key, value]) =>
              value && (
                <span
                  key={key}
                  className="flex items-center bg-blue-700 text-white rounded-full px-3 py-1 text-sm"
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}: {value}
                  <button
                    className="ml-2 text-white hover:text-gray-300"
                    onClick={() => removeFilter(key as keyof typeof filters)}
                  >
                    ×
                  </button>
                </span>
              )
          )}
        </div>
        {/* Results Count and Sort */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <span className="text-lg font-semibold">
            {loading ? "Loading..." : `${filteredResources.length} results`}
          </span>
          <div className="flex items-center gap-2 mt-2 md:mt-0">
            <span className="text-sm">Sort by:</span>
            <select className="bg-black border border-gray-700 text-white rounded px-2 py-1">
              <option>Relevance</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>
        </div>
        {/* Resource Cards Grid */}
        {loading ? (
          <ResourcePlaceholderGrid />
        ) : error ? (
          <ResourceErrorCard
            message="Failed to load resources. Please try again later."
            retryFn={() => setError(false)}
          />
        ) : (
          <div className="grid gap-6">
            {filteredResources.map((resource) => (
              <Card
                key={resource.id}
                className="bg-gray-900 border border-gray-800 text-white flex flex-col md:flex-row"
              >
                <CardHeader className="p-0 relative">
                  <div className="relative  overflow-hidden bg-gray-800 h-60 lg:96">
                    <img
                      src={resource.thumbnailUrl || resource.imageUrl}
                      className="w-full h-full object-cover aspect-video"
                      alt={`thumbnail ${resource?.title}`}
                    />
                  </div>
                  {/* Sale badge example */}
                  {resource.salePrice && (
                    <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                      Sale
                    </span>
                  )}
                </CardHeader>

                <CardContent className="p-4 flex flex-col flex-grow">
                  <CardTitle
                    className="text-lg font-semibold mb-2 line-clamp-2 leading-tight"
                    onClick={() => navigate(`/curriculum/${resource.id}`)}
                  >
                    {resource.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    {/* Seller info and link */}
                    <span className="text-xs text-gray-400">by </span>
                    <a
                      href={resource.sellerUrl || "#"}
                      className="text-blue-400 hover:underline text-xs"
                    >
                      {resource.sellerName || "Seller"}
                    </a>
                  </div>
                  <p className="text-sm text-gray-300 mb-2 line-clamp-2 flex-grow">
                    {resource.description}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs mb-2">
                    <span className="bg-gray-800 px-2 py-1 rounded">
                      Age: {resource.ageRange || "All"}
                    </span>
                    <span className="bg-gray-800 px-2 py-1 rounded">
                      Style: {resource.danceStyle || "-"}
                    </span>
                  </div>
                  {/* Star rating placeholder */}
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-yellow-400">★</span>
                    <span className="text-xs">{resource.rating || "4.9"}</span>
                    <span className="text-xs text-gray-400">
                      ({resource.ratingCount || "8K"})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {resource.salePrice ? (
                      <>
                        <span className="text-xl font-bold text-red-400">
                          ${resource.salePrice}
                        </span>
                        <span className="text-sm line-through text-gray-500">
                          ${resource.price}
                        </span>
                      </>
                    ) : (
                      <span className="text-xl font-bold">
                        ${resource.price}
                      </span>
                    )}
                  </div>
                </CardContent>
                <div className="flex gap-2 items-center p-4 mt-auto">
                  <Button
                    onClick={() => addToCart(resource)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Add to cart
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-white"
                  >
                    Wish List
                  </Button>
                  <a
                    href={resource.sellerUrl || "#"}
                    className="text-xs text-blue-400 hover:underline ml-2"
                  >
                    More from this seller
                  </a>
                </div>
              </Card>
            ))}
          </div>
        )}
        {/* Resource Details Modal */}
        {selectedResource && (
          <ResourceDetailsModal
            resource={selectedResource}
            open={detailsModalOpen}
            onOpenChange={setDetailsModalOpen}
          />
        )}
        {/* All Filters Modal (placeholder) */}
        {showAllFilters && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 w-full max-w-lg relative">
              <button
                className="absolute top-2 right-2 text-white text-2xl"
                onClick={() => setShowAllFilters(false)}
              >
                ×
              </button>
              <h2 className="text-xl font-bold mb-4">All Filters</h2>
              {/* Place all filter dropdowns here for advanced filtering */}
              <div className="flex flex-col gap-4">
                {renderDropdown("age", AGE_OPTIONS)}
                {renderDropdown("style", STYLE_OPTIONS)}
                {renderDropdown("price", PRICE_OPTIONS)}
                {renderDropdown("format", FORMAT_OPTIONS)}
              </div>
              <Button
                className="mt-6 w-full bg-blue-700 hover:bg-blue-800"
                onClick={() => setShowAllFilters(false)}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
