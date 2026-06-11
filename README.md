# Headless WordPress Blog with Astro

## 1. Introduction and Project Overview

This project is a Blog web application that uses **Astro** as the frontend framework and **WordPress** acting as a Headless CMS coupled via the **WPGraphQL** plugin. The application takes advantage of Astro's features to provide highly optimized content delivery through a mix of on-the-fly Server-Side Rendering (SSR) and pre-rendered pages (Static Site Generation or SSG), allowing for high performance, robust SEO, and dynamic interactivity when required (such as the authentication and commenting system).

## 2. Prerequisites and Environment Setup (WordPress)

For the frontend to consume data and function correctly, the WordPress backend requires the following mandatory configuration:

1. **WordPress**: Active installation, either local (XAMPP/Local by Flywheel) or on a cloud server.
2. **Required Plugins**:
   - [**WPGraphQL**](http://wpgraphql.com/): Enables the GraphQL API in WordPress replacing or complementing the traditional REST API.
   - **WPGraphQL SEO**: Extends the schema to integrate metadata in queries.
   - **Yoast SEO**: (Required alongside WPGraphQL SEO) for granular organic positioning control.
   - **Site Logo for WPGraphQL**: Allows extracting the logo configured from the theme customizer via GraphQL. _(Custom plugin, add repository URL here in the future)._
   - **Table of Contents Plus**: Makes it easy to add tables of contents in WordPress, ideal for long articles; its parsed HTML can be extracted.
   - **WP Webhooks**: Useful for invalidating and rebuilding the static site or cache when a new post is published in WordPress via event triggers.
3. **Optional Image Optimization**:
   - **Cloudinary**: Suggested integration at the WordPress level using its respective official plugin to store resources and images in a CDN, saving bandwidth and obfuscating the original URL and internal structure of the WordPress server (reducing the risk of technological exposure).

---

## 3. Technologies and Integrations in Astro

The project has the following technological layers integrated in the setup (`astro.config.mjs` and `package.json`):

- **Astro (v6.x)**: Frontend engine with `output: "server"` mode, which enables SSR alongside the Vercel adapter.
- **@astrojs/vercel**: Adapter to deploy the project in Vercel's serverless infrastructure, running API functionalities (Authentication and dynamic routes in SSR).
- **@tailwindcss/vite**: Integration of the Tailwind CSS v4 engine to manage the visual system in a utility-first way.
- **@astrojs/sitemap**: Automated generation of `sitemap.xml` to robustify search engine positioning, automatically filtering and hiding routes that shouldn't have SEO like ( `/login`, `/register`, `/dashboard`, etc).
- **JWT Libraries (`jsonwebtoken`, `jose`)**: Authentication for users who want to interact as registered users on the blog (stateless session system via cookies/tokens).
- **Sanitize-HTML**: Used to ensure that the injected input from the WordPress visual editor does not contaminate or compromise the web application's XSS security.

---

## 4. Environment Variables

In the root directory (`/`), it is necessary to create a `.env` file based on the `.env.example` file. Variables include:

```env
# Base URL of your WordPress GraphQL installation (e.g.: https://yourdomain.com/graphql)
WP_URL=your_wordpress_wpgraphql_url
# Optional, depending on usage:
WPGRAPHQL_URL=your_wordpress_wpgraphql_url

# Application Credentials in WordPress for Auth / Mutations (Comments/Registration)
# These should be configured as an "Application Password" inside the user profile in WordPress
SECRET_USER=your_secret_user
SECRET_PASSWORD=your_secret_password

# Private key internally used in Astro to sign local JWT access
SECRET_KEY=your_super_secure_secret_key
```

---

## 5. Folder Structure and Architecture

The application follows the layered architecture paradigm with separation of concerns:

```text
.
├── astro.config.mjs
├── package.json
├── public
│   ├── favicon2.png
│   ├── favicon.svg
│   └── images/
├── README.md
├── src
│   ├── consts.ts
│   ├── env.d.ts
│   ├── content/
│   │   └── privacy-policy.md
│   ├── controllers/
│   │   ├── comments.controller.js
│   │   └── themeToggle.controller.js
│   ├── layout/
│   │   ├── BaseHead.astro
│   │   └── Layout.astro
│   ├── pages/
│   │   ├── 404.astro
│   │   ├── index.astro
│   │   ├── privacy-policy.astro
│   │   ├── resultados.astro
│   │   ├── robots.txt.ts
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── patata.ts
│   │   │   └── replies.ts
│   │   ├── category/
│   │   │   ├── index.astro
│   │   │   └── [slug]/
│   │   ├── home/
│   │   │   └── components/
│   │   └── post/
│   │       ├── button-copy.ts
│   │       ├── components/
│   │       └── [slug].astro
│   ├── services/
│   │   ├── auth/
│   │   │   ├── getUserByName.ts
│   │   │   └── index.ts
│   │   ├── queries/
│   │   └── wordpress.ts
│   ├── shared/
│   │   └── components/
│   │       ├── form/
│   │       ├── Pagination.astro
│   │       ├── posts/
│   │       ├── sidebar/
│   │       ├── ThemeIcon.astro
│   │       └── Tilte.astro
│   ├── styles/
│   │   └── global.css
│   ├── types/
│   └── utils/
└── tsconfig.json
```

- `/public`: Static assets, local images, global icons.
- `/src`
  - **`/api/` or `pages/api/`**: Backend endpoints provided by Astro SSR (e.g. `auth/login.ts`, `auth/register.ts`, `replies.ts`, `patata.ts`). They handle POST requests, secure sessions, validations, and restricted communications.
  - **`/pages/`**: Complete rendered routes and views for visitors (Astro file-based routing).
    - `index.astro`: Home page (Categories + Hero). Generally SSR.
    - `/post/[slug].astro`: Single post pages. They take advantage of `prerender = true` (SSG) to prebuild and load instantly.
    - `/category/`: Dynamic routes to list taxonomy articles and pagination (`[...page].astro`).
  - **`/layout/`**: Global structure containers (`BaseHead.astro`, `Layout.astro`), integrate SEO metadata.
  - **`/services/`**: Repository for the data logic layer. This centralizes communication with WordPress using pure JS/Fetch API.
    - `wordpress.ts` / Global fetcher parameterized with credentials.
    - `/queries/`: Files (e.g. `getPostBySlug.ts`, `postComment.ts`) that export GraphQL variables (Queries/Mutations) in isolation to be reused.
    - `/auth/`: Communication logic with the WordPress user backend.
  - **`/controllers/`**: Support JavaScript files for UI and hybrid flows (`comments.controller.js`, `themeToggle.controller.js`), responsible for events and DOM logic.
  - **`/shared/`**: Transversally reusable components (`Pagination`, `Sidebar`, `SearchForm`, `PostCard`).
  - **`/types/`**: Interfaces or formal TypeScript Types to foresee the schema that the WPGraphQL query will return and autocomplete models (`post.type.ts`, `user.type.ts`).
  - **`/utils/`**: Accessory functions (`sanatizeHtml.ts`, `formatedDate.js`, `buildMenuTree.ts`).

---

## 6. Application Flow (How it operates)

1. **Routing and Initial SSR/SSG View**: The user enters a route, for example the front page (`/`). Astro invokes the functions inside `/services/queries/` which make a POST fetch request to `WP_URL`. Upon receiving a response, Astro composes all the HTML on the server by rendering the components from `/pages/home/components/`. Everything is injected before being delivered to the user, guaranteeing maximum speed without heavy JavaScript.
2. **Entering a Specific Post (`/post/[slug]`)**: Because it has `export const prerender = true;`, Astro at build time extracts the entire list of slugs from WordPress via GraphQL and prebuilds these sites generating static files, so these urls are served with extremely high performance from the edge CDN.
3. **Comment Loading / Submission Flow**: This is orchestrated through the `comments.controller.js` controller. Since Astro prebuilds the HTML or generates it server-side, the dynamism of writing a comment triggers a utility function towards the internal endpoint `/api/replies.ts` so as not to filter tokens and IPs directly from the client but in a proxied and protected way, which then transfers the Mutation with basic Auth to WordPress invisibly.
4. **Authentication System Flow (Auth)**:
   - A user interacts with the `/login` page submitting their credentials.
   - The form sends a POST request to the local Astro SSR endpoint at `/api/auth/login.ts`.
   - Astro communicates with WordPress by executing a WPGraphQL `LoginUser` mutation to authenticate the user using the **WPGraphQL JWT Authentication** plugin.
   - WordPress validates the credentials and returns an `authToken` (JWT) along with the user's profile data.
   - Upon receiving the valid response, the Astro server verifies the data and creates its own payload, signed locally using `jsonwebtoken` and the `SECRET_KEY` env variable.
   - Astro sets this token as a secure, strict HttpOnly `Cookie` (`accessToken`) in the client's browser.
   - The user is redirected to `/dashboard`. Subsequent pages and API endpoints read this cookie using `isLoggedIn()` to recognize the user's session state and protect restricted views.

---

## 7. Authentication Setup (WordPress & Astro)

To enable the JWT-based login mechanism between Astro and WordPress, specific configurations are required on the WP backend to allow secure token generation via WPGraphQL:

### 7.1 WordPress Plugin Installation

1. Install and activate the core **WPGraphQL** plugin.
2. Install and activate the official extension **WPGraphQL JWT Authentication** (via the zip file directly from its [GitHub repository](https://github.com/wp-graphql/wp-graphql-jwt-authentication)).
   _(Warning: Do not confuse this with the "JWT Authentication for WP REST API" plugin, which works on REST rather than GraphQL)._
3. Ensure you do **not** have conflicting Basic Auth plugins active (such as "WP-API/Basic-Auth") that could intercept and block the GraphQL requests. Basic Auth for global site queries is managed natively by WordPress via "Application Passwords".

### 7.2 Configuration in `wp-config.php`

You must define a secure signing key and enable CORS for the JWT plugin. Open your server's `wp-config.php` and add the following lines **before** the `/* That's all, stop editing! Happy publishing. */` comment and absolutely before the `require_once ABSPATH . 'wp-settings.php';` execution:

```php
define( 'GRAPHQL_JWT_AUTH_SECRET_KEY', 'your_very_long_and_complex_secret_key_with_at_least_64_chars!' );
define( 'GRAPHQL_JWT_AUTH_CORS_ENABLE', true );
```

_Note: If the key length is too short, WPGraphQL will throw an "Internal Server Error" stating that the "Provided key is too short" when trying to log in._

### 7.3 Frontend Variables

On the Astro side, ensure your local `.env` file contains the `SECRET_KEY` variable:

```env
SECRET_KEY=my_secure_astro_key_123
```

This key is completely independent of the WordPress key and is used exclusively by Astro to sign and verify the session cookies for the browser.
