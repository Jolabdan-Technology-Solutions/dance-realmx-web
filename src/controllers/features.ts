import { Request, Response } from "express";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function getUserFeatures(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get user's subscription and roles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          include: { plan: true }
        },
        role_mappings: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get features from active subscription
    const subscriptionFeatures = user.subscriptions.flatMap(sub => 
      sub.plan.features
    );

    // Get features from user's roles
    const roleFeatures = user.role_mappings.flatMap(mapping => {
      const role = mapping.role as UserRole;
      return getFeaturesForRole(role);
    });

    // Combine and deduplicate features
    const allFeatures = [...new Set([...subscriptionFeatures, ...roleFeatures])];

    return res.json(allFeatures);
  } catch (error) {
    console.error("Error getting user features:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function checkFeatureAccess(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { featureKey } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get user's subscription and roles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          include: { plan: true }
        },
        role_mappings: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if feature is available in active subscription
    const hasSubscriptionAccess = user.subscriptions.some(sub => 
      sub.plan.features.includes(featureKey)
    );

    // Check if feature is available through user's roles
    const hasRoleAccess = user.role_mappings.some(mapping => {
      const role = mapping.role as UserRole;
      const roleFeatures = getFeaturesForRole(role);
      return roleFeatures.includes(featureKey);
    });

    const hasAccess = hasSubscriptionAccess || hasRoleAccess;

    return res.json({ hasAccess });
  } catch (error) {
    console.error("Error checking feature access:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Helper function to get features for a specific role
function getFeaturesForRole(role: UserRole): string[] {
  const roleFeatures: Record<UserRole, string[]> = {
    GUEST_USER: ["basic_profile", "view_courses"],
    STUDENT: ["basic_profile", "view_courses", "enroll_courses", "view_resources"],
    INSTRUCTOR: [
      "basic_profile",
      "view_courses",
      "create_courses",
      "manage_courses",
      "view_resources",
      "create_resources"
    ],
    CURRICULUM_SELLER: [
      "basic_profile",
      "view_courses",
      "create_courses",
      "manage_courses",
      "view_resources",
      "create_resources",
      "sell_resources"
    ],
    ADMIN: ["*"], // Admin has access to all features
    DIRECTORY_MEMBER: ["basic_profile", "view_courses", "view_resources", "directory_access"],
    CERTIFICATION_MANAGER: [
      "basic_profile",
      "view_courses",
      "manage_certifications",
      "issue_certificates"
    ],
    INSTRUCTOR_ADMIN: [
      "basic_profile",
      "view_courses",
      "create_courses",
      "manage_courses",
      "view_resources",
      "create_resources",
      "manage_instructors"
    ],
    CURRICULUM_ADMIN: [
      "basic_profile",
      "view_courses",
      "create_courses",
      "manage_courses",
      "view_resources",
      "create_resources",
      "manage_curriculum"
    ],
    COURSE_CREATOR_ADMIN: [
      "basic_profile",
      "view_courses",
      "create_courses",
      "manage_courses",
      "view_resources",
      "create_resources",
      "manage_course_creators"
    ],
    BOOKING_PROFESSIONAL: [
      "basic_profile",
      "view_courses",
      "manage_bookings",
      "view_resources"
    ],
    BOOKING_USER: [
      "basic_profile",
      "view_courses",
      "create_bookings",
      "view_resources"
    ]
  };

  return roleFeatures[role] || [];
} 