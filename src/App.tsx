import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { useAuth } from './context/AuthContext';

// pages
import DefaultPage from './pages/DefaultPage';
import HomePage from './pages/HomePage';
import CreateEventPage from './pages/CreateEventPage';
import EditEventPage from './pages/EditEventPage';
import EventDetailPage from './pages/EventDetailPage';
import Help from './components/help';
import CreateAccountPage from './pages/CreateAccountPage';
import CalendarPage from './pages/CalendarPage';
import MyProfile from './pages/MyProfile';
import SignInPage from './pages/SignInPage';
import EventCreatedPage from './pages/EventsCreatedPage';

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { user } = useAuth();
  if (!user && window.location.pathname !== "/") {
  return <Navigate to="/" replace />;
}
  return children;
};

const App: React.FC = () => {
  return (
    <>
      <Navbar />
      <Routes>
       <Route path="/" element={<DefaultPage />} />
        <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><CreateEventPage /></ProtectedRoute>} />
        <Route path="/manage" element={<CreateAccountPage />} />
        <Route path="/events/:id" element={<ProtectedRoute><EventDetailPage /></ProtectedRoute>} />
        <Route path="/events/:id/edit" element={<ProtectedRoute><EditEventPage /></ProtectedRoute>} />
        <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
        <Route path="/event-created" element={<ProtectedRoute><EventCreatedPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/login" element={<SignInPage />} />
      </Routes>
    </>
  );
};

export default App;