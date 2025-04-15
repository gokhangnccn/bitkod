import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Code2,
    Terminal,
    LogIn,
    UserPlus,
    User,
    LogOut,
    Menu,
    X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (path: string) => location.pathname === path;

    const navigation = [
        { to: '/problems', label: 'Sorular', icon: <Terminal className="h-5 w-5 mr-2" /> },
        { to: '/account', label: 'Profilim', icon: <User className="h-5 w-5 mr-2" /> },
        { to: '/leaderboard', label: 'Sıralama', icon: <User className="h-5 w-5 mr-2" /> },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 text-indigo-600">
                            <Code2 className="w-7 h-7" />
                            <span className="text-xl font-bold text-gray-800">BitCode</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden sm:flex items-center gap-6">
                            {isAuthenticated &&
                                navigation.map((item) => (
                                    <Link
                                        key={item.to}
                                        to={item.to}
                                        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                                            isActive(item.to)
                                                ? 'bg-indigo-100 text-indigo-700'
                                                : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </Link>
                                ))}
                        </div>

                        {/* Desktop Auth Buttons */}
                        <div className="hidden sm:flex items-center gap-4">
                            {isAuthenticated ? (
                                <>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <User className="h-4 w-4" />
                                        <span>{user?.email}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition"
                                    >
                                        <LogOut className="h-4 w-4 inline-block mr-2" />
                                        Çıkış
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="px-4 py-2 border border-indigo-600 text-indigo-600 text-sm rounded-md hover:bg-indigo-50"
                                    >
                                        <LogIn className="h-4 w-4 inline-block mr-2" />
                                        Giriş
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                                    >
                                        <UserPlus className="h-4 w-4 inline-block mr-2" />
                                        Kayıt Ol
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="sm:hidden">
                            <button
                                onClick={() => setMobileOpen(!mobileOpen)}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileOpen && (
                    <div className="sm:hidden px-4 pb-4">
                        {isAuthenticated &&
                            navigation.map((item) => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    onClick={() => setMobileOpen(false)}
                                    className={`block px-4 py-2 rounded-md text-sm font-medium transition ${
                                        isActive(item.to)
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            ))}

                        <div className="mt-4 border-t pt-4">
                            {isAuthenticated ? (
                                <>
                                    <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                                        <User className="h-4 w-4" />
                                        <span>{user?.email}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition"
                                    >
                                        <LogOut className="h-4 w-4 inline-block mr-2" />
                                        Çıkış
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                                    >
                                        <LogIn className="h-4 w-4 inline-block mr-2" />
                                        Giriş
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                                    >
                                        <UserPlus className="h-4 w-4 inline-block mr-2" />
                                        Kayıt Ol
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* Page Content */}
            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
    );
}