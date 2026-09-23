📦 CATALOGO-TECHUNIVERSE
 ┣ 📂 public               # Favicon, imágenes estáticas
 ┣ 📂 src
 ┃ ┣ 📂 app                # Rutas y páginas (App Router)
 ┃ ┃ ┣ 📂 (public)         # Grupo de rutas públicas
 ┃ ┃ ┃ ┣ 📂 catalogo       # /catalogo
 ┃ ┃ ┃ ┣ 📂 ofertas        # /ofertas
 ┃ ┃ ┃ ┣ 📂 carrito        # /carrito
 ┃ ┃ ┃ ┣ 📂 solicitar      # /solicitar-producto
 ┃ ┃ ┃ ┣ 📂 producto       # Dinámico: /producto/[slug]
 ┃ ┃ ┃ ┗ 📜 page.js        # Inicio (/)
 ┃ ┃ ┣ 📂 admin            # Grupo de rutas protegidas (/admin)
 ┃ ┃ ┃ ┣ 📂 productos      
 ┃ ┃ ┃ ┣ 📂 cotizaciones   
 ┃ ┃ ┃ ┗ 📜 page.js        # Dashboard administrativo
 ┃ ┃ ┣ 📂 api              # Endpoints (Webhooks, emails)
 ┃ ┃ ┣ 📜 layout.js        # Estructura HTML base y Context Providers
 ┃ ┃ ┗ 📜 globals.css      # Tailwind CSS e importaciones
 ┃ ┣ 📂 components         # Piezas reutilizables (UI)
 ┃ ┃ ┣ 📂 ui               # Botones, inputs, modales genéricos
 ┃ ┃ ┣ 📂 layout           # Header, Footer, AdminSidebar
 ┃ ┃ ┗ 📂 store            # ProductCard, CartDrawer, Temporizador
 ┃ ┣ 📂 context            # Estado global (CartContext)
 ┃ ┣ 📂 lib                # Clientes y utilidades
 ┃ ┃ ┣ 📜 supabase.js      # Inicialización del cliente Supabase
 ┃ ┃ ┗ 📜 utils.js         # Formateadores de moneda, fechas, URLs
 ┃ ┗ 📂 hooks              # Custom hooks (ej. useCart, useOfertas)
 ┣ 📜 .env.local           # Variables de entorno secretas
 ┣ 📜 tailwind.config.js   # Configuración visual
 ┗ 📜 package.json         # Dependencias





 A continuación, el Documento de Arquitectura y Especificaciones Técnicas (PRD) de TECH UNIVERSE v1.0.

1. Stack Tecnológico y Dependencias
Framework Core: Next.js 14/15 (App Router).

Lenguaje: JavaScript (ES6+).

Estilos: Tailwind CSS v4 (Mobile-first, utilitario).

Base de Datos y Backend as a Service (BaaS): Supabase (PostgreSQL, Auth, Storage).

Estado Global (Carrito): React Context API + localStorage.

Íconos: lucide-react (ligeros y consistentes).

Manejo de Fechas (Ofertas): date-fns o API nativa Intl.

Envío de Correos: resend (Librería moderna y gratuita para enviar emails transaccionales desde Next.js).

Despliegue: Vercel (CI/CD automático desde GitHub).

2. Estructura Exacta de Carpetas
Adoptaremos una arquitectura modular para separar lógica, componentes e interfaz.

