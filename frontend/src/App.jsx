import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import Login from './components/auth/Login';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DashboardLayout from './components/layout/DashboardLayout';
import AdminPage from './pages/admin/AdminPage';
import UserPage from './pages/user/UserPage';
import ProfilePage from './pages/shared/ProfilePage';
import AdminAccountManagementPage from './pages/admin/AdminAccountManagementPage';
import AdminAccountDetailPage from './pages/admin/AdminAccountDetailPage';
import AdminApartmentManagementPage from './pages/admin/AdminApartmentManagementPage';
import AdminApartmentDetailPage from './pages/admin/AdminApartmentDetailPage';
import AdminApartmentMembersPage from './pages/admin/AdminApartmentMembersPage';
import AdminApartmentBillsPage from './pages/admin/AdminApartmentBillsPage';
import UserApartmentPage from './pages/user/UserApartmentPage';
import UserApartmentMembersPage from './pages/user/UserApartmentMembersPage';
import UserReportsPage from './pages/user/UserReportsPage';
import UserReportDetailPage from './pages/user/UserReportDetailPage';
import AdminReportManagementPage from './pages/admin/AdminReportManagementPage';
import AdminReportDetailPage from './pages/admin/AdminReportDetailPage';
import AdminBillManagementPage from './pages/admin/AdminBillManagementPage';
import AdminBillDetailPage from './pages/admin/AdminBillDetailPage';

import UserBillsPage from './pages/user/UserBillsPage';
import UserInvoicesPage from './pages/user/UserInvoicesPage';
import UserInvoiceDetailPage from './pages/user/UserInvoiceDetailPage';
import AdminInvoiceManagementPage from './pages/admin/AdminInvoiceManagementPage';
import AdminInvoiceDetailPage from './pages/admin/AdminInvoiceDetailPage';
import AdminPaymentManagementPage from './pages/admin/AdminPaymentManagementPage';
import UserNotificationsPage from './pages/user/UserNotificationsPage';
import AdminNotificationManagementPage from './pages/admin/AdminNotificationManagementPage';
import AdminCampaignManagementPage from './pages/admin/AdminCampaignManagementPage';
import AdminCampaignDetailPage from './pages/admin/AdminCampaignDetailPage';
import AdminContributionDetailPage from './pages/admin/AdminContributionDetailPage';
import UserContributionsPage from './pages/user/UserContributionsPage';
import UserContributionDetailPage from './pages/user/UserContributionDetailPage';

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
            element={<Navigate to="/admin-bills" replace />}
          />
          <Route
            path="/my-bills"
            element={
              <ProtectedRoute allowedRole="USER">
                <UserBillsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-invoices"
            element={
              <ProtectedRoute allowedRole="USER">
                <UserInvoicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-invoice/:invoiceId"
            element={
              <ProtectedRoute allowedRole="USER">
                <UserInvoiceDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-invoices"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AdminInvoiceManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-invoice/:invoiceId"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AdminInvoiceDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-payments"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AdminPaymentManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-notifications"
            element={
              <ProtectedRoute allowedRole="USER">
                <UserNotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-notifications"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AdminNotificationManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-campaigns"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AdminCampaignManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-campaign/:campaignId"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AdminCampaignDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-contribution/:contributionId"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AdminContributionDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-contributions"
            element={
              <ProtectedRoute allowedRole="USER">
                <UserContributionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-contribution/:contributionId"
            element={
              <ProtectedRoute allowedRole="USER">
                <UserContributionDetailPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
