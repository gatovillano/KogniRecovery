# KogniRecovery Backend 🧠

Backend API para **KogniRecovery** - Sistema de Acompañamiento en Adicciones.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Ejecutar el Servidor](#-ejecutar-el-servidor)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Autenticación](#-autenticación)
- [Base de Datos](#-base-de-datos)
- [Scripts Disponibles](#-scripts-disponibles)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

## ✨ Características

- **Express.js** con TypeScript strict
- **PostgreSQL** con pool de conexiones
- **JWT** para autenticación con refresh tokens
- **Middleware** de validación, CORS y manejo de errores
- **Arquitectura** limpia (Controller → Service → Model)
- **Seguridad** con bcrypt para contraseñas

## 📦 Requisitos

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 14.0

## 🚀 Instalación

1. **Clonar el repositorio**

2. **Instalar dependencias**
   ```bash
   cd server
   npm install
   ```

3. **Copiar archivo de entorno**
   ```bash
   cp .env.example .env
   ```

4. **Configurar variables de entorno**
   Edita el archivo `.env` con tus valores.

## ⚙️ Configuración

### Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `NODE_ENV` | Entorno de ejecución | `development` |
| `PORT` | Puerto del servidor | `3001` |
| `DATABASE_URL` | URL de PostgreSQL | - |
| `JWT_SECRET` | Clave secreta JWT | - |
| `JWT_REFRESH_SECRET` | Clave secreta refresh token | - |

### Esquema de Base de Datos

El servidor utiliza las siguientes tablas (debes ejecutar las migraciones primero):

- `users` - Usuarios del sistema
- `refresh_tokens` - Tokens de actualización

## 🎯 Ejecutar el Servidor

### Desarrollo

```bash
npm run dev
```

El servidor estará disponible en: `http://localhost:3001`

### Producción

```bash
npm run build
npm start
```

## 📁 Estructura del Proyecto

```
server/
├── src/
│   ├── config/           # Configuración
│   │   ├── index.ts      # Variables de entorno
│   │   └── database.ts   # Conexión PostgreSQL
│   ├── middleware/       # Middlewares Express
│   │   ├── auth.ts       # Autenticación JWT
│   │   ├── cors.ts      # CORS
│   │   ├── error.ts     # Manejo de errores
│   │   └── validation.ts # Validación
│   ├── models/          # Modelos de datos
│   │   ├── user.model.ts
│   │   └── refreshToken.model.ts
│   ├── services/        # Lógica de negocio
│   │   └── auth.service.ts
│   ├── controllers/     # Controladores HTTP
│   │   └── auth.controller.ts
│   ├── routes/          # Rutas API
│   │   ├── index.ts
│   │   └── auth.routes.ts
│   ├── app.ts          # Configuración Express
│   └── index.ts        # Entry point
├── package.json
├── tsconfig.json
└── .env.example
```

## 📡 API Endpoints

### Health Check

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/health` | Verificar estado del servidor |

### Autenticación

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | ❌ | Registrar nuevo usuario |
| POST | `/api/v1/auth/login` | ❌ | Iniciar sesión |
| POST | `/api/v1/auth/refresh` | ❌ | Refrescar tokens |
| POST | `/api/v1/auth/logout` | ✅ | Cerrar sesión |
| GET | `/api/v1/auth/sessions` | ✅ | Obtener sesiones activas |

## 🔐 Autenticación

### Registro de Usuario

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "MiContraseña123!",
  "name": "Juan Pérez",
  "role": "patient"
}
```

**Roles disponibles:** `patient`, `family`, `professional`

### Inicio de Sesión

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "MiContraseña123!"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "usuario@ejemplo.com",
      "name": "Juan Pérez",
      "role": "patient"
    },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ..."
    }
  },
  "message": "Inicio de sesión exitoso"
}
```

### Refrescar Token

```bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJ..."
}
```

### Cerrar Sesión

```bash
POST /api/v1/auth/logout
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "refreshToken": "eyJ..."
}
```

### Headers Requeridos

Para endpoints protegidos:
```
Authorization: Bearer <accessToken>
```

## 🗄️ Base de Datos

### Configuración de Pool

El servidor usa un pool de conexiones configurado en `src/config/database.ts`:

- **Mínimo de conexiones:** 2
- **Máximo de conexiones:** 10
- **Timeout de conexión inactiva:** 30s

### Migraciones

Ejecuta las migraciones desde la raíz del proyecto:

```bash
npm run db:migrate
```

## 📜 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Iniciar servidor en modo desarrollo |
| `npm run build` | Compilar TypeScript |
| `npm run start` | Iniciar servidor en producción |
| `npm run lint` | Ejecutar linter |
| `npm run format` | Formatear código |

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -am 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crea un Pull Request

## 📄 Licencia

MIT License - Copyright (c) 2026 KogniRecovery Team

---

<p align="center">
  🧠 KogniRecovery - Sistema de Acompañamiento en Adicciones
</p>