Plaintext
📦 CATALOGO-TECHUNIVERSE
 ┣ 📂 public               # Favicon, imágenes estáticas
 ┣ 📂 src
 ┃ ┣ 📂 app                # Rutas y páginas (App Router)
 ┃ ┃ ┣ 📂 (public)         # Grupo de rutas públicas
 ┃ ┃ ┃ ┣ 📂 catalogo       # /catalogo
 ┃ ┃ ┃ ┣ 📂 ofertas        # /ofertas
 ┃ ┃ ┃ ┣ 📂 carrito        # /carrito
 ┃ ┃ ┃ ┣ 📂 solicitar      # /solicitar-producto
 ┃ ┃ ┃ ┣ 📂 producto       # Dinámico: /producto/[slug]
 ┃ ┃ ┃ ┗ 📜 page.js        # Inicio (/)
 ┃ ┃ ┣ 📂 admin            # Grupo de rutas protegidas (/admin)
 ┃ ┃ ┃ ┣ 📂 productos      
 ┃ ┃ ┃ ┣ 📂 cotizaciones   
 ┃ ┃ ┃ ┗ 📜 page.js        # Dashboard administrativo
 ┃ ┃ ┣ 📂 api              # Endpoints (Webhooks, emails)
 ┃ ┃ ┣ 📜 layout.js        # Estructura HTML base y Context Providers
 ┃ ┃ ┗ 📜 globals.css      # Tailwind CSS e importaciones
 ┃ ┣ 📂 components         # Piezas reutilizables (UI)
 ┃ ┃ ┣ 📂 ui               # Botones, inputs, modales genéricos
 ┃ ┃ ┣ 📂 layout           # Header, Footer, AdminSidebar
 ┃ ┃ ┗ 📂 store            # ProductCard, CartDrawer, Temporizador
 ┃ ┣ 📂 context            # Estado global (CartContext)
 ┃ ┣ 📂 lib                # Clientes y utilidades
 ┃ ┃ ┣ 📜 supabase.js      # Inicialización del cliente Supabase
 ┃ ┃ ┗ 📜 utils.js         # Formateadores de moneda, fechas, URLs
 ┃ ┗ 📂 hooks              # Custom hooks (ej. useCart, useOfertas)
 ┣ 📜 .env.local           # Variables de entorno secretas
 ┣ 📜 tailwind.config.js   # Configuración visual
 ┗ 📜 package.json         # Dependencias
3. Variables de Entorno
Estrictamente necesarias para la comunicación segura.

Fragmento de código
NEXT_PUBLIC_SUPABASE_URL="https://[TU_PROYECTO].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[TU_CLAVE_ANONIMA_PUBLICA]"
RESEND_API_KEY="[TU_CLAVE_PARA_ENVIAR_CORREOS]"
4. Rutas y Endpoints
Públicas (Páginas renderizadas en servidor/cliente):

/: Inicio (Hero, ofertas activas, carrusel, categorías).

/catalogo: Cuadrícula completa con filtros laterales.

/ofertas: Listado exclusivo de ofertas flash con temporizadores.

/producto/[slug]: Detalle SEO-friendly del producto (ej. /producto/kit-cautin-digital).

/carrito: Resumen del pedido y formulario de datos del cliente.

/solicitar-producto: Formulario para pedidos bajo demanda.

Administrativas (Protegidas por Supabase Auth):

/admin: Dashboard de métricas.

/admin/productos: CRUD de inventario.

/admin/cotizaciones: Gestor de leads y estados.

/admin/ofertas: Programación de Flash Sales.

API Endpoints (src/app/api/):

/api/email/confirmacion: Dispara el correo de Resend al cliente y a ti cuando se crea una cotización.

5. Esquema Completo de Supabase (Relacional)
categorias

id (PK, UUID)

slug (Texto, Único)

nombre (Texto)

productos

id (PK, UUID)

categoria_id (FK -> categorias.id)

slug (Texto, Único, indexado)

titulo (Texto)

descripcion (Texto)

precio_actual (Numérico)

precio_anterior (Numérico, nullable)

imagenes (Arreglo de Texto)

stock (Entero)

activo (Booleano)

creado_en (Timestamptz)

ofertas_flash

id (PK, UUID)

producto_id (FK -> productos.id)

precio_promocional (Numérico)

fecha_inicio (Timestamptz)

fecha_fin (Timestamptz)

estado (Texto: PROGRAMADA, ACTIVA, FINALIZADA)

cotizaciones

id (PK, Serial, formato visible: COT-20260918-00001)

cliente_nombre (Texto)

cliente_whatsapp (Texto)

cliente_correo (Texto, nullable)

cliente_zona (Texto)

observaciones (Texto)

subtotal (Numérico)

