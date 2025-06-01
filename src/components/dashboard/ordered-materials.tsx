import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function OrderedMaterials() {
  const { data: resourceOrders = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/resource-orders"],
  });

  if (isLoading) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">Ordered Materials</h2>
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-6 text-center">Ordered Materials</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resourceOrders.length > 0 ? (
          resourceOrders.map(order => (
            <div key={order.id} className="bg-white text-black rounded-lg shadow-lg overflow-hidden">
              <img 
                src={order.resource?.imageUrl || "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=250&q=80"} 
                alt={order.resource?.title || "Resource Image"} 
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-bold mb-2">{order.resource?.title || "Resource Title"}</h3>
                <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                  {order.resource?.description || "No description available."}
                </p>
                <Button 
                  className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full" 
                  asChild
                >
                  <a 
                    href={order.resource?.filePath} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Download
                  </a>
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center">
            <p className="text-red-500">You have not ordered any materials yet.</p>
            <Button 
              className="mt-4 bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full" 
              asChild
            >
              <Link href="/resources">Browse Resources</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
