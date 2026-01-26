import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';

export default function RequireCompany({ children }) {
    const { selectedCompany, loading } = useCompany();
    const location = useLocation();

    if (loading) {
        return <div>Loading...</div>; // Or a spinner
    }

    if (!selectedCompany) {
        return <Navigate to="/select-company" state={{ from: location }} replace />;
    }

    return children;
}
