import './App.css';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import GlobalNavbar from './components/GlobalNavbar';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import LandingPage from './pages/LandingPage';
import StudentDashboard from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import ContentGenerator from './pages/ContentGenerator';
import QuizGenerator from './pages/QuizGenerator';
import FocusRoom from './pages/FocusRoom';
import StudyRoomList from './pages/StudyRoomList';
import ActiveStudyRoom from './pages/ActiveStudyRoom';
import Mentorship from './pages/Mentorship';
import InstructorMentorship from './pages/InstructorMentorship';
import MentorshipCall from './pages/MentorshipCall';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('studybuddy-theme');
    return saved ? saved === 'dark' : false;
  });

  // Apply dark mode to document
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (isDark) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
    localStorage.setItem('studybuddy-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <Router>
      <GlobalNavbar isDark={isDark} setIsDark={setIsDark} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/studybuddy" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/instructor-dashboard" element={<InstructorDashboard />} />
        <Route path="/content-generator" element={<ContentGenerator />} />
        <Route path="/quiz-generator" element={<QuizGenerator />} />
        <Route path="/focusrooms" element={<FocusRoom />} />
        <Route path="/mentorship" element={<Mentorship />} />
        <Route path="/instructor-mentorship" element={<InstructorMentorship />} />
        <Route path="/mentorship-call/:callId" element={<MentorshipCall />} />
        <Route path="/studyroom" element={<StudyRoomList />} />
        <Route path="/studyroom/:roomId" element={<ActiveStudyRoom />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
