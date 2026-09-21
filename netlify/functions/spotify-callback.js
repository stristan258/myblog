function getCookie(event, name) {
  const cookies = event.headers.cookie || event.headers.Cookie || "";
  const value = cookies.split(";").find((part) => part.trim().startsWith(`${name}=`));
  return value ? decodeURIComponent(value.trim().slice(name.length + 1)) : "";
}

exports.handler = async (event) => {
  const params = new URLSearchParams(event.queryStringParameters || {});
  const code = params.get("code");
  const state = params.get("state");
  const expectedState = getCookie(event, "spotify_oauth_state");
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!code || !state || state !== expectedState) {
    return { statusCode: 400, body: "Invalid Spotify authorization state." };
  }

  if (!clientId || !clientSecret || !redirectUri) {
    return { statusCode: 500, body: "Spotify OAuth is not configured." };
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return { statusCode: 502, body: `Spotify token exchange failed: ${data.error_description || data.error}` };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    body: `Copy this refresh token into Netlify as SPOTIFY_REFRESH_TOKEN, then remove it from this page:\n\n${data.refresh_token}`,
  };
};
