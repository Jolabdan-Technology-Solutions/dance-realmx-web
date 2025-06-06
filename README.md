# Dance RealmX - Developer Implementation Guide

This guide provides a clear, step-by-step breakdown of what developers need to implement to build the Dance RealmX platform based on the product requirements document (PRD). Each section outlines the required features, technical setup, and tools to be used.

---

## 1. Product Summary

Dance RealmX is a dance education and marketplace platform. It allows users to:

* Book dance lessons
* Sell and buy dance-related resources
* Manage dance curriculum and certifications
* Process payments securely

Users include: Students, Dance Professionals, Sellers, Curriculum Officers, and Admins.

---

## 2. Tech Stack Overview

* **Frontend**: React (Vite), Next.js (optional)
* **Backend**: FastAPI (Python)
* **AI Agentic Platform**: CrewAI
* **Database**: PostgreSQL using Prisma ORM
* **Authentication**: JWT / OAuth
* **Payments**: Stripe
* **Storage**: AWS S3
* **Deployment**: Nginx + PM2

---

## 3. Features to Build (Grouped by System Module)

### Admin Panel Access Control

* **Dashboard Variants**: Each user sees a customized admin/dashboard view based on their role.
* **Role Logic**:

  * **Student**: Access to class booking, purchased resources, progress tracking.
  * **Professional**: Manage availability, view bookings, respond to reviews.
  * **Seller**: Upload/manage resources, view sales and payouts.
  * **Curriculum Officer**: Create/edit courses and modules, assign certifications.
  * **Admin**: View system-wide analytics, manage users, moderate content, configure platform settings.
* **UI Implementation**: Conditionally render components based on user role using context or middleware guard.
* **Backend Enforcement**: Role-based middleware must restrict access to protected endpoints to match UI access.

### 3.1 User Management

* **Feature Guard for Upsell (All Plans)**: All users, regardless of their current subscription tier, will be able to see all available features in the UI. However, when attempting to access a feature beyond their current plan level, the system should display a modal or notification explaining that the feature is locked for their plan. This prompt should also display which plan is required and offer an upgrade option via Stripe.

* **Plan-Aware Routing**: Feature access in the frontend must be validated against the user's plan tier. Attempting to navigate to a restricted route should be intercepted with an upgrade prompt.

* **Backend Enforcement**: Every feature-specific API endpoint must validate access based on the user's assigned subscription plan tier using middleware or decorators.

* **Dynamic Upgrade Flow**: When a user clicks a locked feature, a modal should appear showing the name of the required feature, its benefits, and a 'Upgrade Plan' button that routes to the correct Stripe checkout page.

* **Feature Guard for Upsell**: Students (or any role without permissions) can see all available features in the UI. However, when they click on a feature that is outside their plan tier, they are shown a prompt explaining that the feature is locked. The prompt should include details about what the feature does and offer an immediate upgrade option via Stripe.

* **Guard Logic**: Use client-side route guards or component-level access checks to intercept access attempts. On the backend, reinforce protection by verifying the JWT token and user's current plan before fulfilling feature-specific API requests.

* **Upsell Modal**: Include an upgrade modal with dynamic content showing what plan is needed and a button that routes to the Stripe Checkout page for that plan.

* **Feature-Level Access Mapping**: Each individual feature is tied to a minimum required subscription plan:

  * Free: "Profile Listing in Directory"
  * Silver: Includes all Free features + "Sell Classes or Products", "Upload Curriculum", "Manage Courses", "Add PDFs, Videos, Worksheets", "Bookings Management", "Stripe Payout Integration"
  * Gold: Includes all Silver features + "Access to Certification Tools", "Create Certification Tracks", "Manage Assessments and Students"
  * Platinum: Includes all Gold features + "Admin Dashboard", "User Role Management", "Contract Handling", "Payment Oversight"

* **Plan Hierarchy Enforcement**: Plans are structured hierarchically (Free < Silver < Gold < Platinum). Higher-tier plans inherit all access of lower tiers.

