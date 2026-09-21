---
title: "Live Map"
draft: false
---

Track my live location, sent from the Garmin inReach. Send me an emwil and ill give you the pass code (assuming I know who you are..). 

<a href="https://live.garmin.com/lutris" target="_blank" rel="noopener noreferrer">View my live tracker on Garmin →</a>

## Listening now

<div id="spotify-status">Loading Spotify listening status...</div>
<iframe id="spotify-player" title="Spotify player" width="100%" height="152" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
<ol id="spotify-top-tracks" hidden></ol>

<p><a href="/.netlify/functions/spotify-auth">Connect Spotify</a> (one-time setup)</p>

<script>
	async function updateSpotifyStatus() {
		const status = document.getElementById("spotify-status");
		const player = document.getElementById("spotify-player");
		const topTracks = document.getElementById("spotify-top-tracks");

		try {
			const response = await fetch("/.netlify/functions/spotify-now");
			const data = await response.json();

			if (!response.ok || data.error) {
				status.textContent = data.error || "Spotify listening status is unavailable.";
				player.hidden = true;
				return;
			}

			if (data.empty) {
				status.textContent = "Nothing has been played recently.";
				player.hidden = true;
				topTracks.hidden = true;
				return;
			}

			if (data.topTracks) {
				status.textContent = "Top tracks this month";
				player.hidden = true;
				topTracks.replaceChildren(...data.topTracks.map((track) => {
					const item = document.createElement("li");
					const link = document.createElement("a");
					link.href = track.spotifyUrl;
					link.target = "_blank";
					link.rel = "noopener noreferrer";
					link.textContent = `${track.title} - ${track.creator}`;
					item.appendChild(link);
					return item;
				}));
				topTracks.hidden = false;
				return;
			}

			status.textContent = `Listening now: ${data.title} - ${data.creator}`;
			player.src = data.embedUrl;
			player.hidden = false;
			topTracks.hidden = true;
		} catch (error) {
			status.textContent = "Spotify listening status is unavailable.";
			player.hidden = true;
		}
	}

	updateSpotifyStatus();
	setInterval(updateSpotifyStatus, 60000);
</script>
