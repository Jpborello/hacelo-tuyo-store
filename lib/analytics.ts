import { createClient } from '@/lib/supabase/client';

export interface MonthlyMetrics {
    totalVendido: number;
    cantidadPedidos: number;
    ticketPromedio: number;
    topProductos: Array<{
        nombre: string;
        cantidad: number;
        total: number;
    }>;
    ventasPorDia: Array<{
        fecha: string;
        total: number;
    }>;
}

export async function getMonthlyMetrics(
    comercioId: string,
    year: number,
    month: number
): Promise<MonthlyMetrics> {
    const supabase = createClient();

    // Get start and end dates for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Fetch completed orders for the month
    const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select(`
            id,
            total,
            creado_at,
            estado,
            detalle_pedidos (
                cantidad,
                precio_unitario,
                productos (
                    nombre
                )
            )
        `)
        .eq('comercio_id', comercioId)
        .eq('estado', 'completado')
        .gte('creado_at', startDate.toISOString())
        .lte('creado_at', endDate.toISOString());

    if (error) {
        console.error('Error fetching orders:', error);
        return {
            totalVendido: 0,
            cantidadPedidos: 0,
            ticketPromedio: 0,
            topProductos: [],
            ventasPorDia: []
        };
    }

    // Calculate total sales
    const totalVendido = pedidos?.reduce((sum, pedido) => sum + pedido.total, 0) || 0;
    const cantidadPedidos = pedidos?.length || 0;
    const ticketPromedio = cantidadPedidos > 0 ? totalVendido / cantidadPedidos : 0;

    // Calculate top products
    const productosMap = new Map<string, { cantidad: number; total: number }>();

    pedidos?.forEach(pedido => {
        pedido.detalle_pedidos?.forEach((detalle: any) => {
            const nombre = detalle.productos.nombre;
            const cantidad = detalle.cantidad;
            const total = detalle.cantidad * detalle.precio_unitario;

            if (productosMap.has(nombre)) {
                const existing = productosMap.get(nombre)!;
                existing.cantidad += cantidad;
                existing.total += total;
            } else {
                productosMap.set(nombre, { cantidad, total });
            }
        });
    });

    const topProductos = Array.from(productosMap.entries())
        .map(([nombre, data]) => ({
            nombre,
            cantidad: data.cantidad,
            total: data.total
        }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5);

    // Calculate sales per day
    const ventasPorDiaMap = new Map<string, number>();

    pedidos?.forEach(pedido => {
        const fecha = new Date(pedido.creado_at).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit'
        });

        if (ventasPorDiaMap.has(fecha)) {
            ventasPorDiaMap.set(fecha, ventasPorDiaMap.get(fecha)! + pedido.total);
        } else {
            ventasPorDiaMap.set(fecha, pedido.total);
        }
    });

    const ventasPorDia = Array.from(ventasPorDiaMap.entries())
        .map(([fecha, total]) => ({ fecha, total }))
        .sort((a, b) => {
            const [dayA, monthA] = a.fecha.split('/').map(Number);
            const [dayB, monthB] = b.fecha.split('/').map(Number);
            return monthA === monthB ? dayA - dayB : monthA - monthB;
        });

    return {
        totalVendido,
        cantidadPedidos,
        ticketPromedio,
        topProductos,
        ventasPorDia
    };
}
