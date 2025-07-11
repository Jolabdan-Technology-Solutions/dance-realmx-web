import { useEffect, useState } from "react"
import { useParams } from "wouter"

type Course = {
  id: number
  title: string
  description: string
  price: number
  thumbnail_url: string
  difficulty_level: string
  category: string
  instructor_id: number
  dance_style?: string
  age_range?: string
  created_at: string
  updated_at: string
}

type Instructor = {
  id: number
  username: string
  first_name: string
  last_name: string
  profile_image_url: string
  role: string[]
  bio?: string
  experience?: string
  specialties?: string[]
}

type FilterState = {
  selectedStyle: string | null
  selectedAge: string | null
  selectedPriceRange: string | null
  selectedDifficulty: string | null
}

export default function InstructorCoursesPage() {
  // Get instructor ID from URL params
  const params = useParams()
  const instructorId = params.instructorId
  
  console.log('Instructor ID from URL:', instructorId)
  
  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coursesError, setCoursesError] = useState<string | null>(null)
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    selectedStyle: null,
    selectedAge: null,
    selectedPriceRange: null,
    selectedDifficulty: null
  })

  // Filter options
  const danceStyles = [
    'All',
    'Ballet',
    'Contemporary', 
    'Hip Hop',
    'Jazz',
    'Lyrical',
    'Preschool',
    'Tap',
    'Adaptive Dance',
    'Ballroom'
  ]

  const ageRanges = [
    'All Ages',
    '3-5 years',
    '6-8 years', 
    '9-12 years',
    '13-17 years',
    '18+ years',
    'Adult'
  ]

  const priceRanges = [
    'All Prices',
    'Free',
    '$1 - $25',
    '$26 - $50',
    '$51 - $100',
    '$100+'
  ]

  const difficultyLevels = [
    'All Levels',
    'Beginner',
    'Intermediate',
    'Advanced',
    'Professional'
  ]

  // Filter functions
  const applyFilters = (courses: Course[]) => {
    let filtered = [...courses]

    // Style filter
    if (filters.selectedStyle && filters.selectedStyle !== 'All') {
      filtered = filtered.filter(course => 
        course.dance_style?.toLowerCase().includes(filters.selectedStyle!.toLowerCase()) ||
        course.title.toLowerCase().includes(filters.selectedStyle!.toLowerCase()) ||
        course.description.toLowerCase().includes(filters.selectedStyle!.toLowerCase())
      )
    }

    // Age filter
    if (filters.selectedAge && filters.selectedAge !== 'All Ages') {
      filtered = filtered.filter(course => 
        course.age_range?.includes(filters.selectedAge!) ||
        course.title.toLowerCase().includes(filters.selectedAge!.toLowerCase()) ||
        course.description.toLowerCase().includes(filters.selectedAge!.toLowerCase())
      )
    }

    // Price filter
    if (filters.selectedPriceRange && filters.selectedPriceRange !== 'All Prices') {
      filtered = filtered.filter(course => {
        const price = course.price
        switch (filters.selectedPriceRange) {
          case 'Free':
            return price === 0
          case '$1 - $25':
            return price > 0 && price <= 25
          case '$26 - $50':
            return price >= 26 && price <= 50
          case '$51 - $100':
            return price >= 51 && price <= 100
          case '$100+':
            return price > 100
          default:
            return true
        }
      })
    }

    // Difficulty filter
    if (filters.selectedDifficulty && filters.selectedDifficulty !== 'All Levels') {
      filtered = filtered.filter(course => 
        course.difficulty_level?.toLowerCase() === filters.selectedDifficulty!.toLowerCase()
      )
    }

    return filtered
  }

  // Apply filters whenever filters or courses change
  useEffect(() => {
    const filtered = applyFilters(allCourses)
    setFilteredCourses(filtered)
  }, [filters, allCourses])

  // Handle filter changes
  const handleStyleFilter = (style: string) => {
    setFilters(prev => ({
      ...prev,
      selectedStyle: style === 'All' ? null : style
    }))
  }

  const handleAgeFilter = (age: string) => {
    setFilters(prev => ({
      ...prev,
      selectedAge: age === 'All Ages' ? null : age
    }))
  }

  const handlePriceFilter = (priceRange: string) => {
    setFilters(prev => ({
      ...prev,
      selectedPriceRange: priceRange === 'All Prices' ? null : priceRange
    }))
  }

  const handleDifficultyFilter = (difficulty: string) => {
    setFilters(prev => ({
      ...prev,
      selectedDifficulty: difficulty === 'All Levels' ? null : difficulty
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      selectedStyle: null,
      selectedAge: null,
      selectedPriceRange: null,
      selectedDifficulty: null
    })
  }

  // Fetch instructor info
  useEffect(() => {
    if (!instructorId) {
      setError("No instructor ID provided")
      setLoading(false)
      return
    }

    const fetchInstructor = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log(`Fetching instructor from: https://api.livetestdomain.com/api/users/${instructorId}`)
        
        const res = await fetch(`https://api.livetestdomain.com/api/users/${instructorId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (!res.ok) {
          throw new Error(`Failed to fetch instructor: ${res.status} ${res.statusText}`)
        }
        
        const data = await res.json()
        console.log('Fetched instructor data:', data)
        setInstructor(data)
      } catch (error) {
        console.error("Error fetching instructor:", error)
        setError(error instanceof Error ? error.message : "Failed to load instructor")
      } finally {
        setLoading(false)
      }
    }

    fetchInstructor()
  }, [instructorId])

  // Fetch instructor's courses
  useEffect(() => {
    if (!instructorId) return

    const fetchInstructorCourses = async () => {
      try {
        setCoursesLoading(true)
        setCoursesError(null)
        
        console.log(`Fetching courses from: https://api.livetestdomain.com/api/courses/instructor/${instructorId}`)
        
        const res = await fetch(`https://api.livetestdomain.com/api/courses/instructor/${instructorId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (!res.ok) {
          throw new Error(`Failed to fetch courses: ${res.status} ${res.statusText}`)
        }
        
        const data = await res.json()
        console.log('Fetched instructor courses:', data)
        
        // Handle different response formats
        const coursesData = Array.isArray(data) ? data : data.results || data.courses || []
        setAllCourses(coursesData)
      } catch (error) {
        console.error("Error fetching instructor courses:", error)
        setCoursesError(error instanceof Error ? error.message : "Failed to load courses")
      } finally {
        setCoursesLoading(false)
      }
    }

    fetchInstructorCourses()
  }, [instructorId])

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement
    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+'
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-300 rounded-lg mb-6"></div>
          <div className="h-8 bg-gray-300 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold mb-2">Error Loading Instructor</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!instructor) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Instructor Not Found</h2>
          <p className="text-gray-500">The requested instructor could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {/* Instructor Header */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
              {instructor.profile_image_url ? (
                <img 
                  src={instructor.profile_image_url} 
                  alt={`${instructor.first_name} ${instructor.last_name}`}
                  className="w-24 h-24 rounded-full object-cover"
                  onError={handleImageError}
                />
              ) : (
                <span className="text-blue-600 font-semibold text-2xl">
                  {instructor.first_name[0]}{instructor.last_name[0]}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex-grow">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {instructor.first_name} {instructor.last_name}
            </h1>
            <p className="text-gray-600 mb-3">@{instructor.username}</p>
            
            {instructor.role && instructor.role.length > 0 && (
              <div className="flex gap-2 mb-4">
                {instructor.role.map((role, index) => (
                  <span
                    key={index}
                    className="inline-block px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full"
                  >
                    {role}
                  </span>
                ))}
              </div>
            )}
            
            {instructor.bio && (
              <p className="text-gray-700 mb-4 line-clamp-3">{instructor.bio}</p>
            )}
            
            {instructor.specialties && instructor.specialties.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Specialties:</h3>
                <div className="flex flex-wrap gap-2">
                  {instructor.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li><a href="/" className="hover:text-gray-700">Home</a></li>
          <li><span className="mx-2">/</span></li>
          <li><a href="/instructors" className="hover:text-gray-700">Instructors</a></li>
          <li><span className="mx-2">/</span></li>
          <li className="text-gray-900 font-medium">{instructor.first_name} {instructor.last_name}</li>
        </ol>
      </nav>

      {/* Sub Navigation & Filters */}
      {allCourses.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          {/* Dance Style Navigation */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-3">Browse by Dance Style</h3>
            <div className="flex flex-wrap gap-2">
              {danceStyles.map((style) => (
                <button
                  key={style}
                  onClick={() => handleStyleFilter(style)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    (style === 'All' && !filters.selectedStyle) || filters.selectedStyle === style
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="border-t pt-4">
            <div className="flex flex-wrap gap-4 items-center">
              <h3 className="text-md font-medium text-gray-900">Filter by:</h3>
              
              {/* Age Filter */}
              <div className="relative">
                <select
                  value={filters.selectedAge || 'All Ages'}
                  onChange={(e) => handleAgeFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {ageRanges.map((age) => (
                    <option key={age} value={age}>{age}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>

              {/* Price Filter */}
              <div className="relative">
                <select
                  value={filters.selectedPriceRange || 'All Prices'}
                  onChange={(e) => handlePriceFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {priceRanges.map((price) => (
                    <option key={price} value={price}>{price}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>

              {/* Difficulty Filter */}
              <div className="relative">
                <select
                  value={filters.selectedDifficulty || 'All Levels'}
                  onChange={(e) => handleDifficultyFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {difficultyLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>

              {/* Clear Filters */}
              {(filters.selectedStyle || filters.selectedAge || filters.selectedPriceRange || filters.selectedDifficulty) && (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                >
                  Clear All Filters
                </button>
              )}

              {/* Results Count */}
              <span className="text-sm text-gray-600 ml-auto">
                {filteredCourses.length} of {allCourses.length} courses
              </span>
            </div>

            {/* Active Filters Display */}
            {(filters.selectedStyle || filters.selectedAge || filters.selectedPriceRange || filters.selectedDifficulty) && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {filters.selectedStyle && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Style: {filters.selectedStyle}
                    <button
                      onClick={() => handleStyleFilter('All')}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.selectedAge && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Age: {filters.selectedAge}
                    <button
                      onClick={() => handleAgeFilter('All Ages')}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.selectedPriceRange && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Price: {filters.selectedPriceRange}
                    <button
                      onClick={() => handlePriceFilter('All Prices')}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.selectedDifficulty && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Level: {filters.selectedDifficulty}
                    <button
                      onClick={() => handleDifficultyFilter('All Levels')}
                      className="ml-2 text-orange-600 hover:text-orange-800"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Courses Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {instructor.first_name}'s Courses
        </h2>
        
        {coursesLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading courses...</span>
          </div>
        )}
        
        {coursesError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">Unable to load courses</p>
            <p className="text-sm text-yellow-600">{coursesError}</p>
          </div>
        )}
        
        {!coursesLoading && !coursesError && filteredCourses.length === 0 && allCourses.length > 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-700 mb-2">No courses match your filters</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters to see more courses.</p>
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
        
        {!coursesLoading && !coursesError && allCourses.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-700 mb-2">No courses available</h3>
            <p className="text-gray-500">This instructor hasn't published any courses yet.</p>
          </div>
        )}
        
        {!coursesLoading && filteredCourses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div key={course.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-200 relative">
                  {course.thumbnail_url ? (
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <span className="text-gray-400 text-sm">Course</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-green-600">
                      ${course.price}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {course.difficulty_level || 'Course'}
                    </span>
                  </div>
                  {(course.dance_style || course.age_range) && (
                    <div className="flex gap-1 mb-3">
                      {course.dance_style && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {course.dance_style}
                        </span>
                      )}
                      {course.age_range && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          {course.age_range}
                        </span>
                      )}
                    </div>
                  )}
                  <a
                    href={`/courses/${course.id}`}
                    className="w-full bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded hover:bg-blue-700 transition-colors block text-center"
                  >
                    View Course
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}