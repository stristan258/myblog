import http from "node:http";
import { randomUUID } from "node:crypto";
import { URL, URLSearchParams } from "node:url";

const clientId = process.env.STRAVA_CLIENT_ID;
const clientSecret = process.env.STRAVA_CLIENT_SECRET;
const redirectUri = process.env.STRAVA_REDIRECT_URI || "http://127.0.0.1:8765/callback";

if (!clientId || !clientSecret) {
  throw new Error("Set STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET before running this script.");
}

const redirect = new URL(redirectUri);
const state = randomUUID();
const authorizeUrl = new URL("https://www.strava.com/oauth/authorize");
authorizeUrl.search = new URLSearchParams({
  client_id: clientId,
  response_type: "code",
  redirect_uri: redirectUri,
  approval_prompt: "force",
  scope: "activity:read",
  state,
});

const server = http.createServer(async (request, response) => {
  const callbackUrl = new URL(request.url, redirect.origin);
  if (request.method !== "GET" || callbackUrl.pathname !== redirect.pathname) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  const returnedState = callbackUrl.searchParams.get("state");
  if (returnedState !== state) {
    const reason = returnedState === null
      ? "The callback did not include a state parameter. Restart and use the full authorization URL printed by that run."
      : "The callback state belongs to a different authorization run. Restart and use the newest authorization URL.";
    console.error(`Invalid OAuth state. ${reason}`);
    const authorizationLink = authorizeUrl.toString().replaceAll("&", "&amp;");
    response.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    response.end(`<!doctype html><html lang="en"><meta charset="utf-8"><title>Strava authorization</title><body><p>Invalid OAuth state. ${reason}</p><p>The authorization listener is still running.</p><p><a href="${authorizationLink}">Start Strava authorization for this run</a></p></body></html>`);
    return;
  }

  const code = callbackUrl.searchParams.get("code");
  if (!code) {
    response.writeHead(400);
    response.end(`Strava authorization failed: ${callbackUrl.searchParams.get("error") || "unknown error"}`);
    server.close();
    return;
  }

  try {
    const tokenResponse = await fetch("https://www.strava.com/api/v3/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenResponse.json();
    const grantedScopes = (tokenData.scope || "").split(/[\s,]+/);
    if (!tokenResponse.ok || !tokenData.refresh_token || !grantedScopes.includes("activity:read")) {
      throw new Error(tokenData.message || "Strava did not grant the required activity:read scope.");
    }

    response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Authorization complete. Copy the refresh token from your terminal, then close this window.");
    console.log("\nSTRAVA_REFRESH_TOKEN=");
    console.log(tokenData.refresh_token);
    console.log("\nAdd the value to your GitHub repository secret named STRAVA_REFRESH_TOKEN.");
  } catch (error) {
    response.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(`Strava token exchange failed: ${error.message}`);
  } finally {
    server.close();
  }
});

server.listen(Number(redirect.port), redirect.hostname, () => {
  console.log("Open this URL in your browser:");
  console.log(authorizeUrl.toString());
  console.log(`\nWaiting for Strava callback at ${redirectUri}`);
});