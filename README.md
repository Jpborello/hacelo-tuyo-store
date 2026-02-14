# Hacelo Tuyo - SaaS Multitenant

Plataforma de catálogos digitales para mayoristas.

## Inicio Rápido

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Visita http://localhost:3000

## Configuración

1. Ejecuta el SQL en Supabase (ver `database_schema.sql` en artifacts)
2. Crea el bucket `productos-hacelotuyo` en Storage
3. Las variables de entorno ya están configuradas en `.env.local`

## Estructura

- `/[slug]` - Catálogo público
- `/login` - Autenticación
- `/admin/dashboard` - Panel de administración

Ver documentación completa en los artifacts.
