# AI Health Management System

A comprehensive full-stack web application for managing health data, diagnostic tests, and medical alerts. Built with React, Node.js, and MySQL.

## 🚀 Features

### Authentication & Authorization

- User registration and login with JWT tokens
- Protected routes and secure API endpoints
- Session management with automatic token refresh
- Password hashing with bcrypt

### Core Functionality

- **User Profile & Preferences**: Manage personal information, notification settings, theme preferences, and password changes
- **Alerts Dashboard**: Create, view, and manage health alerts with priority levels and status tracking
- **Diagnostic Tests CRUD**: Complete management of diagnostic test results with filtering, search, and detailed views

### Technical Features

- Responsive design with Material-UI components
- Real-time data updates with React Query
- Comprehensive form validation
- Database relationships and constraints
- RESTful API with proper error handling
- Automated testing suite

## 🛠 Tech Stack

### Frontend

- **React 18** - Modern React with hooks
- **Material-UI (MUI)** - Component library and design system
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Relational database
- **Sequelize** - ORM for database operations
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation

### Testing

- **Jest** - Testing framework
- **React Testing Library** - Frontend testing utilities
- **Supertest** - API testing

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MySQL** (v8.0 or higher)
- **Git**

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-health-app
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root directory
cd ..
```

### 3. Database Setup

1. **Create MySQL Database**:

   ```sql
   CREATE DATABASE ai_health_db;
   ```

2. **Configure Environment Variables**:

   ```bash
   # Copy the example environment file
   cp backend/.env.example backend/.env
   ```

3. **Update Database Configuration** in `backend/.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=ai_health_db
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   ```

### 4. Database Migration & Seeding

```bash
# Navigate to backend directory
cd backend

# Run database migrations (tables will be created automatically)
npm run dev

# Seed sample data (optional)
node seeders/sampleData.js
```

### 5. Start the Application

```bash
# From root directory - starts both frontend and backend
npm run dev

# Or start individually:
# Backend (from backend directory)
npm run dev

# Frontend (from frontend directory)
npm start
```

The application will be available at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Test Coverage

```bash
# Backend coverage
cd backend
npm test -- --coverage

# Frontend coverage
cd frontend
npm test -- --coverage --watchAll=false
```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint             | Description       |
| ------ | -------------------- | ----------------- |
| POST   | `/api/auth/register` | Register new user |
| POST   | `/api/auth/login`    | User login        |
| GET    | `/api/auth/me`       | Get current user  |
| POST   | `/api/auth/logout`   | User logout       |
| POST   | `/api/auth/refresh`  | Refresh JWT token |

### User Management

| Method | Endpoint                 | Description             |
| ------ | ------------------------ | ----------------------- |
| GET    | `/api/users/profile`     | Get user profile        |
| PUT    | `/api/users/profile`     | Update user profile     |
| PUT    | `/api/users/preferences` | Update user preferences |
| PUT    | `/api/users/password`    | Change password         |
| GET    | `/api/users/stats`       | Get user statistics     |

### Alerts Management

| Method | Endpoint                      | Description                 |
| ------ | ----------------------------- | --------------------------- |
| GET    | `/api/alerts`                 | Get user alerts (paginated) |
| POST   | `/api/alerts`                 | Create new alert            |
| GET    | `/api/alerts/:id`             | Get specific alert          |
| PUT    | `/api/alerts/:id`             | Update alert                |
| DELETE | `/api/alerts/:id`             | Delete alert                |
| PUT    | `/api/alerts/:id/acknowledge` | Acknowledge alert           |
| PUT    | `/api/alerts/:id/resolve`     | Resolve alert               |

### Diagnostic Tests

| Method | Endpoint                         | Description                |
| ------ | -------------------------------- | -------------------------- |
| GET    | `/api/diagnostic-tests`          | Get user tests (paginated) |
| POST   | `/api/diagnostic-tests`          | Create new test            |
| GET    | `/api/diagnostic-tests/:id`      | Get specific test          |
| PUT    | `/api/diagnostic-tests/:id`      | Update test                |
| DELETE | `/api/diagnostic-tests/:id`      | Delete test                |
| GET    | `/api/diagnostic-tests/recent`   | Get recent tests           |
| GET    | `/api/diagnostic-tests/abnormal` | Get abnormal tests         |

## 🗄 Database Schema

### Users Table

- `id` (Primary Key)
- `name` (String, Required)
- `email` (String, Unique, Required)
- `password` (String, Hashed, Required)
- `preferences` (JSON)
- `isActive` (Boolean, Default: true)
- `lastLogin` (DateTime)
- `createdAt`, `updatedAt` (Timestamps)

### Alerts Table

- `id` (Primary Key)
- `title` (String, Required)
- `message` (Text)
- `status` (Enum: active, acknowledged, resolved, dismissed)
- `priority` (Enum: low, medium, high, critical)
- `type` (Enum: general, health, system, diagnostic, reminder)
- `userId` (Foreign Key)
- `metadata` (JSON)
- `acknowledgedAt`, `resolvedAt` (DateTime)
- `createdAt`, `updatedAt` (Timestamps)

### DiagnosticTests Table

- `id` (Primary Key)
- `name` (String, Required)
- `result` (Text, Required)
- `date` (Date, Required)
- `testType` (Enum: blood, urine, imaging, cardiac, neurological, genetic, general)
- `status` (Enum: pending, completed, reviewed, cancelled)
- `normalRange` (String)
- `units` (String)
- `notes` (Text)
- `userId` (Foreign Key)
- `doctorName`, `labName` (String)
- `isAbnormal` (Boolean, Default: false)
- `attachments` (JSON Array)
- `createdAt`, `updatedAt` (Timestamps)

## 🔐 Demo Credentials

After running the seeder, you can use these demo accounts:

```
Email: john.doe@example.com
Password: password123

