import type { APIRoute } from "astro";
import { createHmac } from "node:crypto";

// GET: Verificación de suscripción PubSubHubbub — YouTube confirma la URL del webhook
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

// POST: YouTube notifica un nuevo video → dispara repository_dispatch en GitHub
export const POST: APIRoute = async ({ request }) => {
  try {
    const secret = import.meta.env.YT_SECRET;
    const ghPat = import.meta.env.GH_PAT;
    const ghRepo = import.meta.env.GH_REPO; // formato: "owner/repo"

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
        return new Response("Unauthorized — unexpected algorithm", { status: 401 });
      }

      const expectedHash = createHmac("sha1", secret).update(body).digest("hex");
      if (expectedHash !== receivedHash) {
        console.error("[youtube-webhook] Firma HMAC inválida.");
        return new Response("Unauthorized — invalid signature", { status: 401 });
      }

      console.log("[youtube-webhook] Firma HMAC verificada ");
    } else {
      console.warn("[youtube-webhook] YT_SECRET no configurado — saltando validación de firma.");
    }

    // --- Disparar repository_dispatch en GitHub ---
    if (!ghPat || !ghRepo) {
      console.error("[youtube-webhook] GH_PAT o GH_REPO no están configurados.");
      return new Response("GitHub credentials not configured.", { status: 500 });
    }

    console.log(`[youtube-webhook] Disparando repository_dispatch en ${ghRepo}...`);

    const githubResponse = await fetch(
      `https://api.github.com/repos/${ghRepo}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ghPat}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ event_type: "youtube-new-video" }),
      }
    );

    // GitHub responde 204 No Content en éxito
    if (githubResponse.status === 204) {
      console.log("[youtube-webhook] repository_dispatch disparado correctamente.");
      return new Response("Webhook received and deploy triggered.", { status: 200 });
    }

    const errText = await githubResponse.text();
    console.error(`[youtube-webhook] Falló el dispatch: ${githubResponse.status} — ${errText}`);
    return new Response("Failed to trigger GitHub dispatch.", { status: 500 });

  } catch (error) {
    console.error("[youtube-webhook] Error inesperado:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
