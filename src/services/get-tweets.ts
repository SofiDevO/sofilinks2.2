import { Client } from "twitter-api-sdk";
import { BEARER_TOKEN } from "astro:env/server";
import fs from "node:fs";
import path from "node:path";

const CACHE_FILE = path.join(process.cwd(), ".cache", "tweets.json");
const CACHE_DURATION = 30 * 60 * 1000;

interface CacheData {
  timestamp: number;
  data: any;
}

function getCachedTweets(): any | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      return null;
    }

    const cacheContent = fs.readFileSync(CACHE_FILE, "utf-8");
    const cache: CacheData = JSON.parse(cacheContent);

    // Verificar si el caché sigue siendo válido
    const now = Date.now();
    const cacheAge = now - cache.timestamp;

    if (cacheAge < CACHE_DURATION) {
      console.log(`✓ Usando caché de tweets (${Math.round(cacheAge / 1000 / 60)} minutos de antigüedad)`);
      return cache.data;
    }

    console.log("Caché expirado, obteniendo nuevos tweets...");
    return null;
  } catch (error) {
    console.error("Error al leer caché:", error);
    return null;
  }
}

function saveCachedTweets(data: any): void {
  try {
    const cacheDir = path.dirname(CACHE_FILE);

    // Crear directorio .cache si no existe
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const cache: CacheData = {
      timestamp: Date.now(),
      data: data
    };

    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
    console.log("✓ Tweets guardados en caché");
  } catch (error) {
    console.error("Error al guardar caché:", error);
  }
}

export async function fetchTweets() {
  // Intentar obtener del caché primero
  const cachedData = getCachedTweets();
  if (cachedData) {
    return cachedData;
  }

  try {
    const bearerToken = BEARER_TOKEN;
    const client = new Client(bearerToken);

    //  @itssofidev
    const userId = "1368665387949318153";

    const response = await client.tweets.usersIdTweets(userId, {
      max_results: 1,
      "tweet.fields": [
          "created_at",
          "text",
          "attachments",
      ],
      "expansions": [
          "attachments.media_keys",
          "author_id"
      ],
      "media.fields": [
          "preview_image_url",
          "url",
          "type",
          "alt_text"
      ],
      "user.fields": [
          "username",
          "name",
          "profile_image_url",
          "verified"
      ]
    });

    console.log("✓ Tweets obtenidos de la API");

    // Guardar en caché
    saveCachedTweets(response);

    return response;

  } catch (error: any) {
    if (error.status === 429) {
      console.warn("Rate limit de Twitter excedido. Reinténtalo más tarde.");
      if (error.headers?.['x-rate-limit-reset']) {
        const resetTime = new Date(parseInt(error.headers['x-rate-limit-reset']) * 1000);
        console.warn(`   Se reiniciará en: ${resetTime.toLocaleString()}`);
      }
    } else {
      console.error("✗ Error al obtener tweets:", error.message);
    }

    // Si hay error, intentar devolver caché antiguo como fallback
    const oldCache = getCachedTweets();
    if (oldCache) {
      console.log("Usando caché antiguo como fallback");
      return oldCache;
    }

    return null;
  }
}
