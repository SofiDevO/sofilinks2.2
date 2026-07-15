import { useEffect, useRef } from "react";
import type { Story, ImageAspectRatio } from "@features/stories/types/stories.types";

// Canvas dimensions: portrait 9:16
const CANVAS_W = 360;
const CANVAS_H = 640;

interface StoryCanvasProps {
  story: Story;
  className?: string;
}

// --- Text story renderer ---
function drawTextStory(ctx: CanvasRenderingContext2D, text: string) {
  // Background: purple to dark gradient
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, "#6d28d9");
  grad.addColorStop(1, "#0f0a1e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Responsive font size via clamp logic: fewer chars = bigger font
  const charCount = text.length;
  const minFont = 22;
  const maxFont = 52;
  // Linear scale: 0 chars -> maxFont, 500 chars -> minFont
  const fontSize = Math.round(
    Math.max(minFont, maxFont - ((maxFont - minFont) * charCount) / 500)
  );

  ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Measure and wrap text
  const maxWidth = CANVAS_W - 48;
  const lineHeight = fontSize * 1.35;
  const lines = wrapText(ctx, text, maxWidth);
  const totalHeight = lines.length * lineHeight;
  const startY = CANVAS_H / 2 - totalHeight / 2 + lineHeight / 2;

  lines.forEach((line, i) => {
    const y = startY + i * lineHeight;
    // Black text-shadow stroke for legibility
    ctx.strokeStyle = "rgba(0,0,0,0.85)";
    ctx.lineWidth = fontSize * 0.08;
    ctx.lineJoin = "round";
    ctx.strokeText(line, CANVAS_W / 2, y);
    // White fill
    ctx.fillStyle = "#ffffff";
    ctx.fillText(line, CANVAS_W / 2, y);
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// --- Image story renderer ---
function drawImageStory(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  aspectRatio: ImageAspectRatio
) {
  // Dark background behind the image
  ctx.fillStyle = "#0f0a1e";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  if (aspectRatio === "9:16") {
    // Cover: fill entire canvas
    ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
  } else {
    // Contain: center with letterbox
    const scale = Math.min(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = (CANVAS_W - dw) / 2;
    const dy = (CANVAS_H - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }
}

export function StoryCanvas({ story, className = "" }: StoryCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (story.mediaType === "text") {
      drawTextStory(ctx, story.textContent ?? "");
      return;
    }

    if (story.mediaType === "image" && story.mediaUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        drawImageStory(ctx, img, story.imageAspectRatio ?? "1:1");
      };
      img.onerror = () => {
        // Fallback: draw a dark placeholder
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      };
      img.src = story.mediaUrl;
      return;
    }

    // video: draw dark placeholder; VideoPreview handles its own rendering
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }, [story]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      className={`story-canvas ${className}`}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
