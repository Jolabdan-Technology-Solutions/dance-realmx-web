# Dance RealmX - Product Requirements Document (PRD)

## 1. Product Overview

### 1.1 Purpose
Dance RealmX is a comprehensive platform connecting dance professionals, students, and sellers in a unified ecosystem for learning, teaching, and resource sharing.

### 1.2 Target Users
- Dance Students
- Dance Professionals
- Resource Sellers
- Curriculum Officers
- Administrators

### 1.3 Key Value Propositions
- Seamless booking system for dance lessons
- Digital resource marketplace
- Professional certification system
- Integrated payment processing
- Comprehensive curriculum management

## 2. Technical Architecture

### 2.1 System Components
```
Frontend (Next.js)
├── Pages
│   ├── Authentication
│   ├── Dashboard
│   ├── Curriculum
│   ├── Booking
│   ├── Resources
│   └── Admin
├── Components
│   ├── Layout
│   ├── Forms
│   ├── Cards
│   └── Modals
└── Services
    ├── API
    ├── Auth
    └── Payment

Backend (Node.js/Express)
├── Controllers
├── Services
├── Models
└── Middleware

Database (PostgreSQL)
├── Users
├── Resources
├── Bookings
└── Transactions
```

### 2.2 Technology Stack
- **Frontend**: Next.js, React, Material-UI
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Payment**: Stripe
- **Storage**: AWS S3
- **Deployment**: PM2, Nginx

## 3. Core Features

### 3.1 User Management
#### 3.1.1 User Roles
```typescript
enum UserRole {
  STUDENT = 'STUDENT',
  PROFESSIONAL = 'PROFESSIONAL',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN',
  CURRICULUM_OFFICER = 'CURRICULUM_OFFICER'
}
```

#### 3.1.2 User Profile
```typescript
interface UserProfile {
  id: string;
  userId: string;
  bio: string;
  location: string;
  specialties: string[];
  certifications: Certification[];
  availability: Availability[];
  rating: number;
  reviews: Review[];
}
```

### 3.2 Booking System
#### 3.2.1 Booking Flow
1. Student selects professional
2. Views availability
3. Selects time slot
4. Confirms booking
5. Processes payment
6. Receives confirmation

#### 3.2.2 Availability Management
```typescript
interface Availability {
  id: string;
  professionalId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  exceptions: Date[];
}
```

### 3.3 Resource Marketplace
#### 3.3.1 Resource Types
- Video Lessons
- PDF Guides
- Music Tracks
- Choreography Notes
- Practice Materials

#### 3.3.2 Resource Structure
```typescript
interface Resource {
  id: string;
  name: string;
  description: string;
  price: number;
  type: ResourceType;
  danceStyle: string;
  difficultyLevel: string;
  ageRange: string;
  thumbnailUrl: string;
  url: string;
  sellerId: string;
}
```

### 3.4 Curriculum Management
#### 3.4.1 Course Structure
```typescript
interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  price: number;
  modules: Module[];
  prerequisites: string[];
  certifications: Certification[];
}
```

#### 3.4.2 Module Structure
```typescript
interface Module {
  id: string;
  title: string;
  description: string;
  resources: Resource[];
  assignments: Assignment[];
  quizzes: Quiz[];
}
```

### 3.5 Payment System
#### 3.5.1 Subscription Plans
```typescript
interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  duration: 'MONTHLY' | 'YEARLY';
  stripePriceId: string;
}
```

#### 3.5.2 Payment Processing
1. Create Stripe customer
2. Handle subscription creation
3. Process one-time payments
4. Manage refunds
5. Handle webhooks

## 4. API Endpoints

### 4.1 Authentication
```typescript
// POST /api/auth/signin
interface SignInRequest {
  email: string;
  password: string;
}

// POST /api/auth/signup
interface SignUpRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}
```

### 4.2 Bookings
```typescript
// GET /api/bookings
interface GetBookingsResponse {
  bookings: Booking[];
  total: number;
  page: number;
}

// POST /api/bookings
interface CreateBookingRequest {
  professionalId: string;
  startTime: Date;
  endTime: Date;
  type: string;
  notes?: string;
}
```

### 4.3 Resources
```typescript
// GET /api/resources
interface GetResourcesResponse {
  resources: Resource[];
  total: number;
  page: number;
}

// POST /api/resources
interface CreateResourceRequest {
  name: string;
  description: string;
  price: number;
  type: ResourceType;
  file: File;
}
```

