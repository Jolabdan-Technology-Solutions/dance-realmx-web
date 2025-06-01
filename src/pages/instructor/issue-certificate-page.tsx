import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

// Define TypeScript interfaces for better type safety
interface Student {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_image_url?: string;
}

interface Course {
  id: number;
  title: string;
  instructorId: number;
}

interface CertificateTemplate {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
}

interface CertificateFormData {
  studentId: string;
  courseId: string;
  templateId: string;
  expiryDate: string;
  notes: string;
}

export default function IssueCertificatePage() {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<CertificateFormData>({
    studentId: "",
    courseId: "",
    templateId: "",
    expiryDate: "",
    notes: ""
  });
  
  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/instructor/students"],
    retry: 2,
  });
  
  const { data: courses, isLoading: isLoadingCourses } = useQuery<Course[]>({
    queryKey: ["/api/instructor/courses"],
    retry: 2,
  });
  
  const { data: templates, isLoading: isLoadingTemplates } = useQuery<CertificateTemplate[]>({
    queryKey: ["/api/certificate-templates"],
    retry: 2,
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/instructor/certificates/issue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to issue certificate");
      }
      
      const data = await response.json();
      
      toast({
        title: "Certificate Issued",
        description: "The certificate has been successfully issued.",
      });
      
      // Redirect back to certificates list
      window.location.href = "/instructor/certificates";
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-6">
        <Button 
          variant="outline" 
          className="flex items-center gap-2 mb-4"
          onClick={() => window.location.href = "/instructor/certificates"}
        >
          <ArrowLeft size={16} />
          Back to Certificates
        </Button>
        <h1 className="text-3xl font-bold text-white">Issue New Certificate</h1>
        <p className="text-gray-400">Create and issue a new certificate for a student</p>
      </div>
      
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Certificate Details</CardTitle>
          <CardDescription className="text-gray-400">
            Fill out the information to issue a certificate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="studentId" className="text-white">Student</Label>
                {isLoadingStudents ? (
                  <div className="flex items-center space-x-2 h-10 px-3 py-2 text-sm bg-gray-800 border-gray-700 text-white rounded-md">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Loading students...</span>
                  </div>
                ) : (
                  <Select 
                    value={formData.studentId} 
                    onValueChange={(value) => handleSelectChange("studentId", value)}
                    required
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      {students && students.length > 0 ? (
                        students.map(student => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.first_name} {student.last_name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-students">No students available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="courseId" className="text-white">Course</Label>
                {isLoadingCourses ? (
                  <div className="flex items-center space-x-2 h-10 px-3 py-2 text-sm bg-gray-800 border-gray-700 text-white rounded-md">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Loading courses...</span>
                  </div>
                ) : (
                  <Select 
                    value={formData.courseId} 
                    onValueChange={(value) => handleSelectChange("courseId", value)}
                    required
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      {courses && courses.length > 0 ? (
                        courses.map(course => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.title}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-courses">No courses available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="templateId" className="text-white">Certificate Template</Label>
                {isLoadingTemplates ? (
                  <div className="flex items-center space-x-2 h-10 px-3 py-2 text-sm bg-gray-800 border-gray-700 text-white rounded-md">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Loading templates...</span>
                  </div>
                ) : (
                  <Select 
                    value={formData.templateId} 
                    onValueChange={(value) => handleSelectChange("templateId", value)}
                    required
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      {templates && templates.length > 0 ? (
                        templates.map(template => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-templates">No templates available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expiryDate" className="text-white">Expiry Date (Optional)</Label>
                <Input
                  type="date"
                  id="expiryDate"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-white">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Add any additional information or comments about this certificate"
                className="bg-gray-800 border-gray-700 text-white h-32"
              />
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                className="flex items-center gap-2"
              >
                <Save size={16} />
                Issue Certificate
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}