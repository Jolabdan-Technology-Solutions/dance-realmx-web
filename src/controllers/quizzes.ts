import { Request, Response } from "express";
import { prisma } from "@/lib/prisma";

// GET /courses/:courseId/quizzes
export async function getQuizzesForCourse(req: Request, res: Response) {
  const courseId = parseInt(req.params.courseId, 10);
  if (isNaN(courseId)) {
    return res.status(400).json({ message: "Invalid course ID" });
  }
  try {
    // Find all modules for the course, including lessons and quizzes
    const modules = await prisma.module.findMany({
      where: { course_id: courseId },
      include: {
        lessons: {
          include: {
            quizzes: {
              include: {
                questions: {
                  include: {
                    options: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Flatten quizzes and attach lesson/module info
    const quizzesWithContext = [];
    for (const module of modules) {
      for (const lesson of module.lessons) {
        for (const quiz of lesson.quizzes) {
          quizzesWithContext.push({
            quiz,
            lesson: {
              id: lesson.id,
              title: lesson.title,
              order: lesson.order,
            },
            module: {
              id: module.id,
              title: module.title,
              order: module.order,
            },
          });
        }
      }
    }

    return res.json({ quizzes: quizzesWithContext });
  } catch (error) {
    console.error("Error fetching quizzes for course:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch quizzes for course" });
  }
}
