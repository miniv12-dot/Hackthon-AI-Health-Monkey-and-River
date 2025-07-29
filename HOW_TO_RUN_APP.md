# How to Run the AI Health Management System

## 🚀 Starting the Application

### Method 1: Start Both Services Separately

**Terminal 1 - Backend (API Server):**

```bash
cd backend
npm start
```

- Backend will run on: http://localhost:5000
- Health check: http://localhost:5000/api/health

**Terminal 2 - Frontend (React App):**

```bash
cd frontend
npm start
```

- Frontend will run on: http://localhost:3000
- Will automatically open in your browser

### Method 2: Quick Start (Root Directory)

```bash
# Install all dependencies
npm run install-deps

# Start both backend and frontend
npm run dev
```

## 🛑 Stopping the Application

### To Stop Running Servers:

1. **In each terminal window**, press: `Ctrl + C` (Windows/Linux) or `Cmd + C` (Mac)
2. This will gracefully shut down the servers

### Force Stop (if needed):

- **Windows**: `Ctrl + C` then `Y` if prompted
- **Mac/Linux**: `Ctrl + C` then `killall node` if processes persist

## 📱 Accessing the Application

Once both servers are running:

1. **Open your browser** and go to: http://localhost:3000
2. **Register a new account** or **login** with existing credentials
3. **Explore the features**:
   - Dashboard with health overview
   - Alerts management
   - Diagnostic tests tracking
   - User profile settings

## 🔧 Development Commands

```bash
# Backend only
cd backend
npm start          # Start server
npm run dev        # Start with nodemon (auto-restart)
npm test           # Run tests

# Frontend only
cd frontend
npm start          # Start React development server
npm test           # Run React tests
npm run build      # Build for production

# Root directory
npm run install-deps    # Install all dependencies
npm run dev            # Start both services
npm test              # Run all tests
```

## 🗄️ Database Status

- **Database**: Railway MySQL ✅ Connected
- **Connection**: Automatic on server start
- **Tables**: Auto-created (users, alerts, diagnostic_tests)
- **Health Check**: http://localhost:5000/api/health

## 🔍 Troubleshooting

### Port Already in Use:

```bash
# Kill process on port 3000 (frontend)
npx kill-port 3000

# Kill process on port 5000 (backend)
npx kill-port 5000
```

### Database Connection Issues:

1. Check Railway MySQL service status
2. Verify `.env` file in backend directory
3. Test connection: http://localhost:5000/api/health

### Frontend Won't Load:

1. Ensure backend is running first
2. Check console for CORS errors
3. Verify API endpoints are accessible

## 📋 Quick Status Check

**Backend Running?** ✅ Check: http://localhost:5000/api/health
**Frontend Running?** ✅ Check: http://localhost:3000
**Database Connected?** ✅ Check health endpoint response

## 🎯 Default Test User

For testing purposes, you can create a user or use:

- **Email**: test@example.com
- **Password**: password123
- **Name**: Test User

---

**Need help?** Check the detailed documentation:

- [Railway MySQL Setup](./RAILWAY_MYSQL_SETUP.md)
- [Quick Reference](./RAILWAY_QUICK_REFERENCE.md)
