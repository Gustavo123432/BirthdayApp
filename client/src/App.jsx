import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RequireAuth from './components/RequireAuth';
import Layout from './components/Layout';
import RequireAdmin from './components/RequireAdmin';
import Dashboard from './pages/Dashboard';
import People from './pages/People';
import Settings from './pages/Settings';
import Templates from './pages/Templates';
import ImportGuide from './pages/ImportGuide';
import Login from './pages/Login';
import StoreRequest from './pages/StoreRequest';
import AdminDashboard from './pages/AdminDashboard';
import Users from './pages/Users';
import { CompanyProvider } from './context/CompanyContext';
import CompanySelection from './pages/CompanySelection';
import RequireCompany from './components/RequireCompany';

function App() {
    return (
        <AuthProvider>
            <CompanyProvider>
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/store-request" element={<StoreRequest />} />

                        <Route path="/select-company" element={
                            <RequireAuth>
                                <CompanySelection />
                            </RequireAuth>
                        } />

                        <Route path="/" element={
                            <RequireAuth>
                                <RequireCompany>
                                    <Layout />
                                </RequireCompany>
                            </RequireAuth>
                        }>
                            <Route index element={<Dashboard />} />
                            <Route path="people" element={<People />} />
                            <Route path="import-guide" element={<ImportGuide />} />
                            <Route path="settings" element={<Settings />} />
                            <Route path="templates" element={<Templates />} />
                            <Route path="users" element={
                                <RequireAdmin>
                                    <Users />
                                </RequireAdmin>
                            } />
                            <Route path="admin-dashboard" element={
                                <RequireAdmin>
                                    <AdminDashboard />
                                </RequireAdmin>
                            } />
                        </Route>
                    </Routes>
                </Router>
            </CompanyProvider>
        </AuthProvider >
    );
}

export default App;
