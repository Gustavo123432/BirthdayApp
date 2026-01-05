import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format, isSameDay, setYear } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function Dashboard() {
    const [people, setPeople] = useState([]);
    const [upcoming, setUpcoming] = useState([]);

    useEffect(() => {
        fetchPeople();
    }, []);

    const fetchPeople = async () => {
        try {
            const res = await axios.get('/api/people');
            setPeople(res.data);
            calculateUpcoming(res.data);
        } catch (error) {
            console.error('Error fetching people:', error);
        }
    };

    const calculateUpcoming = (data) => {
        const today = new Date();
        const currentYear = today.getFullYear();

        const withNextBirthday = data.map(person => {
            const birthdate = new Date(person.birthdate);
            let nextBirthday = setYear(birthdate, currentYear);

            if (nextBirthday < today && !isSameDay(nextBirthday, today)) {
                nextBirthday = setYear(birthdate, currentYear + 1);
            }

            return { ...person, nextBirthday };
        });

        const sorted = withNextBirthday
            .sort((a, b) => a.nextBirthday - b.nextBirthday)
            .slice(0, 5); // Show next 5

        setUpcoming(sorted);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Painel de Controlo</h1>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Próximos Aniversários</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">As próximas 5 celebrações.</p>
                </div>
                <div className="border-t border-gray-200">
                    <ul role="list" className="divide-y divide-gray-200">
                        {upcoming.map((person) => (
                            <li key={person.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-medium text-indigo-600 truncate">
                                        {person.name}
                                    </div>
                                    <div className="ml-2 flex-shrink-0 flex">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            {format(person.nextBirthday, "d 'de' MMMM", { locale: pt })}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                    <div className="sm:flex">
                                        <p className="flex items-center text-sm text-gray-500">
                                            {person.email}
                                        </p>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {upcoming.length === 0 && (
                            <li className="px-4 py-4 sm:px-6 text-sm text-gray-500">
                                Não foram encontrados próximos aniversários.
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
