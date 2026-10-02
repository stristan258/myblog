import { appendFile, writeFile } from "node:fs/promises";

const credentials = {
  clientId: process.env.STRAVA_CLIENT_ID,
  clientSecret: process.env.STRAVA_CLIENT_SECRET,
  refreshToken: process.env.STRAVA_REFRESH_TOKEN,
};
const configured = Object.values(credentials).every(Boolean);
const unconfigured = Object.values(credentials).every((value) => !value);

if (unconfigured) {
  await writeSnapshot({ configured: false, activity: null });
  console.log("Strava is not configured; wrote an empty activity snapshot.");
} else {
  if (!configured) throw new Error("Set STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, and STRAVA_REFRESH_TOKEN together.");
  if (!process.env.STRAVA_SECRETS_TOKEN) throw new Error("Set STRAVA_SECRETS_TOKEN so the workflow can save rotated refresh tokens.");

  const tokenResponse = await fetch("https://www.strava.com/api/v3/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      grant_type: "refresh_token",
      refresh_token: credentials.refreshToken,
    }),
  });
  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.access_token || !tokenData.refresh_token) {
    throw new Error(`Strava token refresh failed: ${tokenData.message || tokenData.errors?.[0]?.message || "unknown error"}`);
  }

  if (process.env.GITHUB_OUTPUT) {
    if (process.env.GITHUB_ACTIONS === "true") {
      console.log(`::add-mask::${tokenData.refresh_token}`);
    }
    await appendFile(process.env.GITHUB_OUTPUT, `refresh_token=${tokenData.refresh_token}\n`);
  }

  const activity = await findLatestPublicHike(tokenData.access_token);
  const athleteResponse = await fetch("https://www.strava.com/api/v3/athlete", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const athlete = athleteResponse.ok ? await athleteResponse.json() : {};
  await writeSnapshot({
    configured: true,
    activity: activity ? {
      name: activity.name || "Hike",
      date: activity.start_date_local || activity.start_date,
      description: activity.description || "",
      distanceMeters: activity.distance,
      elevationGainMeters: activity.total_elevation_gain,
      profileImageUrl: athlete.profile_medium || athlete.profile || "",
      profileName: [athlete.firstname, athlete.lastname].filter(Boolean).join(" ") || athlete.username || "",
      profileUrl: athlete.id ? `https://www.strava.com/athletes/${athlete.id}` : "",
      summaryPolyline: activity.map?.summary_polyline || null,
      url: `https://www.strava.com/activities/${activity.id}`,
    } : null,
  });
}

async function findLatestPublicHike(accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  for (let page = 1; ; page += 1) {
    const url = new URL("https://www.strava.com/api/v3/athlete/activities");
    url.search = new URLSearchParams({ page: String(page), per_page: "100" });
    const response = await fetch(url, { headers });
    const activities = await response.json();
    if (!response.ok) {
      throw new Error(`Strava activities request failed: ${activities.message || "unknown error"}`);
    }

    const hike = activities.find((activity) =>
      (activity.sport_type === "Hike" || activity.type === "Hike") && activity.private === false,
    );
    if (hike) return hike;
    if (activities.length < 100) return null;
  }
}

async function writeSnapshot(data) {
  await writeFile("static/strava.json", `${JSON.stringify({ ...data, updatedAt: new Date().toISOString() }, null, 2)}\n`);
}