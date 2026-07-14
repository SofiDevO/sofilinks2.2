import { useState, useRef } from "react";
import type { Story } from "@features/stories/types/stories.types";
import "./dashboard.css";

interface Props {
  initialStories: Story[];
}

async function proxyFetch(
  path: string,
  method: string,
  body?: object,
) {
  const res = await fetch("/api/dashboard/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, method, body }),
  });
  return res.json();
}

export default function StoriesPanel({ initialStories }: Props) {
  const [stories, setStories] = useState<Story[]>(initialStories);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshStories = async () => {
    const res = await proxyFetch("/api/v1/stories", "GET");
    if (res.success && res.data) {
      setStories(res.data);
    }
  };

  const handleCreate = async () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setError("Solo se permiten archivos de video");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress("Obteniendo URL de subida...");

    try {
      // Step 1: Get presigned URL from backend
      const createRes = await proxyFetch("/api/v1/stories", "POST");

      if (!createRes.success || !createRes.data) {
        throw new Error(createRes.error || "Error al crear la story");
      }

      const { uploadUrl } = createRes.data;

      // Step 2: Upload video directly to R2 via presigned URL
      setUploadProgress("Subiendo video a Cloudflare...");

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Error al subir el video a R2");
      }

      setUploadProgress("Completado");
      await refreshStories();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (storyId: string) => {
    if (!confirm("Segura que quieres eliminar esta story? Se eliminaran tambien sus comentarios y likes.")) {
      return;
    }

    setDeletingId(storyId);
    setError(null);

    try {
      const res = await proxyFetch(`/api/v1/stories/${storyId}`, "DELETE");

      if (!res.success) {
        throw new Error(res.error || "Error al eliminar");
      }

      setStories((prev) => prev.filter((s) => s.id !== storyId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="panel-container">
      {error && (
        <div className="panel-error">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-close">x</button>
        </div>
      )}

      {uploadProgress && (
        <div className="panel-progress">
          <div className="progress-spinner" />
          <span>{uploadProgress}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      <button
        onClick={handleCreate}
        disabled={isUploading}
        className="btn-create"
      >
        {isUploading ? (
          <div className="progress-spinner" />
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Subir story
          </>
        )}
      </button>

      {stories.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p>No hay stories activas</p>
          <span>Las stories expiran despues de 24 horas</span>
        </div>
      ) : (
        <div className="stories-grid">
          {stories.map((story) => (
            <article key={story.id} className="story-card">
              <div className="story-card-video">
                <video
                  src={story.videoUrl}
                  muted
                  preload="metadata"
                  playsInline
                  onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                  onMouseLeave={(e) => {
                    const v = e.target as HTMLVideoElement;
                    v.pause();
                    v.currentTime = 0;
                  }}
                />
              </div>
              <div className="story-card-footer">
                <span className="story-card-date">{formatDate(story.createdAt)}</span>
                <button
                  onClick={() => handleDelete(story.id)}
                  disabled={deletingId === story.id}
                  className="btn-delete"
                  title="Eliminar story"
                >
                  {deletingId === story.id ? (
                    <div className="progress-spinner small" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
