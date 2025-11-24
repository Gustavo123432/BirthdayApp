import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

export default function People() {
    const [people, setPeople] = useState([]);
    const [formData, setFormData] = useState({ name: '', email: '', birthdate: '' });
    const [isEditing, setIsEditing] = useState(null);
    const [importMessage, setImportMessage] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchPeople();
    }, []);

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
            setFormData({ name: '', email: '', birthdate: '' });
            setIsEditing(null);
            fetchPeople();
        } catch (error) {
            console.error('Error saving person:', error);
            alert('Error saving person');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
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
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const peopleData = jsonData.map(row => {
                // Parse date from DD/MM/YYYY format
                const dateParts = row['Data de Nascimento']?.split('/');
                let birthdate;
                if (dateParts && dateParts.length === 3) {
                    birthdate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
                } else {
                    birthdate = row['Data de Nascimento'];
                }

                return {
                    name: row['Nome'] || row['Name'] || '',
                    email: row['Email'] || '',
                    birthdate: birthdate
                };
            }).filter(p => p.name && p.email && p.birthdate);

            if (peopleData.length === 0) {
                setImportMessage('No valid data found in file');
                return;
            }

            const res = await axios.post('/api/people/bulk', { people: peopleData });
            setImportMessage(res.data.message);
            fetchPeople();
            setTimeout(() => setImportMessage(''), 5000);
        } catch (error) {
            console.error('Import error:', error);
            setImportMessage('Error importing file: ' + (error.response?.data?.error || error.message));
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        People Management
                    </h2>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
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
                        Import Excel
                    </label>
                </div>
            </div>

            {importMessage && (
                <div className={`p-4 rounded-md ${importMessage.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {importMessage}
                </div>
            )}

            {/* Form */}
            <div className="bg-white shadow sm:rounded-lg p-6">
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-0 md:flex md:gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Name</label>
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
                        <label className="block text-sm font-medium text-gray-700">Birthdate</label>
                        <input
                            type="date"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            value={formData.birthdate}
                            onChange={e => setFormData({ ...formData, birthdate: e.target.value })}
                        />
                    </div>
                    <button
                        type="submit"
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        {isEditing ? 'Update' : 'Add'}
                    </button>
                    {isEditing && (
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditing(null);
                                setFormData({ name: '', email: '', birthdate: '' });
                            }}
                            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Cancel
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
                                            Name
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Birthdate
                                        </th>
                                        <th scope="col" className="relative px-6 py-3">
                                            <span className="sr-only">Actions</span>
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
                                                {format(new Date(person.birthdate), 'MMMM do, yyyy')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleEdit(person)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(person.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
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
