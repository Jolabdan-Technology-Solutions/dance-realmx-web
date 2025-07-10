// // // pages/curriculum/curriculum-info-wrapper.tsx
// // import { useParams } from "wouter";
// // import CurriculumInfoPage from "./curriculumInfo-page";

// // export default function CurriculumInfoPageWrapper() {
// //   const { resourceId } = useParams<{ resourceId: string }>();
// //   const parsedId = parseInt(resourceId || "0");

// //   return <CurriculumInfoPage resourceId={parsedId} />;
// // }


// // src/pages/curriculum/curriculum-info-page.tsx
// import { useParams } from "wouter";
// import { useEffect, useState } from "react";

// type Resource = {
//   id: number;
//   name: string;
//   description: string;
// };

// export default function CurriculumInfoPage() {
//   const { id } = useParams<{ id: string }>();
//   const [resource, setResource] = useState<Resource | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     if (!id) {
//       setError("Invalid ID");
//       return;
//     }

//     fetch(`/api/resources/${id}`)
//       .then((res) => {
//         if (!res.ok) throw new Error("Resource not found");
//         return res.json();
//       })
//       .then((data) => {
//         setResource(data);
//         setLoading(false);
//       })
//       .catch((err) => {
//         setError(err.message);
//         setLoading(false);
//       });
//   }, [id]);

//   if (loading) return <p className="p-8 text-center">Loading...</p>;
//   if (error) return <p className="p-8 text-center text-red-500">{error}</p>;
//   if (!resource) return null;

//   return (
//     <div className="max-w-4xl mx-auto px-4 py-8">
//       <h1 className="text-3xl font-bold mb-4">{resource.name}</h1>
//       <p className="text-gray-700">{resource.description}</p>
//     </div>
//   );
// }


import { useEffect, useState } from "react"
// Import useParams from wouter instead of next/navigation
import { useParams } from "wouter"

type Seller = {
  id: number
  username: string
  first_name: string
  last_name: string
  profile_image_url: string
  role: string[]
}

type Category = {
  id: number
  name: string
} | null

type Resource = {
  id: number
  title: string
  description: string
  price: number
  ageRange: string
  categoryId: number
  danceStyle: string
  difficultyLevel: string
  sellerId: number
  thumbnailUrl: string
  type: string
  url: string
  created_at: string
  updated_at: string
  seller: Seller
  category: Category
}

export default function CurriculumInfoPage() {
  // Use wouter's useParams and get resourceId (not id)
  const params = useParams()
  const resourceId = params.resourceId
  
  console.log('Wouter params:', params)
  console.log('Resource ID from wouter:', resourceId)
  
  const [resource, setResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!resourceId) {
      setError("No resource ID provided")
      setLoading(false)
      return
    }

    const fetchResource = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log(`Fetching resource from: https://api.livetestdomain.com/api/resources/${resourceId}`)
        
        const res = await fetch(`https://api.livetestdomain.com/api/resources/${resourceId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        console.log(`Response status: ${res.status}`)
        
        if (!res.ok) {
          const errorText = await res.text()
          console.error(`Error response body:`, errorText)
          throw new Error(`Failed to fetch resource: ${res.status} ${res.statusText}`)
        }
        
        const data = await res.json()
        console.log('Fetched resource data:', data)
        setResource(data)
      } catch (error) {
        console.error("Error fetching resource:", error)
        setError(error instanceof Error ? error.message : "An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchResource()
  }, [resourceId])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="w-full h-64 bg-gray-300 rounded-xl mb-6"></div>
          <div className="h-8 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded mb-4 w-3/4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold mb-2">Error Loading Resource</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => {
              setError(null)
              setLoading(true)
              // Force a re-fetch by updating resourceId state
              window.location.reload()
            }} 
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!resource) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Resource Not Found</h2>
          <p className="text-gray-500">The requested curriculum resource could not be found.</p>
        </div>
      </div>
    )
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement
    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+'
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Thumbnail Image */}
      <div className="relative mb-6">
        <img 
          src={resource.thumbnailUrl} 
          alt={resource.title}
          className="w-full h-64 object-cover rounded-xl shadow-lg"
          onError={handleImageError}
        />
      </div>

      {/* Title and Description */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-400 mb-3">{resource.title}</h1>
        <p className="text-gray-600 text-lg leading-relaxed">{resource.description}</p>
      </div>

      {/* Resource Details */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Resource Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">Price:</span>
              <span className="ml-2 text-green-600 font-semibold text-gray-800">${resource.price}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Age Range:</span>
              <span className="ml-2 text-gray-800">{resource.ageRange}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Dance Style:</span>
              <span className="ml-2 text-gray-800">{resource.danceStyle}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Difficulty:</span>
              <span className="ml-2 capitalize text-gray-800">{resource.difficultyLevel.toLowerCase()}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">Type:</span>
              <span className="ml-2 capitalize text-gray-800">{resource.type.toLowerCase()}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Category:</span>
              <span className="ml-2 text-gray-800">{resource.category?.name || `Category ${resource.categoryId}`}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Created:</span>
              <span className="ml-2 text-gray-800">{new Date(resource.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seller Information */}
      {resource.seller && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Instructor</h2>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              {resource.seller.profile_image_url ? (
                <img 
                  src={resource.seller.profile_image_url} 
                  alt={`${resource.seller.first_name} ${resource.seller.last_name}`}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <span className="text-blue-600 font-semibold text-lg">
                  {resource.seller.first_name[0]}{resource.seller.last_name[0]}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {resource.seller.first_name} {resource.seller.last_name}
              </h3>
              <p className="text-sm text-gray-500">@{resource.seller.username}</p>
              {resource.seller.role.includes('ADMIN') && (
                <button className="inline-block mt-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                  Admin
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      {/* <div className="flex justify-center">
        <a
          href={resource.url}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 shadow-lg hover:shadow-xl"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-4a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Watch Video
        </a>
      </div> */}
    </div>
  )
}