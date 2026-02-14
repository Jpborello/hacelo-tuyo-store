require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('🔧 Ejecutando migración de categorías...\n');

    const migrations = [
        {
            name: 'Crear tabla categorias',
            sql: `
        CREATE TABLE IF NOT EXISTS categorias (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          comercio_id UUID NOT NULL REFERENCES comercios(id) ON DELETE CASCADE,
          nombre TEXT NOT NULL,
          slug TEXT NOT NULL,
          orden INTEGER DEFAULT 0,
          creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(comercio_id, slug)
        );
      `
        },
        {
            name: 'Crear índices en categorias',
            sql: `
        CREATE INDEX IF NOT EXISTS idx_categorias_comercio_id ON categorias(comercio_id);
        CREATE INDEX IF NOT EXISTS idx_categorias_slug ON categorias(slug);
      `
        },
        {
            name: 'Agregar categoria_id a productos',
            sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='productos' AND column_name='categoria_id'
          ) THEN
            ALTER TABLE productos ADD COLUMN categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL;
            CREATE INDEX idx_productos_categoria_id ON productos(categoria_id);
          END IF;
        END $$;
      `
        },
        {
            name: 'Agregar cuit_dni a pedidos',
            sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='pedidos' AND column_name='cuit_dni'
          ) THEN
            ALTER TABLE pedidos ADD COLUMN cuit_dni TEXT;
          END IF;
        END $$;
      `
        },
        {
            name: 'Habilitar RLS en categorias',
            sql: `ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;`
        },
        {
            name: 'Política: Categorías son públicas',
            sql: `
        DROP POLICY IF EXISTS "Categorías son públicas" ON categorias;
        CREATE POLICY "Categorías son públicas"
          ON categorias FOR SELECT USING (true);
      `
        },
        {
            name: 'Política: Dueños pueden crear categorías',
            sql: `
        DROP POLICY IF EXISTS "Dueños pueden crear categorías" ON categorias;
        CREATE POLICY "Dueños pueden crear categorías"
          ON categorias FOR INSERT
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM comercios
              WHERE comercios.id = comercio_id
              AND comercios.user_id = auth.uid()
            )
          );
      `
        }
    ];

    for (const migration of migrations) {
        try {
            console.log(`⏳ ${migration.name}...`);

            const { error } = await supabase.rpc('exec_sql', { sql: migration.sql });

            if (error) {
                // Intentar ejecutar directamente si exec_sql no existe
                const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': supabaseServiceKey,
                        'Authorization': `Bearer ${supabaseServiceKey}`
                    },
                    body: JSON.stringify({ sql: migration.sql })
                });

                if (!response.ok) {
                    console.log(`   ⚠️  No se puede ejecutar SQL directamente via API`);
                    console.log(`   📝 Necesitás ejecutar esto manualmente en Supabase SQL Editor`);
                    return false;
                }
            }

            console.log(`   ✅ ${migration.name} completado`);
        } catch (error) {
            console.log(`   ⚠️  Error: ${error.message}`);
            return false;
        }
    }

    console.log('\n✅ Migración completada!');
    return true;
}

runMigration().then(success => {
    if (success) {
        console.log('\n🎯 Ahora podés ejecutar: node scripts/create-user.js');
    } else {
        console.log('\n📝 Ejecutá database_migration_categories.sql manualmente en Supabase SQL Editor');
    }
    process.exit(success ? 0 : 1);
});
