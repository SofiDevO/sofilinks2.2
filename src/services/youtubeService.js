const YTKey = import.meta.env.PUBLIC_YT_SECRET_KEY;

export const fetchYouTubeVideos = async (channelId, maxResults = 10) => {
  const url =
    `https://youtube.googleapis.com/youtube/v3/search` +
    `?part=snippet` +
    `&channelId=${channelId}` +
    `&maxResults=${maxResults}` +
    `&order=date` +
    `&type=video` +
    `&key=${YTKey}`;

  const response = await fetch(url);

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
    link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    title: item.snippet.title,
    thumbnail:
      item.snippet.thumbnails?.medium?.url ||
      item.snippet.thumbnails?.default?.url,
    publishedAt: item.snippet.publishedAt,
  }));
};
