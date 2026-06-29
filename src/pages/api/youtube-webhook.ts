import type { APIRoute } from "astro";
import { createHmac } from "node:crypto";

// GET endpoint to handle the WebSub/PubSubHubbub verification challenge from YouTube
export const GET: APIRoute = ({ request }) => {
  const url = new URL(request.url);
  const challenge = url.searchParams.get("hub.challenge");
  const mode = url.searchParams.get("hub.mode");
  const topic = url.searchParams.get("hub.topic");

  console.log(`[youtube-webhook] GET verification — mode: ${mode}, topic: ${topic}`);

  if (challenge) {
    console.log("[youtube-webhook] Verification challenge accepted.");
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response("Missing hub.challenge", { status: 400 });
};

// POST endpoint: YouTube notifica un nuevo video → dispara Vercel deploy hook
export const POST: APIRoute = async ({ request }) => {
  try {
    const secret = import.meta.env.YT_SECRET;
    const deployHookUrl = import.meta.env.VERCEL_DEPLOY_HOOK_URL;

    // --- Validar firma HMAC-SHA1 de YouTube ---
    if (secret) {
      const signature = request.headers.get("X-Hub-Signature");
      if (!signature) {
        console.warn("[youtube-webhook] Rechazado: no hay X-Hub-Signature.");
        return new Response("Unauthorized — missing signature", { status: 401 });
      }

      const body = await request.text();
      const [algo, receivedHash] = signature.split("=");

      if (algo !== "sha1") {
        console.warn(`[youtube-webhook] Algoritmo de firma inesperado: ${algo}`);
        return new Response("Unauthorized — unexpected algorithm", { status: 401 });
      }

      const expectedHash = createHmac("sha1", secret).update(body).digest("hex");

      if (expectedHash !== receivedHash) {
        console.error("[youtube-webhook] Firma HMAC inválida — posible petición no autorizada.");
        return new Response("Unauthorized — invalid signature", { status: 401 });
      }

      console.log("[youtube-webhook] Firma HMAC verificada ✅");
    } else {
      console.warn("[youtube-webhook] YT_SECRET no configurado — saltando validación de firma.");
    }

    // --- Disparar Vercel Deploy Hook ---
    if (!deployHookUrl) {
      console.error("[youtube-webhook] VERCEL_DEPLOY_HOOK_URL no está configurada.");
      return new Response("Deploy hook URL not configured.", { status: 500 });
    }

    console.log("[youtube-webhook] Disparando Vercel deploy hook...");
    const vercelResponse = await fetch(deployHookUrl, { method: "POST" });

    if (vercelResponse.ok) {
      console.log("[youtube-webhook] ✅ Deploy hook disparado correctamente.");
      return new Response("Webhook received and deploy triggered.", { status: 200 });
    } else {
      const errText = await vercelResponse.text();
      console.error(`[youtube-webhook] ❌ Falló el deploy hook: ${vercelResponse.status} — ${errText}`);
      return new Response("Failed to trigger deploy.", { status: 500 });
    }
  } catch (error) {
    console.error("[youtube-webhook] Error inesperado:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
