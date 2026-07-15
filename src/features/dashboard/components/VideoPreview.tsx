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
  const pendingCanPlayRef = useRef<(() => void) | null>(null);
  const [hasThumbnail, setHasThumbnail] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fallbackToVideo, setFallbackToVideo] = useState(false);

  const drawThumbnail = () => {
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setHasThumbnail(false);
    setFallbackToVideo(false);
    setIsPlaying(false);

    video.preload = "auto";

    let timer: NodeJS.Timeout | null = null;
    if (video.readyState >= 2 && video.currentTime === 0.5) {
      timer = setTimeout(() => {
        drawThumbnail();
      }, 50);
    } else {
      video.currentTime = 0.5;
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (pendingCanPlayRef.current && videoRef.current) {
        videoRef.current.removeEventListener("canplay", pendingCanPlayRef.current);
        pendingCanPlayRef.current = null;
      }
    };
  }, [src]);

  const handleSeeked = () => {
    if (hasThumbnail || fallbackToVideo) return;
    drawThumbnail();
  };

  const handleLoadedData = () => {
    const video = videoRef.current;
    if (video && video.readyState >= 2 && video.currentTime === 0.5) {
      drawThumbnail();
    }
  };

  const handleMouseEnter = () => {
    if (!hoverToPlay) return;
    isHoveredRef.current = true;
    setIsPlaying(true);
    const video = videoRef.current;
    if (video) {
      // Seek to beginning
      video.currentTime = 0;

      // Clean up any existing listener first
      if (pendingCanPlayRef.current) {
        video.removeEventListener("canplay", pendingCanPlayRef.current);
        pendingCanPlayRef.current = null;
      }

      const playVideo = () => {
        if (!isHoveredRef.current) return;
        const playPromise = video.play();
        playPromiseRef.current = playPromise;
        playPromise.catch((err) => {
          if (err.name !== "AbortError") {
            console.error("Play error:", err);
          }
        });
      };

      if (video.readyState >= 2) {
        playVideo();
      } else {
        const handleCanPlay = () => {
          video.removeEventListener("canplay", handleCanPlay);
          if (pendingCanPlayRef.current === handleCanPlay) {
            pendingCanPlayRef.current = null;
          }
          playVideo();
        };
        pendingCanPlayRef.current = handleCanPlay;
        video.addEventListener("canplay", handleCanPlay);
      }
    }
  };

  const handleMouseLeave = () => {
    if (!hoverToPlay) return;
    isHoveredRef.current = false;
    setIsPlaying(false);
    const video = videoRef.current;
    if (video) {
      // Clean up pending canplay listener
      if (pendingCanPlayRef.current) {
        video.removeEventListener("canplay", pendingCanPlayRef.current);
        pendingCanPlayRef.current = null;
      }

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
        onLoadedData={handleLoadedData}
        onError={() => setFallbackToVideo(true)}
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
