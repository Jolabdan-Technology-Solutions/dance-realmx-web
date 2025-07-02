import { Switch, Route } from "wouter";
import { Toaster } from "./components/ui/toaster";
import { ProtectedRoute } from "./lib/protected-route";
import { GuestRoute } from "./lib/guest-route";
import { AdminRoute } from "./lib/admin-route";
import { DashboardRedirect } from "./lib/dashboard-redirect";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import Layout from "./components/layout/layout";
import AdminLayout from "./components/layout/admin-layout";
import { AuthProvider } from "./hooks/use-auth";
import { GuestModeProvider } from "./hooks/use-guest-mode";
import { GuestCartProvider } from "./hooks/use-guest-cart";
import { CartProvider } from "./hooks/use-cart";
import instructorModulePage from "./pages/instructor/instructor-module-page";
// import

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

// Error fallback component for failed lazy loads

// Enhanced lazy loading with error handling
const createLazyComponent = (
  importFn: () => Promise<{ default: React.ComponentType<any> }>
) => {
  return lazy(async () => {
    try {
      const module = await importFn();
      return module;
    } catch (error) {
      console.error("Failed to load component:", error);
      // Return a fallback component instead of throwing
      return {
        default: () => (
          <div className="container mx-auto p-6">
            <div className="text-center text-red-500">
              <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
              <p>The requested page could not be loaded.</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-primary text-white rounded"
              >
                Refresh Page
              </button>
            </div>
          </div>
        ),
      };
    }
  });
};

