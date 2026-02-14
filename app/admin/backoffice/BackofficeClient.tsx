'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Comercio } from '@/lib/types/database';
import { Loader2, Shield, Save, Search, RefreshCw } from 'lucide-react';

export default function BackofficeClient() {
    const supabase = createClient();
    const [comercios, setComercios] = useState<Comercio[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [updating, setUpdating] = useState<string | null>(null);

    const loadComercios = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('comercios')
            .select('*')
            .order('creado_at', { ascending: false });

        if (!error && data) {
            setComercios(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadComercios();
    }, []);

    const handleUpdatePlan = async (comercioId: string, newPlan: string) => {
        setUpdating(comercioId);

        let limite = 15; // Free
        let planToSave: any = newPlan;

        if (newPlan === 'free') {
            planToSave = null;
            limite = 15;
        } else if (newPlan === 'basico') {
            limite = 50;
        } else if (newPlan === 'premium') {
            limite = 1000; // Ilimitado visualmente
        }

        const { error } = await supabase
            .from('comercios')
            .update({
                plan: planToSave,
                limite_productos: limite
            })
            .eq('id', comercioId);

        if (error) {
            alert('Error al actualizar plan: ' + error.message);
            console.error(error);
        } else {
            // Actualizar localmente
            setComercios(comercios.map(c =>
                c.id === comercioId
                    ? { ...c, plan: planToSave, limite_productos: limite }
                    : c
            ));
        }
        setUpdating(null);
    };

    const filteredComercios = comercios.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-600 rounded-lg shadow-lg">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Panel de Control (Super Admin)</h1>
                            <p className="text-gray-500">Gestioná los planes de todos los comercios desde acá.</p>
                        </div>
                    </div>
                    <button
                        onClick={loadComercios}
                        className="p-2 text-gray-600 hover:text-indigo-600 transition"
                        title="Recargar datos"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>

                {/* Buscador */}
                <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex items-center gap-4">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o slug..."
                        className="flex-1 outline-none text-gray-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-xl shadow-lg run-in overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-600">Comercio</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600">Slug</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600">Plan Actual</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center">
                                            <div className="flex items-center justify-center gap-2 text-gray-500">
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                Cargando comercios...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredComercios.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                            No se encontraron comercios.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredComercios.map((comercio) => (
                                        <tr key={comercio.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900">{comercio.nombre}</div>
                                                <div className="text-xs text-gray-400">{new Date(comercio.creado_at).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <a
                                                    href={`/${comercio.slug}`}
                                                    target="_blank"
                                                    className="text-indigo-600 hover:underline flex items-center gap-1"
                                                >
                                                    {comercio.slug}
                                                </a>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${comercio.plan === 'premium' ? 'bg-purple-100 text-purple-700' :
                                                    comercio.plan === 'basico' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {comercio.plan || 'Gratis'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        value={comercio.plan || 'free'}
                                                        onChange={(e) => handleUpdatePlan(comercio.id, e.target.value)}
                                                        disabled={updating === comercio.id}
                                                    >
                                                        <option value="free">Gratis</option>
                                                        <option value="basico">Emprendedor</option>
                                                        <option value="premium">Empresario</option>
                                                    </select>
                                                    {updating === comercio.id && (
                                                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
