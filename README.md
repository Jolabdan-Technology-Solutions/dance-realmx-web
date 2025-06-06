# DanceRealmX Platform

## Overview
DanceRealmX is a comprehensive dance education platform that combines e-learning, resource marketplace, certification, and booking systems. This repository contains the full-stack implementation of the platform.

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: NestJS + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT + OAuth
- **Payment Processing**: Stripe
- **File Storage**: Cloudinary
- **Email Service**: SendGrid

## Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn
- Stripe account
- Cloudinary account
- SendGrid account

## Environment Setup

### Required Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dancerealmx"

# Authentication
JWT_SECRET="your-jwt-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Subscription Price IDs
STRIPE_PRICE_SILVER_MONTHLY="price_..."
STRIPE_PRICE_SILVER_YEARLY="price_..."
STRIPE_PRICE_GOLD_MONTHLY="price_..."
STRIPE_PRICE_GOLD_YEARLY="price_..."
STRIPE_PRICE_PLATINUM_MONTHLY="price_..."
STRIPE_PRICE_PLATINUM_YEARLY="price_..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# SendGrid
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@dancerealmx.com"

# Frontend
VITE_API_URL="http://localhost:3000"
VITE_STRIPE_PUBLIC_KEY="pk_test_..."
```

## Installation

### Backend Setup
```bash
cd dance-realmx
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### Frontend Setup
```bash
cd dance-realmx-web
npm install
npm run dev
```

## Feature Implementation Status

### Core Features ✅
- [x] User Authentication
- [x] Role-based Access Control
- [x] Profile Management
- [x] Basic Course Structure
- [x] Resource Management
- [x] Subscription System
- [x] Basic Booking System

### In Progress 🚧
- [ ] Enhanced Learning Paths
- [ ] Certificate System
- [ ] Advanced Booking Features
- [ ] Mobile Optimization
- [ ] Performance Improvements

### Planned Features 📋
- [ ] Live Streaming
- [ ] AI Recommendations
- [ ] Community Features
- [ ] International Support

## Testing

### Backend Tests
```bash
cd dance-realmx
npm run test
npm run test:e2e
```

### Frontend Tests
```bash
cd dance-realmx-web
npm run test
npm run test:e2e
```

## API Documentation
API documentation is available at `/api/docs` when running the backend server.

## Development Workflow

### Branch Strategy
- `main` - Production branch
- `dev` - Development branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches

### Commit Convention
```
feat: add new feature
fix: fix bug
docs: update documentation
style: format code
refactor: refactor code
test: add tests
chore: update dependencies
```

### Pull Request Process
1. Create feature branch from `dev`
2. Implement changes
3. Write/update tests
4. Update documentation
5. Create PR to `dev`
6. Code review
7. Merge to `dev`
8. Deploy to staging
9. QA testing
10. Merge to `main`

## Deployment

### Production Deployment
```bash
# Backend
cd dance-realmx
npm run build
pm2 start ecosystem.config.js

# Frontend
cd dance-realmx-web
npm run build
```

### Environment Setup
1. Set up production environment variables
2. Configure SSL certificates
3. Set up database backups
4. Configure monitoring
5. Set up CI/CD pipeline

## Monitoring and Maintenance

### Health Checks
- API endpoints: `/health`
- Database connection
- External service status

### Logging
- Application logs
- Error tracking
- Performance monitoring

### Backup Strategy
- Daily database backups
- Weekly full backups
- Monthly archive backups

## Security

### Authentication
- JWT token validation
- Role-based access control
- OAuth integration
- Session management

### Data Protection
- Data encryption
- Secure file storage
- Payment security
- API security

## Performance Optimization

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Caching strategy

### Backend
- Query optimization
- Caching implementation
- Load balancing
- Database indexing

## Troubleshooting

### Common Issues
1. Database Connection
   - Check DATABASE_URL
   - Verify PostgreSQL service
   - Check network connectivity

2. Authentication
   - Verify JWT_SECRET
   - Check OAuth credentials
   - Validate token expiration

3. File Upload
   - Check Cloudinary credentials
   - Verify file size limits
   - Check storage quotas

### Support
For technical support, contact:
- Email: support@dancerealmx.com
- Slack: #dancerealmx-dev

## Contributing
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License
This project is licensed under the MIT License - see LICENSE file for details.
