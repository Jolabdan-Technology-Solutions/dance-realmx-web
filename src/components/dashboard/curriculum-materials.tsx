import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Book, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Displays a user's ordered curriculum materials.
 * Component is renamed from OrderedMaterials to CurriculumMaterials for
 * consistency with the "Curriculum" naming convention.
 */
export default function CurriculumMaterials() {
  const { data: resourceOrders = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/resource-orders"],
  });

  const { data: resources = [] } = useQuery<any[]>({
    queryKey: ["/api/curriculum"],
    enabled: resourceOrders.length > 0,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
      </div>
    );
  }

  if (resourceOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Book className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">No Curriculum Materials Yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Browse our collection of dance curriculum resources created by professional dance educators.
        </p>
        <Button asChild>
          <Link href="/curriculum">Shop Curriculum</Link>
        </Button>
      </div>
    );
  }

  // Get the resource details for each order
  const ordersWithDetails = resourceOrders.map(order => {
    const resource = resources.find(r => r.id === order.resourceId) || {};
    return {
      ...order,
      resource
    };
  });

  return (
    <div className="flex flex-wrap -mx-4">
      {ordersWithDetails.map((order) => (
        <div key={order.id} className="w-full px-4 mb-8 sm:w-1/2 lg:w-1/3">
          <Card className="overflow-hidden flex flex-col h-full w-full">
            {order.resource.imageUrl ? (
              <div className="h-48 bg-muted">
                <img
                  src={order.resource.imageUrl}
                  alt={order.resource.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-48 bg-muted flex items-center justify-center">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <CardTitle className="line-clamp-1">{order.resource.title || "Untitled Resource"}</CardTitle>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {order.status === "completed" ? "Purchased" : "Processing"}
              </Badge>
            </div>
            <CardDescription>
              Ordered on {new Date(order.orderedAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pb-2 flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {order.resource.description || "No description available"}
            </p>
          </CardContent>
          
          <CardFooter className="pt-2 border-t">
            <div className="flex justify-between w-full items-center">
              <span className="font-medium">{order.price || order.resource.price || "Free"}</span>
              <Button 
                size="sm" 
                className="flex items-center gap-1"
                disabled={!order.isDownloadable}
                asChild={order.isDownloadable}
              >
                {order.isDownloadable ? (
                  <Link href={`/curriculum/${order.resourceId}`}>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Link>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
          </Card>
        </div>
      ))}
    </div>
  );
}