import { useEffect, useRef, useState } from "react";

interface VideoPreviewProps {
  src: string;
  className?: string;
  hoverToPlay?: boolean;
}

export function VideoPreview({
  src,
  className = "",
  hoverToPlay = true,
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const isHoveredRef = useRef(false);
  const [hasThumbnail, setHasThumbnail] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fallbackToVideo, setFallbackToVideo] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setHasThumbnail(false);
    setFallbackToVideo(false);
    setIsPlaying(false);

    video.crossOrigin = "anonymous";
    video.preload = "auto";
    video.currentTime = 0.5;
  }, [src]);

  const handleSeeked = () => {
    if (hasThumbnail || fallbackToVideo) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth || 360;
    canvas.height = video.videoHeight || 640;

    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setHasThumbnail(true);
    } catch (e) {
      console.warn(
        "Failed to capture video thumbnail via canvas (possibly CORS):",
        e,
      );
      setFallbackToVideo(true);
    }
  };

  const handleMouseEnter = () => {
    if (!hoverToPlay) return;
    isHoveredRef.current = true;
    setIsPlaying(true);
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      const playPromise = video.play();
      playPromiseRef.current = playPromise;
      playPromise.catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Play error:", err);
        }
      });
    }
  };

  const handleMouseLeave = () => {
    if (!hoverToPlay) return;
    isHoveredRef.current = false;
    setIsPlaying(false);
    const video = videoRef.current;
    if (video) {
      const playPromise = playPromiseRef.current;
      if (playPromise) {
        playPromise
          .then(() => {
            if (!isHoveredRef.current && videoRef.current) {
              videoRef.current.pause();
              videoRef.current.currentTime = 0.5;
            }
          })
          .catch(() => {
            if (!isHoveredRef.current && videoRef.current) {
              videoRef.current.pause();
              videoRef.current.currentTime = 0.5;
            }
          });
      } else {
        video.pause();
        video.currentTime = 0.5;
      }
    }
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`video-preview-wrapper ${className}`}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: "#1a1a2e",
      }}
    >
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        onSeeked={handleSeeked}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: isPlaying || fallbackToVideo ? "block" : "none",
        }}
      />

      {!fallbackToVideo && (
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: !isPlaying && hasThumbnail ? "block" : "none",
          }}
        />
      )}

      {!isPlaying && !hasThumbnail && !fallbackToVideo && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#1a1a2e",
          }}
        >
          <div className="progress-spinner" />
        </div>
      )}
    </div>
  );
}
