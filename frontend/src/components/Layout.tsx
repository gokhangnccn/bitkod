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
    Moon,
    Sun,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import bitkodDark from '../assets/bitkod_dark.png';
import bitkodLight from '../assets/bitkod_light.png';

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    const { isAuthenticated, user, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (path: string) => location.pathname === path;

    const navigation = [
        { to: '/problems', label: 'Sorular', icon: <Terminal className="h-5 w-5 mr-2" /> },
        { to: '/account', label: 'Profilim', icon: <User className="h-5 w-5 mr-2" /> },
        { to: '/leaderboard', label: 'Sıralama', icon: <User className="h-5 w-5 mr-2" /> },
        ...(user?.role === 'ADMIN'
            ? [{ to: '/admin', label: 'Admin', icon: <User className="h-5 w-5 mr-2" /> }]
            : []),
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-900 dark:text-white transition-colors duration-300">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 backdrop-blur-md bg-blue-50/50 dark:bg-zinc-900/80 border-b border-gray-200 dark:border-zinc-700 shadow-sm">
                <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
                    {/* Sol: Logo ve Menü */}
                    <div className="flex items-center gap-6">
                        <Link to="/" className="flex items-center gap-2">
                            <img
                                src={isDark ? bitkodDark : bitkodLight}
                                alt="BitKod Logo"
                                className="h-9 w-auto"
                            />
                        </Link>


                        <div className="hidden sm:flex items-center gap-4">
                            {isAuthenticated &&
                                navigation.map((item) => (
                                    <Link
                                        key={item.to}
                                        to={item.to}
                                        className={`relative flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all ${
                                            isActive(item.to)
                                                ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-white'
                                                : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                                        }`}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </Link>
                                ))}
                        </div>
                    </div>

                    {/* Sağ: Auth + Tema */}
                    <div className="flex items-center gap-4">
                        {/* Tema Butonu */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
                            title="Tema Değiştir"
                        >
                            {isDark ? (
                                <Sun className="h-5 w-5 text-yellow-400" />
                            ) : (
                                <Moon className="h-5 w-5 text-gray-800" />
                            )}
                        </button>

                        {/* Auth */}
                        <div className="hidden sm:flex items-center gap-4">
                            {isAuthenticated ? (
                                <>
                                    <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                                        <User className="h-4 w-4" />
                                        <span className="font-medium truncate max-w-[140px]">{user?.email}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Çıkış
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="flex items-center gap-2 px-4 py-2 border border-indigo-600 text-indigo-600 dark:text-indigo-300 text-sm rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900 transition"
                                    >
                                        <LogIn className="h-4 w-4" />
                                        Giriş
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition"
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        Kayıt Ol
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Toggle */}
                        <div className="sm:hidden">
                            <button
                                onClick={() => setMobileOpen(!mobileOpen)}
                                className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition"
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
                                            ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-white'
                                            : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                                    }`}
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            ))}

                        <div className="mt-4 border-t pt-4 border-gray-200 dark:border-zinc-700">
                            {isAuthenticated ? (
                                <>
                                    <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 mb-3">
                                        <User className="h-4 w-4" />
                                        <span className="font-medium truncate max-w-[160px]">{user?.email}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-md transition"
                                    >
                                        <LogOut className="h-4 w-4 inline-block mr-2" />
                                        Çıkış
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="block px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md"
                                    >
                                        <LogIn className="h-4 w-4 inline-block mr-2" />
                                        Giriş
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="block px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md"
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

            <main className="px-4 sm:px-6 lg:px-8 py-6">
                {children}
            </main>
        </div>
    );
}
