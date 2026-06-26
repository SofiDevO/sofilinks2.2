# Estado de Conexión con el Backend — `sofilinks2.2`

Resumen del estado actual de integración entre el frontend Astro y los distintos backends del proyecto.

---

## 🟢 Lo que YA tenemos implementado

### 1. Stories API (backend principal — Cloudflare Worker)

| Capa | Archivo | Estado |
|---|---|---|
| Helper base (`apiFetch`, headers) | `shared/helpers/stories.helpers.ts` | ✅ Implementado |
| Tipos (`Story`, `Comment`, `LikeResponse`, `ApiResponse`) | `features/stories/types/stories.types.ts` | ✅ Implementado |
| Servicio público (get stories, likes, comments) | `features/stories/services/stories.service.ts` | ✅ Implementado |
| Servicio admin (upload URL, delete, bans) | `features/dashboard/services/dashboard.service.ts` | ✅ Implementado |
| Tipo `Ban` | `features/dashboard/types/dashboard.types.ts` | ✅ Implementado |

**Endpoints cubiertos en el service layer:**

| Método | Endpoint | Servicio |
|---|---|---|
| `GET` | `/api/v1/stories` | `storiesService.getActiveStories` |
| `GET` | `/api/v1/stories/:id/likes` | `storiesService.getLikesCount` |
| `POST` | `/api/v1/stories/:id/likes` | `storiesService.addLike` |
| `GET` | `/api/v1/stories/:id/comments` | `storiesService.getComments` |
| `POST` | `/api/v1/stories/:id/comments` | `storiesService.addComment` |
| `POST` | `/api/v1/stories` | `dashboardService.getUploadUrl` |
| `DELETE` | `/api/v1/stories/:id` | `dashboardService.deleteStory` |
| `GET` | `/api/v1/admin/bans` | `dashboardService.getBans` |
| `POST` | `/api/v1/admin/bans` | `dashboardService.banIp` |
| `DELETE` | `/api/v1/admin/bans/:ip` | `dashboardService.unbanIp` |

---

### 2. Autenticación (Login Flow)

| Capa | Archivo | Estado |
|---|---|---|
| API Route de login (proxy → backend) | `pages/api/auth/login.ts` | ✅ Implementado |
| Manejo de cookie `stories_token` (httpOnly) | `pages/api/auth/login.ts` | ✅ Implementado |
| Utilidades de auth (`getToken`, `isAuthenticated`, `clearToken`) | `shared/utils/auth.ts` | ✅ Implementado |
| Redirect de `/login` si ya autenticado | `pages/login/index.astro` | ✅ Implementado |
| UI del login (form, inputs, loader, error) | `pages/login/_components/` | ✅ Implementado |

---

### 3. WordPress Headless (Blog)

| Capa | Archivo | Estado |
|---|---|---|
| Cliente GraphQL (`wpquery`) | `features/blog/services/wordpress.ts` | ✅ Implementado |
| Query helper de posts (`getCards.js`) | `features/blog/services/getCards.js` | ✅ Implementado |

---

### 4. YouTube API

| Capa | Archivo | Estado |
|---|---|---|
| Servicio de playlist (`fetchPlaylist.js`) | `features/youtube/services/fetchPlaylist.js` | ✅ Implementado |
| Servicio general YouTube (`youtubeService.js`) | `features/youtube/services/youtubeService.js` | ✅ Implementado |
| Webhook receiver (WebSub + Vercel deploy hook) | `pages/api/youtube-webhook.ts` | ✅ Implementado |

---

## 🔴 Lo que NOS FALTA

### 1. Dashboard — página y componentes sin implementar

La página `/dashboard/index.astro` tiene solo 6 líneas con un `<h1>Dashboard</h1>` vacío.

Faltan:
- [ ] UI para gestionar stories (lista, subir, eliminar)
- [ ] UI para gestión de bans (lista, banear IP, desbanear)
- [ ] Guard de autenticación (redirect a `/login` si no hay token)
- [ ] Hooks en `features/dashboard/hooks/` (directorio vacío)
- [ ] Componentes en `features/dashboard/components/` (directorio vacío)

---

### 2. API Route de logout

El helper `clearToken` existe en `auth.ts` pero no hay ninguna ruta `DELETE /api/auth/logout` que lo invoque. Los usuarios no pueden cerrar sesión.

---

### 3. Variable de entorno `PUBLIC_STORIES_API_URL` sin valor en `.env.dev`

```bash
# .env.dev actual — sin valor, confía en el fallback del schema
PUBLIC_STORIES_API_URL=   # vacío → usa http://localhost:8787
```

No hay archivo `.env` de producción ni `.env.example` documentado. Hay que asegurarse de que esté configurado en Vercel.

---

### 4. Headers de admin incorrectos (`getAdminHeaders`)

```ts
// ⚠️ ACTUAL — usa el token en lugar del API-Key como "x-api-key"
const getAdminHeaders = (token?: string) => ({
  "Content-Type": "application/json",
  "x-api-key": token || API_KEY,  // ← el token JWT no es el API key
});
```

Dependiendo de cómo el backend valide admins, puede ser que el token JWT deba ir en `Authorization: Bearer <token>` y la API key en un header separado `x-api-key`.

---

## 📊 Resumen Visual

```
BACKEND               CAPA DE SERVICIO    HOOKS/UI
──────────────────────────────────────────────────
Stories API ──────── ✅ stories.service   ❌ sin hooks
                     ✅ dashboard.service ❌ sin UI
Auth /login ─────── ✅ API route          ✅ login UI
                     ✅ cookie mgmt        ❌ sin logout
WordPress ──────────  ✅ wpquery           ✅ getCards
YouTube API ────────  ✅ fetchPlaylist     ✅ youtubeService
YouTube Webhook ────  ✅ /api/youtube-wh.
```

---

## ✅ Próximos pasos recomendados

1. Implementar `DELETE /api/auth/logout` route
2. Implementar guard de autenticación en `dashboard/index.astro`
3. Construir los componentes y hooks del dashboard
4. Revisar si `getAdminHeaders` debe separar JWT token de API key
