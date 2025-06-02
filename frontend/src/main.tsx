import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import AdminApp from './AdminApp';

const isAdminSubdomain = window.location.hostname.startsWith('admin.');
const isAdminPath = window.location.pathname.startsWith('/admin');

createRoot(document.getElementById('root')!).render(
    <ThemeProvider>
        {isAdminSubdomain || isAdminPath ? <AdminApp /> : <App />}
    </ThemeProvider>
);