* **Role-Based Feature Bundles and Plan Mapping**: User roles such as Curriculum Seller, Directory Member, Certification Manager, and Admin are made available based on plan eligibility.

* **Onboarding Flow with Feature Selection**: When users click “Get Started,” show an explanation of all available roles and their features. Users check features they want (e.g., Sell Classes, Access Certification Tools), and the system maps them to the required plan.

* **Dynamic Plan Recommendation Engine**: Based on selections, display the most suitable subscription plan:

  * **Free**: Directory listing only
  * **Silver**: Includes Directory + Curriculum Seller
  * **Gold**: Adds Certification Manager tools
  * **Platinum**: Grants full Admin tools

* **Stripe Checkout Flow**: After plan recommendation, users are redirected to Stripe to complete payment.

* **Account Activation on Payment Success**: Post-payment (via Stripe webhook), create the user account and assign them the selected role(s). Their dashboard shows only the features their plan allows.

* **Role-Based Dashboards**: Upon login, users see customized dashboard sections:

  * **Curriculum Seller**: Store + Curriculum Tabs, Booking tools
  * **Certification Manager**: Certification tab with tools to manage tracks and assessments
  * **Directory Member**: View-only profile listing
  * **Admin**: Full visibility and platform management tools

* **Registration/Login**: Users should be able to register with email, password, name, and select their role. Login will return a JWT token used for session validation.

* **Role-Based Permissions**: Each role will have access to specific features. Middleware should check JWT and user role before allowing access to protected routes.

* **User Profile**: Users can update their profile with bio, location, specialties (dance styles), and upload certification proof. Professionals must define their availability. Reviews and ratings are linked to the user after completed bookings.

* **Role-Based Feature Bundles and Plan Mapping**: User roles such as Curriculum Seller, Directory Member, Certification Manager, and Admin will each unlock different feature sets. Each role maps to a required subscription plan (Free, Silver, Gold, Platinum).

* **Onboarding Flow with Feature Selection**: When users click “Get Started,” show an explanation of all available roles and their features. Users check features they want (e.g., Sell Classes, Access Certification Tools), and the system matches them to the required plan.

* **Dynamic Plan Recommendation Engine**: Based on selections, display the most suitable subscription plan:

  * **Free**: Directory listing only
  * **Silver**: Includes Directory + Curriculum Seller
  * **Gold**: Adds Certification Manager tools
  * **Platinum**: Grants full Admin tools

* **Stripe Checkout Flow**: After plan recommendation, users are redirected to Stripe to complete payment.

* **Account Activation on Payment Success**: Post-payment (via Stripe webhook), create the user account and assign them the selected role(s). Their dashboard shows only the features their plan allows.

* **Role-Based Dashboards**: Upon login, users see customized dashboard sections:

  * **Curriculum Seller**: Store + Curriculum Tabs, Booking tools
  * **Certification Manager**: Certification tab with tools to manage tracks and assessments
  * **Directory Member**: View-only profile listing
  * **Admin**: Full visibility and platform management tools

* **Onboarding Flow with Feature Selection**: When new users click “Get Started,” they are shown a step-by-step interface that explains the available roles (Student, Professional, Seller, Curriculum Officer) and features associated with each role.

* **Feature Checkbox Selection**: Users will check the features they’re most interested in (e.g., book classes, upload resources, create courses).

* **Plan Recommendation Engine**: Based on the selected features, the system recommends the most appropriate subscription plan (mapped to roles and permissions).

* **Stripe Checkout Integration**: The user is redirected to a Stripe Checkout session to pay for the recommended subscription plan.

* **Account Creation on Payment Success**: Only after successful payment confirmation (via Stripe webhook), the user account is created in the system with the assigned role and unlocked access based on selected features.

* **Post-Payment Access**: User is redirected to their personalized dashboard where access is granted according to their role and subscription permissions.

* **Registration/Login**: Users should be able to register with email, password, name, and select their role. Login will return a JWT token used for session validation.