Email: jane.smith@example.com
Password: password123

Email: dr.johnson@example.com
Password: password123
```

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
DB_HOST=your_production_db_host
DB_NAME=your_production_db_name
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password
JWT_SECRET=your_production_jwt_secret
CLIENT_URL=https://your-frontend-domain.com
```

### Build for Production

```bash
# Build frontend
cd frontend
npm run build

# The build folder contains the production-ready frontend files
```

### Docker Deployment (Optional)

Create a `Dockerfile` in the root directory:

```dockerfile
# Multi-stage build
FROM node:16-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM node:16-alpine AS backend
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --only=production
COPY backend/ ./
COPY --from=frontend-build /app/frontend/build ./public

EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing Strategy

### Backend Testing

- **Authentication Tests**: Login, registration, token validation
- **Database Tests**: Model validation, relationships, CRUD operations
- **API Tests**: Endpoint functionality, error handling, authorization

### Frontend Testing

- **Component Tests**: Rendering, user interactions, form validation
- **Integration Tests**: Authentication flow, protected routes
- **E2E Tests**: Complete user workflows

### Test Coverage Goals

- Backend: >90% code coverage
- Frontend: >80% code coverage
- Critical paths: 100% coverage

## 🔧 Development Guidelines

### Code Style

- ESLint configuration for consistent code style
- Prettier for code formatting
- Conventional commit messages

### Git Workflow

```bash
# Feature development
git checkout -b feature/feature-name
git commit -m "feat: add new feature"
git push origin feature/feature-name
```

### Database Migrations

```bash
# Create new migration
npx sequelize-cli migration:generate --name migration-name

# Run migrations
npx sequelize-cli db:migrate

# Rollback migration
npx sequelize-cli db:migrate:undo
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**

   - Verify MySQL is running
   - Check database credentials in `.env`
   - Ensure database exists

2. **Port Already in Use**

   ```bash
   # Kill process on port 5000
   lsof -ti:5000 | xargs kill -9

   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   ```

3. **JWT Token Issues**

   - Clear browser localStorage
   - Check JWT_SECRET in environment variables
   - Verify token expiration settings

4. **CORS Issues**
   - Verify CLIENT_URL in backend `.env`
   - Check proxy setting in frontend `package.json`

### Debug Mode

```bash
# Backend debug mode
cd backend
DEBUG=* npm run dev

# Frontend with verbose logging
cd frontend
REACT_APP_DEBUG=true npm start
```

## 📈 Performance Optimization

### Frontend

- React Query for efficient data caching
- Lazy loading of components
- Image optimization
- Bundle size optimization

### Backend

- Database query optimization
- Response caching
- Connection pooling
- Rate limiting

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- SQL injection prevention with Sequelize
- XSS protection with helmet
- CORS configuration
- Rate limiting on API endpoints

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📞 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the troubleshooting section
- Review the API documentation

## 🎯 Future Enhancements

- [ ] Real-time notifications with WebSocket
- [ ] Mobile app with React Native
- [ ] Advanced analytics and reporting
- [ ] Integration with wearable devices
- [ ] Telemedicine features
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Export data functionality
- [ ] Advanced search and filtering
- [ ] Role-based access control

---

**Built with ❤️ for better health management**
