import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './admin/components/AdminLayout';
import Dashboard from './admin/pages/Dashboard';
import UsersPage from './admin/pages/UsersPage';
import ReportsPage from './admin/pages/ReportsPage';
import ProblemsPage from './admin/pages/ProblemsPage';
import ProblemCreatePage from './admin/pages/ProblemCreatePage';
import ProblemEditPage from './admin/pages/ProblemEditPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import Loader from './components/Loader.tsx';

function AdminRoutes() {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <Loader fullHeight />;
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role !== 'ADMIN') {
    // Normal user yanlışlıkla admin subdomainine girdiyse siteye yönlendir.
    window.location.href = 'https://www.bitkod.org';
    return null;
  }
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/problems" element={<ProblemsPage />} />
        <Route path="/problems/create" element={<ProblemCreatePage />} />
        <Route path="/problems/:id/edit" element={<ProblemEditPage />} />
      </Routes>
    </AdminLayout>
  );
}

export default function AdminApp() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/*" element={<AdminRoutes />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
} 