// Lazy load pages for better performance
const HomePage = lazy(() => import("@/pages/home-page"));
const AboutPage = lazy(() => import("@/pages/about-page"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const RegistrationFlowPage = lazy(() => import("@/pages/registration-flow"));
const ProfileImageDebugPage = lazy(() => import("@/pages/profile-image-debug"));
const NotFound = createLazyComponent(() => import("./pages/not-found"));

// Course Certification Module
const CoursesPage = lazy(() => import("@/pages/courses/courses-page"));
const CourseDetailsPage = lazy(
  () => import("@/pages/courses/course-details-page")
);
const MyCertificationsPage = lazy(
  () => import("@/pages/my-certifications-page")
);

const MyCoursesPage = lazy(() => import("@/pages/courses/my-courses-page"));
const CourseModulePage = lazy(
  () => import("@/pages/courses/course-module-page")
);
const LessonPage = lazy(() => import("@/pages/lesson-page"));
const QuizPage = lazy(() => import("@/pages/quiz-page"));
const CertificatePage = lazy(() => import("@/pages/certificate-page"));
const CertificateTemplatesPage = lazy(
  () => import("@/pages/certificate-templates-page")
);
const CourseAdminDashboard = lazy(
  () => import("@/pages/courses/course-admin-dashboard")
);

// Connect - Booking Module
const ConnectPage = lazy(() => import("@/pages/connect-page"));
const ConnectPageNew = lazy(() => import("@/pages/connect-page-new"));
const ConnectPageUpdated = lazy(() => import("@/pages/connect-page-updated"));
const InstructorProfilePage = lazy(
  () => import("@/pages/instructor-profile-page")
);
const BookingPage = lazy(() => import("@/pages/booking-page"));
const MyBookingsPage = lazy(() => import("@/pages/my-bookings-page"));

// Curriculum Resource Module
const CurriculumPage = lazy(
  () => import("@/pages/curriculum/curriculum-page-simple")
);
// const CurriculumPageCombined = lazy(
//   // () => import("@/pages/curriculum/curriculum-page-combined")
// );
const ResourceDetailsPage = lazy(
  () => import("@/pages/curriculum/curriculum-details-page")
);
const EditResourcePage = lazy(() => import("@/pages/edit-resource-page"));
const MyResourcesPage = lazy(() => import("@/pages/my-resources-page"));
const UploadResourcePage = lazy(() => import("@/pages/upload-resource-page"));
const SimpleUploadResourcePage = lazy(
  () => import("@/pages/simple-upload-resource-page")
);
const SellerStorePage = lazy(() => import("@/pages/seller-store-page"));
const SellerDashboardPage = lazy(() => import("@/pages/seller-dashboard-page"));
const SellerPaymentsPage = lazy(() => import("@/pages/seller-payments-page"));
const CurriculumOfficerDashboard = lazy(
  () => import("@/pages/curriculum/curriculum-officer-dashboard")
);

// Subscription Module
const SubscriptionPage = createLazyComponent(
  () => import("./pages/subscription-page")
);
const SubscriptionSuccessPage = createLazyComponent(
  () => import("./pages/subscription-success-page")
);

// Shopping Cart and Checkout Module
const CartPage = createLazyComponent(() => import("./pages/cart-page"));
const CheckoutPage = createLazyComponent(
  () => import("./pages/checkout-page-new")
);
const StripeCheckoutPage = createLazyComponent(
  () => import("./pages/checkout/stripe")
);
const SimpleCheckoutPage = createLazyComponent(
  () => import("./pages/simple-checkout")
);
const PaymentSuccessPage = createLazyComponent(
  () => import("./pages/payment-success")
);
const MyPurchasesPage = createLazyComponent(
  () => import("./pages/my-purchases")
);

// Dashboard Pages
const DashboardPage = createLazyComponent(
  () => import("./pages/dashboard-page")
);
const MultiDashboardPage = createLazyComponent(
  () => import("./pages/multi-dashboard-page")
);
const ProfileEditPage = createLazyComponent(
  () => import("./pages/profile-edit-page")
);
const UserProfilePage = createLazyComponent(
  () => import("./pages/user-profile-page")
);

// Instructor Pages
const InstructorDashboardPage = createLazyComponent(
  () => import("./pages/instructor/instructor-dashboard-page")
);
const CourseCreatePage = createLazyComponent(
  () => import("./pages/instructor/course-create-page")
);
const CourseDetailPage = createLazyComponent(
  () => import("./pages/instructor/course-detail-page")
);
const InstructorStudentsPage = createLazyComponent(
  () => import("./pages/instructor/instructor-students-page")
);
const InstructorQuizzesPage = createLazyComponent(
  () => import("./pages/instructor/instructor-quizzes-page")
);
const InstructorCertificatesPage = createLazyComponent(
  () => import("./pages/instructor/instructor-certificates-page")
);
const IssueCertificatePage = createLazyComponent(
  () => import("./pages/instructor/issue-certificate-page")
);
const CourseEditPages = createLazyComponent(
  () => import("./components/form/Edit-course")
);
const getBooked = createLazyComponent(
  () => import("./pages/instructor/get-booked-page")
);

const bookProfessional = createLazyComponent(
  () => import("./pages/instructor/book-professional-page")
);

// Admin Pages
const AdminDashboardPage = createLazyComponent(
  () => import("./pages/admin/admin-dashboard-page")
);
const AdminCoursesPage = createLazyComponent(
  () => import("./pages/admin/admin-courses-page")
);
const AdminUsersPage = createLazyComponent(
  () => import("./pages/admin/admin-users-page")
);
const AdminUserEditPage = createLazyComponent(
  () => import("./pages/admin/admin-user-edit-page")
);
const AdminRolesPage = createLazyComponent(
  () => import("./pages/admin/admin-roles-page")
);
const AdminResourcesPage = createLazyComponent(
  () => import("./pages/admin/admin-resources-page")
);
const AdminSubscriptionsPage = createLazyComponent(
  () => import("./pages/admin/admin-subscriptions-page")
);
const AdminCouponsPage = createLazyComponent(
  () => import("./pages/admin/admin-coupons-page")
);
const AdminSettingsPage = createLazyComponent(
  () => import("./pages/admin/admin-settings-page")
);
const AdminCourseCategoriesPage = createLazyComponent(
  () => import("./pages/admin/admin-course-categories-page")
);
const AdminResourceCategoriesPage = createLazyComponent(
  () => import("./pages/admin/admin-resource-categories-page")
);
const AdminDanceStylesPage = createLazyComponent(
  () => import("./pages/admin/admin-dance-styles-page")
);
const AdminInstructorsPage = createLazyComponent(
  () => import("./pages/admin/admin-instructors-page")
);
const AdminBookingsPage = createLazyComponent(
  () => import("./pages/admin/admin-bookings-page")
);
const AdminMessagesPage = createLazyComponent(
  () => import("./pages/admin/admin-messages-page")
);
const AdminCertificatesPage = createLazyComponent(
  () => import("./pages/admin/admin-certificates-page")
);
const AdminSellersPage = createLazyComponent(
  () => import("./pages/admin/admin-sellers-page")
);
const AdminDeploymentPage = createLazyComponent(
  () => import("./pages/admin/admin-deployment-page")
);
const AdminDocumentationPage = createLazyComponent(
  () => import("./pages/admin/admin-documentation-page")
);

// Layout wrapper functions
const withLayout = (Component: React.ComponentType) => () => (
  <Layout>
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  </Layout>
);

const withAdminLayout = (Component: React.ComponentType) => () => (
  <AdminLayout>
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  </AdminLayout>
);

// Page components with layouts applied
const Pages = {
  // Public Pages
  Home: withLayout(HomePage),
  About: withLayout(AboutPage),
  Auth: withLayout(AuthPage),
  RegistrationFlow: withLayout(RegistrationFlowPage),
  ProfileImageDebug: withLayout(ProfileImageDebugPage),
  NotFound: withLayout(NotFound),

  // Course Certification Module
  Courses: withLayout(CoursesPage),
  CourseDetails: withLayout(CourseDetailsPage),
  MyCertifications: withLayout(MyCertificationsPage),
  MyCourses: withLayout(MyCoursesPage),
  CourseModule: withLayout(CourseModulePage),
  Lesson: withLayout(LessonPage),
  Quiz: withLayout(QuizPage),
  Certificate: withLayout(CertificatePage),
  CertificateTemplates: withLayout(CertificateTemplatesPage),

  // Connect - Booking Module
  Connect: withLayout(ConnectPage),
  ConnectNew: withLayout(ConnectPageNew),
  ConnectUpdated: withLayout(ConnectPageUpdated),
  InstructorProfile: withLayout(InstructorProfilePage),
  Booking: withLayout(BookingPage),
  MyBookings: withLayout(MyBookingsPage),

  // Curriculum Resource Module
  Curriculum: withLayout(CurriculumPage),
  // CurriculumCombined: withLayout(CurriculumPageCombined),
  ResourceDetails: withLayout(ResourceDetailsPage),
  EditResource: withLayout(EditResourcePage),
  MyResources: withLayout(MyResourcesPage),
  UploadResource: withLayout(UploadResourcePage),
  SimpleUploadResource: withLayout(SimpleUploadResourcePage),
  SellerStore: withLayout(SellerStorePage),
  SellerDashboard: withLayout(SellerDashboardPage),
  SellerPayments: withLayout(SellerPaymentsPage),

  // Subscription Module
  Subscription: withLayout(SubscriptionPage),
  SubscriptionSuccess: withLayout(SubscriptionSuccessPage),

  // Shopping Cart and Checkout Module
  Cart: withLayout(CartPage),
  Checkout: withLayout(CheckoutPage),
  StripeCheckout: withLayout(StripeCheckoutPage),
  SimpleCheckout: withLayout(SimpleCheckoutPage),
  PaymentSuccess: withLayout(PaymentSuccessPage),
  MyPurchases: withLayout(MyPurchasesPage),

  // Dashboard Pages
  Dashboard: withLayout(DashboardPage),
  MultiDashboard: withLayout(MultiDashboardPage),
  ProfileEdit: withLayout(ProfileEditPage),
  UserProfile: withLayout(UserProfilePage),

  // Instructor Pages
  bookProfessional: withLayout(bookProfessional),
  getBooked: withLayout(getBooked),
  InstructorDashboard: withLayout(InstructorDashboardPage),
  CourseCreate: withLayout(CourseCreatePage),
  CourseDetail: withLayout(CourseDetailPage),
  InstructorStudents: withLayout(InstructorStudentsPage),
  InstructorQuizzes: withLayout(InstructorQuizzesPage),
  InstructorCertificates: withLayout(InstructorCertificatesPage),
  IssueCertificate: withLayout(IssueCertificatePage),
  CourseEdit: withLayout(CourseEditPages),
  instructorModulePage: withLayout(instructorModulePage),

  // Admin Pages
  AdminDashboard: withAdminLayout(AdminDashboardPage),
  AdminCourses: withAdminLayout(AdminCoursesPage),
  AdminUsers: withAdminLayout(AdminUsersPage),
  AdminUserEdit: withAdminLayout(AdminUserEditPage),
  AdminRoles: withAdminLayout(AdminRolesPage),
  AdminResources: withAdminLayout(AdminResourcesPage),
  AdminSubscriptions: withAdminLayout(AdminSubscriptionsPage),
  AdminCoupons: withAdminLayout(AdminCouponsPage),
  AdminSettings: withAdminLayout(AdminSettingsPage),
  AdminCourseCategories: withAdminLayout(AdminCourseCategoriesPage),
  AdminResourceCategories: withAdminLayout(AdminResourceCategoriesPage),
  AdminDanceStyles: withAdminLayout(AdminDanceStylesPage),
  AdminInstructors: withAdminLayout(AdminInstructorsPage),
  AdminBookings: withAdminLayout(AdminBookingsPage),
  AdminMessages: withAdminLayout(AdminMessagesPage),
  AdminCertificates: withAdminLayout(AdminCertificatesPage),
  AdminSellers: withAdminLayout(AdminSellersPage),
  AdminDeployment: withAdminLayout(AdminDeploymentPage),
  AdminDocumentation: withAdminLayout(AdminDocumentationPage),

  // Specialty Admin Dashboards
  CourseAdmin: withAdminLayout(CourseAdminDashboard),
  CurriculumOfficer: withAdminLayout(CurriculumOfficerDashboard),
};

function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={Pages.Home} />
        <Route path="/about" component={Pages.About} />
        <Route path="/auth" component={Pages.Auth} />
        <Route path="/register" component={Pages.RegistrationFlow} />

        {/* Course Certification Module */}
        <Route path="/courses" component={Pages.Courses} />
        <Route path="/courses/:id" component={Pages.CourseDetails} />

        {/* Redirect singular /course/:id to plural /courses/:id */}
        <Route path="/course/:id">
          {({ id }) => {
            window.location.href = `/courses/${id}`;
            return null;
          }}
        </Route>

        <ProtectedRoute
          path="/courses/:courseId/modules/:moduleId"
          component={Pages.CourseModule}
        />
        <ProtectedRoute
          path="/courses/:courseId/modules/:moduleId/lessons/:lessonId"
          component={Pages.Lesson}
        />
        <ProtectedRoute path="/lesson/:courseId" component={Pages.Lesson} />
        <ProtectedRoute
          path="/courses/:courseId/modules/:moduleId/quizzes/:quizId"
          component={Pages.Quiz}
        />
        <ProtectedRoute
          path="/my-certifications"
          component={Pages.MyCertifications}
        />
        <ProtectedRoute path="/my-courses" component={Pages.MyCourses} />
        <ProtectedRoute
          path="/certificate-templates"
          component={Pages.CertificateTemplates}
        />
        <ProtectedRoute
          path="/certificates"
          component={Pages.MyCertifications}
        />
        <ProtectedRoute
          path="/certificates/:certificateId"
          component={Pages.Certificate}
        />

        {/* Connect - Booking Module */}
        <Route path="/connect" component={Pages.ConnectNew} />
        <Route path="/connect-updated" component={Pages.ConnectUpdated} />
        <Route path="/connect-old" component={Pages.Connect} />
        <ProtectedRoute
          path="/connect/book/:instructorId"
          component={Pages.Booking}
        />
        <ProtectedRoute
          path="/connect/profile"
          component={Pages.InstructorProfile}
        />
        <Route
          path="/instructors/:instructorId"
          component={Pages.InstructorProfile}
        />
        <ProtectedRoute
          path="/instructors/:instructorId/book"
          component={Pages.Booking}
        />
        <ProtectedRoute path="/my-bookings" component={Pages.MyBookings} />

        {/* Curriculum Resource Module */}
        <GuestRoute path="/curriculum" component={Pages.Curriculum} />

        <GuestRoute
          path="/curriculum/:resourceId"
          component={Pages.ResourceDetails}
        />
        <GuestRoute path="/sellers/:sellerId" component={Pages.SellerStore} />
        <GuestRoute
          path="/seller-store/:sellerId"
          component={Pages.SellerStore}
        />
        <ProtectedRoute path="/my-store" component={Pages.SellerStore} />
        <ProtectedRoute path="/my-resources" component={Pages.MyResources} />
        <ProtectedRoute path="/seller" component={Pages.SellerDashboard} />
        <ProtectedRoute
          path="/seller/resources"
          component={Pages.MyResources}
        />
        <ProtectedRoute
          path="/seller/resources/add"
          component={Pages.SimpleUploadResource}
        />
        <ProtectedRoute
          path="/seller/upload-resource"
          component={Pages.SimpleUploadResource}
        />
        <ProtectedRoute
          path="/curriculum/upload"
          component={Pages.SimpleUploadResource}
        />
        <ProtectedRoute
          path="/upload-resource"
          component={Pages.SimpleUploadResource}
        />
        <ProtectedRoute
          path="/simple-upload"
          component={Pages.SimpleUploadResource}
        />
        <ProtectedRoute
          path="/curriculum/:id/edit"
          component={Pages.EditResource}
        />

        {/* Legacy routes for backward compatibility - redirect to /curriculum */}
        <Route path="/resources">
          {() => {
            window.location.href = "/curriculum";
            return null;
          }}
        </Route>
        <Route path="/resources/:resourceId">
          {({ resourceId }) => {
            window.location.href = `/curriculum/${resourceId}`;
            return null;
          }}
        </Route>
        <Route path="/resources/:id/edit">
          {({ id }) => {
            window.location.href = `/curriculum/${id}/edit`;
            return null;
          }}
        </Route>

        {/* Subscription Module */}
        <Route path="/subscription" component={Pages.Subscription} />
        <Route
          path="/subscription/success"
          component={Pages.SubscriptionSuccess}
        />

        {/* Redirect /pricing to /subscription */}
        <Route path="/pricing">
          {() => {
            window.location.href = "/subscription";
            return null;
          }}
        </Route>

        {/* Shopping Cart and Checkout Module */}
        <Route path="/cart" component={Pages.Cart} />
        <ProtectedRoute path="/checkout" component={Pages.Checkout} />
        <Route path="/checkout/stripe" component={Pages.StripeCheckout} />
        <Route path="/simple-checkout" component={Pages.SimpleCheckout} />
        <Route path="/payment-success" component={Pages.PaymentSuccess} />
        <ProtectedRoute path="/my-purchases" component={Pages.MyPurchases} />

        {/* Main dashboard entry route - will redirect based on user role */}
        <Route path="/my-dashboard" component={DashboardRedirect} />
        <Route path="/dashboard" component={DashboardRedirect} />

        {/* Role-specific dashboard routes */}
        <ProtectedRoute
          path="/multi-dashboard"
          component={Pages.MultiDashboard}
        />
        <ProtectedRoute path="/dashboard/user" component={Pages.Dashboard} />
        <ProtectedRoute
          path="/seller-dashboard"
          component={Pages.SellerDashboard}
        />
        <ProtectedRoute
          path="/seller/payments"
          component={Pages.SellerPayments}
        />
        <ProtectedRoute
          path="/seller/resources"
          component={Pages.MyResources}
        />
        <ProtectedRoute
          path="/seller/resources/create"
          component={Pages.SimpleUploadResource}
        />
        <ProtectedRoute path="/profile" component={Pages.ProfileEdit} />
        <ProtectedRoute path="/profile/edit" component={Pages.ProfileEdit} />
        <ProtectedRoute
          path="/profile-image-debug"
          component={Pages.ProfileImageDebug}
        />
        <Route path="/profile/:userId" component={Pages.UserProfile} />

        {/* Instructor Routes */}
        <ProtectedRoute
          path="/instructor/dashboard"
          component={Pages.InstructorDashboard}
        />
        <ProtectedRoute
          path="/instructor/courses/create"
          component={Pages.CourseCreate}
        />
        <ProtectedRoute
          path="/instructor/courses/:id"
          component={Pages.CourseDetail}
        />

        <ProtectedRoute
          path="/instructor/courses/:id/edit"
          component={Pages.CourseEdit}
        />
        <ProtectedRoute
          path="/instructor/students"
          component={Pages.InstructorStudents}
        />
        <ProtectedRoute
          path="/instructor/quizzes"
          component={Pages.InstructorQuizzes}
        />
        <ProtectedRoute
          path="/instructor/certificates"
          component={Pages.InstructorCertificates}
        />
        <ProtectedRoute
          path="/instructor/certificates/issue"
          component={Pages.IssueCertificate}
        />
        <ProtectedRoute
          path="/instructor/instructor-module-page"
          component={Pages.instructorModulePage}
        />

        {/* Admin Routes */}
        <AdminRoute path="/admin" component={Pages.AdminDashboard} />
        <AdminRoute path="/admin/dashboard" component={Pages.AdminDashboard} />
        <AdminRoute path="/admin/users" component={Pages.AdminUsers} />
        <AdminRoute path="/admin/users/:id" component={Pages.AdminUserEdit} />
        <AdminRoute path="/admin/roles" component={Pages.AdminRoles} />
        <ProtectedRoute path="/admin/courses" component={Pages.AdminCourses} />
        <AdminRoute
          path="/admin/course-categories"
          component={Pages.AdminCourseCategories}
        />
        <AdminRoute
          path="/admin/certificates"
          component={Pages.AdminCertificates}
        />
        <AdminRoute path="/admin/resources" component={Pages.AdminResources} />
        <AdminRoute path="/admin/curriculum" component={Pages.AdminResources} />
        <AdminRoute
          path="/admin/resource-categories"
          component={Pages.AdminResourceCategories}
        />
        <AdminRoute
          path="/admin/curriculum-categories"
          component={Pages.AdminResourceCategories}
        />
        <AdminRoute
          path="/admin/instructors"
          component={Pages.AdminInstructors}
        />
        <AdminRoute path="/admin/bookings" component={Pages.AdminBookings} />
        <AdminRoute
          path="/admin/dance-styles"
          component={Pages.AdminDanceStyles}
        />
        <AdminRoute
          path="/admin/subscription-plans"
          component={Pages.AdminSubscriptions}
        />
        <AdminRoute path="/admin/coupons" component={Pages.AdminCoupons} />
        <AdminRoute path="/admin/messages" component={Pages.AdminMessages} />
        <AdminRoute path="/admin/settings" component={Pages.AdminSettings} />
        <AdminRoute path="/admin/sellers" component={Pages.AdminSellers} />
        <AdminRoute
          path="/admin/deployment"
          component={Pages.AdminDeployment}
        />
        <AdminRoute
          path="/admin/documentation"
          component={Pages.AdminDocumentation}
        />

        {/* Specialty Admin Dashboards */}
        <ProtectedRoute
          path="/admin/course-creator"
          component={Pages.CourseAdmin}
        />
        <AdminRoute
          path="/admin/curriculum-officer"
          component={Pages.CurriculumOfficer}
        />
        <AdminRoute
          path="/curriculum-officer-dashboard"
          component={Pages.CurriculumOfficer}
        />

        {/* 404 Not Found - Must be last */}
        <Route component={Pages.NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <GuestModeProvider>
        <GuestCartProvider>
          <CartProvider>
            <Router />
            <Toaster />
          </CartProvider>
        </GuestCartProvider>
      </GuestModeProvider>
    </AuthProvider>
  );
}

export default App;
