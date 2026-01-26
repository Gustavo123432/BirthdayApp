import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';
import { useAuth } from '../context/AuthContext';

export default function CompanySelection() {
    const { companies, selectCompany, createCompany, selectedCompany } = useCompany();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isCreating, setIsCreating] = useState(false);
    const [newCompanyName, setNewCompanyName] = useState('');

    // Navigate only when selectedCompany is successfully set
    React.useEffect(() => {
        if (selectedCompany) {
            navigate('/');
        }
    }, [selectedCompany, navigate]);

    const handleSelect = (company) => {
        selectCompany(company);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createCompany(newCompanyName);
            // selectCompany is called inside createCompany, which triggers the useEffect above
        } catch (error) {
            alert('Erro ao criar empresa');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Selecione uma Empresa
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="space-y-4">
                        {companies.map(company => (
                            <button
                                key={company.id}
                                onClick={() => handleSelect(company)}
                                className="w-full flex justify-between items-center px-4 py-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <span className="text-lg font-medium">{company.name}</span>
                                <span className="text-gray-400">&rarr;</span>
                            </button>
                        ))}

                        {companies.length === 0 && !isCreating && (
                            <div className="text-center text-gray-500 py-4">
                                Nenhuma empresa encontrada. Crie a primeira!
                            </div>
                        )}

                        {/* Only ADMINs can create companies */}
                        {(!isCreating && user?.role === 'ADMIN') && (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-4"
                            >
                                + Criar Nova Empresa
                            </button>
                        )}

                        {!isCreating && user?.role !== 'ADMIN' && (
                            <div className="text-center text-xs text-gray-400 mt-4">
                                Contacte um administrador para criar uma nova empresa.
                            </div>
                        )}

                        {isCreating && (
                            <form onSubmit={handleCreate} className="mt-4 space-y-4 border-t pt-4">
                                <div>
                                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                                        Nome da Empresa
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="companyName"
                                            name="companyName"
                                            type="text"
                                            required
                                            value={newCompanyName}
                                            onChange={(e) => setNewCompanyName(e.target.value)}
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Criar
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
