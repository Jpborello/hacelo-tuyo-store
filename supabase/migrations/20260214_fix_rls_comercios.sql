-- Agregar política RLS para permitir INSERT en tabla comercios
-- Esto permite que los usuarios autenticados creen su propio comercio

-- Política para INSERT: Usuarios pueden crear su propio comercio
CREATE POLICY "Usuarios pueden crear su propio comercio"
    ON comercios FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: Usuarios pueden actualizar su propio comercio
CREATE POLICY "Usuarios pueden actualizar su propio comercio"
    ON comercios FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Verificar políticas existentes
-- SELECT * FROM pg_policies WHERE tablename = 'comercios';
