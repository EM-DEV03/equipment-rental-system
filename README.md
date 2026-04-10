# Sistema MVP - Alquiler de Equipos de Construccion

MVP web para controlar la operacion diaria de alquiler de equipos de construccion con foco en:

- inventario en tiempo real
- clientes con historial
- salidas con documento obligatorio
- devoluciones obligatorias por numero de factura
- cargos automaticos por mora, daños e incompletos

## Arquitectura

### Frontend
- Next.js 14
- Tailwind CSS
- Interfaz orientada a operacion rapida

### Backend
- NestJS
- TypeORM
- SQLite local para ejecucion simple con Node
- PDF generado automaticamente al crear una factura o recibo
- Swagger disponible para documentacion de API

### Modulos implementados
- `auth`
- `customers`
- `equipment`
- `rentals`
- `returns`
- `dashboard`
- `reports`

## Modelo de datos

Entidades principales:

- `users`
- `customers`
- `equipment`
- `rentals`
- `rental_items`
- `invoices`
- `returns`
- `return_items`
- `activity_logs`

## Reglas de negocio cubiertas

- Toda salida genera `FACTURA` o `RECIBO`
- Toda devolucion se hace por numero de factura
- No se alquila si no hay stock suficiente
- Se registra estado de devolucion: `GOOD`, `DAMAGED`, `INCOMPLETE`
- Se calculan dias de alquiler, mora y cargos adicionales
- El inventario se actualiza automaticamente
- El sistema puede imprimir en POS 80mm o en impresora normal A4 segun el perfil configurado

## Ejecucion local con Node

### 1. Backend

```powershell
cd backend
npm install
npm run build
node dist/main.js
```

Backend disponible en:

- `http://localhost:3001/api`
- `http://localhost:3001/api/docs`

Healthcheck:

- `http://localhost:3001/api/health`

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend disponible en:

- `http://localhost:3000`

## Credenciales demo

Se crean automaticamente al iniciar el backend por primera vez:

- Usuario: `admin`
- Clave: `Admin123*`

Tambien se crea un usuario empleado:

- Usuario: `empleado`
- Clave: `Empleado123*`

## Flujo principal

### Alquiler
1. Seleccionar cliente
2. Seleccionar responsable
3. Elegir equipos y cantidades
4. Definir fecha estimada de devolucion
5. Generar factura o recibo

Resultado:

- se descuenta inventario
- se genera numero consecutivo
- se crea PDF
- queda disponible para devolucion por factura
- se puede imprimir como ticket POS o como documento normal

### Devolucion
1. Buscar factura
2. Revisar lo pendiente
3. Registrar cantidad devuelta
4. Marcar estado
5. Procesar devolucion

Resultado:

- se compara salida vs devolucion
- se calculan cargos extra
- se actualiza inventario
- el alquiler queda parcial o completado

## Endpoints principales

### Auth
- `POST /api/auth/login`
- `GET /api/auth/users`

### Clientes
- `GET /api/customers`
- `POST /api/customers`
- `PATCH /api/customers/:id`
- `GET /api/customers/:id/history`

### Inventario
- `GET /api/equipment`
- `POST /api/equipment`
- `PATCH /api/equipment/:id`

### Alquileres
- `GET /api/rentals`
- `POST /api/rentals`
- `GET /api/rentals/invoice/:invoiceNumber`

### Devoluciones
- `GET /api/returns/invoice/:invoiceNumber`
- `POST /api/returns`

### Reportes
- `GET /api/dashboard/summary`
- `GET /api/reports/active-rentals`
- `GET /api/reports/top-equipment`
- `GET /api/reports/income`

## Impresion segun impresora

En la pantalla de alquiler existe un selector llamado `Perfil de impresora`.

- `Impresora POS 80mm`: abre un ticket compacto para comandas o tirilla.
- `Impresora normal / A4`: abre un documento ancho para hoja carta o impresora convencional.

La preferencia queda guardada en el navegador y el boton de impresion cambia automaticamente.

## Seguridad aplicada

- contraseñas con `bcrypt`
- `helmet` para cabeceras HTTP
- validacion global con `ValidationPipe`
- JWT listo para autenticacion
- logs de actividad para eventos clave
- Swagger para inspeccion y prueba de endpoints

## Notas

- El backend ahora usa puerto configurable por variable `PORT`; por defecto `3001`.
- Si `3001` esta ocupado, cierra el proceso anterior o inicia con otro puerto:

```powershell
$env:PORT=3002
node dist/main.js
```

- Para una fase siguiente se puede migrar de SQLite a PostgreSQL sin rehacer la logica de negocio.
- El frontend fue actualizado a una version moderna de Next.js y React.

## Produccion

Para subirlo y empezar a usarlo en web de forma seria, la recomendacion es:

- frontend en `Vercel`
- backend NestJS en `Railway` o `Render`
- base de datos `PostgreSQL`

### Variables recomendadas para backend

Usa [backend/.env.example](c:/Users/Maria_Iriarte/Documents/EM_DATA/Arleys_Software/backend/.env.example) como base.

Variables claves:

- `NODE_ENV=production`
- `HOST=0.0.0.0`
- `PORT=3001`
- `CORS_ORIGIN=https://tu-frontend.vercel.app`
- `JWT_SECRET=un-secreto-largo-y-seguro`
- `DB_TYPE=postgres`
- `DATABASE_URL=postgresql://usuario:clave@host:5432/base`
- `DB_SSL=true`
- `DB_SYNCHRONIZE=false`

### Variables recomendadas para frontend

Usa [frontend/.env.example](c:/Users/Maria_Iriarte/Documents/EM_DATA/Arleys_Software/frontend/.env.example):

- `NEXT_PUBLIC_API_URL=https://tu-api.com/api`

### Flujo de despliegue recomendado

1. Crear base PostgreSQL.
2. Configurar variables del backend.
3. Subir backend y validar `/api/health`.
4. Configurar variables del frontend.
5. Subir frontend.
6. Probar login, alquiler, devolucion y pagos.

## Estado actual del sistema

Ya incluye:

- autenticacion JWT
- proteccion de rutas API
- clientes, inventario, alquileres, devoluciones
- pagos y cartera
- usuarios y roles basicos
- configuracion del negocio
- impresion POS y A4
- Swagger
- healthcheck
- soporte para PostgreSQL por entorno
- transacciones en operaciones criticas
