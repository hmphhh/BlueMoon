import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import Login from './components/Login';
import DashboardLayout from './components/DashboardLayout';
import AdminPage from './pages/AdminPage';
import UserPage from './pages/UserPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser && savedUser !== 'undefined') {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      localStorage.removeItem('user');
    }
    return null;
  });

  const handleSetUser = (userDataOrFn) => {
    if (typeof userDataOrFn === 'function') {
      setUser(prev => {
        const newUser = userDataOrFn(prev);
        if (newUser) {
          localStorage.setItem('user', JSON.stringify(newUser));
        } else {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
        return newUser;
      });
    } else {
      if (userDataOrFn) {
        localStorage.setItem('user', JSON.stringify(userDataOrFn));
      } else {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
      setUser(userDataOrFn);
    }
  };

  const ProtectedRoute = ({ children, allowedRole }) => {
    if (!user) return <Navigate to="/" />;
    if (allowedRole && user.role !== allowedRole) return <Navigate to="/" />;
    return (
      <DashboardLayout user={user} setUser={handleSetUser}>
        {children}
      </DashboardLayout>
    );
  };

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login setUser={handleSetUser} />} />
          <Route
            path="/admin-panel"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AdminPage user={user} setUser={handleSetUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resident-home"
            element={
              <ProtectedRoute allowedRole="USER">
                <UserPage user={user} setUser={handleSetUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage user={user} setUser={handleSetUser} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}