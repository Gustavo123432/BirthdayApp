import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Settings() {
    const [config, setConfig] = useState({
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPass: '',
        // Keeping this for backward compatibility or as a fallback
        emailTemplate: 'Ex.mo(a) {name},\n\nEm nome da Direção, do pessoal docente e não docente, temos o prazer de lhe desejar um feliz aniversário, repleto de saúde, sucesso e momentos de alegria.\n\nQue este dia seja especial e que o próximo ano da sua vida seja marcado por realizações pessoais e profissionais.\n\nCom os nossos melhores cumprimentos,\n\nA Direção\nEscola Profissional de Vila do Conde'
    });
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await axios.get('/api/config');
            // Don't show the password
            const { smtpPass, ...rest } = res.data;
            setConfig({ ...rest, smtpPass: '' });
        } catch (error) {
            console.error('Error fetching config:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/config', config);
            setMessage('Definições guardadas com sucesso!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error saving config:', error);
            setMessage('Erro ao guardar definições.');
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Definições</h1>

            {message && (
                <div className={`p-4 rounded-md ${message.includes('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-lg p-6 space-y-6">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">Configuração SMTP</h3>
                    <p className="mt-1 text-sm text-gray-500">Configure o seu Office 365 ou outro fornecedor de SMTP.</p>
                </div>

                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-4">
                        <label className="block text-sm font-medium text-gray-700">Servidor SMTP (Host)</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            value={config.smtpHost}
                            onChange={e => setConfig({ ...config, smtpHost: e.target.value })}
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Porta</label>
                        <input
                            type="number"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            value={config.smtpPort}
                            onChange={e => setConfig({ ...config, smtpPort: e.target.value })}
                        />
                    </div>

                    <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-gray-700">Utilizador (Email)</label>
                        <input
                            type="email"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            value={config.smtpUser}
                            onChange={e => setConfig({ ...config, smtpUser: e.target.value })}
                        />
                    </div>

                    <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-gray-700">Palavra-passe</label>
                        <input
                            type="password"
                            placeholder="Deixe em branco para manter"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            value={config.smtpPass}
                            onChange={e => setConfig({ ...config, smtpPass: e.target.value })}
                        />
                    </div>

                    {/* Legacy/Fallback Template */}
                    <div className="sm:col-span-6 border-t pt-4">
                        <label className="block text-sm font-medium text-gray-700">Modelo de e-mail de recurso (Global)</label>
                        <p className="text-xs text-gray-500 mb-2">Usado se não houver um modelo específico definido na página "Modelos".</p>
                        <textarea
                            rows={6}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            value={config.emailTemplate}
                            onChange={e => setConfig({ ...config, emailTemplate: e.target.value })}
                        />
                    </div>
                </div>

                <div className="pt-5 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Testar configuração</h3>
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">Enviar e-mail de teste para</label>
                            <input
                                type="email"
                                placeholder="Insira o endereço de email"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                id="test-email-input"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={async () => {
                                const email = document.getElementById('test-email-input').value;
                                if (!email) return alert('Por favor, insira um endereço de e-mail');
                                try {
                                    setMessage('A enviar e-mail de teste...');
                                    await axios.post('/api/config/test-email', { email });
                                    setMessage('E-mail de teste enviado com sucesso!');
                                } catch (error) {
                                    console.error(error);
                                    setMessage('Erro ao enviar e-mail de teste: ' + (error.response?.data?.error || error.message));
                                }
                            }}
                            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Enviar Teste
                        </button>
                    </div>
                </div>

                <div className="pt-5">
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Guardar Definições
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
