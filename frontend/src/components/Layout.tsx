import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Code2, Terminal, LogIn, UserPlus, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isActive = (path: string) => location.pathname === path;

    const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
        <Link
            to={to}
            className={`${
                isActive(to)
                    ? 'text-indigo-600 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-900 border-transparent'
            } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
        >
            {children}
        </Link>
    );

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link to="/" className="flex items-center">
                                <Code2 className="h-8 w-8 text-indigo-600" />
                                <span className="ml-2 text-2xl font-bold text-gray-900">CodePro</span>
                            </Link>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                {isAuthenticated && (
                                    <NavLink to="/problems">
                                        <Terminal className="h-4 w-4 mr-2" />
                                        Challenges
                                    </NavLink>
                                )}
                            </div>
                        </div>

                        <div className="sm:hidden flex items-center">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                            >
                                {isMenuOpen ? (
                                    <X className="h-6 w-6" />
                                ) : (
                                    <Menu className="h-6 w-6" />
                                )}
                            </button>
                        </div>

                        <div className="hidden sm:flex sm:items-center sm:space-x-4">
                            {isAuthenticated ? (
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                                        <User className="h-4 w-4" />
                                        <span>{user?.email}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors duration-200"
                                    >
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="inline-flex items-center px-4 py-2 border border-indigo-600 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 transition-colors duration-200"
                                    >
                                        <LogIn className="h-4 w-4 mr-2" />
                                        Login
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
                                    >
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
                    <div className="pt-2 pb-3 space-y-1">
                        {isAuthenticated && (
                            <Link
                                to="/problems"
                                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                                    isActive('/problems')
                                        ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                                }`}
                            >
                                Challenges
                            </Link>
                        )}
                    </div>
                    {isAuthenticated ? (
                        <div className="pt-4 pb-3 border-t border-gray-200">
                            <div className="flex items-center px-4">
                                <div className="flex-shrink-0">
                                    <User className="h-8 w-8 rounded-full" />
                                </div>
                                <div className="ml-3">
                                    <div className="text-base font-medium text-gray-800">{user?.email}</div>
                                </div>
                            </div>
                            <div className="mt-3 space-y-1">
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                                >
                                    Sign out
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="pt-4 pb-3 border-t border-gray-200">
                            <div className="space-y-1">
                                <Link
                                    to="/login"
                                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                                >
                                    Register
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </nav>
            <main>{children}</main>
        </div>
    );
}