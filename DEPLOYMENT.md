# Deployment Guide

This guide provides instructions for deploying the News & NGO Platform API to various environments.

## Prerequisites

- Node.js v14 or higher
- PostgreSQL database
- Cloudinary account (optional, for file storage)
- Email service account (Gmail, SendGrid, etc.)

## Environment Configuration

### Required Environment Variables

Create a `config.env` file in the root directory with the following variables:

```env
# Database Configuration
PG_HOST=your_database_host
PG_PORT=5432
PG_DB=your_database_name
PG_USER=your_database_user
PG_PASSWORD=your_database_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password_or_app_password
EMAIL_FROM=your_email@example.com

# Cloudinary Configuration (Optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server Configuration
PORT=3000
NODE_ENV=production

# CORS Configuration
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
```

### Development vs Production

For development, you can use a local PostgreSQL database and set `NODE_ENV=development`.

For production, ensure you use a secure database connection and set `NODE_ENV=production`.

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

3. Set up the database:
   ```bash
   # Create the database tables
   npm run db:sync
   ```

4. Start the server:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Database Setup

### PostgreSQL

1. Install PostgreSQL on your server
2. Create a database:
   ```sql
   CREATE DATABASE news_ngo;
   ```
3. Create a user with appropriate permissions:
   ```sql
   CREATE USER news_ngo_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE news_ngo TO news_ngo_user;
   ```

### Database Migrations

The application uses Sequelize for ORM. To sync the database schema:

```bash
npm run db:sync
```

For production environments, consider using proper migration scripts instead of `sync`.

## Deployment Options

### Heroku

1. Create a new Heroku app
2. Add PostgreSQL addon:
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```
3. Set environment variables:
   ```bash
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set EMAIL_USER=your_email@example.com
   heroku config:set EMAIL_PASS=your_email_password
   ```
4. Deploy:
   ```bash
   git push heroku main
   ```

### Docker

1. Build the Docker image:
   ```bash
   docker build -t news-ngo-api .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 \
     -e PG_HOST=your_db_host \
     -e PG_DB=your_db_name \
     -e PG_USER=your_db_user \
     -e PG_PASSWORD=your_db_password \
     -e JWT_SECRET=your_jwt_secret \
     news-ngo-api
   ```

### AWS EC2

1. Launch an EC2 instance with Ubuntu
2. Install Node.js and PostgreSQL
3. Clone the repository and install dependencies
4. Configure environment variables
5. Set up PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start src/server.js
   pm2 startup
   pm2 save
   ```

### Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set environment variables in the Render dashboard
4. Set the build command to `npm install`
5. Set the start command to `node src/server.js`

## Monitoring and Logging

The application uses Winston for logging. Logs are stored in the `logs/` directory:

- `combined.log` - All logs
- `error.log` - Error logs only

In production, consider using a centralized logging solution like:

- Papertrail
- Loggly
- AWS CloudWatch
- Google Cloud Logging

## Security Considerations

1. Always use HTTPS in production
2. Rotate JWT secrets regularly
3. Use strong passwords for database and email accounts
4. Implement proper rate limiting
5. Keep dependencies updated
6. Use environment variables for sensitive configuration
7. Regularly backup your database

## Backup and Recovery

### Database Backup

For PostgreSQL, use pg_dump:

```bash
pg_dump -h hostname -U username database_name > backup.sql
```

### Automated Backups

Set up cron jobs for regular backups:

```bash
# Daily backup at 2 AM
0 2 * * * pg_dump -h hostname -U username database_name > /backups/backup_$(date +\%Y\%m\%d).sql
```

## Scaling

### Horizontal Scaling

- Use a load balancer to distribute traffic
- Use Redis for session storage if needed
- Implement database connection pooling

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Use database indexing

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check database credentials
   - Ensure database server is running
   - Verify network connectivity

2. **Email Not Sending**
   - Check email service configuration
   - Verify credentials
   - Check spam folder

3. **File Uploads Not Working**
   - Verify Cloudinary configuration
   - Check file size limits
   - Ensure proper file permissions

### Logs

Check the application logs for detailed error information:

```bash
tail -f logs/error.log
```

## API Documentation

The API documentation is available at `/api-docs` when the server is running.

For production deployments, consider hosting the documentation separately.

## Support

For issues and support, please:
1. Check the logs for error messages
2. Verify all environment variables are set correctly
3. Ensure dependencies are up to date
4. Contact the development team if issues persist