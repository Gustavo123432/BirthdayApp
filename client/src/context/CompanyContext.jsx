import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CompanyContext = createContext(null);

export const CompanyProvider = ({ children }) => {
    const { user } = useAuth();
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchCompanies();
        } else {
            setLoading(false);
            setCompanies([]);
            setSelectedCompany(null);
        }
    }, [user]);

    // Load persisted selection
    useEffect(() => {
        const saved = localStorage.getItem('selectedCompanyId');
        if (saved && companies.length > 0) {
            const found = companies.find(c => c.id === parseInt(saved));
            if (found) {
                selectCompany(found);
            }
        } else if (companies.length > 0 && !selectedCompany) {
            // Optional: Auto-select if only one company?
            // Or prompt user?
            // Let's leave it null so user is forced to select.
        }
    }, [companies]);

    const fetchCompanies = async () => {
        try {
            const res = await axios.get('/api/companies');
            setCompanies(res.data);
        } catch (error) {
            console.error('Error fetching companies:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectCompany = (company) => {
        setSelectedCompany(company);
        localStorage.setItem('selectedCompanyId', company.id);
        axios.defaults.headers.common['x-company-id'] = company.id;
    };

    const unselectCompany = () => {
        setSelectedCompany(null);
        localStorage.removeItem('selectedCompanyId');
        delete axios.defaults.headers.common['x-company-id'];
    };

    const createCompany = async (name) => {
        try {
            const res = await axios.post('/api/companies', { name });
            const newCompany = res.data;
            setCompanies([...companies, newCompany]);
            selectCompany(newCompany); // Auto select new company
            return newCompany;
        } catch (error) {
            console.error('Error creating company:', error);
            throw error;
        }
    };

    return (
        <CompanyContext.Provider value={{
            companies,
            selectedCompany,
            selectCompany,
            unselectCompany,
            createCompany,
            loading,
            refreshCompanies: fetchCompanies
        }}>
            {children}
        </CompanyContext.Provider>
    );
};

export const useCompany = () => useContext(CompanyContext);
