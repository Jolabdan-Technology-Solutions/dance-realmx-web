// app/curriculum/[id]/page.tsx
"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"

export default function ResourceDetailsPage() {
  const { id } = useParams()
  const [resource, setResource] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResource = async () => {
      try {
        const res = await api.get(`/api/resources/${id}`)
        setResource(res.data)
      } catch (err) {
        console.error("Failed to fetch resource:", err)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchResource()
  }, [id])

  if (loading) return <p className="text-center py-10">Loading...</p>
  if (!resource) return <p className="text-center py-10">Resource not found.</p>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="relative aspect-video mb-6">
        <img
          src={resource.thumbnailUrl || resource.imageUrl || "/placeholder.svg?height=300&width=400"}
          alt={resource.title}
          className="w-full h-full object-cover rounded-md"
        />
      </div>
      <h1 className="text-3xl font-bold mb-4">{resource.title}</h1>
      <p className="text-gray-600 mb-6">{resource.description}</p>

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 mb-6">
        <div>
          <strong>Style:</strong> {resource.danceStyle || resource.category}
        </div>
        <div>
          <strong>Age:</strong> {resource.ageRange || "All Ages"}
        </div>
        <div>
          <strong>Level:</strong> {resource.difficultyLevel || "Any Level"}
        </div>
        <div>
          <strong>Price:</strong> {resource.price === "0" || resource.price === 0 ? "Free" : `$${resource.price}`}
        </div>
      </div>

      <Button>Add to Cart</Button>
    </div>
  )
}
