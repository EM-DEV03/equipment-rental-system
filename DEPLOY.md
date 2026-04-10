# Despliegue recomendado

Esta es la forma recomendada para dejar el sistema publicado y listo para uso real:

- `frontend` en Vercel
- `backend` en Railway
- `base de datos` PostgreSQL

## 1. Base de datos PostgreSQL

Opciones simples:

- Railway Postgres
- Neon
- Supabase Postgres

Debes obtener:

- `DATABASE_URL`

## 2. Backend en Railway

### Opción recomendada

Crear un servicio nuevo en Railway apuntando a la carpeta `backend`.

Puede desplegarse usando:

- Nixpacks
- o el [backend/Dockerfile](c:/Users/Maria_Iriarte/Documents/EM_DATA/Arleys_Software/backend/Dockerfile)

### Variables del backend

Configura estas variables:

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=3001
CORS_ORIGIN=https://TU-FRONTEND.vercel.app
JWT_SECRET=CAMBIA_ESTO_POR_UN_SECRETO_MUY_LARGO
DB_TYPE=postgres
DATABASE_URL=postgresql://usuario:clave@host:5432/base
DB_SSL=true
DB_SYNCHRONIZE=false
DB_POOL_MAX=10
```

### Build y start

Si usas Nixpacks:

- Build command: `npm run build`
- Start command: `node dist/main.js`

### Healthcheck

Configura en Railway:

- Healthcheck path: `/api/health`

## 3. Frontend en Vercel

Crear un proyecto en Vercel apuntando a la carpeta `frontend`.

La documentación oficial indica que Next.js en Vercel funciona con despliegue de cero configuración:

- https://vercel.com/docs/frameworks/nextjs

### Variable del frontend

```env
NEXT_PUBLIC_API_URL=https://TU-BACKEND.railway.app/api
```

## 4. Dominio

Configura algo así:

- `app.tudominio.com` -> frontend
- `api.tudominio.com` -> backend

Luego actualiza:

- `CORS_ORIGIN=https://app.tudominio.com`
- `NEXT_PUBLIC_API_URL=https://api.tudominio.com/api`

## 5. Validación final

Después del despliegue prueba:

1. `https://api.tudominio.com/api/health`
2. `https://api.tudominio.com/api/docs`
3. login en frontend
4. crear cliente
5. crear alquiler
6. generar documento
7. procesar devolución
8. registrar pago

## 6. Recomendaciones finales

- usa PostgreSQL en producción
- no publiques `.env`
- cambia el `JWT_SECRET`
- crea backups automáticos del Postgres
- limita acceso al panel de Railway/Vercel
- usa HTTPS siempre
