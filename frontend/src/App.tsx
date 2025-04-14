import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Problems } from './pages/Problems';
import { ProblemSolve } from './pages/ProblemSolve';
import { AuthProvider } from './context/AuthContext';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Layout>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/problems" element={<Problems />} />
                        <Route path="/problems/:id" element={<ProblemSolve />} />
                    </Routes>
                </Layout>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;