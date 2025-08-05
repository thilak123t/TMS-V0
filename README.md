# Tender Management System - Backend

A comprehensive backend API for managing tenders, bids, and vendor relationships built with Node.js, Express, and PostgreSQL.

## Features

- **User Management**: Multi-role authentication (Admin, Tender Creator, Vendor)
- **Tender Management**: Create, publish, update, and award tenders
- **Bid Management**: Submit, evaluate, and manage bids
- **Real-time Notifications**: Socket.IO powered notifications
- **Email System**: Automated email notifications for key events
- **File Upload**: Support for tender and bid attachments
- **Dashboard Analytics**: Comprehensive statistics and charts
- **Security**: JWT authentication, rate limiting, input validation
- **Logging**: Comprehensive logging with Winston
- **Docker Support**: Full containerization with Docker Compose

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **Cache**: Redis
- **Authentication**: JWT
- **Email**: Nodemailer
- **Real-time**: Socket.IO
- **Validation**: Joi
- **Logging**: Winston
- **File Upload**: Multer
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 15 or higher
- Redis (optional, for caching)
- SMTP server for email notifications

## Installation

### Using Docker (Recommended)

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd tender-management-backend
\`\`\`

2. Create environment file:
\`\`\`bash
cp .env.example .env
\`\`\`

3. Update the `.env` file with your configuration:
\`\`\`env
# Database
DB_NAME=tender_management
DB_USER=postgres
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_very_long_and_secure_jwt_secret_key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
\`\`\`

4. Start the services:
\`\`\`bash
docker-compose up -d
\`\`\`

5. Run database migrations:
\`\`\`bash
docker-compose exec backend npm run migrate
\`\`\`

6. Seed initial data:
\`\`\`bash
docker-compose exec backend npm run seed
\`\`\`

### Manual Installation

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Set up PostgreSQL database and update `.env` file

3. Run database migrations:
\`\`\`bash
npm run migrate
\`\`\`

4. Seed initial data:
\`\`\`bash
npm run seed
\`\`\`

5. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/profile` | Get user profile |
| PUT | `/api/auth/profile` | Update user profile |
| PUT | `/api/auth/change-password` | Change password |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| POST | `/api/auth/logout` | User logout |

### Tender Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tenders` | Get all tenders (with filters) |
| GET | `/api/tenders/:id` | Get single tender |
| POST | `/api/tenders` | Create new tender |
| PUT | `/api/tenders/:id` | Update tender |
| DELETE | `/api/tenders/:id` | Delete tender |
| PUT | `/api/tenders/:id/publish` | Publish tender |
| PUT | `/api/tenders/:id/award` | Award tender |
| POST | `/api/tenders/:id/invite` | Invite vendors |

### Bid Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bids` | Get user's bids |
| GET | `/api/bids/:id` | Get single bid |
| POST | `/api/bids` | Submit new bid |
| PUT | `/api/bids/:id` | Update bid |
| DELETE | `/api/bids/:id` | Withdraw bid |
| GET | `/api/tenders/:id/bids` | Get tender bids |

### User Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users (Admin only) |
| GET | `/api/users/:id` | Get single user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |
| PUT | `/api/users/:id/toggle-status` | Toggle user status |

### Notification Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get user notifications |
| PUT | `/api/notifications/:id/read` | Mark as read |
| PUT | `/api/notifications/read-all` | Mark all as read |
| DELETE | `/api/notifications/:id` | Delete notification |
| GET | `/api/notifications/unread-count` | Get unread count |

### Dashboard Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Get dashboard statistics |
| GET | `/api/dashboard/charts` | Get chart data |
| GET | `/api/dashboard/recent-activity` | Get recent activity |

### File Upload Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/uploads/tender` | Upload tender files |
| POST | `/api/uploads/bid` | Upload bid files |
| DELETE | `/api/uploads/:filename` | Delete uploaded file |

## Environment Variables

\`\`\`env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=tender_management
DB_PASSWORD=password
DB_PORT=5432

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM_NAME=Tender Management System
EMAIL_FROM_ADDRESS=noreply@tendermanagement.com

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif
MAX_FILES_PER_UPLOAD=5

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
\`\`\`

## Database Schema

The system uses PostgreSQL with the following main tables:

- **users**: User accounts with role-based access
- **tenders**: Tender information and requirements
- **bids**: Vendor bids on tenders
- **tender_invitations**: Vendor invitations to specific tenders
- **notifications**: System notifications
- **comments**: Comments on tenders and bids
- **file_uploads**: File attachment metadata

## User Roles

1. **Admin**: Full system access, user management
2. **Tender Creator**: Create and manage tenders, evaluate bids
3. **Vendor**: View tenders, submit bids, receive invitations

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- Input validation with Joi
- SQL injection prevention
- CORS configuration
- Helmet security headers
- File upload restrictions

## Real-time Features

- Live notifications via Socket.IO
- Real-time bid updates
- Tender status changes
- Comment notifications

## Email Notifications

- Welcome emails for new users
- Tender invitation emails
- Bid submission notifications
- Award notifications
- Password reset emails

## Logging

Comprehensive logging with Winston:
- Console output for development
- File logging for production
- Error tracking and debugging
- Request/response logging

## Testing

Run the test suite:
\`\`\`bash
npm test
\`\`\`

Run tests in watch mode:
\`\`\`bash
npm run test:watch
\`\`\`

## Deployment

### Production Deployment

1. Set `NODE_ENV=production` in your environment
2. Use a process manager like PM2
3. Set up SSL certificates
4. Configure reverse proxy (Nginx)
5. Set up database backups
6. Monitor logs and performance

### Docker Production

\`\`\`bash
docker-compose -f docker-compose.prod.yml up -d
\`\`\`

## API Response Format

All API responses follow a consistent format:

\`\`\`json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "pagination": {
    // Pagination info (for list endpoints)
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
\`\`\`

Error responses:
\`\`\`json
{
  "success": false,
  "message": "Error description",
  "errors": [
    // Validation errors (if applicable)
  ]
}
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

## Changelog

### Version 1.0.0
- Initial release
- User authentication and authorization
- Tender management system
- Bid submission and evaluation
- Real-time notifications
- Email system integration
- File upload support
- Dashboard analytics
