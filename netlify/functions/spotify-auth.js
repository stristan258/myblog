const crypto = require("node:crypto");

exports.handler = async (event) => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return { statusCode: 500, body: "Spotify OAuth is not configured." };
  }

  const state = crypto.randomBytes(24).toString("hex");
  const scopes = "user-read-currently-playing user-read-recently-played user-top-read";
  const authorizeUrl = new URL("https://accounts.spotify.com/authorize");
  authorizeUrl.search = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    state,
  });

  return {
    statusCode: 302,
    headers: {
      Location: authorizeUrl.toString(),
      "Set-Cookie": `spotify_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`,
    },
    body: "",
  };
};
