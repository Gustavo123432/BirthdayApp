import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function StoreRequest() {
    const [formData, setFormData] = useState({
        companyName: '',
        address: '',
        requesterName: '',
        requesterEmail: ''
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const response = await fetch('http://localhost:3000/api/store-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setMessage('Pedido enviado com sucesso! Entraremos em contacto brevemente.');
                setFormData({
                    companyName: '',
                    address: '',
                    requesterName: '',
                    requesterEmail: ''
                });
            } else {
                const data = await response.json();
                setError(data.error || 'Erro ao enviar pedido.');
            }
        } catch (err) {
            setError('Erro de conexão.');
        }
    };

    return (
        <div className="min-h-screen bg-app-light-bg flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <h2 className="text-3xl font-bold text-app-dark-blue mb-6 text-center">Pedir Conta de Loja</h2>

                {message && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{message}</div>}
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Nome da Loja / Empresa</label>
                        <input
                            type="text"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-app-blue transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Morada</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-app-blue transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">O Seu Nome</label>
                        <input
                            type="text"
                            name="requesterName"
                            value={formData.requesterName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-app-blue transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">O Seu Email</label>
                        <input
                            type="email"
                            name="requesterEmail"
                            value={formData.requesterEmail}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-app-blue transition-colors"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-app-blue text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg"
                    >
                        Enviar Pedido
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-app-blue hover:underline text-sm">
                        Voltar ao Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default StoreRequest;
