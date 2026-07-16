import type { Story, Comment } from "../types/stories.types";
import { storiesService } from "../services/stories.service";

const MAX_STATIC_DURATION_MS = 10_000;

export class StoriesViewerController {
  private modal: HTMLElement;
  private backdrop: HTMLElement;
  private track: HTMLElement;
  private progressBar: HTMLElement;
  private btnClose: HTMLElement;
  private btnPrev: HTMLButtonElement;
  private btnNext: HTMLButtonElement;
  private triggerBtn: HTMLElement | null;

  private replyForm: HTMLFormElement;
  private replyInput: HTMLInputElement;
  private replySend: HTMLButtonElement;
  private likeBtn: HTMLButtonElement;
  private likeCountEl: HTMLElement;

  // New Comment Button & Drawer elements
  private commentsBtn: HTMLButtonElement;
  private commentsCountEl: HTMLElement;
  private commentsPanel: HTMLElement;
  private commentsCloseBtn: HTMLElement;
  private commentsListEl: HTMLElement;

  private viewport: HTMLElement;

  private stories: Story[] = [];
  private currentIndex = 0;
  private progressTimer: ReturnType<typeof setTimeout> | null = null;
  private loaded = false;
  private isOpen = false;

  // Pause state managers
  private isPaused = false;
  private startTime = 0;
  private totalDuration = 0;
  private elapsedTime = 0;
  private remainingTime = 0;

  // Cache to track whether floating comments animation has run on current story load
  private animatedStories = new Set<string>();
  private activeBubbleTimers: number[] = [];

  constructor() {
    this.modal = document.getElementById("stories-modal")!;
    this.backdrop = document.getElementById("stories-backdrop")!;
    this.track = document.getElementById("stories-track")!;
    this.progressBar = document.getElementById("stories-progress-bar")!;
    this.btnClose = document.getElementById("stories-close")!;
    this.btnPrev = document.getElementById("stories-prev") as HTMLButtonElement;
    this.btnNext = document.getElementById("stories-next") as HTMLButtonElement;
    this.triggerBtn = document.getElementById("story-avatar-btn");

    this.replyForm = document.getElementById("stories-reply-form") as HTMLFormElement;
    this.replyInput = document.getElementById("stories-reply-input") as HTMLInputElement;
    this.replySend = document.getElementById("stories-reply-send") as HTMLButtonElement;
    this.likeBtn = document.getElementById("stories-like-btn") as HTMLButtonElement;
    this.likeCountEl = document.getElementById("stories-like-count")!;

    // comments panel drawer & footer elements
    this.commentsBtn = document.getElementById("stories-comments-btn") as HTMLButtonElement;
    this.commentsCountEl = document.getElementById("stories-comments-count")!;
    this.commentsPanel = document.getElementById("stories-comments-panel")!;
    this.commentsCloseBtn = document.getElementById("stories-comments-close")!;
    this.commentsListEl = document.getElementById("stories-comments-list")!;

    this.viewport = this.modal.querySelector(".stories-viewport") as HTMLElement;

    this.initEvents();
    this.checkAutoOpen();
  }

