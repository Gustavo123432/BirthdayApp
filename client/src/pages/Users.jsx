import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function Users() {
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '' });
    const [isChangingPassword, setIsChangingPassword] = useState(null);
    const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '' });
    const [message, setMessage] = useState('');
    const [modalMessage, setModalMessage] = useState(''); // Mensagem específica para o modal
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/users');
            setUsers(res.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const validatePassword = (password) => {
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        let errors = [];
        if (!hasUpperCase) errors.push("uma letra maiúscula");
        if (!hasLowerCase) errors.push("uma letra minúscula");
        if (!hasNumber) errors.push("um número");
        if (!hasSpecialChar) errors.push("um caracter especial");

        if (errors.length > 0) {
            return "A password deve ter: " + errors.join(", ") + ".";
        }
        return null;
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setMessage('Erro: As passwords não coincidem.');
            return;
        }

        const passwordError = validatePassword(formData.password);
        if (passwordError) {
            setMessage('Erro: ' + passwordError);
            return;
        }

        try {
            await axios.post('/api/users', { username: formData.username, password: formData.password });
            setFormData({ username: '', password: '', confirmPassword: '' });
            setMessage('Utilizador criado com sucesso!');
            fetchUsers();
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error creating user:', error);
            setMessage('Erro ao criar utilizador: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Tem a certeza que deseja apagar este utilizador?')) return;
        try {
            await axios.delete(`/api/users/${id}`);
            setMessage('Utilizador apagado com sucesso!');
            fetchUsers();
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error deleting user:', error);
            setMessage('Erro ao apagar utilizador: ' + (error.response?.data?.error || error.message));
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setModalMessage(''); // Limpa mensagens anteriores

        if (passwordData.password !== passwordData.confirmPassword) {
            setModalMessage('Erro: As passwords não coincidem.');
            return;
        }

        const passwordError = validatePassword(passwordData.password);
        if (passwordError) {
            setModalMessage('Erro: ' + passwordError);
            return;
        }

        try {
            await axios.put(`/api/users/${isChangingPassword}/password`, { password: passwordData.password });

            // Sucesso: fecha modal e mostra mensagem na página principal
            setIsChangingPassword(null);
            setPasswordData({ password: '', confirmPassword: '' });
            setModalMessage('');

            setMessage('Password atualizada com sucesso!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error updating password:', error);
            setModalMessage('Erro ao atualizar password: ' + (error.response?.data?.error || error.message));
        }
    };

    const toggleShowPassword = () => setShowPassword(!showPassword);
    const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

    // SVGs inline para evitar dependências externas que falham no build
    const EyeIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-400">
            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
            <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" />
        </svg>
    );

    const EyeSlashIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-400">
            <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577a11.217 11.217 0 014.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113z" />
            <path d="M5.535 9.423l-1.474-1.474a11.272 11.272 0 00-.738.935 1.762 1.762 0 000 1.113c1.487 4.471 5.705 7.697 10.677 7.697 1.258 0 2.493-.207 3.668-.595L15.28 14.71a5.251 5.251 0 01-7.904-7.904l-1.841-1.383z" />
        </svg>
    );

    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Gestão de Utilizadores
                    </h2>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-md ${message.includes('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {message}
                </div>
            )}

            {/* Create User Form */}
            <div className="bg-white shadow sm:rounded-lg p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Novo Utilizador</h3>
                <form onSubmit={handleCreateUser} className="space-y-4 md:space-y-0 md:flex md:gap-4 items-start">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>
                    <div className="flex-1 relative">
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 pr-10"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={toggleShowPassword}>
                                {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 relative">
                        <label className="block text-sm font-medium text-gray-700">Confirmar Password</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 pr-10"
                                value={formData.confirmPassword}
                                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={toggleShowConfirmPassword}>
                                {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                            </div>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="mt-6 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 h-10"
                    >
                        Criar
                    </button>
                </form>
            </div>

            {/* Users Table */}
            <div className="flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Username
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Criado em
                                        </th>
                                        <th scope="col" className="relative px-6 py-3">
                                            <span className="sr-only">Ações</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {user.username}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {format(new Date(user.createdAt), "d 'de' MMMM, yyyy", { locale: pt })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => {
                                                        setIsChangingPassword(user.id);
                                                        setModalMessage('');
                                                        setShowPassword(false);
                                                        setShowConfirmPassword(false);
                                                        setPasswordData({ password: '', confirmPassword: '' });
                                                    }}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                >
                                                    Alterar Password
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
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

            {/* Change Password Modal */}
            {isChangingPassword && (
                <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsChangingPassword(null)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block aligns-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handlePasswordUpdate}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                                Alterar Password
                                            </h3>

                                            {/* Mensagem de ERRO dentro do modal */}
                                            {modalMessage && (
                                                <div className={`mt-4 p-2 rounded-md ${modalMessage.includes('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'} text-sm`}>
                                                    {modalMessage}
                                                </div>
                                            )}

                                            <div className="mt-4 space-y-4">
                                                <div className="relative">
                                                    <label className="block text-sm font-medium text-gray-700">Nova Password</label>
                                                    <div className="mt-1 relative rounded-md shadow-sm">
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            required
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 pr-10"
                                                            value={passwordData.password}
                                                            onChange={e => setPasswordData({ ...passwordData, password: e.target.value })}
                                                        />
                                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={toggleShowPassword}>
                                                            {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <label className="block text-sm font-medium text-gray-700">Confirmar Nova Password</label>
                                                    <div className="mt-1 relative rounded-md shadow-sm">
                                                        <input
                                                            type={showConfirmPassword ? "text" : "password"}
                                                            required
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 pr-10"
                                                            value={passwordData.confirmPassword}
                                                            onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                        />
                                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={toggleShowConfirmPassword}>
                                                            {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm">
                                        Alterar
                                    </button>
                                    <button type="button" onClick={() => setIsChangingPassword(null)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