estado (Texto: NUEVA, EN REVISIÓN, COTIZADA, ACEPTADA, COMPLETADA, CANCELADA)

creado_en (Timestamptz)

detalles_cotizacion

id (PK, UUID)

cotizacion_id (FK -> cotizaciones.id)

producto_id (FK -> productos.id)

cantidad (Entero)

precio_unitario_fijado (Numérico - guarda el precio al momento de cotizar)

solicitudes_productos

id (PK, Serial)

descripcion (Texto)

marca_modelo (Texto)

cantidad (Entero)

presupuesto (Numérico)

whatsapp (Texto)

estado (Texto)

6. Seguridad, Roles y RLS (Row Level Security)
Supabase Auth manejará tu acceso administrativo.

Visitantes (Público): Política de lectura (SELECT) permitida en productos, categorias y ofertas_flash (solo donde activo = true). Política de escritura (INSERT) permitida en cotizaciones, detalles_cotizacion y solicitudes_productos.

Administrador (Autenticado): Política total (ALL) en todas las tablas mediante autenticación de Supabase (Email/Password).

7. Componentes Reutilizables Clave
ProductCard: Muestra imagen, título, precio, badge de oferta dinámico, estrellas fijas, y botón de "Agregar".

CartDrawer / CartContext: El carrito flotante que se alimenta del Context y se sincroniza con localStorage.

CountdownTimer: Componente visual que recibe una fecha_fin y calcula Días/Horas/Minutos/Segundos en tiempo real.

8. Lógica de los Sistemas Core
Sistema del Carrito: Un estado en React (useCart) almacena { id, cantidad, precio, titulo, imagen }. Cada vez que cambia, hace JSON.stringify y se guarda en window.localStorage.getItem('tech_universe_cart').

Sistema de Cotizaciones: Al enviar el carrito, el frontend agrupa los datos, hace un INSERT en Supabase cotizaciones retornando el id. Luego hace un insert múltiple en detalles_cotizacion.

Flujo de WhatsApp: Al confirmar la cotización, se construye una cadena de texto codificada (encodeURIComponent) con los productos y el subtotal, y se abre [https://wa.me/TUTELEFONO?text=](https://wa.me/TUTELEFONO?text=)... en una nueva pestaña.

Flujo de Correo: Si el usuario dejó su email, un Server Action en Next.js llama a la API de Resend enviando una plantilla HTML profesional con la tabla de productos cotizados.

Ofertas Flash: La base de datos tendrá la verdad absoluta. Si la fecha_inicio ya pasó y la fecha_fin no ha llegado, el componente CountdownTimer renderiza; al llegar a cero, el producto pierde el precio promocional en la vista automáticamente.

Estrategia de Imágenes: El administrador seleccionará imágenes. Un script del lado del cliente utilizará la API Canvas para redimensionar (max 1000px) y convertir el blob a image/webp antes de hacer el upload a Supabase Storage.

9. Orden Exacto de Desarrollo (El Roadmap)
Fase 1 (Base Estructural): Limpiar proyecto, crear carpetas en src/app, configurar Tailwind y establecer Contexto global vacío.

Fase 2 (Base de Datos): Aplicar el esquema SQL definitivo en Supabase, crear políticas RLS y poblar 5 productos de prueba.

Fase 3 (El Motor del Carrito): Escribir CartContext.js, probar guardado en localStorage, crear funciones de sumar/restar/eliminar.

Fase 4 (UI Pública Core): Construir Header, buscador en vivo, ProductCard, página de inicio / y página de catálogo /catalogo.

Fase 5 (Cotización y Comunicación): Formulario de checkout, guardado transaccional en base de datos, generación de enlace de WhatsApp e integración de correos.

Fase 6 (Ofertas Flash): Lógica de temporizadores, UI de página de ofertas, badge de cuenta regresiva.

Fase 7 (Administración): Pantalla de login segura, layout del dashboard, CRUD de productos, visor de cotizaciones para el administrador.

Fase 8 (Optimización final): SEO (metadata), conversión de imágenes .webp, pruebas responsivas rigurosas.