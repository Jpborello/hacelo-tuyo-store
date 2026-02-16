'use client';

import { useState, useEffect } from 'react';
import { getMonthlyMetrics, type MonthlyMetrics } from '@/lib/analytics';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import { Loader2, DollarSign, ShoppingBag, TrendingUp, Package } from 'lucide-react';

interface MetricasTabProps {
    comercioId: string;
}

export default function MetricasTab({ comercioId }: MetricasTabProps) {
    const [metrics, setMetrics] = useState<MonthlyMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadMetrics();
    }, [comercioId]);

    const loadMetrics = async () => {
        try {
            const now = new Date();
            const data = await getMonthlyMetrics(
                comercioId,
                now.getFullYear(),
                now.getMonth() + 1
            );
            setMetrics(data);
        } catch (err) {
            console.error('Error loading metrics:', err);
            setError('Error al cargar las métricas');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10 text-red-600 bg-red-50 rounded-lg">
                <p>{error}</p>
                <button
                    onClick={loadMetrics}
                    className="mt-4 text-blue-600 hover:underline"
                >
                    Intentar de nuevo
                </button>
            </div>
        );
    }

    if (!metrics) return null;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Métricas del Mes</h2>
                <div className="text-sm text-gray-500">
                    {new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Vendido */}
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <DollarSign className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-sm text-gray-500 font-medium">Total Vendido</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                        ${metrics.totalVendido.toLocaleString()}
                    </div>
                </div>

                {/* Cantidad Pedidos */}
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-100 rounded-full">
                            <ShoppingBag className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="text-sm text-gray-500 font-medium">Pedidos Completados</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                        {metrics.cantidadPedidos}
                    </div>
                </div>

                {/* Ticket Promedio */}
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-100 rounded-full">
                            <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                        <span className="text-sm text-gray-500 font-medium">Ticket Promedio</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                        ${metrics.ticketPromedio.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Productos Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Package className="w-5 h-5 text-gray-500" />
                        Top 5 Productos
                    </h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.topProductos} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="nombre" type="category" width={150} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value?: number) => [`${value ?? 0} unidades`, 'Cantidad']}
                                />
                                <Bar dataKey="cantidad" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Ventas Diarias Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-gray-500" />
                        Ventas Diarias
                    </h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={metrics.ventasPorDia}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                                <YAxis />
                                <Tooltip
                                    formatter={(value?: number) => [`$${(value ?? 0).toLocaleString()}`, 'Ventas']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
