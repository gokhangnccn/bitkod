import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Problems } from './pages/Problems';
import { ProblemSolve } from './pages/ProblemSolve';
import { AuthProvider } from './context/AuthContext';
import Account from "./pages/Account.tsx";
import Leaderboard from "./pages/LeaderBoard.tsx";

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Layout>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/account" element={<Account />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/problems" element={<Problems />} />
                        <Route path="/problems/:uid" element={<ProblemSolve />} />
                    </Routes>
                </Layout>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;