# Backend Configuration Guide

## Environment Setup

### Required Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/dance_realmx"

# JWT Configuration
JWT_SECRET="your-jwt-secret"
JWT_EXPIRATION="24h"

# Stripe Configuration
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
STRIPE_PRICE_ID="your-stripe-price-id"

# AWS S3 Configuration
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="your-aws-region"
AWS_BUCKET_NAME="your-bucket-name"

# Email Configuration
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"
EMAIL_FROM="noreply@dancerealmx.com"
```

## Database Configuration

### PostgreSQL Setup
1. Install PostgreSQL:
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

2. Create database:
```sql
CREATE DATABASE dance_realmx;
CREATE USER dance_user WITH ENCRYPTED PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE dance_realmx TO dance_user;
```

3. Run migrations:
```bash
npx prisma migrate dev
```

## API Configuration

### CORS Setup
Configure CORS in `src/main.ts`:

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
});
```

### Rate Limiting
Configure rate limiting in `src/main.ts`:

```typescript
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  })
);
```

## Security Configuration

### JWT Authentication
Configure JWT in `src/auth/jwt.strategy.ts`:

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }
}
```

### Password Hashing
Configure password hashing in `src/auth/auth.service.ts`:

```typescript
@Injectable()
export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
```

## File Upload Configuration

### AWS S3 Setup
Configure S3 in `src/config/s3.config.ts`:

```typescript
export const s3Config = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  bucket: process.env.AWS_BUCKET_NAME,
};
```

## Payment Configuration

### Stripe Setup
Configure Stripe in `src/config/stripe.config.ts`:

```typescript
export const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  priceId: process.env.STRIPE_PRICE_ID,
};
```

## Logging Configuration

### Winston Logger
Configure logging in `src/config/logger.config.ts`:

```typescript
export const loggerConfig = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
};
```

## Testing Configuration

### Jest Setup
Configure Jest in `jest.config.js`:

```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
```

## Production Configuration

### PM2 Setup
Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'dance-realmx',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
    },
  }],
};
```

### Nginx Configuration
Configure Nginx in `/etc/nginx/sites-available/dance-realmx`:

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

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring Configuration

### Health Check Endpoint
Configure health check in `src/health/health.controller.ts`:

```typescript
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
```

### Error Monitoring
Configure error monitoring in `src/main.ts`:

```typescript
app.useGlobalFilters(new AllExceptionsFilter());
app.useGlobalInterceptors(new LoggingInterceptor());
``` 