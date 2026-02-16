'use client';

import { useState, useEffect } from 'react';
import { Comercio } from '@/lib/types/database';
import { Loader2, Shield, Search, RefreshCw, AlertTriangle, CheckCircle, XCircle, Ban } from 'lucide-react';
import { getAllComercios, updateComercioPlan, updateComercioStatus } from './actions';

export default function BackofficeClient() {
    const [comercios, setComercios] = useState<Comercio[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [updating, setUpdating] = useState<string | null>(null);

    const loadComercios = async () => {
        setLoading(true);
        try {
            const data = await getAllComercios();
            setComercios(data as Comercio[]);
        } catch (error) {
            console.error(error);
            // alert('Error cargando comercios: ' + error); 
        }
        setLoading(false);
    };

    useEffect(() => {
        loadComercios();
    }, []);

    const handleUpdatePlan = async (comercioId: string, newPlan: string) => {
        // Confirmar cambio si es downgrade
        if (!confirm('¿Estás seguro de cambiar el plan? Esto actualizará el límite de productos.')) return;

        setUpdating(comercioId);

        let limite = 10; // Default Prueba

        switch (newPlan) {
            case 'prueba': limite = 10; break;
            case 'basico': limite = 20; break;
            case 'estandar': limite = 50; break;
            case 'premium': limite = 100; break;
        }

        try {
            await updateComercioPlan(comercioId, newPlan, limite);
            // Actualizar localmente
            setComercios(comercios.map(c =>
                c.id === comercioId
                    ? { ...c, plan: newPlan as any, limite_productos: limite }
                    : c
            ));
        } catch (error: any) {
            alert('Error al actualizar plan: ' + error.message);
        }
        setUpdating(null);
    };

    const handleUpdateStatus = async (comercioId: string, newStatus: string) => {
        setUpdating(comercioId);

        try {
            await updateComercioStatus(comercioId, newStatus);
            setComercios(comercios.map(c =>
                c.id === comercioId ? { ...c, estado: newStatus as any } : c
            ));
        } catch (error: any) {
            alert('Error al actualizar estado: ' + error.message);
        }
        setUpdating(null);
    };

    const filteredComercios = comercios.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getExpirationStatus = (comercio: Comercio) => {
        let expirationDate: Date | null = null;

        if (comercio.plan === 'prueba') {
            const createdAt = new Date(comercio.creado_at);
            expirationDate = new Date(createdAt);
            expirationDate.setDate(createdAt.getDate() + 15);
        } else if (comercio.mp_next_payment_date) {
            expirationDate = new Date(comercio.mp_next_payment_date);
        } else if (comercio.fecha_ultimo_pago) {
            const lastPayment = new Date(comercio.fecha_ultimo_pago);
            expirationDate = new Date(lastPayment);
            expirationDate.setDate(lastPayment.getDate() + 30);
        }

        if (!expirationDate) return null;

        const now = new Date();
        const diffTime = expirationDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 5 && diffDays >= 0) {
            return (
                <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
                    <AlertTriangle className="w-3 h-3" />
                    Vence en {diffDays} día{diffDays !== 1 ? 's' : ''}
                </span>
            );
        }

        if (diffDays < 0 && comercio.estado !== 'suspendido' && comercio.estado !== 'bloqueado') {
            return (
                <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                    <AlertTriangle className="w-3 h-3" />
                    Vencido hace {Math.abs(diffDays)} días
                </span>
            );
        }

        return null;
    };

    const getStatusBadge = (status: string | undefined) => {
        switch (status) {
            case 'activo': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> ACTIVO</span>;
            case 'pendiente': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> PENDIENTE</span>;
            case 'suspendido': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 flex items-center gap-1"><XCircle className="w-3 h-3" /> SUSPENDIDO</span>;
            case 'bloqueado': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 flex items-center gap-1"><Ban className="w-3 h-3" /> BLOQUEADO</span>;
            default: return <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">UNK</span>;
        }
    };

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
                            <p className="text-gray-500">Administrá usuarios, planes y estados.</p>
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
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-600">Comercio</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600">Plan</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600">Estado</th>
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
                                                <a
                                                    href={`/${comercio.slug}`}
                                                    target="_blank"
                                                    className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                                                >
                                                    /{comercio.slug}
                                                </a>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    Alta: {new Date(comercio.creado_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    className="px-2 py-1 bg-white border border-gray-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full max-w-[140px]"
                                                    value={comercio.plan || 'prueba'}
                                                    onChange={(e) => handleUpdatePlan(comercio.id, e.target.value)}
                                                    disabled={updating === comercio.id}
                                                >
                                                    <option value="prueba">Prueba (10)</option>
                                                    <option value="basico">Básico (20)</option>
                                                    <option value="estandar">Estándar (50)</option>
                                                    <option value="premium">Premium (100)</option>
                                                </select>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Límite: {comercio.limite_productos} productos
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="mb-2 flex flex-col items-start gap-1">
                                                    {getStatusBadge(comercio.estado)}
                                                    {getExpirationStatus(comercio)}
                                                </div>
                                                <select
                                                    className="px-2 py-1 bg-white border border-gray-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full max-w-[140px]"
                                                    value={comercio.estado || 'pendiente'}
                                                    onChange={(e) => handleUpdateStatus(comercio.id, e.target.value)}
                                                    disabled={updating === comercio.id}
                                                >
                                                    <option value="activo">Activo</option>
                                                    <option value="pendiente">Pendiente</option>
                                                    <option value="suspendido">Suspendido</option>
                                                    <option value="bloqueado">Bloqueado</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {updating === comercio.id && (
                                                        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                                                    )}
                                                    {/* Botón rápido de bloqueo/desbloqueo */}
                                                    {comercio.estado === 'bloqueado' ? (
                                                        <button
                                                            onClick={() => handleUpdateStatus(comercio.id, 'activo')}
                                                            disabled={updating === comercio.id}
                                                            className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-md hover:bg-green-100 transition"
                                                        >
                                                            Desbloquear
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleUpdateStatus(comercio.id, 'bloqueado')}
                                                            disabled={updating === comercio.id}
                                                            className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-md hover:bg-red-100 transition"
                                                        >
                                                            Bloquear
                                                        </button>
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