* **Role-Based Permissions**: Each role will have access to specific features. Middleware should check JWT and user role before allowing access to protected routes.

* **User Profile**: Users can update their profile with bio, location, specialties (dance styles), and upload certification proof. Professionals must define their availability. Reviews and ratings are linked to the user after completed bookings.

### 3.2 Connect (Professional Module)

* **Professional Listings**: Display a searchable list of professionals by location, style, rating, and availability.
* **Availability Picker**: Pull from professional's availability and show calendar slots. Students can click to select time.
* **Booking Flow**: Student selects slot → redirected to Stripe → on successful payment, booking record is created and confirmation is sent.
* **Database Storage**: Booking model stores student ID, professional ID, timestamp, session length, amount, and status (booked, canceled, completed).

### 3.3 Resources (Curriculum Module)

* **Upload Interface**: Sellers can upload videos, PDFs, music tracks, and descriptions. Files go to AWS S3.
* **Categorization**: Sellers must tag each resource with type (e.g., video), dance style, target age, and difficulty level.
* **Display Listings**: Frontend will render preview cards with thumbnail, title, price, and download restrictions.
* **Purchase & Access**: After successful Stripe payment, access token to download file is generated for that user only. Prevent unauthorized sharing.

### 3.4 Certification (Course & Credential Module)

* **Course Builder**: Curriculum Officers can create courses with a title, description, price, and list of modules.
* **Module Structure**: Each module contains one or more resources (e.g., video + worksheet), and optional quiz/assignment.
* **User Enrollment**: Users can enroll in a course (free or paid). Their progress is tracked per module.
* **Certificates**: Once all modules and assessments are completed, auto-generate downloadable certification if configured by instructor.

### 3.5 Payment Integration

* **Subscriptions**: Offer monthly and yearly plans tied to premium roles (e.g., Sellers, Curriculum Officers). Use Stripe to manage plan tiers.
* **One-Time Payments**: Handle standalone purchases like resource files or private bookings. Create Stripe Checkout session per transaction.
* **Webhook Handling**: Stripe webhook notifies backend on payment success/failure. On success, assign role/resource access. Handle refunds and cancellations cleanly.
* **Stripe Connect Integration**: Follow the [Stripe Connect integration guide](https://docs.stripe.com/connect/design-an-integration) to:

  * Allow sellers and professionals to onboard and link a payout account
  * Use Standard Connect accounts with OAuth for onboarding
  * Automatically handle payouts to sellers after resource or booking purchases
  * Store the returned Stripe `account_id` and associate it with the seller’s user profile in your database
  * Securely manage updates, transfers, and dashboard redirection URLs for seller accounts

---

## 4. API Endpoints

### 4.1 Auth

* `POST /api/auth/signup`
* `POST /api/auth/signin`

### 4.2 Bookings

* `GET /api/bookings`
* `POST /api/bookings`

### 4.3 Resources

* `GET /api/resources`
* `POST /api/resources`

---

## 5. Database (Prisma Models)

Models to define:

* `User`
* `Booking`
* `Resource`
* `Course`
* `Subscription`
* `Review`
* `Availability`

Use Prisma migrations and `prisma generate` to keep schema up to date.

---

## 6. Frontend Tasks

* Build pages: Login, Dashboard, Booking, Curriculum, Marketplace, Admin
* Use React components for: Modals, Cards, Tables, Forms
* Connect to backend via Axios
* Handle Stripe checkout redirection
* Use Tailwind or Material UI for styling

---

## 7. Security

* Use JWT tokens for auth
* Encrypt passwords
* Validate inputs (server + client)
* Secure file storage on S3

---

## 8. Performance Targets

* API response < 200ms
* Page load < 2s
* Upload < 5s

---

## 9. DevOps and Deployment

* Use PM2 for backend process manager
* Set up Nginx as reverse proxy
* Backup DB daily, code weekly
* Monitor uptime, API errors, storage status