## 5. Database Schema

### 5.1 Core Tables
```prisma
model user {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  role          user_role
  profile       profile?
  bookings      booking[]
  resources     resource[]
  subscriptions subscription[]
}

model booking {
  id               String         @id @default(cuid())
  professional_id  String
  student_id       String
  start_time       DateTime
  end_time         DateTime
  status           booking_status
  price            Float
  location         Json
}

model resource {
  id               String   @id @default(cuid())
  name             String
  description      String?
  price            Float
  type             String
  dance_style      String?
  difficulty_level String?
  seller_id        String
}
```

## 6. Security Requirements

### 6.1 Authentication
- JWT-based authentication
- Role-based access control
- Session management
- Password hashing
- OAuth integration

### 6.2 Data Protection
- Data encryption at rest
- Secure file storage
- Payment data security
- API security
- Input validation

## 7. Performance Requirements

### 7.1 Response Times
- API endpoints: < 200ms
- Page load: < 2s
- Search results: < 1s
- File uploads: < 5s

### 7.2 Scalability
- Support 10,000+ concurrent users
- Handle 100+ bookings per minute
- Process 1000+ resource uploads daily
- Manage 100,000+ active subscriptions

## 8. Development Guidelines

### 8.1 Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Jest for testing
- Husky for pre-commit hooks

### 8.2 Git Workflow
```bash
# Feature Development
git checkout -b feature/feature-name
git add .
git commit -m "feat: add feature-name"
git push origin feature/feature-name

# Bug Fixes
git checkout -b fix/bug-name
git add .
git commit -m "fix: resolve bug-name"
git push origin fix/bug-name
```

### 8.3 Testing Requirements
- Unit tests: > 80% coverage
- Integration tests for critical flows
- E2E tests for user journeys
- Performance testing
- Security testing

## 9. Deployment Process

### 9.1 Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm run test
```

### 9.2 Production
```bash
# Build application
npm run build

# Start production server
npm run start:prod

# Monitor with PM2
pm2 start npm --name dance-realmx -- run start:prod
```

### 9.3 Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 10. Monitoring and Maintenance

### 10.1 Health Checks
- API endpoint monitoring
- Database connection status
- External service status
- Error rate tracking
- Performance metrics

### 10.2 Backup Strategy
- Daily database backups
- Weekly full backups
- Monthly archive backups
- File storage backups
- Configuration backups

## 11. Future Enhancements

### 11.1 Planned Features
- Live streaming integration
- AI-powered recommendations
- Mobile app development
- International payment support
- Advanced analytics dashboard

### 11.2 Technical Improvements
- Microservices architecture
- Real-time notifications
- Caching implementation
- CDN integration
- Automated scaling

## 12. Support and Documentation

### 12.1 Developer Resources
- API documentation
- Component library
- Style guide
- Architecture diagrams
- Deployment guides

### 12.2 User Support
- Help center
- FAQ documentation
- Video tutorials
- Email support
- Community forums

## 13. Compliance Requirements

### 13.1 Data Protection
- GDPR compliance
- CCPA compliance
- Data retention policies
- Privacy policy
- Terms of service

### 13.2 Payment Compliance
- PCI DSS compliance
- Payment card security
- Transaction monitoring
- Fraud prevention
- Refund policies

## 14. Project Timeline

### 14.1 Development Phases
1. Core Infrastructure (2 weeks)
2. User Management (2 weeks)
3. Booking System (3 weeks)
4. Resource Marketplace (3 weeks)
5. Payment Integration (2 weeks)
6. Testing and QA (2 weeks)
7. Deployment and Launch (1 week)

### 14.2 Milestones
- Alpha Release: Week 8
- Beta Release: Week 12
- Production Release: Week 14
- Post-Launch Support: Ongoing

## 15. Contact Information

### 15.1 Development Team
- Project Manager: [Name]
- Lead Developer: [Name]
- Frontend Developer: [Name]
- Backend Developer: [Name]
- UI/UX Designer: [Name]

### 15.2 Support Channels
- Email: support@dancerealmx.com
- Slack: #dancerealmx-dev
- GitHub: github.com/your-org/dance-realmx
- Documentation: docs.dancerealmx.com 