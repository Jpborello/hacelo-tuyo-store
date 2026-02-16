# HaceloTuyo - Sistema de E-Commerce White Label

## 1. Visión General del Sistema
HaceloTuyo es una plataforma **SaaS (Software as a Service) "White Label"** diseñada para que pequeños y medianos comerciantes puedan crear su propia tienda online (catálogo digital) de manera instantánea. El sistema permite a los usuarios registrarse, elegir un plan, cargar productos y gestionar pedidos a través de WhatsApp, todo bajo su propia URL personalizada.

### Arquitectura
-   **Frontend:** Next.js 15 (React 19, Server Components) para máximo rendimiento y SEO.
-   **Backend/Database:** Supabase (PostgreSQL, Auth, Storage, Realtime).
-   **Estilos:** Tailwind CSS (Diseño Mobile-First).
-   **Pagos:** Integración completa con Mercado Pago (Suscripciones y Pagos únicos).
-   **Infraestructura:** Vercel (Edge Network).

---

## 2. Módulos y Funcionalidades Principales

### A. Para el Comerciante (Panel de Administración)
Es el "corazón" del sistema donde cada cliente gestiona su negocio.
1.  **Dashboard Interactivo:**
    *   Métricas en tiempo real (Disponible en planes estándar/premium).
    *   Gestión de pestañas fluida (Productos, Pedidos, Resumen, Historial).
2.  **Gestión de Productos:**
    *   Carga ilimitada (limitada por plan) con compresión automática de imágenes.
    *   Edición rápida de precio, stock y estado (activo/inactivo).
    *   Validación de límites según el plan contratado.
3.  **Gestión de Pedidos:**
    *   Recepción de pedidos en tiempo real.
    *   Estados de pedido: Pendiente -> Procesando -> Completado.
    *   **Integración WhatsApp:** Botón para enviar detalle del pedido al cliente.
    *   **Impresión:** Generación de ticket de comanda para cocina/armado.
4.  **Lista de Compras (Resumen):**
    *   Calcula automáticamente qué productos faltan y en qué cantidad total para abastecer todos los pedidos pendientes (ideal para reposición).
5.  **Gestión de Suscripción:**
    *   Visualización del plan actual.
    *   Botón de pago/upgrade integrado con Mercado Pago.
    *   Bloqueo automático por falta de pago o vencimiento de prueba.

### B. Para el Cliente Final (Catálogo Público)
La "tienda" que ve el comprador.
1.  **Catálogo Dinámico:**
    *   URL única por comercio (ej: `hacelotuyo.com/mi-negocio`).
    *   Diseño responsive optimizado para móviles (app-like experience).
2.  **Carrito de Compras:**
    *   Persistencia local (no pierde el carrito si cierra la página).
    *   Cálculo de subtotales y totales.
3.  **Checkout Simplificado:**
    *   Formulario de datos básicos (Nombre, WhatsApp, Dirección).
    *   Envío de pedido directo a WhatsApp y Base de Datos.

### C. Para el Super Administrador (Backoffice)
El panel de control del dueño de la plataforma (VOS).
1.  **Gestión de Comercios:**
    *   Listado completo de todos los clientes.
    *   Buscador por nombre o slug.
2.  **Control Total:**
    *   Cambio manual de planes (Prueba, Básico, Estándar, Premium).
    *   Cambio manual de estados (Activo, Suspendido, Bloqueado).
    *   Desbloqueo de emergencia.
3.  **Alertas:**
    *   Visualización rápida de clientes próximos a vencer o vencidos.

---

## 3. Modelo de Negocio y Planes
El sistema opera bajo un modelo de suscripción recurrente (SaaS).

| Plan | Límite Productos | Precio Sugerido (AR$) | Características |
| :--- | :---: | :---: | :--- |
| **Prueba** | 10 | Gratis (15 días) | Funcionalidad básica para enganchar al cliente |
| **Básico** | 20 | $5.000 / mes | Ideal para emprendedores iniciales (Tortas, Artesanías) |
| **Estándar** | 50 | $12.000 / mes | Comercios chicos (Kioscos, Verdulerías) + Métricas |
| **Premium** | 100 | $20.000 / mes | Comercios medianos (Petshop, Ferretería) + Métricas Full |

---

## 4. Valuación de Miercado (Estimación para 10 Clientes)

Esta valuación considera el sistema como un **activo generador de renta** (SaaS) y no solo como código a medida (Software Factory).

### Escenario: 10 Clientes Activos
Supongamos un mezcla realista de clientes para empezar:
*   5 Clientes Básicos ($5.000 c/u) = $25.000
*   3 Clientes Estándar ($12.000 c/u) = $36.000
*   2 Clientes Premium ($20.000 c/u) = $40.000
*   **Ingreso Mensual Recurrente (MRR):** **$101.000 ARS**

### A. Valuación por Costo de Desarrollo (Si vendés el código hoy)
¿Cuánto costaría contratar a un desarrollador Senior/Semi-Senior para construir esto desde cero (Next.js 15, Supabase, Integraicón MP, Backoffice, Mobile First)?
*   Tiempo estimado desarrollo: 160 - 240 horas.
*   Valor hora promedio mercado (Freelance): USD 15 - 25.
*   Costo de Reposición (Software): **USD 3.000 - USD 5.000** (aprox $3.5M - $6M ARS).

### B. Valuación por Múltiplo de Ingresos (Si vendés el negocio funcionando)
Las empresas SaaS suelen valer entre **3x y 5x su Ingreso Anual Recurrente (ARR)**, dependiendo del crecimiento.
*   ARR actual (con 10 clientes): $101.000 x 12 = $1.212.000 ARS.
*   **Valuación de Negocio (Micro-SaaS inicial):** **$3.500.000 - $6.000.000 ARS**.

> **Nota:** Esta valuación crece exponencialmente. Con 100 clientes, el sistema pasa a valer +$50.000 USD fácilmente porque el costo de mantenimiento es muy bajo (infraestructura serverless).

### C. Valor Agregado Intangible
*   **Escalabilidad:** El código ya soporta 10 o 10.000 clientes sin cambios estructurales (gracias a Supabase/Vercel).
*   **Autonomía:** El sistema de cobros y bloqueo es automático. No requiere gestión manual mensual.

---

## Conclusión
Tenés en manos un **Micro-SaaS totalmente funcional**.
No es solo una página web, es una **fábrica de tiendas online**.

**Valor de Venta Recomendado (Código Fuente + Negocio 'llave en mano'):**
Si tuvieras que venderle todo el proyecto a un inversor hoy (código + 10 clientes hipotéticos): **USD 4.500 - USD 6.000**.
