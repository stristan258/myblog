function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

async function getAccessToken() {
  const credentials = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
    }),
  });

  if (!response.ok) {
    throw new Error("Spotify access token request failed.");
  }

  return (await response.json()).access_token;
}

function formatItem(item, isPlaying) {
  const isEpisode = item.type === "episode";
  const title = item.name;
  const creator = isEpisode ? item.show?.name : item.artists?.map((artist) => artist.name).join(", ");
  const embedType = isEpisode ? "episode" : "track";

  return {
    isPlaying,
    type: embedType,
    title,
    creator,
    embedUrl: `https://open.spotify.com/embed/${embedType}/${item.id}?utm_source=generator`,
    spotifyUrl: item.external_urls?.spotify,
  };
}

exports.handler = async () => {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET || !process.env.SPOTIFY_REFRESH_TOKEN) {
    return json(503, { error: "Spotify is not configured yet." });
  }

  try {
    const accessToken = await getAccessToken();
    const headers = { Authorization: `Bearer ${accessToken}` };
    const currentResponse = await fetch("https://api.spotify.com/v1/me/player", { headers });

    if (currentResponse.ok) {
      const current = await currentResponse.json();
      if (current?.item) {
        return json(200, formatItem(current.item, current.is_playing));
      }
    }

    const topTracksResponse = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=short_term", { headers });
    if (!topTracksResponse.ok) {
      return json(502, { error: "Spotify top tracks request failed." });
    }

    const topTracks = await topTracksResponse.json();
    const items = (topTracks.items || []).map((item) => formatItem(item, false));
    return items.length ? json(200, { isPlaying: false, topTracks: items }) : json(200, { isPlaying: false, empty: true });
  } catch (error) {
    return json(502, { error: error.message });
  }
};
