import { writeFile } from "node:fs/promises";

const required = ["SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET", "SPOTIFY_REFRESH_TOKEN"];
for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} is missing`);
}

const credentials = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64");
const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
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

const tokenData = await tokenResponse.json();
if (!tokenResponse.ok || !tokenData.access_token) {
  throw new Error(`Spotify token refresh failed: ${tokenData.error || "unknown_error"}${tokenData.error_description ? ` (${tokenData.error_description})` : ""}`);
}

const headers = { Authorization: `Bearer ${tokenData.access_token}` };
const currentResponse = await fetch("https://api.spotify.com/v1/me/player", { headers });
let output;

if (currentResponse.ok) {
  const current = await currentResponse.json();
  if (current?.item) output = formatItem(current.item, current.is_playing);
}

if (!output) {
  const topResponse = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=short_term", { headers });
  const topData = await topResponse.json();
  if (!topResponse.ok) throw new Error(`Spotify top tracks request failed: ${topData.error?.message || "unknown_error"}`);
  output = {
    isPlaying: false,
    topTracks: (topData.items || []).map((item) => formatItem(item, false)),
  };
}

output.updatedAt = new Date().toISOString();
await writeFile("static/spotify.json", `${JSON.stringify(output, null, 2)}\n`);

function formatItem(item, isPlaying) {
  const isEpisode = item.type === "episode";
  const embedType = isEpisode ? "episode" : "track";
  return {
    isPlaying,
    type: embedType,
    title: item.name,
    creator: isEpisode ? item.show?.name : item.artists?.map((artist) => artist.name).join(", "),
    imageUrl: isEpisode ? item.show?.images?.[0]?.url : item.album?.images?.[0]?.url,
    embedUrl: `https://open.spotify.com/embed/${embedType}/${item.id}?utm_source=generator`,
    spotifyUrl: item.external_urls?.spotify,
  };
}
