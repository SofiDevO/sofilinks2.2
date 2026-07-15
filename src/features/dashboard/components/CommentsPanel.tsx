import { useState } from "react";
import type { Story, Comment } from "@features/stories/types/stories.types";
import { VideoPreview } from "./VideoPreview";
import { StoryCanvas } from "./StoryCanvas";
import "./dashboard.css";

interface StoryWithComments {
  story: Story;
  comments: Comment[];
}

interface Props {
  initialStoriesWithComments: StoryWithComments[];
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

export default function CommentsPanel({ initialStoriesWithComments }: Props) {
  const [data, setData] = useState<StoryWithComments[]>(initialStoriesWithComments);
  const [banningIp, setBanningIp] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleBanIp = async (ip: string, commentContent: string) => {
    if (!confirm(`¿Estás segura de que quieres banear la IP: ${ip}?\nEsto bloqueará al usuario para que no publique más comentarios o likes.`)) {
      return;
    }

    setBanningIp(ip);
    setError(null);
    setSuccess(null);

    try {
      const res = await proxyFetch("/api/v1/admin/bans", "POST", {
        ipAddress: ip,
        reason: `Baneado por moderación de comentario: "${commentContent.substring(0, 30)}..."`,
      });

      if (!res.success) {
        throw new Error(res.error || "Error al banear la IP");
      }

      setSuccess(`IP ${ip} baneada exitosamente`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBanningIp(null);
    }
  };

  const handleDeleteComment = async (storyId: string, commentId: string) => {
    if (!confirm("¿Segura que quieres eliminar este comentario?")) {
      return;
    }

    setDeletingId(commentId);
    setError(null);
    setSuccess(null);

    try {
      const res = await proxyFetch(`/api/v1/admin/comments/${commentId}`, "DELETE");

      if (!res.success) {
        throw new Error(res.error || "Error al eliminar el comentario");
      }

      // Update local state
      setData((prev) =>
        prev.map((item) => {
          if (item.story.id === storyId) {
            return {
              ...item,
              comments: item.comments.filter((c) => c.id !== commentId),
            };
          }
          return item;
        })
      );

      setSuccess("Comentario eliminado exitosamente");
      setTimeout(() => setSuccess(null), 3000);
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

  const totalComments = data.reduce((acc, s) => acc + s.comments.length, 0);
  const activeStoriesWithComments = data.filter((s) => s.comments.length > 0 || s.story);

  return (
    <div className="panel-container">
      {error && (
        <div className="panel-error">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-close">x</button>
        </div>
      )}

      {success && (
        <div className="panel-success">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      <div className="comments-summary-card">
        <span className="comments-summary-count">{totalComments}</span>
        <span className="comments-summary-label">Comentarios Totales Activos</span>
      </div>

      {activeStoriesWithComments.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p>No hay stories activas</p>
          <span>Los comentarios aparecerán cuando los usuarios comenten tus stories</span>
        </div>
      ) : (
        <div className="comments-list">
          {activeStoriesWithComments.map(({ story, comments }) => (
            <article key={story.id} className="comments-story-group">
              <div className="story-group-header">
                <div className="story-group-thumb">
                  {story.mediaType === "video" && story.mediaUrl ? (
                    <VideoPreview src={story.mediaUrl} hoverToPlay={false} />
                  ) : (
                    <StoryCanvas story={story} />
                  )}
                </div>
                <div className="story-group-info">
                  <span className="story-group-id" title={story.id}>
                    Story: {story.id.substring(0, 8)}...
                  </span>
                  <span className="story-group-date">Publicada: {formatDate(story.createdAt)}</span>
                  <span className="story-group-count">
                    {comments.length} {comments.length === 1 ? "comentario" : "comentarios"}
                  </span>
                </div>
              </div>

              {comments.length === 0 ? (
                <p className="no-comments-text">Sin comentarios aún</p>
              ) : (
                <div className="comments-thread">
                  {comments.map((comment) => (
                    <div key={comment.id} className="comment-item">
                      <div className="comment-avatar">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M17.987 18.724A6 6 0 0012 15a6 6 0 00-5.987 3.724M12 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" />
                        </svg>
                      </div>
                      <div className="comment-body">
                        <div className="comment-meta-row">
                          <span className="comment-date">{formatDate(comment.createdAt)}</span>
                          {comment.ipAddress && (
                            <span className="comment-ip-badge" title="IP del autor">
                              IP: {comment.ipAddress}
                            </span>
                          )}
                        </div>
                        <p className="comment-content">{comment.content}</p>
                      </div>
                      <div className="comment-actions">
                        {comment.ipAddress && (
                          <button
                            onClick={() => handleBanIp(comment.ipAddress!, comment.content)}
                            disabled={banningIp === comment.ipAddress}
                            className="btn-comment-action ban"
                            title={`Banear IP ${comment.ipAddress}`}
                          >
                            {banningIp === comment.ipAddress ? (
                              <div className="progress-spinner small" />
                            ) : (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                                Banear IP
                              </>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteComment(story.id, comment.id)}
                          disabled={deletingId === comment.id}
                          className="btn-comment-action delete"
                          title="Eliminar comentario"
                        >
                          {deletingId === comment.id ? (
                            <div className="progress-spinner small" />
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Eliminar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
