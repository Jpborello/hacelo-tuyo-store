export interface ProductoAdquirido {
    id: string;
    comercio_id: string;
    producto_id: string;
    creado_at: string;
}

export interface Comercio {
    id: string;
    creado_at: string;
    nombre: string;
    slug: string;
    logo_url: string | null;
    user_id: string;
    // Campos de suscripción
    estado?: 'pendiente' | 'activo' | 'bloqueado' | 'eliminado';
    plan?: 'basico' | 'estandar' | 'premium';
    limite_productos: number;
    // Mercado Pago Fields
    mp_subscription_id?: string | null;
    mp_payer_id?: string;
    mp_status?: 'active' | 'paused' | 'cancelled' | 'pending';
    mp_external_reference?: string;
    fecha_alta?: string | null;
    fecha_ultimo_pago?: string | null;
    proximo_pago?: string | null;
    meses_sin_pagar?: number;
    mp_preapproval_id?: string | null;
    tiene_metodo_pago?: boolean;
    notas_admin?: string | null;
}

export interface Categoria {
    id: string;
    comercio_id: string;
    nombre: string;
    slug: string;
    orden: number;
    creado_at: string;
}

export interface Producto {
    id: string;
    comercio_id: string;
    categoria_id: string | null;
    nombre: string;
    descripcion: string | null;
    precio: number;
    stock: number;
    imagen_url: string | null;
    unidad_medida: 'bulto' | 'granel';
    activo: boolean;
    creado_at: string;
    actualizado_at: string;
}

export interface Pedido {
    id: string;
    comercio_id: string;
    cliente_nombre: string;
    direccion: string;
    telefono: string;
    cuit_dni: string | null;
    total: number;
    estado: 'pendiente' | 'procesando' | 'completado' | 'entregado';
    creado_at: string;
    actualizado_at: string;
}

export interface DetallePedido {
    id: string
    pedido_id: string
    producto_id: string
    cantidad: number
    precio_unitario: number
    creado_at: string
}

export interface DetallePedidoConProducto extends DetallePedido {
    productos: {
        id: string;
        nombre: string;
        descripcion: string | null;
        imagen_url: string | null;
        unidad_medida: 'bulto' | 'granel';
    };
}

export interface PedidoConDetalles extends Pedido {
    detalle_pedidos: DetallePedidoConProducto[];
}

export interface Plan {
    id: string;
    nombre: 'basico' | 'estandar' | 'premium';
    limite_productos: number;
    precio_mensual: number;
    descripcion: string | null;
    activo: boolean;
    creado_at: string;
    actualizado_at: string;
}

export interface Pago {
    id: string;
    comercio_id: string;
    tipo: 'alta' | 'mensual' | 'upgrade';
    plan: string | null;
    monto: number;
    fecha_pago: string;
    metodo_pago: string;
    mp_payment_id: string | null;
    estado: 'pendiente' | 'aprobado' | 'rechazado';
    comprobante_url: string | null;
    notas: string | null;
    registrado_por: string | null;
    creado_at: string;
}

export interface NotificacionEmail {
    id: string;
    comercio_id: string;
    tipo: 'recordatorio_pago' | 'pago_exitoso' | 'cuenta_bloqueada' | 'advertencia_eliminacion' | 'aprobacion_cuenta';
    enviado: boolean;
    fecha_envio: string | null;
    error: string | null;
    creado_at: string;
}

export interface Database {
    public: {
        Tables: {
            comercios: {
                Row: Comercio
                Insert: Omit<Comercio, 'id' | 'creado_at'>
                Update: Partial<Omit<Comercio, 'id' | 'creado_at'>>
            }
            categorias: {
                Row: Categoria
                Insert: Omit<Categoria, 'id' | 'creado_at'>
                Update: Partial<Omit<Categoria, 'id' | 'creado_at'>>
            }
            productos: {
                Row: Producto
                Insert: Omit<Producto, 'id' | 'creado_at' | 'actualizado_at'>
                Update: Partial<Omit<Producto, 'id' | 'creado_at' | 'actualizado_at'>>
            }
            pedidos: {
                Row: Pedido
                Insert: Omit<Pedido, 'id' | 'creado_at' | 'actualizado_at'>
                Update: Partial<Omit<Pedido, 'id' | 'creado_at' | 'actualizado_at'>>
            }
            detalle_pedidos: {
                Row: DetallePedido
                Insert: Omit<DetallePedido, 'id' | 'creado_at'>
                Update: Partial<Omit<DetallePedido, 'id' | 'creado_at'>>
            }
            planes: {
                Row: Plan
                Insert: Omit<Plan, 'id' | 'creado_at' | 'actualizado_at'>
                Update: Partial<Omit<Plan, 'id' | 'creado_at' | 'actualizado_at'>>
            }
            pagos: {
                Row: Pago
                Insert: Omit<Pago, 'id' | 'creado_at'>
                Update: Partial<Omit<Pago, 'id' | 'creado_at'>>
            }
            notificaciones_email: {
                Row: NotificacionEmail
                Insert: Omit<NotificacionEmail, 'id' | 'creado_at'>
                Update: Partial<Omit<NotificacionEmail, 'id' | 'creado_at'>>
            }
        }
    }
}
