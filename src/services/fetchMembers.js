const CLIENT_ID = import.meta.env.YT_OAUTH_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.YT_OAUTH_CLIENT_SECRET;
const REFRESH_TOKEN = import.meta.env.YT_OAUTH_REFRESH_TOKEN;

/**
 * Obtiene un access token fresco usando el refresh token OAuth 2.0.
 * El access token dura ~1 hora; se solicita uno nuevo en cada build.
 */
const getAccessToken = async () => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error(`OAuth token refresh failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`OAuth token refresh error: ${data.error_description || data.error}`);
  }

  return data.access_token;
};

/**
 * Obtiene todos los miembros del canal usando la YouTube Data API v3.
 * Recorre la paginación automáticamente hasta obtener todos los resultados.
 *
 * @returns {{ members: Array, error: string|null }}
 */
export const fetchMembers = async () => {
  let members = [];
  let error = null;

  try {
    const accessToken = await getAccessToken();

    let pageToken = null;

    do {
      const params = new URLSearchParams({
        part: 'snippet',
        mode: 'all_current',
        maxResults: '1000',
      });

      if (pageToken) params.append('pageToken', pageToken);

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/members?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`YouTube Members API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`YouTube Members API error: ${data.error.message}`);
      }

      const page = (data.items || []).map((item) => ({
        channelId: item.snippet.memberDetails.channelId,
        channelUrl: item.snippet.memberDetails.channelUrl,
        displayName: item.snippet.memberDetails.displayName,
        profileImageUrl: item.snippet.memberDetails.profileImageUrl,
        level: item.snippet.membershipsDetails.highestAccessibleLevelDisplayName,
        memberSince: item.snippet.membershipsDetails.membershipsDuration?.memberSince ?? null,
        totalMonths: item.snippet.membershipsDetails.membershipsDuration?.memberTotalDurationMonths ?? 0,
      }));

      members = [...members, ...page];
      pageToken = data.nextPageToken ?? null;

    } while (pageToken);

  } catch (e) {
    console.error('Error fetching YouTube members:', e);
    error = e instanceof Error ? e.message : 'Unknown error occurred';
  }

  return { members, error };
};
