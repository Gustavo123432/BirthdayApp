import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Ideally we would validate the token with the backend here,
            // but for now we'll just assume it's valid if present.
            // We could decode it to get the username.
            setUser({ token });
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const res = await axios.post('/api/auth/login', { username, password });
            const token = res.data.accessToken;
            localStorage.setItem('token', token);
            setUser({ token, username });
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            return true;
        } catch (error) {
            console.error('Login failed', error);
            return false;
        }
    };

    const register = async (username, password) => {
        try {
            await axios.post('/api/auth/register', { username, password });
            return true;
        } catch (error) {
            console.error('Registration failed', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
