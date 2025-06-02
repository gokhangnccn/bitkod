import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/UsersPage';
import ProblemsPage from './pages/ProblemsPage';
import ProblemCreatePage from './pages/ProblemCreatePage';
import ProblemEditPage from './pages/ProblemEditPage';
import ReportsPage from './pages/ReportsPage';

export default function AdminRoutes() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="problems" element={<ProblemsPage />} />
        <Route path="problems/create" element={<ProblemCreatePage />} />
        <Route path="problems/:id/edit" element={<ProblemEditPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AdminLayout>
  );
} 