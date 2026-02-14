-- Fase 1: Base de Datos y Planes
-- Sistema de Suscripciones SaaS

-- 1. Modificar tabla comercios para agregar campos de suscripción
ALTER TABLE comercios 
ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'pendiente',
ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'basico',
ADD COLUMN IF NOT EXISTS limite_productos INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS fecha_alta TIMESTAMP,
ADD COLUMN IF NOT EXISTS fecha_ultimo_pago TIMESTAMP,
ADD COLUMN IF NOT EXISTS proximo_pago DATE,
ADD COLUMN IF NOT EXISTS meses_sin_pagar INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mp_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS mp_preapproval_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS tiene_metodo_pago BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notas_admin TEXT;

-- Comentarios sobre estados y planes
COMMENT ON COLUMN comercios.estado IS 'Estados: pendiente, activo, bloqueado, eliminado';
COMMENT ON COLUMN comercios.plan IS 'Planes: basico (20), estandar (50), premium (100)';

-- 2. Crear tabla de planes
CREATE TABLE IF NOT EXISTS planes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) NOT NULL UNIQUE,
    limite_productos INTEGER NOT NULL,
    precio_mensual DECIMAL(10,2) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    creado_at TIMESTAMP DEFAULT NOW(),
    actualizado_at TIMESTAMP DEFAULT NOW()
);

-- Insertar planes iniciales
INSERT INTO planes (nombre, limite_productos, precio_mensual, descripcion) VALUES
('basico', 20, 50000.00, 'Plan Básico - Hasta 20 productos'),
('estandar', 50, 70000.00, 'Plan Estándar - Hasta 50 productos'),
('premium', 100, 80000.00, 'Plan Premium - Hasta 100 productos')
ON CONFLICT (nombre) DO NOTHING;

-- 3. Crear tabla de pagos
CREATE TABLE IF NOT EXISTS pagos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comercio_id UUID REFERENCES comercios(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL,
    plan VARCHAR(20),
    monto DECIMAL(10,2) NOT NULL,
    fecha_pago TIMESTAMP DEFAULT NOW(),
    metodo_pago VARCHAR(50) DEFAULT 'mercadopago',
    mp_payment_id VARCHAR(255),
    estado VARCHAR(20) DEFAULT 'aprobado',
    comprobante_url TEXT,
    notas TEXT,
    registrado_por UUID REFERENCES auth.users(id),
    creado_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON COLUMN pagos.tipo IS 'Tipos: alta, mensual, upgrade';
COMMENT ON COLUMN pagos.estado IS 'Estados: pendiente, aprobado, rechazado';

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_pagos_comercio_id ON pagos(comercio_id);
CREATE INDEX IF NOT EXISTS idx_pagos_mp_payment_id ON pagos(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha_pago ON pagos(fecha_pago);

-- 4. Crear tabla de notificaciones de email
CREATE TABLE IF NOT EXISTS notificaciones_email (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comercio_id UUID REFERENCES comercios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    enviado BOOLEAN DEFAULT false,
    fecha_envio TIMESTAMP,
    error TEXT,
    creado_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON COLUMN notificaciones_email.tipo IS 'Tipos: recordatorio_pago, pago_exitoso, cuenta_bloqueada, advertencia_eliminacion, aprobacion_cuenta';

-- Índices
CREATE INDEX IF NOT EXISTS idx_notif_comercio_id ON notificaciones_email(comercio_id);
CREATE INDEX IF NOT EXISTS idx_notif_tipo ON notificaciones_email(tipo);
CREATE INDEX IF NOT EXISTS idx_notif_enviado ON notificaciones_email(enviado);

-- 5. Crear índices adicionales en comercios para queries de suscripción
CREATE INDEX IF NOT EXISTS idx_comercios_estado ON comercios(estado);
CREATE INDEX IF NOT EXISTS idx_comercios_plan ON comercios(plan);
CREATE INDEX IF NOT EXISTS idx_comercios_proximo_pago ON comercios(proximo_pago);

-- 6. Función para actualizar límite de productos según plan
CREATE OR REPLACE FUNCTION actualizar_limite_productos()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.plan = 'basico' THEN
        NEW.limite_productos := 20;
    ELSIF NEW.plan = 'estandar' THEN
        NEW.limite_productos := 50;
    ELSIF NEW.plan = 'premium' THEN
        NEW.limite_productos := 100;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar límite automáticamente cuando cambia el plan
DROP TRIGGER IF EXISTS trigger_actualizar_limite ON comercios;
CREATE TRIGGER trigger_actualizar_limite
    BEFORE INSERT OR UPDATE OF plan ON comercios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_limite_productos();

-- 7. Row Level Security (RLS) para las nuevas tablas

-- Planes: Solo lectura para todos los autenticados
ALTER TABLE planes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Planes son visibles para todos los autenticados"
    ON planes FOR SELECT
    TO authenticated
    USING (true);

-- Pagos: Solo el comercio puede ver sus propios pagos
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comercios pueden ver sus propios pagos"
    ON pagos FOR SELECT
    TO authenticated
    USING (
        comercio_id IN (
            SELECT id FROM comercios WHERE user_id = auth.uid()
        )
    );

-- Notificaciones: Solo el comercio puede ver sus notificaciones
ALTER TABLE notificaciones_email ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comercios pueden ver sus propias notificaciones"
    ON notificaciones_email FOR SELECT
    TO authenticated
    USING (
        comercio_id IN (
            SELECT id FROM comercios WHERE user_id = auth.uid()
        )
    );
