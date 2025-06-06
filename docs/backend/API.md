# Dance RealmX Backend API Documentation

## Authentication Endpoints

### POST /api/auth/signin
Authenticate a user and return a JWT token.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "string"
  }
}
```

### POST /api/auth/signup
Register a new user.

**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "name": "string",
  "role": "STUDENT | PROFESSIONAL | SELLER"
}
```

## User Management

### GET /api/users
Get all users (Admin only).

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 10)
- `role`: string (optional)
- `search`: string (optional)

### GET /api/users/:id
Get user by ID.

### PUT /api/users/:id
Update user information.

**Request Body:**
```json
{
  "name": "string",
  "bio": "string",
  "location": "string",
  "specialties": ["string"]
}
```

## Booking System

### GET /api/bookings
Get all bookings for the authenticated user.

**Query Parameters:**
- `status`: string (optional)
- `startDate`: string (optional)
- `endDate`: string (optional)

### POST /api/bookings
Create a new booking.

**Request Body:**
```json
{
  "professionalId": "string",
  "startTime": "string",
  "endTime": "string",
  "type": "string",
  "notes": "string"
}
```

### PUT /api/bookings/:id/status
Update booking status.

**Request Body:**
```json
{
  "status": "PENDING | CONFIRMED | CANCELLED | COMPLETED"
}
```

## Resource Management

### GET /api/resources
Get all resources.

**Query Parameters:**
- `type`: string (optional)
- `danceStyle`: string (optional)
- `difficultyLevel`: string (optional)
- `priceRange`: string (optional)

### POST /api/resources
Create a new resource.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "price": number,
  "type": "string",
  "danceStyle": "string",
  "difficultyLevel": "string",
  "ageRange": "string",
  "file": File
}
```

## Payment Integration

### POST /api/payments/create-intent
Create a payment intent.

**Request Body:**
```json
{
  "amount": number,
  "currency": "string",
  "paymentMethod": "string"
}
```

### POST /api/subscriptions
Create a subscription.

**Request Body:**
```json
{
  "planId": "string",
  "paymentMethod": "string"
}
```

## Error Responses

All endpoints may return the following error responses:

```json
{
  "statusCode": number,
  "message": "string",
  "error": "string"
}
```

Common status codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error 