-- Eliminar la restricción actual de estados
ALTER TABLE public.pedidos DROP CONSTRAINT IF EXISTS pedidos_estado_check;

-- Agregar la nueva restricción incluyendo 'completado'
ALTER TABLE public.pedidos ADD CONSTRAINT pedidos_estado_check 
CHECK (estado IN ('pendiente', 'procesando', 'completado', 'entregado'));
