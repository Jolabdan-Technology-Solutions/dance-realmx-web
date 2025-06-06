# Dance RealmX Platform

A comprehensive platform for dance professionals and students to connect, learn, and grow together.

## 🚀 Features

### For Students
- Book private/group lessons with professionals
- Purchase and access dance resources
- Track progress and earn certifications
- Join courses and communities
- Receive personalized recommendations

### For Professionals
- Manage bookings and availability
- Create and sell resources
- Issue certifications
- Track earnings and analytics
- Build professional profile

### For Sellers
- Upload and sell dance resources
- Manage digital products
- Track sales and analytics
- Connect with customers

## 🛠 Tech Stack

- **Frontend**: Next.js, React, Material-UI
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Payment Processing**: Stripe
- **File Storage**: AWS S3
- **Deployment**: PM2, Nginx

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v13 or higher)
- PM2 (for production)
- Nginx (for production)

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dance_realmx"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Stripe
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
STRIPE_PRICE_ID="your-stripe-price-id"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="your-aws-region"
AWS_BUCKET_NAME="your-bucket-name"
```

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/dance-realmx.git
   cd dance-realmx
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

6. **Start production server**
   ```bash
   npm run start:prod
   ```

## 📁 Project Structure

```
dance-realmx/
├── prisma/              # Database schema and migrations
├── src/
│   ├── pages/          # Next.js pages
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions
│   ├── services/       # Business logic
│   └── styles/         # Global styles
├── public/             # Static files
└── tests/              # Test files
```

## 🔄 Database Schema

The platform uses the following main models:

- `user`: Core user information and authentication
- `profile`: Extended user profile information
- `booking`: Lesson booking management
- `course`: Course and curriculum management
- `resource`: Digital resource management
- `subscription`: Subscription and payment management
- `certification`: User certification tracking

## 💳 Payment Integration

The platform uses Stripe for payment processing:

1. **Subscription Plans**
   - Monthly/Yearly billing
   - Multiple plan tiers
   - Automatic renewal

2. **Resource Purchases**
   - One-time payments
   - Digital delivery
   - Purchase history

3. **Booking Payments**
   - Secure payment processing
   - Refund handling
   - Payment verification

## 🔐 Authentication

- Google OAuth integration
- Role-based access control
- Session management
- Secure password handling

## 📱 API Endpoints

### Authentication
- `POST /api/auth/signin`
- `POST /api/auth/signout`
- `GET /api/auth/session`

### Bookings
- `GET /api/bookings`
- `POST /api/bookings`
- `PUT /api/bookings/:id`
- `DELETE /api/bookings/:id`

### Resources
- `GET /api/resources`
- `POST /api/resources`
- `PUT /api/resources/:id`
- `DELETE /api/resources/:id`

### Courses
- `GET /api/courses`
- `POST /api/courses`
- `PUT /api/courses/:id`
- `DELETE /api/courses/:id`

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
```

## 📈 Monitoring

- PM2 process management
- Error tracking
- Performance monitoring
- Usage analytics

## 🔄 Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start with PM2**
   ```bash
   pm2 start npm --name dance-realmx -- run start:prod
   ```

3. **Configure Nginx**
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

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- Project Manager: [Name]
- Lead Developer: [Name]
- UI/UX Designer: [Name]
- Backend Developer: [Name]
- Frontend Developer: [Name]

## 📞 Support

For support, email support@dancerealmx.com or join our Slack channel.
