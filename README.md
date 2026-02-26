# StudyBuddy - Learning Management System

A full-stack web application for students and teachers to manage courses, assignments, and learning materials.

## 🚀 Quick Start

### Prerequisites
- Node.js installed
- MongoDB Atlas account (or local MongoDB)
- Git (optional)

### Starting the Application

**Option 1: Use the Startup Script (Recommended)**
```powershell
.\start-dev.ps1
```

**Option 2: Manual Start**

Open two separate terminals:

**Terminal 1 - Backend:**
```powershell
cd backend
node server.js
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm start
```

### Accessing the Application

Once both servers are running:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📁 Project Structure

```
StudyBuddy/
├── backend/              # Node.js/Express backend
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── .env             # Environment variables
│   └── server.js        # Backend entry point
│
├── frontend/            # React frontend
│   ├── public/          # Static files
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── App.js       # Main app component
│   └── package.json
│
├── start-dev.ps1        # Development startup script
└── README.md
```

## 🔧 Technology Stack

### Frontend
- React 19
- React Router
- Axios
- TailwindCSS
- Lucide React Icons

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcrypt for password hashing

## 📝 Important Notes

### Why Do I Need to Start Servers Every Time?

This is a **development environment**. The servers are not persistent and only run while the terminal commands are active. They stop when:
- You close the terminal
- You restart your computer
- You close VS Code (if terminals were inside VS Code)

### Production Deployment

For production, you would:
1. Build the frontend: `npm run build` in the frontend directory
2. Deploy the backend to a hosting service (Heroku, Railway, etc.)
3. Deploy the frontend build to a static hosting service (Vercel, Netlify, etc.)
4. Use environment variables for production MongoDB and JWT secrets

## 🔐 Environment Variables

Create a `.env` file in the `backend` directory:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Network Error" when registering/logging in | Make sure backend server is running on port 5000 |
| "Cannot GET /" on port 3000 | Make sure frontend server is running |
| Port already in use | Close the previous server or change the port |
| MongoDB connection error | Check your `.env` file and internet connection |

## 📚 Features

- ✅ User Authentication (Student/Teacher roles)
- ✅ JWT-based authorization
- ✅ Secure password hashing
- ✅ Role-based access control
- 🚧 Course management (coming soon)
- 🚧 Assignment submission (coming soon)
- 🚧 Grade tracking (coming soon)

## 👥 User Roles

- **Student**: Can enroll in courses, submit assignments, view grades
- **Teacher**: Can create courses, manage assignments, grade submissions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is for educational purposes.
