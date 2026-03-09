# Documentación Detallada del Sistema "HaceloTuyo"

## 1. Visión General

**HaceloTuyo** es una plataforma SaaS "White Label" diseñada para que pequeños y medianos comerciantes puedan crear su propia tienda online de manera instantánea. El sistema permite a los usuarios registrarse, elegir un plan, cargar productos y gestionar pedidos a través de WhatsApp, todo bajo su propia URL personalizada.

### Tecnologías Principales
- **Frontend:** Next.js 15 (React 19, Server Components).
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime).
- **Estilos:** Tailwind CSS (Diseño Mobile-First).
- **Pagos:** Integración con Mercado Pago (Suscripciones y Pagos únicos).
- **Infraestructura:** Vercel (Edge Network).

---

## 2. Módulos y Funcionalidades

### A. Panel de Administración (Comerciante)

1. **Dashboard Interactivo:**
   - Métricas en tiempo real (disponible en planes estándar/premium).
   - Gestión de pestañas fluida (Productos, Pedidos, Resumen, Historial).

2. **Gestión de Productos:**
   - Carga ilimitada de productos (limitada por plan contratado).
   - Compresión automática de imágenes.
   - Edición rápida de precio, stock y estado (activo/inactivo).
   - Validación de límites según el plan contratado.

3. **Gestión de Pedidos:**
   - Recepción de pedidos en tiempo real.
   - Estados de pedido: Pendiente -> Procesando -> Completado.
   - **Integración WhatsApp:** Botón para enviar detalle del pedido al cliente.
   - **Impresión:** Generación de ticket de comanda para cocina/armado.

4. **Lista de Compras (Resumen):**
   - Calcula automáticamente qué productos faltan y en qué cantidad total para abastecer todos los pedidos pendientes (ideal para reposición).

5. **Gestión de Suscripción:**
   - Visualización del plan actual.
   - Botón de pago/upgrade integrado con Mercado Pago.
   - Bloqueo automático por falta de pago o vencimiento de prueba.

### B. Catálogo Público (Cliente Final)

1. **Catálogo Dinámico:**
   - URL única por comercio (ejemplo: `hacelotuyo.com/mi-negocio`).
   - Diseño responsive optimizado para móviles (app-like experience).

2. **Carrito de Compras:**
   - Persistencia local (no pierde el carrito si cierra la página).
   - Cálculo de subtotales y totales.

3. **Checkout Simplificado:**
   - Formulario de datos básicos (Nombre, WhatsApp, Dirección).
   - Envío de pedido directo a WhatsApp y Base de Datos.

### C. Backoffice (Super Administrador)

- Gestión avanzada de la plataforma.
- Control de usuarios, planes y métricas globales.

---

## 3. Configuración y Desarrollo

### Inicio Rápido

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Acceso en: [http://localhost:3000](http://localhost:3000)

### Configuración Inicial

1. Ejecutar los scripts SQL en Supabase (ver `database_schema.sql` en artifacts).
2. Crear el bucket `productos-hacelotuyo` en Storage.
3. Configurar las variables de entorno en `.env.local`.

---

## 4. Estructura del Proyecto

### Frontend

- **`/[slug]`**: Catálogo público.
- **`/login`**: Autenticación.
- **`/admin/dashboard`**: Panel de administración.

### Backend

- **Rutas API:**
  - **`/api/cron/check-subscriptions`**: Verificación de suscripciones.
  - **`/api/mp/create-subscription`**: Creación de suscripciones en Mercado Pago.
  - **`/api/payments/alta`**: Alta de pagos.

### Scripts

- Automatización de tareas:
  - **`create-products-only.js`**: Creación de productos.
  - **`test_subscription.js`**: Pruebas de suscripciones.
  - **`verify_mp.js`**: Verificación de integraciones con Mercado Pago.

---

## 5. Funcionalidades Clave

### Integración con Mercado Pago
- Creación y sincronización de suscripciones.
- Pagos únicos y recurrentes.

### Gestión de Productos
- Carga masiva y edición rápida.
- Validación automática según el plan contratado.

### Gestión de Pedidos
- Flujo completo de estados.
- Integración con WhatsApp para notificaciones.

### Métricas y Reportes
- Visualización en tiempo real.
- Resúmenes automáticos para reposición de inventario.

---

## 6. Infraestructura

- **Hosting:** Vercel.
- **Base de Datos:** Supabase (PostgreSQL).
- **Almacenamiento:** Buckets en Supabase Storage.
- **Autenticación:** Supabase Auth.

---

## 7. Planes y Limitaciones

- **Plan Básico:**
  - Límite de productos: 50.
  - Sin métricas avanzadas.

- **Plan Estándar:**
  - Límite de productos: 200.
  - Métricas básicas.

- **Plan Premium:**
  - Sin límite de productos.
  - Métricas avanzadas y soporte prioritario.

---

## 8. Próximos Pasos

- Implementar notificaciones push.
- Mejorar la experiencia de usuario en el checkout.
- Añadir soporte para múltiples idiomas.

---

**Autor:** Equipo de Desarrollo de HaceloTuyo.
**Fecha:** 20 de febrero de 2026.