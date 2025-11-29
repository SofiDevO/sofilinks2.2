
const YTKey = import.meta.env.PUBLIC_YT_API_KEY;

export const fetchPlaylist = async () => {
  let playlists = [];
  let error = null;

  // IDs de las playlists que queremos mostrar
  const playlistIds = [
    "PLU7AGreFiX-HjcXJi4uHHBclC4cu3FER5",
    "PLU7AGreFiX-E9cK4VNozzly9JAXI_tTPk"
  ];

  try {
    const playlistIdsString = playlistIds.join(',');
    const response = await fetch(
      `https://youtube.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${playlistIdsString}&key=${YTKey}`,
      {
        headers: {
          'Referer': 'http://localhost:4321/',
          'Referer': 'https://links.itssofi.dev/',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    // console.log('YouTube API response data:', data);
    if (data.error) {
      throw new Error(`YouTube API error: ${data.error.message}`);
    }

    playlists = data.items?.map((item) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      publishedAt: item.snippet.publishedAt,
      channelTitle: item.snippet.channelTitle,
      videoCount: item.contentDetails.itemCount,
      link: `https://www.youtube.com/playlist?list=${item.id}`
    })) || [];

  } catch (e) {
    console.error('Error fetching YouTube playlists:', e);
    error = e instanceof Error ? e.message : 'Unknown error occurred';
  }

  return { playlists, error };
};
