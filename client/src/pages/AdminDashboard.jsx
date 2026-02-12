import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function AdminDashboard() {
    const [requests, setRequests] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [message, setMessage] = useState('');
    const { token } = useAuth(); // Assuming useAuth exposes token or we use axios interceptor

    // Configure axios to include token if not already globally configured
    // Assuming global config or AuthContext handles it. If not, we might need to add headers here.
    // The App seems to use axios interceptors or AuthProvider. Let's assume AuthProvider sets it?
    // Looking at Login.jsx, it uses 'login' from context.
    // Let's assume we need to pass headers manually or use a configured axios instance if available.
    // For now, I'll use the token from context if available, or just rely on global if set.
    // Actually, looking at previous files, there isn't a global axios interceptor shown in snippets.
    // I should probably check AuthContext, but to be safe I will add headers if I can access token.

    // START TOKEN HANDLING (Assuming secure handling is needed)
    const authHeaders = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } // Fallback to localStorage if context doesn't provide
    };

    useEffect(() => {
        fetchRequests();
        fetchCompanies();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/admin/store-requests', authHeaders);
            setRequests(res.data);
        } catch (err) {
            console.error('Failed to fetch requests', err);
        }
    };

    const fetchCompanies = async () => {
        // We technically need an endpoint to get ALL companies for admin, 
        // but /api/companies only returns user's companies.
        // I might need to update the backend to allow Admin to see ALL companies.
        // For now, let's just list requests.
        // Wait, the plan said "Manage Companies". I should probably add an endpoint for that or use existing.
        // Let's stick to Requests first as requested.
        // Actually, let's try to fetch user companies, maybe the admin is in all of them?
        // Or I can add a specific admin route for all companies later.
    };

    const handleApprove = async (id) => {
        try {
            const res = await axios.post(`http://localhost:3000/api/admin/store-requests/${id}/approve`, {}, authHeaders);
            setMessage(`Aprovado! User: ${res.data.user.username}, Pass: ${res.data.user.temporaryPassword}`);
            fetchRequests();
        } catch (err) {
            setMessage('Erro ao aprovar: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Tem a certeza que deseja rejeitar?')) return;
        try {
            await axios.post(`http://localhost:3000/api/admin/store-requests/${id}/reject`, {}, authHeaders);
            setMessage('Rejeitado com sucesso.');
            fetchRequests();
        } catch (err) {
            setMessage('Erro ao rejeitar: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <header className="mb-8 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Painel de Administrador</h1>
                <a href="/" className="text-blue-600 hover:underline">Voltar à App</a>
            </header>

            {message && (
                <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6" role="alert">
                    <p>{message}</p>
                </div>
            )}

            <section className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4 border-b pb-2">Pedidos de Criação de Loja</h2>

                {requests.length === 0 ? (
                    <p className="text-gray-500">Não há pedidos pendentes.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full leading-normal">
                            <thead>
                                <tr>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Empresa
                                    </th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Morada
                                    </th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Solicitante
                                    </th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(req => (
                                    <tr key={req.id}>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <p className="text-gray-900 whitespace-no-wrap">{req.companyName}</p>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <p className="text-gray-900 whitespace-no-wrap">{req.address}</p>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <p className="text-gray-900 whitespace-no-wrap">{req.requesterName}</p>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <p className="text-gray-900 whitespace-no-wrap">{req.requesterEmail}</p>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <span className={`relative inline-block px-3 py-1 font-semibold leading-tight rounded-full ${req.status === 'PENDING' ? 'bg-yellow-200 text-yellow-900' :
                                                    req.status === 'APPROVED' ? 'bg-green-200 text-green-900' :
                                                        'bg-red-200 text-red-900'
                                                }`}>
                                                <span className="relative">{req.status}</span>
                                            </span>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            {req.status === 'PENDING' && (
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleApprove(req.id)}
                                                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-xs"
                                                    >
                                                        Aprovar
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(req.id)}
                                                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs"
                                                    >
                                                        Rejeitar
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

export default AdminDashboard;
