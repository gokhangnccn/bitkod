import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoLight from '../../assets/bitkod_light.png';
import logoDark from '../../assets/bitkod_dark.png';
import {
  LayoutDashboard,
  Users,
  FileBarChart,
  ListTodo,
  PlusSquare,
  LogOut,
} from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: Props) {
  const { logout } = useAuth();
  const location = useLocation();

  const prefix = window.location.hostname.startsWith('admin.') ? '' : '/admin';

  const links = [
    { to: `${prefix}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { to: `${prefix}/users`, label: 'Kullanıcılar', icon: Users },
    { to: `${prefix}/reports`, label: 'Raporlar', icon: FileBarChart },
    { to: `${prefix}/problems`, label: 'Sorular', icon: ListTodo },
    { to: `${prefix}/problems/create`, label: 'Soru Ekle', icon: PlusSquare },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-800 text-white flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-700 mb-4">
          <img
            src={logoDark}
            alt="BitKod Logo"
            className="h-10 dark:hidden"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`group flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-gray-700 ${
                isActive(to) ? 'bg-gray-700' : ''
              }`}
            >
              <Icon size={18} className="shrink-0" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={logout}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm"
          >
            <LogOut size={16} /> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white overflow-y-auto">
        {children}
      </main>
    </div>
  );
} 