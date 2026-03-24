# KogniRecovery 🧠💚

**App de acompañamiento en adicciones con IA**

Proyecto desarrollado con React Native + Expo, TypeScript y arquitectura escalable.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Setup Inicial](#setup-inicial)
- [Scripts Disponibles](#scripts-disponibles)
- [Configuración de Base de Datos](#configuración-de-base-de-datos)
- [Convenciones de Código](#convenciones-de-código)
- [Estado del Sprint 0](#estado-del-sprint-0)
- [Próximos Pasos](#próximos-pasos)

---

## 🌟 Características

- **Autenticación segura**: Login/registro con persistencia local
- **Check-ins diarios**: Seguimiento de estado emocional y cravings
- **Chatbot IA**: Asistente conversacional para apoyo 24/7
- **Dashboard familiar**: Vista para familiares (próximamente)
- **Modo oscuro/claro**: Tema adaptable
- **Accesibilidad**: Soporte para configuraciones de accesibilidad
- **Offline-first**: Datos persistidos localmente

---

## 🛠️ Tecnologías

### Frontend Móvil
- **React Native** 0.74.1
- **Expo** 51.0.0
- **TypeScript** 5.1.3 (strict mode)
- **React Navigation** 6.x (Stack + Bottom Tabs)
- **Zustand** 4.x (State Management)
- **Expo Secure Store** (Persistencia segura)

### Desarrollo
- **ESLint** + **Prettier** (Code Quality)
- **Husky** (Git hooks - pendiente)
- **Jest** (Testing - pendiente)

### Backend (Docker)
- **PostgreSQL** 15 (Base de datos principal)
- **Redis** 7 (Cache y sesiones)
- **pgAdmin** (Herramienta de administración)

---

## 📁 Estructura del Proyecto

```
KogniRecovery/
├── App.tsx                      # Componente raíz
├── src/
│   ├── assets/                  # Imágenes, fuentes, iconos
│   ├── components/              # Componentes UI reutilizables
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Card/
│   │   ├── Modal/
│   │   └── LoadingSpinner/
│   ├── screens/                 # Pantallas de la app
│   │   ├── auth/                # Login, Register, ForgotPassword
│   │   ├── dashboard/           # Dashboard principal
│   │   ├── checkin/             # Check-in diario
│   │   ├── chatbot/             # Chatbot IA
│   │   └── profile/             # Perfil de usuario
│   ├── navigation/              # Configuración de navegación
│   │   ├── RootNavigator.tsx    # Navegador raíz (condicional)
│   │   ├── AuthNavigator.tsx    # Stack de autenticación
│   │   ├── MainTabNavigator.tsx # Bottom tabs principal
│   │   └── types.ts             # Tipos de navegación
│   ├── store/                   # Estado global (Zustand)
│   │   ├── authStore.ts         # Autenticación
│   │   ├── uiStore.ts           # Configuración UI
│   │   └── checkinStore.ts      # Check-ins y streaks
│   ├── theme/                   # Sistema de temas
│   │   ├── theme.ts             # Tokens de diseño
│   │   └── ThemeContext.tsx     # Context provider
│   ├── services/                # Servicios (API, LLM, etc.)
│   ├── utils/                   # Funciones utilitarias
│   └── types/                   # Definiciones TypeScript
├── docker/
│   └── postgres/
│       └── init.sql             # Migraciones iniciales
├── docker-compose.yml           # Orquestación de servicios
├── .env.example                 # Variables de entorno
├── app.json                     # Configuración Expo
├── babel.config.js              # Configuración Babel
├── tsconfig.json                # Configuración TypeScript
├── .eslintrc.js                 # Configuración ESLint
├── .prettierrc.js               # Configuración Prettier
└── package.json                 # Dependencias
```

---

## 🚀 Setup Inicial

### 1. Prerrequisitos

- **Node.js** 18+ ([Descargar](https://nodejs.org/))
- **npm** o **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **Docker** y **Docker Compose** (para backend)
- **Git**

### 2. Instalación de Dependencias

```bash
# Clonar el repositorio (si aplica)
# git clone <repo-url>
cd KogniRecovery

# Instalar dependencias
npm install

# O con yarn
yarn install
```

### 3. Configuración de Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus configuraciones
# - API_URL (backend)
# - LLM_API_KEY (OpenAI/Anthropic)
# - SENTRY_DSN (opcional)
```

### 4. Iniciar Base de Datos (Docker)

```bash
# Levantar PostgreSQL + Redis
docker-compose up -d postgres redis

# Opcional: Levantar pgAdmin para administración
docker-compose --profile tools up -d pgadmin
# Acceder en: http://localhost:5050
# Email: admin@kognirecovery.com
# Password: admin
```

### 5. Iniciar la App

```bash
# Iniciar Expo
npm start

# O directamente
expo start
```

**Opciones de ejecución:**
- `i` - iOS Simulator
- `a` - Android Emulator
- `w` - Web browser
- Escanear QR con Expo Go en dispositivo físico

---

## 📜 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm start` | Inicia Expo development server |
| `npm run android` | Inicia en Android emulator |
| `npm run ios` | Inicia en iOS simulator |
| `npm run web` | Inicia en web browser |
| `npm run lint` | Ejecuta ESLint |
| `npm run lint:fix` | Ejecuta ESLint y corrige errores |
| `npm run format` | Formatea código con Prettier |
| `npm run typecheck` | Verifica tipos TypeScript |
| `npm test` | Ejecuta tests (pendiente) |

---

## 🗄️ Configuración de Base de Datos

### Esquema Inicial

El proyecto incluye migraciones SQL en `docker/postgres/init.sql` que crea:

- **users**: Autenticación y roles
- **profiles**: Información extendida de usuario
- **checkins**: Registros diarios/semanales
- **notifications**: Notificaciones del sistema
- **emergency_alerts**: Alertas de emergencia

### Conexión

```typescript
// Configuración en .env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kognirecovery_dev
```

### pgAdmin

Acceder a http://localhost:5050 para administrar la base de datos visualmente.

---

## 🎨 Convenciones de Código

### TypeScript
- **Modo estricto** (`strict: true`)
- Tipado explícito en funciones y componentes
- Interfaces para todos los props de componentes
- Tipos en `src/types/index.ts`

### Estilos
- **Prettier** para formateo automático
- **ESLint** para calidad de código
- 2 espacios para indentación
- Single quotes para strings

### Componentes
- Nombrar como `PascalCase` (ej: `PrimaryButton`)
- Archivos `.tsx` para componentes con JSX
- Exportación named exports
- Props con interfaces definidas en `@types`

### Navegación
- Stack para flujos secuenciales
- Bottom Tabs para secciones principales
- Protected routes en `RootNavigator`

### Estado Global
- **Zustand** para state management
- Persistencia con `expo-secure-store`
- Stores modulares en `src/store/`

---

## 📊 Estado del Sprint 0

### ✅ Completado

- [x] Estructura de proyecto Expo + TypeScript
- [x] Configuración ESLint + Prettier
- [x] Sistema de temas (claro/oscuro)
- [x] Componentes UI base (Button, Input, Card, Modal, LoadingSpinner)
- [x] Zustand stores (auth, ui, checkin)
- [x] Navegación (AuthStack, MainTabs, protected routes)
- [x] Variables de entorno (.env.example)
- [x] Docker compose (PostgreSQL + Redis)
- [x] Migraciones SQL iniciales

### 🚧 En Desarrollo

- [ ] Tests unitarios y de integración
- [ ] CI/CD pipeline
- [ ] Configuración Sentry
- [ ] Assets e iconos oficiales

### ⏳ Pendiente (Sprints posteriores)

- Pantallas específicas completas
- Conexión a APIs externas
- Integración con LLM
- Push notifications
- Analytics

---

## 🔮 Próximos Pasos

1. **Sprint 1**: Pantallas de autenticación completas
2. **Sprint 2**: Dashboard y check-in diario
3. **Sprint 3**: Chatbot con IA
4. **Sprint 4**: Perfil y configuración
5. **Sprint 5**: Features avanzados (emergencia, familiares)

---

## 📝 Notas de Arquitectura

### Decisiones Técnicas

1. **Expo over React Native CLI**: Mayor velocidad de desarrollo, OTA updates
2. **Zustand over Redux**: Simplicidad, menos boilerplate, mejor TypeScript support
3. **React Navigation v6**: Estándar de la industria, bien mantenido
4. **TypeScript strict**: Máxima seguridad de tipos
5. **Docker para desarrollo**: Consistencia entre entornos
6. **expo-secure-store**: Almacenamiento seguro en dispositivo

### Patrones Implementados

- **Provider Pattern**: Theme, Navigation
- **Store Pattern**: Zustand con persistencia
- **Component Composition**: UI kit reutilizable
- **Conditional Navigation**: Auth vs Main flows
- **Theme System**: Dark/light mode con tokens de diseño

---

## 🤝 Contribución

Este proyecto sigue las convenciones de código establecidas. Antes de enviar cambios:

1. Ejecutar `npm run lint` y `npm run format`
2. Verificar `npm run typecheck`
3. Asegurar que todos los tests pasan
4. Documentar cambios en `/docs/Cambios.md`

---

## 📄 Licencia

ISC

---

**Desarrollado con ❤️ para la recuperación**