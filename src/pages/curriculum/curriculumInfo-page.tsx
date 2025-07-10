// // // app/curriculum/[id]/page.tsx
// // "use client"
// // import { useEffect, useState } from "react"
// // import { useParams } from "next/navigation"
// // import { api } from "@/lib/api"
// // import { Button } from "@/components/ui/button"
// // import { number } from "zod"

// // type CurriculumInfoPageProps = {
// //   resourceId?: number;
// // };
// // export default function CurriculumInfoPage({ resourceId }: CurriculumInfoPageProps) {
// //   return (
// //     <div className="max-w-4xl mx-auto px-4 py-8">
// //       <h1>Resource ID is {resourceId}</h1>
// //     </div>
// //   );
// // }



// "use client"

// import { useEffect, useState } from "react"
// import { useParams } from "next/navigation"
// import { api } from "@/lib/api"
// import { Loader2 } from "lucide-react"

// type Course = {
//   id: number
//   name: string
//   description: string
//   // Add other fields as needed
// }

// export default function CurriculumInfoPage() {
//   const params = useParams()
//   const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined

//   const [course, setCourse] = useState<Course | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState("")

//   useEffect(() => {
//     if (!id) return

//     const fetchCourse = async () => {
//       try {
//         const response = await api.get(`/courses/${id}`)
//         setCourse(response.data)
//       } catch (err) {
//         console.error("Failed to fetch course:", err)
//         setError("Failed to load course details.")
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchCourse()
//   }, [id])

//   if (!id) {
//     return <p className="text-center text-gray-500 py-8">Invalid course ID.</p>
//   }

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center min-h-[60vh]">
//         <Loader2 className="w-6 h-6 animate-spin text-primary" />
//       </div>
//     )
//   }

//   if (error) {
//     return (
//       <div className="text-center text-red-600 py-8">
//         <p>{error}</p>
//       </div>
//     )
//   }

//   if (!course) {
//     return (
//       <div className="text-center text-gray-600 py-8">
//         <p>Course not found.</p>
//       </div>
//     )
//   }

//   return (
//     <div className="max-w-4xl mx-auto px-6 py-10">
//       <h1 className="text-3xl font-bold mb-4">{course.name}</h1>
//       <p className="text-gray-700">{course.description}</p>
//       {/* Add more details like instructor, price, etc. here */}
//     </div>
//   )
// }


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
