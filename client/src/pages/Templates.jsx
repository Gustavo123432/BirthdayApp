import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Templates() {
    const [tags, setTags] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [newTag, setNewTag] = useState('');
    const [expandedTag, setExpandedTag] = useState(null); // ID of expanded tag, 'default' for default
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchTags();
        fetchTemplates();
    }, []);

    const fetchTags = async () => {
        try {
            const res = await axios.get('/api/tags');
            setTags(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchTemplates = async () => {
        try {
            const res = await axios.get('/api/templates');
            setTemplates(res.data);
        } catch (error) { console.error(error); }
    };

    const handleAddTag = async () => {
        if (!newTag) return;
        try {
            await axios.post('/api/tags', { name: newTag });
            setNewTag('');
            fetchTags();
        } catch (error) { alert('Erro ao criar etiqueta'); }
    };

    const handleDeleteTag = async (id, e) => {
        e.stopPropagation(); // Prevent accordion toggle
        if (!window.confirm('Tem a certeza?')) return;
        try {
            await axios.delete(`/api/tags/${id}`);
            fetchTags();
        } catch (error) { alert('Erro ao apagar etiqueta'); }
    };

    const getTemplate = (tagId) => {
        return templates.find(t => t.tagId === tagId) || { subject: '', body: '' };
    };

    const handleSaveTemplate = async (tagId, subject, body) => {
        try {
            await axios.post('/api/templates', { tagId, subject, body });
            setMessage('Modelo guardado!');
            fetchTemplates();
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error(error);
            setMessage('Erro ao guardar modelo');
        }
    };

    const toggleAccordion = (id) => {
        setExpandedTag(expandedTag === id ? null : id);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-gray-900">Gestão de modelos de e-mail</h1>

            {message && (
                <div className={`p-4 rounded-md ${message.includes('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {message}
                </div>
            )}

            {/* TAGS MANAGEMENT */}
            <div className="bg-white shadow sm:rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Gerir etiquetas</h3>
                <div className="flex gap-4 mb-4">
                    <input
                        type="text"
                        className="flex-1 rounded-md border-gray-300 shadow-sm border p-2"
                        placeholder="Nova etiqueta (ex: VIP, Funcionário)"
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                    />
                    <button type="button" onClick={handleAddTag} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Adicionar</button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                        <span key={tag.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            {tag.name}
                            <button type="button" onClick={(e) => handleDeleteTag(tag.id, e)} className="ml-2 text-gray-500 hover:text-red-600">×</button>
                        </span>
                    ))}
                </div>
            </div>

            {/* TEMPLATES ACCORDION */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Modelos de e-mail</h3>
                <p className="text-sm text-gray-500">Clique na etiqueta para expandir e editar o modelo.</p>

                {/* Default Template */}
                <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                    <button
                        onClick={() => toggleAccordion('default')}
                        className="w-full px-6 py-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 focus:outline-none"
                    >
                        <span className="font-medium text-gray-900">Modelo padrão (Sem etiqueta)</span>
                        <span className="text-gray-500">{expandedTag === 'default' ? '▼' : '▶'}</span>
                    </button>
                    {expandedTag === 'default' && (
                        <div className="px-6 py-4 border-t border-gray-200">
                            <TemplateEditor
                                tagId={null}
                                initialData={getTemplate(null)}
                                onSave={handleSaveTemplate}
                            />
                        </div>
                    )}
                </div>

                {/* Dynamic Tags */}
                {tags.map(tag => (
                    <div key={tag.id} className="bg-white shadow sm:rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleAccordion(tag.id)}
                            className="w-full px-6 py-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 focus:outline-none"
                        >
                            <span className="font-medium text-indigo-600">{tag.name}</span>
                            <span className="text-gray-500">{expandedTag === tag.id ? '▼' : '▶'}</span>
                        </button>
                        {expandedTag === tag.id && (
                            <div className="px-6 py-4 border-t border-gray-200">
                                <TemplateEditor
                                    tagId={tag.id}
                                    initialData={getTemplate(tag.id)}
                                    onSave={handleSaveTemplate}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function TemplateEditor({ tagId, initialData, onSave }) {
    const [subject, setSubject] = useState(initialData.subject);
    const [body, setBody] = useState(initialData.body);

    useEffect(() => {
        setSubject(initialData.subject || '');
        setBody(initialData.body || '');
    }, [initialData]);

    const handleTest = async () => {
        const email = prompt('Para qual email deseja enviar o teste?');
        if (!email) return;

        try {
            await axios.post('/api/config/test-email', {
                email,
                subject,
                body
            });
            alert('E-mail de teste enviado com sucesso!');
        } catch (error) {
            console.error(error);
            alert('Erro ao enviar teste: ' + (error.response?.data?.error || error.message));
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Assunto</label>
                <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Mensagem HTML</label>
                <p className="text-xs text-gray-500 mb-1">Pode colar código HTML completo aqui. Use {'{name}'} para o nome.</p>
                <textarea
                    rows={15}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 font-mono text-sm"
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="<html>...</html>"
                />
            </div>
            <div className="flex justify-end gap-3">
                <button
                    type="button"
                    onClick={handleTest}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                    Testar modelo
                </button>
                <button
                    type="button"
                    onClick={() => onSave(tagId, subject, body)}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    Guardar modelo
                </button>
            </div>
        </div>
    );
}
