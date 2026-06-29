const API_KEY = import.meta.env.YT_API_KEY;
const SITE_URL = import.meta.env.PUBLIC_SITE_URL;
export const fetchYouTubeVideos = async (channelId, maxResults = 10) => {
  const playlistId = channelId.replace(/^UC/, "UU");
  const url = `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${maxResults}&key=${API_KEY}`;

  const response = await fetch(url, {
    headers: {
      Referer: SITE_URL || "http://localhost:4321",
    },
  });
  if (!response.ok) {
    throw new Error(
      `YouTube API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`YouTube API error: ${data.error.message}`);
  }

  if (!data.items || data.items.length === 0) {
    throw new Error("No videos found for this channel.");
  }

  return data.items.map((item) => ({
    link: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
    title: item.snippet.title,
    thumbnail:
      item.snippet.thumbnails?.medium?.url ||
      item.snippet.thumbnails?.default?.url,
    publishedAt: item.snippet.publishedAt,
  }));
};
