import { useState, useRef } from "react";
import type {
  Story,
  StoryMediaType,
  ImageAspectRatio,
} from "@features/stories/types/stories.types";
import { VideoPreview } from "./VideoPreview";
import { StoryCanvas } from "./StoryCanvas";
import "./dashboard.css";

interface Props {
  initialStories: Story[];
}

async function proxyFetch(path: string, method: string, body?: object) {
  const res = await fetch("/api/dashboard/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, method, body }),
  });
  return res.json();
}

// --- Story card: renders the correct preview per type ---
function StoryCardMedia({ story }: { story: Story }) {
  if (story.mediaType === "video" && story.mediaUrl) {
    return (
      <div className="story-card-media">
        <VideoPreview src={story.mediaUrl} />
      </div>
    );
  }

  // image and text: canvas-based preview
  return (
    <div className="story-card-media">
      <StoryCanvas story={story} />
    </div>
  );
}

// --- Type badge ---
const TYPE_LABEL: Record<StoryMediaType, string> = {
  video: "Video",
  image: "Foto",
  text: "Texto",
};

// --- Main component ---
export default function StoriesPanel({ initialStories }: Props) {
  const [stories, setStories] = useState<Story[]>(initialStories);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<StoryMediaType>("video");
  const [textContent, setTextContent] = useState("");

  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const refreshStories = async () => {
    const res = await proxyFetch("/api/v1/stories", "GET");
    if (res.success && res.data) {
      setStories(res.data);
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setSelectedType("video");
    setTextContent("");
  };

  // Called when user confirms the type selection
  const handleModalConfirm = () => {
    if (selectedType === "video") {
      resetModal();
      videoInputRef.current?.click();
    } else if (selectedType === "image") {
      resetModal();
      imageInputRef.current?.click();
    }
    // For text: the form stays visible inside the modal
  };

  // Upload flow for video and image
  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    mediaType: "video" | "image"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (mediaType === "video" && !file.type.startsWith("video/")) {
      setError("Solo se permiten archivos de video");
      return;
    }
    if (mediaType === "image" && !file.type.startsWith("image/")) {
      setError("Solo se permiten archivos de imagen");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress("Obteniendo URL de subida...");

    let computedAspectRatio: ImageAspectRatio = "1:1";
    if (mediaType === "image") {
      const getAspectRatio = (): Promise<ImageAspectRatio> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = URL.createObjectURL(file);
          img.onload = () => {
            const ratio = img.width / img.height;
            URL.revokeObjectURL(img.src);
            if (ratio >= 0.95 && ratio <= 1.05) {
              resolve("1:1");
            } else if (ratio < 0.95) {
              resolve("9:16");
            } else {
              resolve("horizontal");
            }
          };
          img.onerror = () => {
            resolve("1:1");
          };
        });
      };
      computedAspectRatio = await getAspectRatio();
    }

    const body: Record<string, string> = { mediaType };
    if (mediaType === "image") {
      body.imageAspectRatio = computedAspectRatio;
    }

    try {
      const createRes = await proxyFetch("/api/v1/stories", "POST", body);
      if (!createRes.success || !createRes.data?.uploadUrl) {
        throw new Error(createRes.error || "Error al crear la story");
      }

      const { uploadUrl } = createRes.data;
      setUploadProgress(
        mediaType === "video"
          ? "Subiendo video a Cloudflare..."
          : "Subiendo imagen a Cloudflare..."
      );

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) {
        throw new Error("Error al subir el archivo a R2");
      }

      setUploadProgress("Completado");
      await refreshStories();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (videoInputRef.current) videoInputRef.current.value = "";
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  // Submit flow for text stories
  const handleTextSubmit = async () => {
    if (!textContent.trim()) {
      setError("El texto no puede estar vacio");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress("Publicando story de texto...");
    resetModal();

    try {
      const createRes = await proxyFetch("/api/v1/stories", "POST", {
        mediaType: "text",
        textContent: textContent.trim(),
      });

      if (!createRes.success) {
        throw new Error(createRes.error || "Error al crear la story");
      }

      setUploadProgress("Completado");
      await refreshStories();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDelete = async (storyId: string) => {
    if (
      !confirm(
        "Segura que quieres eliminar esta story? Se eliminaran tambien sus comentarios y likes."
      )
    ) {
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

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="panel-container">
      {/* Error banner */}
      {error && (
        <div className="panel-error">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-close">
            x
          </button>
        </div>
      )}

      {/* Progress banner */}
      {uploadProgress && (
        <div className="panel-progress">
          <div className="progress-spinner" />
          <span>{uploadProgress}</span>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={(e) => handleFileSelect(e, "video")}
        style={{ display: "none" }}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e, "image")}
        style={{ display: "none" }}
      />

      {/* Create button */}
      <button
        onClick={() => setShowModal(true)}
        disabled={isUploading}
        className="btn-create"
        id="btn-create-story"
      >
        {isUploading ? (
          <div className="progress-spinner" />
        ) : (
          <>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nueva story
          </>
        )}
      </button>

      {/* Type selector modal */}
      {showModal && (
        <div className="story-type-overlay" onClick={resetModal}>
          <div
            className="story-type-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="story-type-modal-header">
              <h3 className="story-type-modal-title">Nueva story</h3>
              <button
                className="story-type-modal-close"
                onClick={resetModal}
                aria-label="Cerrar"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="story-type-modal-body">
              {/* Type selector */}
              <div className="form-group">
                <label className="story-type-label" htmlFor="story-type-select">
                  Tipo de story
                </label>
                <select
                  id="story-type-select"
                  className="story-type-select"
                  value={selectedType}
                  onChange={(e) =>
                    setSelectedType(e.target.value as StoryMediaType)
                  }
                >
                  <option value="video">Video</option>
                  <option value="image">Fotografia</option>
                  <option value="text">Texto</option>
                </select>
              </div>


              {/* Text: textarea form */}
              {selectedType === "text" ? (
                <div className="story-text-form">
                  <div className="form-group">
                    <label className="story-type-label" htmlFor="story-text-area">
                      Contenido del texto
                    </label>
                    <textarea
                      id="story-text-area"
                      className="story-text-area"
                      placeholder="Escribe el texto de tu story..."
                      maxLength={500}
                      rows={5}
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                    />
                    <span className="story-text-char-count">
                      {textContent.length} / 500
                    </span>
                  </div>

                  <div className="story-type-modal-actions">
                    <button className="btn-modal-cancel" onClick={resetModal}>
                      Cancelar
                    </button>
                    <button
                      className="btn-modal-submit"
                      onClick={handleTextSubmit}
                      disabled={!textContent.trim()}
                    >
                      Publicar story
                    </button>
                  </div>
                </div>
              ) : (
                <div className="story-type-modal-actions">
                  <button className="btn-modal-cancel" onClick={resetModal}>
                    Cancelar
                  </button>
                  <button
                    className="btn-modal-submit"
                    onClick={handleModalConfirm}
                  >
                    {selectedType === "video"
                      ? "Seleccionar video"
                      : "Seleccionar imagen"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stories grid */}
      {stories.length === 0 ? (
        <div className="empty-state">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.4"
          >
            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p>No hay stories activas</p>
          <span>Las stories expiran despues de 24 horas</span>
        </div>
      ) : (
        <div className="stories-grid">
          {stories.map((story) => (
            <article key={story.id} className="story-card">
              <StoryCardMedia story={story} />
              <div className="story-card-footer">
                <div className="story-card-meta">
                  <span className="story-type-badge story-type-badge--{story.mediaType}">
                    {TYPE_LABEL[story.mediaType]}
                  </span>
                  <span className="story-card-date">
                    {formatDate(story.createdAt)}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(story.id)}
                  disabled={deletingId === story.id}
                  className="btn-delete"
                  title="Eliminar story"
                >
                  {deletingId === story.id ? (
                    <div className="progress-spinner small" />
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
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
