

import { notFound } from "next/navigation"
import { Loader2 } from "lucide-react"

type Props = {
  params: {
    id: string
  }
}

type Resource = {
  id: number
  name: string
  description: string
}

export default async function CurriculumInfoPage({ params }: Props) {
  const id = params.id

  // Validate the ID
  if (!id || isNaN(Number(id))) {
    notFound()
  }

  let resource: Resource | null = null

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/resources/${id}`, {
      next: { revalidate: 60 }, // ISR caching if needed
    })

    if (!res.ok) throw new Error("Failed to fetch")

    resource = await res.json()
  } catch (error) {
    console.error("Error fetching resource:", error)
    notFound()
  }

  if (!resource) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-4">{resource.name}</h1>
      <p className="text-gray-700">{resource.description}</p>
    </div>
  )
}
