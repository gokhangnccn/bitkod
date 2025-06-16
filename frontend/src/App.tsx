import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Problems } from './pages/Problems';
import { ProblemSolve } from './pages/ProblemSolve';
import { AuthProvider } from './context/AuthContext';
import Account from "./pages/Account";
import Leaderboard from "./pages/LeaderBoard";
import OAuth2Redirect from './pages/OAuth2Redirect';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminRoutes from './admin/AdminRoutes';

function App() {
    const isAdminSubdomain = window.location.hostname.startsWith('admin.');

    return (
        <BrowserRouter>
            <AuthProvider>
                <Toaster position="top-center" richColors />
                {isAdminSubdomain ? (
                    <AdminRoutes />
                ) : (
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/account" element={<Account />} />
                            <Route path="/leaderboard" element={<Leaderboard />} />
                            <Route path="/problems" element={<Problems />} />
                            <Route path="/problems/:uid" element={<ProblemSolve />} />
                            <Route path="/oauth2-success" element={<OAuth2Redirect />} />
                            <Route path="/verify-email" element={<VerifyEmailPage />} />
                            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                            <Route path="/reset-password" element={<ResetPasswordPage />} />
                            <Route path="/admin/*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Layout>
                )}
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;