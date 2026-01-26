import React, { useState } from 'react';

const MultiSelect = ({ items, selectedIds, onChange, label, placeholder = "Selecionar..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const toggleOption = (id) => {
        const idInt = parseInt(id);
        const newSelection = selectedIds.includes(idInt)
            ? selectedIds.filter(selectedId => selectedId !== idInt)
            : [...selectedIds, idInt];
        onChange(newSelection);
    };

    const selectedItems = items.filter(item => selectedIds.includes(item.id));
    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative">
            {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
            <div
                className="min-h-[42px] p-1.5 border border-gray-300 rounded-md bg-white cursor-pointer focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 shadow-sm flex flex-wrap gap-2 transition-all duration-200"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedItems.length === 0 && !isOpen && (
                    <span className="text-gray-400 text-sm mt-1 ml-2">{placeholder}</span>
                )}
                {selectedItems.map(item => (
                    <span
                        key={item.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200"
                    >
                        {item.name}
                        <button
                            type="button"
                            className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-600 focus:outline-none"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleOption(item.id);
                            }}
                        >
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 4.293z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </span>
                ))}
            </div>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute z-50 mt-1 w-full bg-white shadow-xl max-h-60 rounded-md border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-2 border-b bg-gray-50">
                            <input
                                type="text"
                                autoFocus
                                className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2"
                                placeholder="Pesquisar..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                        <div className="overflow-y-auto flex-1 py-1 text-left">
                            {filteredItems.length === 0 && (
                                <div className="px-4 py-3 text-sm text-gray-500 text-center">Nenhum item encontrado</div>
                            )}
                            {filteredItems.map(item => (
                                <label
                                    key={item.id}
                                    className="flex items-center px-4 py-2 hover:bg-indigo-50 cursor-pointer transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        checked={selectedIds.includes(item.id)}
                                        onChange={() => toggleOption(item.id)}
                                    />
                                    <span className="ml-3 text-sm text-gray-700 font-medium">{item.name}</span>
                                </label>
                            ))}
                        </div>
                        <div className="p-2 border-t bg-gray-50 flex justify-end">
                            <button
                                type="button"
                                className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 p-1"
                                onClick={() => setIsOpen(false)}
                            >
                                Concluído
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default MultiSelect;
