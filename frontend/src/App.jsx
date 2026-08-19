import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Shell from './components/Shell';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Reserves from './pages/Reserves';
import Logistics from './pages/Logistics';
import FSA from './pages/FSA';
import Crisis from './pages/Crisis';

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/" element={<ProtectedRoute><Shell><Dashboard /></Shell></ProtectedRoute>} />
      <Route path="/reserves" element={<ProtectedRoute><Shell><Reserves /></Shell></ProtectedRoute>} />
      <Route path="/logistics" element={<ProtectedRoute><Shell><Logistics /></Shell></ProtectedRoute>} />
      <Route path="/fsa" element={<ProtectedRoute><Shell><FSA /></Shell></ProtectedRoute>} />
      <Route path="/crisis" element={<ProtectedRoute><Shell><Crisis /></Shell></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
