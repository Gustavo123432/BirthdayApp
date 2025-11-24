import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Settings() {
    const [config, setConfig] = useState({
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPass: '',
        emailTemplate: ''
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
            setMessage('Settings saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error saving config:', error);
            setMessage('Error saving settings.');
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

            {message && (
                <div className={`p-4 rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-lg p-6 space-y-6">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">SMTP Configuration</h3>
                    <p className="mt-1 text-sm text-gray-500">Configure your Office 365 or other SMTP provider.</p>
                </div>

                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-4">
                        <label className="block text-sm font-medium text-gray-700">SMTP Host</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            value={config.smtpHost}
                            onChange={e => setConfig({ ...config, smtpHost: e.target.value })}
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Port</label>
                        <input
                            type="number"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            value={config.smtpPort}
                            onChange={e => setConfig({ ...config, smtpPort: e.target.value })}
                        />
                    </div>

                    <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-gray-700">Username (Email)</label>
                        <input
                            type="email"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            value={config.smtpUser}
                            onChange={e => setConfig({ ...config, smtpUser: e.target.value })}
                        />
                    </div>

                    <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            placeholder="Leave blank to keep unchanged"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            value={config.smtpPass}
                            onChange={e => setConfig({ ...config, smtpPass: e.target.value })}
                        />
                    </div>

                    <div className="sm:col-span-6">
                        <label className="block text-sm font-medium text-gray-700">Email Template</label>
                        <p className="text-xs text-gray-500 mb-2">Use {'{name}'} to insert the person's name.</p>
                        <textarea
                            rows={4}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            value={config.emailTemplate}
                            onChange={e => setConfig({ ...config, emailTemplate: e.target.value })}
                        />
                    </div>
                </div>

                </div>

                <div className="pt-5 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Test Configuration</h3>
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">Send Test Email To</label>
                            <input
                                type="email"
                                placeholder="Enter email address"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                id="test-email-input"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={async () => {
                                const email = document.getElementById('test-email-input').value;
                                if (!email) return alert('Please enter an email address');
                                try {
                                    setMessage('Sending test email...');
                                    await axios.post('/api/config/test-email', { email });
                                    setMessage('Test email sent successfully!');
                                } catch (error) {
                                    console.error(error);
                                    setMessage('Error sending test email: ' + (error.response?.data?.error || error.message));
                                }
                            }}
                            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Send Test Email
                        </button>
                    </div>
                </div>

                <div className="pt-5">
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Save Settings
                        </button>
                    </div>
                </div>
            </form >
        </div >
    );
}
