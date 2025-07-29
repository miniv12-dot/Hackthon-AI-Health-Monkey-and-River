# Railway MySQL Database Setup Documentation

This document provides complete instructions for connecting your AI Health Management System to Railway MySQL database.

## Table of Contents

1. [Overview](#overview)
2. [Railway MySQL Configuration](#railway-mysql-configuration)
3. [Environment Setup](#environment-setup)
4. [Database Configuration](#database-configuration)
5. [Model Fixes](#model-fixes)
6. [Testing Results](#testing-results)
7. [Deployment Guide](#deployment-guide)
8. [Troubleshooting](#troubleshooting)

## Overview

Railway provides a managed MySQL database service that's perfect for production applications. This setup guide covers:

- Connecting your Node.js/Express backend to Railway MySQL
- Configuring Sequelize ORM for Railway
- Environment variable setup
- Testing all API endpoints
- Production deployment considerations

## Railway MySQL Configuration

### Connection Details

Your Railway MySQL instance has the following configuration:

- **Host**: `gondola.proxy.rlwy.net`
- **Port**: `19685`
- **Database**: `railway`
- **Username**: `root`
- **Password**: `zcVcCumFZjtaLeEzSdZlVDbJuYzqprUN`

### Connection String

```
mysql://root:zcVcCumFZjtaLeEzSdZlVDbJuYzqprUN@gondola.proxy.rlwy.net:19685/railway
```

## Environment Setup

### 1. Create `.env` File

Create `backend/.env` with the following configuration:

```env
# Railway MySQL Database Connection
DATABASE_URL=mysql://root:zcVcCumFZjtaLeEzSdZlVDbJuYzqprUN@gondola.proxy.rlwy.net:19685/railway

# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# JWT Configuration (change this secret for production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
```

### 2. Environment Variables Explanation

- `DATABASE_URL`: Complete MySQL connection string for Railway
- `PORT`: Server port (Railway will override this in production)
- `NODE_ENV`: Environment mode (development/production)
- `CLIENT_URL`: Frontend URL for CORS configuration
- `JWT_SECRET`: Secret key for JWT token signing
- `JWT_EXPIRES_IN`: JWT token expiration time

## Database Configuration

### Updated `backend/config/database.js`

```javascript
const { Sequelize } = require("sequelize");
require("dotenv").config();

// Railway MySQL connection string or individual environment variables
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "mysql://root:zcVcCumFZjtaLeEzSdZlVDbJuYzqprUN@gondola.proxy.rlwy.net:19685/railway";

const sequelize = DATABASE_URL
  ? new Sequelize(DATABASE_URL, {
      dialect: "mysql",
      logging: process.env.NODE_ENV === "development" ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true,
      },
      dialectOptions: {
        ssl:
          process.env.NODE_ENV === "production"
            ? {
                require: true,
                rejectUnauthorized: false,
              }
            : false,
      },
    })
  : new Sequelize(
      process.env.DB_NAME || "ai_health_db",
      process.env.DB_USER || "root",
      process.env.DB_PASSWORD || "",
      {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        dialect: "mysql",
        logging: process.env.NODE_ENV === "development" ? console.log : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
        define: {
          timestamps: true,
          underscored: true,
          freezeTableName: true,
        },
      }
    );

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
    return true;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
};
```

### Key Configuration Features

- **Dual Configuration**: Supports both connection string and individual variables
- **SSL Support**: Automatically enables SSL for production
- **Connection Pooling**: Optimized for Railway's connection limits
- **Underscored Fields**: Converts camelCase to snake_case in database
- **Logging**: Enabled in development, disabled in production

## Model Fixes

### Issue: Index Field Name Mismatch

Due to the `underscored: true` setting, Sequelize converts camelCase field names to snake_case in the database. The models needed index fixes:

### Fixed `backend/models/Alert.js`

```javascript
// Changed from:
indexes: [
  { fields: ["userId"] }, // ❌ This becomes 'userId' but DB has 'user_id'
];

// Changed to:
indexes: [
  { fields: ["user_id"] }, // ✅ Matches actual database column name
];
```

### Fixed `backend/models/DiagnosticTest.js`

```javascript
// Changed from:
indexes: [{ fields: ["userId"] }, { fields: ["testType"] }];

// Changed to:
indexes: [{ fields: ["user_id"] }, { fields: ["test_type"] }];
```

## Testing Results

### ✅ Database Connection & Schema

- Railway MySQL connection established successfully
- All tables created: `users`, `alerts`, `diagnostic_tests`
- Foreign key relationships working properly
- Indexes created correctly with proper field names

### ✅ Authentication System

```bash
# User Registration Test
POST http://localhost:5000/api/auth/register
Body: {"name":"Test User","email":"test@example.com","password":"password123"}
Result: ✅ User created, JWT token returned

# User Login Test
POST http://localhost:5000/api/auth/login
Body: {"email":"test@example.com","password":"password123"}
Result: ✅ Login successful, JWT token returned, last_login updated
```

### ✅ API Endpoints Tested

```bash
# Health Check
GET http://localhost:5000/api/health
Result: ✅ {"status":"OK","database":"Connected"}

# Create Alert
POST http://localhost:5000/api/alerts
Headers: Authorization: Bearer <token>
Body: {"title":"Test Alert","message":"Test message","priority":"high","type":"health"}
Result: ✅ Alert created in Railway MySQL

# Get Alerts
GET http://localhost:5000/api/alerts
Headers: Authorization: Bearer <token>
Result: ✅ Alerts retrieved from Railway MySQL

# Update Alert
PUT http://localhost:5000/api/alerts/1
Headers: Authorization: Bearer <token>
Body: {"status":"acknowledged"}
Result: ✅ Alert updated, acknowledgedAt timestamp set

# Create Diagnostic Test
POST http://localhost:5000/api/diagnostic-tests
Headers: Authorization: Bearer <token>
Body: {"name":"Blood Test","result":"Normal","date":"2024-01-29","testType":"blood"}
Result: ✅ Test created in Railway MySQL

# Get Diagnostic Tests
GET http://localhost:5000/api/diagnostic-tests
Headers: Authorization: Bearer <token>
Result: ✅ Tests retrieved from Railway MySQL

# Get User Profile
GET http://localhost:5000/api/users/profile
Headers: Authorization: Bearer <token>
Result: ✅ User profile retrieved from Railway MySQL
```

### ✅ Security & Error Handling

```bash
# No Token Test
GET http://localhost:5000/api/alerts
Result: ✅ {"message":"Access denied. No token provided."}

# Invalid Token Test
GET http://localhost:5000/api/alerts
Headers: Authorization: Bearer invalid_token
Result: ✅ {"message":"Access denied. Invalid token."}

# Invalid Credentials Test
POST http://localhost:5000/api/auth/login
Body: {"email":"test@example.com","password":"wrongpassword"}
Result: ✅ {"message":"Invalid email or password"}
```

## Deployment Guide

### 1. Railway Deployment

When deploying to Railway, the platform will automatically:

- Set the `DATABASE_URL` environment variable
- Override the `PORT` environment variable
- Enable SSL connections

### 2. Environment Variables for Production

Set these in your Railway dashboard:

```env
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.com
JWT_SECRET=your-production-jwt-secret-key
JWT_EXPIRES_IN=24h
```

### 3. Database Migration

Railway MySQL will automatically:

- Create tables on first run
- Apply schema changes with `sequelize.sync({ alter: true })`
- Maintain data integrity

### 4. Health Check Endpoint

Monitor your deployment using:

```
GET https://your-app.railway.app/api/health
```

## Troubleshooting

### Common Issues & Solutions

#### 1. Connection Refused

**Problem**: `ECONNREFUSED` error
**Solution**:

- Verify Railway MySQL service is running
- Check connection string format
- Ensure port 19685 is correct

#### 2. SSL Connection Issues

**Problem**: SSL handshake errors in production
**Solution**:

```javascript
dialectOptions: {
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
}
```

#### 3. Index Creation Errors

**Problem**: `Key column 'userId' doesn't exist`
**Solution**: Use snake_case field names in indexes:

```javascript
indexes: [
  { fields: ["user_id"] }, // Not 'userId'
  { fields: ["test_type"] }, // Not 'testType'
];
```

#### 4. Authentication Issues

**Problem**: JWT tokens not working
**Solution**:

- Verify `JWT_SECRET` is set
- Check token format: `Bearer <token>`
- Ensure middleware is properly configured

#### 5. CORS Issues

**Problem**: Frontend can't connect to API
**Solution**: Update `CLIENT_URL` in environment variables

### Database Schema

The following tables are automatically created:

#### Users Table

```sql
CREATE TABLE users (
  id INTEGER AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  preferences JSON,
  is_active TINYINT(1) DEFAULT true,
  last_login DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

#### Alerts Table

```sql
CREATE TABLE alerts (
  id INTEGER AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  status ENUM('active', 'acknowledged', 'resolved', 'dismissed') DEFAULT 'active',
  priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  type VARCHAR(50) DEFAULT 'general',
  user_id INTEGER NOT NULL,
  metadata JSON,
  acknowledged_at DATETIME,
  resolved_at DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Diagnostic Tests Table

```sql
CREATE TABLE diagnostic_tests (
  id INTEGER AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  result TEXT NOT NULL,
  date DATE NOT NULL,
  test_type VARCHAR(100) DEFAULT 'general',
  status ENUM('pending', 'completed', 'reviewed', 'cancelled') DEFAULT 'completed',
  normal_range VARCHAR(255),
  units VARCHAR(50),
  notes TEXT,
  user_id INTEGER NOT NULL,
  doctor_name VARCHAR(255),
  lab_name VARCHAR(255),
  is_abnormal TINYINT(1) DEFAULT false,
  attachments JSON,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Performance Optimization

### Connection Pooling

```javascript
pool: {
  max: 5,        // Maximum connections
  min: 0,        // Minimum connections
  acquire: 30000, // Maximum time to get connection
  idle: 10000    // Maximum idle time
}
```

### Query Optimization

- Indexes are automatically created on foreign keys
- Additional indexes on frequently queried fields
- Proper use of `LIMIT` and `ORDER BY` in queries

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secrets**: Use strong, unique secrets in production
3. **Password Hashing**: bcryptjs with salt rounds
4. **SQL Injection**: Sequelize provides automatic protection
5. **CORS**: Configure proper origins for production

## Monitoring & Logging

### Health Check

```javascript
app.get("/api/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: "OK",
      database: "Connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      database: "Disconnected",
      error: error.message,
    });
  }
});
```

### Database Logging

- Development: SQL queries logged to console
- Production: Logging disabled for performance

## Support & Resources

- **Railway Documentation**: https://docs.railway.app/
- **Sequelize Documentation**: https://sequelize.org/
- **MySQL Documentation**: https://dev.mysql.com/doc/

---

**Last Updated**: January 29, 2025
**Status**: ✅ Production Ready
**Tested**: All endpoints verified working with Railway MySQL
