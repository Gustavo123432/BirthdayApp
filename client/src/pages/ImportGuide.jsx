import React from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';

export default function ImportGuide() {
    const handleDownloadTemplate = () => {
        const headers = ['name', 'email', 'birthdate'];
        const exampleRow = ['João Silva', 'joao@exemplo.com', '1990-12-31'];

        const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");

        XLSX.writeFile(wb, "birthday-app-template.xlsx");
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-indigo-600">
                    <h3 className="text-lg leading-6 font-medium text-white">
                        Guia de Importação Excel
                    </h3>
                </div>
                <div className="px-4 py-5 sm:p-6 space-y-6">
                    <div>
                        <h4 className="text-lg font-medium text-gray-900">Como funciona?</h4>
                        <p className="mt-2 text-sm text-gray-500">
                            Você pode adicionar várias pessoas de uma vez importando um arquivo Excel (.xlsx ou .xls).
                            O sistema irá ler o arquivo e adicionar todos os contatos válidos à sua lista.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-lg font-medium text-gray-900">Estrutura do Arquivo</h4>
                        <p className="mt-2 text-sm text-gray-500">
                            O seu arquivo Excel deve ter as seguintes colunas na primeira linha (cabeçalho):
                        </p>
                        <div className="mt-4 border rounded-md overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">birthdate</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    <tr>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">João Silva</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">joao@exemplo.com</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1990-12-31</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-2 text-xs text-gray-400">
                            * A data deve estar no formato AAAA-MM-DD ou formato de Data do Excel.
                        </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-md flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900">Precisa de um modelo?</h4>
                            <p className="text-sm text-gray-500">Baixe um arquivo vazio pronto para preencher.</p>
                        </div>
                        <button
                            onClick={handleDownloadTemplate}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Baixar Modelo
                        </button>
                    </div>

                    <div className="pt-4 border-t border-gray-200 flex justify-end">
                        <Link
                            to="/people"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Voltar para Pessoas
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