  private initEvents() {
    this.triggerBtn?.addEventListener("click", () => this.openModal());
    this.btnClose.addEventListener("click", () => this.closeModal());
    this.backdrop.addEventListener("click", () => this.closeModal());

    this.btnPrev.addEventListener("click", (e) => {
      e.stopPropagation();
      if (this.currentIndex > 0) this.goToStory(this.currentIndex - 1);
    });

    this.btnNext.addEventListener("click", (e) => {
      e.stopPropagation();
      if (this.currentIndex < this.stories.length - 1) {
        this.goToStory(this.currentIndex + 1);
      } else {
        this.closeModal();
      }
    });

    // Toggle pause/resume on canvas/media click (only if comments panel is closed)
    this.track.addEventListener("click", () => {
      if (!this.commentsPanel.classList.contains("is-open")) {
        this.togglePause();
      }
    });

    // Reply input keyboard & state triggers
    this.replyInput.addEventListener("focus", () => this.pauseStory());
    this.replyInput.addEventListener("blur", () => {
      setTimeout(() => {
        if (document.activeElement !== this.replyInput && !this.commentsPanel.classList.contains("is-open")) {
          this.resumeStory();
        }
      }, 150);
    });

    this.replyInput.addEventListener("input", () => {
      this.replySend.disabled = !this.replyInput.value.trim();
    });

    this.replyForm.addEventListener("submit", (e) => this.submitComment(e));
    this.likeBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Avoid screen pause
      this.handleLike();
    });

    // Toggle comments panel (BottomSheet)
    this.commentsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.openCommentsPanel();
    });

    this.commentsCloseBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.closeCommentsPanel();
    });

    document.addEventListener("keydown", (e) => {
      if (!this.modal.classList.contains("is-open")) return;
      if (document.activeElement === this.replyInput) return;

      if (e.key === "Escape") {
        if (this.commentsPanel.classList.contains("is-open")) {
          this.closeCommentsPanel();
        } else {
          this.closeModal();
        }
      }
      if (e.key === "Space") {
        e.preventDefault();
        if (!this.commentsPanel.classList.contains("is-open")) {
          this.togglePause();
        }
      }
      if (e.key === "ArrowRight") {
        if (this.commentsPanel.classList.contains("is-open")) return;
        if (this.currentIndex < this.stories.length - 1) {
          this.goToStory(this.currentIndex + 1);
        } else {
          this.closeModal();
        }
      }
      if (e.key === "ArrowLeft") {
        if (this.commentsPanel.classList.contains("is-open")) return;
        if (this.currentIndex > 0) this.goToStory(this.currentIndex - 1);
      }
    });
  }

  private checkAutoOpen() {
    if (this.triggerBtn) {
      const latestId = this.triggerBtn.getAttribute("data-latest-id");
      const seenId = localStorage.getItem("last_seen_story_id");
      if (latestId && seenId !== latestId) {
        this.openModal();
        localStorage.setItem("last_seen_story_id", latestId);
      }
    }
  }

  // --- Helpers ---

  private getActiveVideo(): HTMLVideoElement | null {
    return this.track.querySelector("video");
  }

  private stopActiveMedia() {
    const video = this.getActiveVideo();
    if (video) {
      video.pause();
      video.src = "";
      video.load();
    }
  }

  private clearTimers() {
    if (this.progressTimer) clearTimeout(this.progressTimer);
    this.progressTimer = null;
    this.clearBubbleTimers();
  }

  private clearBubbleTimers() {
    this.activeBubbleTimers.forEach((t) => clearTimeout(t));
    this.activeBubbleTimers = [];
  }

  // --- Pause/Resume logic ---

  private pauseStory() {
    if (this.isPaused || !this.isOpen || this.stories.length === 0) return;
    this.isPaused = true;

    this.clearTimers();

    const video = this.getActiveVideo();
    if (video) {
      video.pause();
    }

    this.elapsedTime = Date.now() - this.startTime;
    this.remainingTime = this.totalDuration - this.elapsedTime;
    if (this.remainingTime < 0) this.remainingTime = 0;

    const segments = this.progressBar.querySelectorAll(".story-progress-segment");
    const currentFill = segments[this.currentIndex]?.querySelector(".story-progress-fill") as HTMLElement;
    if (currentFill) {
      const pct = Math.min(100, (this.elapsedTime / this.totalDuration) * 100);
      currentFill.style.transition = "none";
      currentFill.style.width = `${pct}%`;
    }
  }

  private resumeStory() {
    if (!this.isPaused || !this.isOpen || this.stories.length === 0) return;
    this.isPaused = false;

    const video = this.getActiveVideo();
    if (video) {
      video.play().catch(() => {});
    }

    const segments = this.progressBar.querySelectorAll(".story-progress-segment");
    const currentFill = segments[this.currentIndex]?.querySelector(".story-progress-fill") as HTMLElement;
    if (currentFill && this.remainingTime > 0) {
      this.startTime = Date.now();
      this.totalDuration = this.remainingTime;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          currentFill.style.transition = `width ${this.remainingTime}ms linear`;
          currentFill.style.width = "100%";
        });
      });

      this.progressTimer = setTimeout(() => this.advanceStory(), this.remainingTime);
    }
  }

  private togglePause() {
    if (this.isPaused) {
      this.resumeStory();
    } else {
      this.pauseStory();
    }
  }

  // --- Modal lifecycle ---

  private openModal() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.modal.classList.add("is-open");
    this.modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    this.animatedStories.clear(); // Reset anim state
    if (!this.loaded) {
      this.loadStories();
    } else {
      this.goToStory(0);
    }
  }

  private closeModal() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.closeCommentsPanel();
    this.clearTimers();
    this.stopActiveMedia();
    this.track.innerHTML = "";
    this.modal.classList.remove("is-open");
    this.modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    // Clear input
    this.replyInput.value = "";
    this.replySend.disabled = true;
  }

  // --- Bottom Sheet comments panel ---

  private openCommentsPanel() {
    this.pauseStory();
    this.commentsPanel.classList.add("is-open");
  }

  private closeCommentsPanel() {
    if (this.commentsPanel.classList.contains("is-open")) {
      this.commentsPanel.classList.remove("is-open");
      this.resumeStory();
    }
  }

  // --- Data loading & Interactions ---

  private async loadStories() {
    const res = await storiesService.getActiveStories();
    if (!res.success || !res.data?.length) {
      this.track.innerHTML = `<p style="color:rgba(255,255,255,0.5);font-size:0.9rem;text-align:center;padding:2rem;">No hay stories activas</p>`;
      return;
    }
    this.stories = res.data;
    this.loaded = true;
    this.buildProgressSegments();
    this.goToStory(0);
  }

  private buildProgressSegments() {
    this.progressBar.innerHTML = this.stories
      .map(
        (_, i) =>
          `<div class="story-progress-segment" data-index="${i}"><div class="story-progress-fill"></div></div>`,
      )
      .join("");
  }

  private async loadStoryLikes(storyId: string) {
    this.likeBtn.classList.remove("is-liked");
    this.likeCountEl.textContent = "0";

    const res = await storiesService.getLikesCount(storyId);
    if (res.success && res.data) {
      this.likeCountEl.textContent = res.data.count.toString();
      if (res.data.hasLiked) {
        this.likeBtn.classList.add("is-liked");
      }
    }
  }

  private async loadStoryComments(storyId: string) {
    // Reset footer comments button state
    this.commentsBtn.classList.add("hidden");
    this.commentsCountEl.textContent = "0";
    this.commentsListEl.innerHTML = `<div class="spinner-container"><span class="spinner"></span></div>`;

    const res = await storiesService.getComments(storyId);
    if (!res.success || !res.data) {
      this.commentsListEl.innerHTML = `<p class="no-comments-placeholder">Error al cargar comentarios</p>`;
      return;
    }

    const comments = res.data;
    const count = comments.length;

    // Show button with badge ONLY if comments exist
    if (count > 0) {
      this.commentsCountEl.textContent = count.toString();
      this.commentsBtn.classList.remove("hidden");

      // Render full comments inside Drawer
      this.commentsListEl.innerHTML = comments
        .map((c) => {
          const dateStr = new Date(c.createdAt).toLocaleDateString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          });
          return `
            <div class="comment-item-bubble">
              <span class="comment-item-content">${c.content}</span>
              <span class="comment-item-date">${dateStr}</span>
            </div>
          `;
        })
        .join("");

      // Trigger floating bubbles if they haven't run on this load of the current story
      if (!this.animatedStories.has(storyId)) {
        this.animatedStories.add(storyId);
        this.triggerFloatingComments(comments);
      }
    } else {
      this.commentsListEl.innerHTML = `<p class="no-comments-placeholder">Aún no hay respuestas en esta story</p>`;
    }
  }

  private triggerFloatingComments(comments: Comment[]) {
    // Clear any previous scheduled bubbles
    this.clearBubbleTimers();

    // Remove any floating bubbles left in viewport
    const oldBubbles = this.viewport.querySelectorAll(".story-comment-bubble");
    oldBubbles.forEach((b) => b.remove());

    // Sort comments by newest first (default api response is usually newest or oldest, sort just in case)
    const sortedComments = [...comments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Limit to latest 5 to avoid cluttering screen
    const itemsToAnimate = sortedComments.slice(0, 5);

    itemsToAnimate.forEach((c, index) => {
      const timer = setTimeout(() => {
        if (!this.isOpen || this.isPaused) return;
        this.spawnCommentBubble(c.content);
      }, index * 800) as unknown as number; // Escalate spawning
      
      this.activeBubbleTimers.push(timer);
    });
  }

  private spawnCommentBubble(text: string) {
    const bubble = document.createElement("div");
    bubble.className = "story-comment-bubble";
    bubble.textContent = text;

    // Random horizontal position (within 10% to 55% to avoid overlapping footer buttons)
    const randomLeft = 10 + Math.random() * 45;
    bubble.style.left = `${randomLeft}%`;

    // Clean up bubble element from DOM after animation completes
    bubble.addEventListener("animationend", () => {
      bubble.remove();
    });

    this.viewport.appendChild(bubble);
  }

  private async handleLike() {
    const story = this.stories[this.currentIndex];
    if (!story) return;

    if (this.likeBtn.classList.contains("is-liked")) {
       return; // Already liked
    }

    this.likeBtn.classList.add("is-liked");
    const currentVal = parseInt(this.likeCountEl.textContent || "0", 10);
    this.likeCountEl.textContent = (currentVal + 1).toString();

    await storiesService.addLike(story.id);
  }

  private async submitComment(e: Event) {
    e.preventDefault();
    const story = this.stories[this.currentIndex];
    if (!story) return;

    const content = this.replyInput.value.trim();
    if (!content) return;

    this.replyInput.value = "";
    this.replySend.disabled = true;
    this.replyInput.blur();

    const originalPlaceholder = this.replyInput.placeholder;
    this.replyInput.placeholder = "¡Respuesta enviada!";
    setTimeout(() => {
      this.replyInput.placeholder = originalPlaceholder;
    }, 2000);

    // Optimistically reload comments list after sending comment
    await storiesService.addComment(story.id, content);
    this.loadStoryComments(story.id);
  }

  // --- Renderers ---

  private renderTextStory(story: Story, container: HTMLElement) {
    const canvas = document.createElement("canvas");

    const rect = this.viewport.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";

    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#6d28d9");
    grad.addColorStop(1, "#0f0a1e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const text = story.textContent ?? "";
    const maxWidth = w - 60;
    const baseFontSize = Math.max(
      18,
      Math.min(48, Math.floor((w * 0.9) / Math.max(Math.sqrt(text.length), 1))),
    );
    ctx.font = `bold ${baseFontSize}px 'Inter', system-ui, sans-serif`;
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 10;

    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);

    const lineHeight = baseFontSize * 1.4;
    const totalHeight = lines.length * lineHeight;
    let y = (h - totalHeight) / 2 + baseFontSize;
    for (const l of lines) {
      ctx.fillText(l, w / 2, y);
      y += lineHeight;
    }

    container.appendChild(canvas);
  }

  private renderImageStory(story: Story, container: HTMLElement) {
    const img = document.createElement("img");
    img.src = story.mediaUrl ?? "";
    img.alt = "Story";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit =
      story.imageAspectRatio === "9:16" ? "cover" : "contain";
    container.appendChild(img);
  }

  private renderVideoStory(story: Story, container: HTMLElement) {
    const video = document.createElement("video");
    video.src = story.mediaUrl ?? "";
    video.autoplay = true;
    video.muted = false;
    video.loop = false;
    video.playsInline = true;
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";

    video.addEventListener("ended", () => this.advanceStory());
    video.addEventListener("loadedmetadata", () => {
      const durationMs = video.duration * 1000;
      this.syncProgressBarDuration(durationMs);
    });

    container.appendChild(video);
    video.play().catch(() => {});
  }

  // --- Story navigation ---

  private goToStory(index: number) {
    this.clearTimers();
    this.stopActiveMedia();
    this.currentIndex = index;

    // Ensure comments drawer is closed when changing stories
    if (this.commentsPanel.classList.contains("is-open")) {
      this.commentsPanel.classList.remove("is-open");
    }

    const story = this.stories[index];
    if (!story) return;

    this.track.innerHTML = "";
    const slide = document.createElement("div");
    slide.className = "story-slide";

    if (story.mediaType === "text") {
      this.renderTextStory(story, slide);
    } else if (story.mediaType === "image") {
      this.renderImageStory(story, slide);
    } else {
      this.renderVideoStory(story, slide);
    }

    this.track.appendChild(slide);
    this.updateNav();
    this.loadStoryLikes(story.id);
    this.loadStoryComments(story.id); // Triggers drawer list load + floating animation

    // Reset pause state managers
    this.isPaused = false;
    this.elapsedTime = 0;
    this.remainingTime = 0;

    this.startProgress(MAX_STATIC_DURATION_MS);
  }

  private startProgress(duration: number) {
    const segments = this.progressBar.querySelectorAll(".story-progress-segment");
    segments.forEach((s, i) => {
      const fill = s.querySelector(".story-progress-fill") as HTMLElement;
      fill.style.transition = "none";
      fill.style.width = i < this.currentIndex ? "100%" : "0%";
    });

    const currentFill = segments[this.currentIndex]?.querySelector(
      ".story-progress-fill",
    ) as HTMLElement;
    if (!currentFill) return;

    this.isPaused = false;
    this.startTime = Date.now();
    this.totalDuration = duration;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        currentFill.style.transition = `width ${duration}ms linear`;
        currentFill.style.width = "100%";
      });
    });

    this.clearTimers();
    this.progressTimer = setTimeout(() => this.advanceStory(), duration);
  }

  private syncProgressBarDuration(durationMs: number) {
    this.clearTimers();
    const segments = this.progressBar.querySelectorAll(".story-progress-segment");
    const currentFill = segments[this.currentIndex]?.querySelector(
      ".story-progress-fill",
    ) as HTMLElement;
    if (!currentFill) return;

    this.isPaused = false;
    this.startTime = Date.now();
    this.totalDuration = durationMs;

    currentFill.style.transition = "none";
    currentFill.style.width = "0%";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        currentFill.style.transition = `width ${durationMs}ms linear`;
        currentFill.style.width = "100%";
      });
    });

    this.progressTimer = setTimeout(() => this.advanceStory(), durationMs);
  }

  private advanceStory() {
    if (this.currentIndex < this.stories.length - 1) {
      this.goToStory(this.currentIndex + 1);
    } else {
      this.closeModal();
    }
  }

  private updateNav() {
    this.btnPrev.disabled = this.currentIndex === 0;
    this.btnNext.disabled = this.currentIndex === this.stories.length - 1;
  }
}
