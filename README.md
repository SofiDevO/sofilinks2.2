# SofiLinks 2.2

Sitio personal de enlaces de [SofiDev](https://itssofi.dev) — una linktree personalizada con integración de blog, YouTube, Twitch y más.

**Producción:** https://links.sofidev.blog  
**Diseño Figma:** https://www.figma.com/design/5Lpy7o4AG2F0cNyZToyXLv/Redise%C3%B1o-SofiLinks\?node-id\=0-1\&t\=I6yPTk1ZV40LQtBD-1

## Stack

- [Astro 5](https://astro.build) — framework principal (SSR, desplegado en Vercel)
- [React 19](https://react.dev) — componentes interactivos
- [Tailwind CSS 4](https://tailwindcss.com) — estilos
- [MDX](https://mdxjs.com) — contenido de páginas (About, legal)
- [Swiper](https://swiperjs.com) — carrusel de productos/videos

## Integraciones externas

| Servicio | Uso |
| :--- | :--- |
| WordPress GraphQL | Últimas entradas del blog (`WPGRAPHQL_URL`) |
| YouTube Data API v3 | Feed de videos del canal (`YT_API_KEY`, `YT_SECRET`) |
| Twitter/X API | Últimos tweets (`BEARER_TOKEN`) |
| Google AdSense | Anuncios (`ca-pub-3828278469742835`) |
| Ko-fi / GitHub Sponsors | Sección de soporte |

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con:

```env
WPGRAPHQL_URL=           # URL del endpoint GraphQL de WordPress
YT_API_KEY=              # API Key de YouTube Data API v3 (server-side)
PUBLIC_YT_SECRET=        # API Key de YouTube (client-side, para el carrusel)
BEARER_TOKEN=            # Bearer Token de la API de Twitter/X
```

## 🚀 Estructura del proyecto

```text
/
├── public/              # Archivos estáticos (fuentes, imágenes, SVGs)
├── src/
│   ├── components/
│   │   ├── atoms/       # Componentes base (Button, Avatar, Title…)
│   │   ├── molecules/   # Componentes compuestos (BlogPost, LiveCard, SwiperComponent…)
│   │   └── organisms/   # Secciones completas (Header, BentoMain, Footer…)
│   ├── content/         # Contenido legal en Markdown
│   ├── data/            # JSON de configuración (user, social, support, products…)
│   ├── layouts/         # Layout principal
│   ├── pages/           # Rutas: /, /about, /lives, /privacy-policy, /terms-of-service
│   ├── services/        # Clientes de API (WordPress, YouTube, Twitch)
│   ├── styles/          # CSS global
│   └── utils/           # Utilidades (colores de imagen, estado en vivo, YouTube helpers)
└── package.json
```

## 🧞 Comandos

Todos los comandos se ejecutan desde la raíz del proyecto:

| Comando | Acción |
| :--- | :--- |
| `npm install` | Instala las dependencias |
| `npm run dev` | Servidor de desarrollo en `localhost:4321` |
| `npm run build` | Compila el sitio para producción en `./dist/` |
| `npm run preview` | Previsualiza el build localmente |
| `npm run astro ...` | CLI de Astro (`astro add`, `astro check`, etc.) |

## Personalización

Los datos del perfil, redes sociales, soporte y productos se editan en los archivos JSON de `src/data/`:

- `user.json` — nombre, foto de perfil, redes y bio
- `social.json` — iconos y enlaces de redes sociales
- `support.json` — plataformas de soporte (Ko-fi, YouTube Members, GitHub Sponsors…)
- `productData.json` — productos del carrusel
- `youtubeChannels.json` — canales de YouTube mostrados
