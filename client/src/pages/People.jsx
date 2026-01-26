import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useCompany } from '../context/CompanyContext';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import MultiSelect from '../components/MultiSelect';

export default function People() {
    const [people, setPeople] = useState([]);
    const [tags, setTags] = useState([]); // [1]
    const [formData, setFormData] = useState({ name: '', email: '', birthdate: '', tagIds: [] }); // [2]
    const [isEditing, setIsEditing] = useState(null);
    const [importMessage, setImportMessage] = useState('');
    const fileInputRef = useRef(null);
    const { selectedCompany } = useCompany();

    useEffect(() => {
        fetchPeople();
        fetchTags(); // [3]
    }, []);

    const fetchTags = async () => {
        try {
            const res = await axios.get('/api/tags');
            setTags(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchPeople = async () => {
        try {
            const res = await axios.get('/api/people');
            setPeople(res.data);
        } catch (error) {
            console.error('Error fetching people:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await axios.put(`/api/people/${isEditing}`, formData);
            } else {
                await axios.post('/api/people', formData);
            }
            setFormData({ name: '', email: '', birthdate: '', tagIds: [] }); // Reset tags
            setIsEditing(null);
            fetchPeople();
        } catch (error) {
            console.error('Error saving person:', error);
            alert('Erro ao guardar pessoa');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem a certeza?')) return;
        try {
            await axios.delete(`/api/people/${id}`);
            fetchPeople();
        } catch (error) {
            console.error('Error deleting person:', error);
        }
    };

    const handleEdit = (person) => {
        setFormData({
            name: person.name,
            email: person.email,
            birthdate: format(new Date(person.birthdate), 'yyyy-MM-dd'),
            tagIds: person.tags ? person.tags.map(t => t.id) : [] // Load existing tags
        });
        setIsEditing(person.id);
    };

    const handleFileImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            // raw: false ensures dates come as formatted strings if they are dates in Excel
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });

            console.log('Dados Excel brutos:', jsonData); // Debug

            const peopleData = jsonData.map(row => {
                // Helper function to find case-insensitive keys
                const findValue = (keys) => {
                    const rowKeys = Object.keys(row);
                    const match = rowKeys.find(k => keys.some(key => k.trim().toLowerCase() === key.toLowerCase()));
                    return match ? row[match] : null;
                };

                const name = findValue(['nome', 'name', 'nomes', 'full name']);
                const email = findValue(['email', 'e-mail', 'mail']);
                const rawDate = findValue(['data de nascimento', 'data nascimento', 'nascimento', 'birthdate', 'birth date', 'data', 'data_nascimento']);
                const tagName = findValue(['tag', 'etiqueta', 'grupo', 'tags', 'etiquetas']);

                if (!name || !email || !rawDate) return null;

                // Parse date
                let birthdate;
                if (typeof rawDate === 'string') {
                    // Try DD/MM/YYYY
                    const partsSlash = rawDate.split('/');
                    if (partsSlash.length === 3) {
                        // Assumes DD/MM/YYYY
                        birthdate = `${partsSlash[2]}-${partsSlash[1].padStart(2, '0')}-${partsSlash[0].padStart(2, '0')}`;
                    } else if (rawDate.includes('-')) {
                        // Maybe already YYYY-MM-DD or DD-MM-YYYY, let's try to standardize
                        birthdate = rawDate;
                    }
                }

                // Fallback for simple validation
                if (!birthdate || isNaN(new Date(birthdate).getTime())) {
                    // Try to see if it's already a valid date string accepted by constructor
                    const d = new Date(rawDate);
                    if (!isNaN(d.getTime())) {
                        birthdate = format(d, 'yyyy-MM-dd');
                    } else {
                        return null; // Invalid date
                    }
                }

                return {
                    name: name.toString().trim(),
                    email: email.toString().trim(),
                    birthdate: birthdate,
                    tagName: tagName ? tagName.toString().trim() : null
                };
            }).filter(p => p !== null);

            if (peopleData.length === 0) {
                setImportMessage('Não foram encontrados dados válidos. Verifique as colunas: "Nome", "Email", "Data de Nascimento". (Opcional: "Tag")');
                return;
            }

            const res = await axios.post('/api/people/bulk', { people: peopleData });
            setImportMessage(res.data.message);
            fetchPeople();
            setTimeout(() => setImportMessage(''), 5000);
        } catch (error) {
            console.error('Import error:', error);
            setImportMessage('Erro ao importar ficheiro: ' + (error.response?.data?.error || error.message));
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleExport = async () => {
        if (!selectedCompany) return;
        try {
            const res = await axios.get(`/api/companies/${selectedCompany.id}/export/people`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `people-${selectedCompany.name}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export error:', error);
            alert('Erro ao exportar dados');
        }
    };

    // ... (existing code) ...

    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Gestão de Pessoas
                    </h2>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <Link
                        to="/import-guide"
                        className="mr-2 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Ajuda / Modelo
                    </Link>
                    <button
                        onClick={handleExport}
                        className="mr-2 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Exportar Excel
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileImport}
                        accept=".xlsx,.xls"
                        className="hidden"
                        id="excel-upload"
                    />
                    <label
                        htmlFor="excel-upload"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                    >
                        Importar Excel
                    </label>
                </div>
            </div>

            {importMessage && (
                <div className={`p-4 rounded-md ${importMessage.includes('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {importMessage}
                </div>
            )}

            {/* Form */}
            <div className="bg-white shadow sm:rounded-lg p-6">
                <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-0 lg:flex lg:gap-4 items-end flex-wrap">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Nome</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                        <input
                            type="date"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            value={formData.birthdate}
                            onChange={e => setFormData({ ...formData, birthdate: e.target.value })}
                        />
                    </div>

                    <div className="flex-1 min-w-[280px]">
                        <MultiSelect
                            label="Etiquetas/Grupos"
                            items={tags}
                            selectedIds={formData.tagIds}
                            onChange={(ids) => setFormData({ ...formData, tagIds: ids })}
                            placeholder="Pesquisar etiquetas..."
                        />
                    </div>
                    <div className="w-full lg:w-auto">
                        <button
                            type="submit"
                            className="w-full lg:w-auto inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 h-[42px] items-center"
                        >
                            {isEditing ? 'Atualizar' : 'Adicionar Pessoa'}
                        </button>
                    </div>
                    {isEditing && (
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditing(null);
                                setFormData({ name: '', email: '', birthdate: '', tagIds: [] });
                            }}
                            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                    )}
                </form>
            </div>

            {/* Table */}
            <div className="flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nome
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Data de Nascimento
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Etiquetas
                                        </th>
                                        <th scope="col" className="relative px-6 py-3">
                                            <span className="sr-only">Ações</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {people.map((person) => (
                                        <tr key={person.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {person.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {person.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {format(new Date(person.birthdate), "d 'de' MMMM, yyyy", { locale: pt })}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div className="flex flex-wrap gap-1">
                                                    {person.tags && person.tags.map(t => (
                                                        <span key={t.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                            {t.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleEdit(person)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(person.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Apagar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
