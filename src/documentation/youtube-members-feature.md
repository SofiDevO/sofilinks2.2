# YouTube Members Feature — Resumen de implementación

**Fecha de inicio:** 23 de marzo de 2026  
**Estado:** En espera de aprobación de Google

---

## Que es esta feature?

Mostrar los miembros del canal de YouTube usando el endpoint oficial `members.list` de la YouTube Data API v3. Los miembros son suscriptores de pago que brindan apoyo económico recurrente al canal.

---

## Lo que ya está hecho

### 1. Servicio `fetchMembers.js`
**Ruta:** `src/services/fetchMembers.js`

- Usa OAuth 2.0 con `refresh_token` para obtener un `access_token` fresco en cada build
- Llama a `GET https://www.googleapis.com/youtube/v3/members`
- Soporta paginación automática (`nextPageToken`)
- Retorna `{ members, error }` con el siguiente shape por miembro:

```js
{
  channelId: string,       // ID del canal del miembro
  channelUrl: string,      // URL del canal del miembro
  displayName: string,     // Nombre visible
  profileImageUrl: string, // Avatar
  level: string,           // Nombre del nivel de membresía más alto
  memberSince: string,     // Fecha de inicio (ISO 8601)
  totalMonths: number,     // Meses totales de membresía
}
```

### 2. Variables de entorno en `.env.local`

```env
YT_OAUTH_CLIENT_ID="your-client-id.apps.googleusercontent.com"
YT_OAUTH_CLIENT_SECRET="your-client-secret"
YT_OAUTH_REFRESH_TOKEN="your-refresh-token"
YT_OAUTH_ACCESS_TOKEN="your-access-token"   # opcional, expira en 1h
```

> NOTA: El `REFRESH_TOKEN` actual fue generado sin las credenciales propias. Regenerarlo tras recibir la aprobación de Google.

### 3. Páginas legales requeridas para verificación
- `/privacy-policy` → `src/pages/privacy-policy/index.astro`
- `/terms-of-service` → `src/pages/terms-of-service/index.astro`
- Ambas usan archivos `.md` en `src/content/`

---

## Bloqueadores actuales

### Verificación de Google pendiente
- **Scope requerido:** `https://www.googleapis.com/auth/youtube.channel-memberships.creator`
- Este scope requiere que la app pase el proceso de verificación de Google (OAuth API verification)
- **La solicitud fue enviada el 23 de marzo de 2026**
- Tiempo estimado de revisión: 4-6 semanas

### Mientras llega la aprobación
Se puede probar en modo desarrollo agregando la cuenta propietaria del canal como **Test User**:
- Google Cloud Console → APIs & Services → OAuth consent screen → Test users → Add Users

---

## Proximos pasos cuando llegue la aprobación

1. **Regenerar el refresh token** en [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/) con las credenciales propias activadas ("Use your own OAuth credentials"), usando el scope `channel-memberships.creator`
2. **Actualizar** `YT_OAUTH_REFRESH_TOKEN` en `.env.local` y en las variables de entorno de Vercel
3. **Crear el componente** para mostrar la lista de miembros (sugerencia: una sección de "Wall of Fame" o grilla de avatares)
4. **Integrar el componente** en `src/pages/index.astro` o en una página dedicada `/members`
5. **Verificar en build** con `npm run build` que el servicio obtiene los datos correctamente

---

## Referencias

- [YouTube Data API — members.list](https://developers.google.com/youtube/v3/docs/members/list)
- [YouTube Data API — member resource](https://developers.google.com/youtube/v3/docs/members#resource)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
- [Google Cloud Console](https://console.cloud.google.com/)
