import http from "node:http";
import { randomUUID } from "node:crypto";
import { URL, URLSearchParams } from "node:url";

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI || "http://127.0.0.1:8765/callback";

if (!clientId || !clientSecret) {
  throw new Error("Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET before running this script.");
}

const redirect = new URL(redirectUri);
const state = randomUUID();
const scopes = "user-read-currently-playing user-top-read";
const authorizeUrl = new URL("https://accounts.spotify.com/authorize");
authorizeUrl.search = new URLSearchParams({
  response_type: "code",
  client_id: clientId,
  scope: scopes,
  redirect_uri: redirectUri,
  state,
});

const server = http.createServer(async (request, response) => {
  const callbackUrl = new URL(request.url, redirect.origin);
  if (callbackUrl.pathname !== redirect.pathname) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  if (callbackUrl.searchParams.get("state") !== state) {
    response.writeHead(400);
    response.end("Invalid OAuth state.");
    server.close();
    return;
  }

  const code = callbackUrl.searchParams.get("code");
  if (!code) {
    response.writeHead(400);
    response.end(`Spotify authorization failed: ${callbackUrl.searchParams.get("error") || "unknown error"}`);
    server.close();
    return;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
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
  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenData.refresh_token) {
    response.writeHead(502);
    response.end(`Spotify token exchange failed: ${tokenData.error || "unknown_error"}`);
    server.close();
    return;
  }

  response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(`Authorization complete. Copy the refresh token below, then close this window:\n\n${tokenData.refresh_token}`);
  console.log("\nSPOTIFY_REFRESH_TOKEN=");
  console.log(tokenData.refresh_token);
  console.log("\nAdd that value to GitHub repository secrets, then remove it from your terminal history if necessary.");
  server.close();
});

server.listen(Number(redirect.port), redirect.hostname, () => {
  console.log("Open this URL in your browser:");
  console.log(authorizeUrl.toString());
  console.log(`\nWaiting for Spotify callback at ${redirectUri}`);
});
