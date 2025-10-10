# News & NGO Platform API

A comprehensive backend API for a news portal and NGO management platform built with Node.js, Express, and PostgreSQL.

## Features

- **User Authentication & Authorization**: JWT-based authentication with role-based access control (admin, editor, reporter, user)
- **News Management**: Create, read, update, delete news articles with approval workflow
- **Content Approval Workflow**: Draft → Submitted → Approved/Rejected with version control
- **NGO Operations**: Stories, gallery, and donation management
- **Newsletter Subscription**: Email subscription with OTP verification
- **File Uploads**: Support for images, PDFs, and videos with Cloudinary integration
- **Scheduled Publishing**: Automatic publishing of news articles
- **Rate Limiting**: Protection against abuse and brute force attacks
- **Security**: Helmet.js, CORS, XSS protection, and input sanitization
- **Logging**: Comprehensive logging with Winston
- **API Documentation**: Swagger/OpenAPI documentation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary (with local fallback)
- **Email**: Nodemailer
- **Validation**: express-validator
- **Logging**: Winston
- **Security**: Helmet.js, CORS
- **Testing**: Jest, Supertest
- **Documentation**: Swagger UI

## Prerequisites

- Node.js v14 or higher
- PostgreSQL database
- npm or yarn package manager

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd news-ngo-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp config.env.example config.env
   # Edit config.env with your configuration
   ```

4. Run database migrations:
   ```bash
   npm run db:sync
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `config.env` file in the root directory:

```env
# Database Configuration
PG_HOST=localhost
PG_PORT=5432
PG_DB=news_ngo
PG_USER=your_username
PG_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@example.com

# Cloudinary Configuration (Optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server Configuration
PORT=3000
NODE_ENV=development
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login existing user
- `POST /api/auth/accept-invite/:token` - Accept invitation
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password
- `POST /api/auth/logout` - Logout user

### Admin
- `POST /api/admin/invite` - Invite new user
- `POST /api/admin/resend-invite` - Resend invitation
- `GET /api/admin/pending-users` - Get pending users

### News
- `POST /api/news` - Create news article
- `GET /api/news` - Get all news articles
- `GET /api/news/:id` - Get news article by ID
- `PUT /api/news/:id` - Update news article
- `DELETE /api/news/:id` - Delete news article
- `PATCH /api/news/:id/submit` - Submit news for approval
- `PATCH /api/news/:id/approve` - Approve news article
- `PATCH /api/news/:id/reject` - Reject news article
- `GET /api/news/:id/versions` - Get news versions
- `PATCH /api/news/:id/rollback/:versionId` - Rollback to version
- `POST /api/news/add` - Add news article (admin only)

### NGO
- `POST /api/ngo/stories` - Create NGO story
- `GET /api/ngo/stories` - Get all NGO stories
- `POST /api/ngo/gallery` - Add gallery item
- `GET /api/ngo/gallery` - Get all gallery items
- `POST /api/ngo/donate` - Create donation
- `GET /api/ngo/donations` - Get all donations (admin only)

### Subscription
- `POST /api/subscribe` - Subscribe to newsletter
- `POST /api/subscribe/verify-otp` - Verify subscription
- `GET /api/subscribe/unsubscribe` - Unsubscribe from newsletter

## Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all features |
| **Editor** | Manage news articles, approve/reject content, manage users |
| **Reporter** | Create and edit news articles, submit for approval |
| **User** | View public content, subscribe to newsletter |

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/auth.test.js

# Run tests with coverage
npm run test:coverage
```

### API Documentation

API documentation is available at `http://localhost:3000/api-docs` when the server is running.

### Docker Development

```bash
# Start services with docker-compose
docker-compose up

# Stop services
docker-compose down

# View logs
docker-compose logs
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### Production Deployment with Docker

```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up -d

# Stop production services
docker-compose -f docker-compose.prod.yml down
```

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middlewares/     # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic
├── uploads/         # Uploaded files (local storage)
├── logs/            # Log files
└── server.js        # Application entry point
```

## Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Rate limiting
- XSS protection
- Helmet.js security headers
- CORS configuration
- Password hashing with bcrypt
- Secure file upload handling

## Logging

The application uses Winston for logging with the following log levels:
- error: Error events
- warn: Warning events
- info: Informational messages
- debug: Debug messages (development only)

Logs are stored in the `logs/` directory:
- `combined.log`: All log messages
- `error.log`: Error messages only

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and support, please:
1. Check the existing issues
2. Create a new issue with detailed information
3. Include steps to reproduce the problem
4. Include relevant logs and error messages