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
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-950 dark:text-white transition-all duration-300">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border-b border-gray-200/50 dark:border-zinc-700/50 shadow-sm">
                <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    {/* Sol: Logo ve Menü */}
                    <div className="flex items-center gap-6">
                        <Link to="/" className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xl transition-colors">
                            <Code2 className="w-6 h-6" />
                            BitCode
                        </Link>

                        <div className="hidden sm:flex items-center gap-4">
                            {isAuthenticated &&
                                navigation.map((item) => (
                                    <Link
                                        key={item.to}
                                        to={item.to}
                                        className={`relative flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                            isActive(item.to)
                                                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
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
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            title="Tema Değiştir"
                        >
                            {isDark ? (
                                <Sun className="h-5 w-5 text-yellow-500" />
                            ) : (
                                <Moon className="h-5 w-5 text-gray-700" />
                            )}
                        </button>

                        {/* Auth */}
                        <div className="hidden sm:flex items-center gap-4">
                            {isAuthenticated ? (
                                <>
                                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-lg">
                                        <User className="h-4 w-4" />
                                        <span className="font-medium truncate max-w-[140px]">{user?.email}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 rounded-lg transition-colors"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Çıkış
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="flex items-center gap-2 px-4 py-2 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-400/20 text-sm rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                                    >
                                        <LogIn className="h-4 w-4" />
                                        Giriş
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-sm rounded-lg transition-colors"
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
                                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileOpen && (
                    <div className="sm:hidden px-4 pb-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg">
                        {isAuthenticated &&
                            navigation.map((item) => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    onClick={() => setMobileOpen(false)}
                                    className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors mb-1 ${
                                        isActive(item.to)
                                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <div className="flex items-center">
                                        {item.icon}
                                        {item.label}
                                    </div>
                                </Link>
                            ))}

                        <div className="mt-4 border-t pt-4 border-gray-200/50 dark:border-zinc-700/50">
                            {isAuthenticated ? (
                                <>
                                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-3 px-4">
                                        <User className="h-4 w-4" />
                                        <span className="font-medium truncate max-w-[160px]">{user?.email}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <LogOut className="h-4 w-4 inline-block mr-2" />
                                        Çıkış
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="block px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors"
                                    >
                                        <LogIn className="h-4 w-4 inline-block mr-2" />
                                        Giriş
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="block px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors"
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
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
            </main>
        </div>
    );
}