import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RequireAuth from './components/RequireAuth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import People from './pages/People';
import Settings from './pages/Settings';
import ImportGuide from './pages/ImportGuide';
import Login from './pages/Login';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/" element={
                        <RequireAuth>
                            <Layout />
                        </RequireAuth>
                    }>
                        <Route index element={<Dashboard />} />
                        <Route path="people" element={<People />} />
                        <Route path="import-guide" element={<ImportGuide />} />
                        <Route path="settings" element={<Settings />} />
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
