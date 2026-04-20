import logo from './logo.svg';
import './App.css';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
        <Route path="/studybuddy" element={<Navigate to="/login" replace />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
