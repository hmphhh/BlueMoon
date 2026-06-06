import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import Login from './components/Login';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardLayout from './components/DashboardLayout';
import AdminPage from './pages/AdminPage';
import UserPage from './pages/UserPage';
import ProfilePage from './pages/ProfilePage';
import AdminAccountManagementPage from './pages/AdminAccountManagementPage';
import AdminAccountDetailPage from './pages/AdminAccountDetailPage';
import AdminApartmentManagementPage from './pages/AdminApartmentManagementPage';
import AdminApartmentDetailPage from './pages/AdminApartmentDetailPage';
import AdminApartmentMembersPage from './pages/AdminApartmentMembersPage';
import AdminApartmentBillsPage from './pages/AdminApartmentBillsPage';
import UserApartmentPage from './pages/UserApartmentPage';
import UserApartmentMembersPage from './pages/UserApartmentMembersPage';
import UserReportsPage from './pages/UserReportsPage';
import UserReportDetailPage from './pages/UserReportDetailPage';
import AdminReportManagementPage from './pages/AdminReportManagementPage';
import AdminReportDetailPage from './pages/AdminReportDetailPage';
import AdminBillManagementPage from './pages/AdminBillManagementPage';
import AdminBillDetailPage from './pages/AdminBillDetailPage';
import AdminBillTemplatePage from './pages/AdminBillTemplatePage';
import UserBillsPage from './pages/UserBillsPage';

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
          <Route path="/login" element={<Login setUser={handleSetUser} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
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
            path="/my-apartment"
            element={
              <ProtectedRoute allowedRole="USER">
                <UserApartmentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-apartment/members"
            element={
              <ProtectedRoute allowedRole="USER">
                <UserApartmentMembersPage />
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
          <Route
            path="/accounts"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AdminAccountManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/:userId"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AdminAccountDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/apartments"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AdminApartmentManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/apartment/:apartmentId"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AdminApartmentDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/apartment/:apartmentId/members"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AdminApartmentMembersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/apartment/:apartmentId/bills"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AdminApartmentBillsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRole="USER">
                <UserReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report/:reportId"
            element={
              <ProtectedRoute allowedRole="USER">
                <UserReportDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-reports"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AdminReportManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-report/:reportId"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AdminReportDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-bills"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AdminBillManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-bill/:billId"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AdminBillDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-bill-templates"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AdminBillTemplatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bills"
            element={
              <ProtectedRoute allowedRole="USER">
                <UserBillsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}