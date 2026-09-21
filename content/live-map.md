---
title: "Live Map"
draft: false
---

Track my live location, sent from the Garmin inReach. Send me an emwil and ill give you the pass code (assuming I know who you are..). 

<a href="https://live.garmin.com/lutris" target="_blank" rel="noopener noreferrer">View my live tracker on Garmin →</a>

## Listening now

<section class="spotify-widget" aria-live="polite">
	<div id="spotify-status" class="spotify-status">Loading Spotify listening status...</div>
	<a id="spotify-current" class="spotify-current" target="_blank" rel="noopener noreferrer" hidden>
		<img id="spotify-artwork" class="spotify-artwork" alt="">
		<span class="spotify-details">
			<span id="spotify-state" class="spotify-state"></span>
			<strong id="spotify-title" class="spotify-title"></strong>
			<span id="spotify-creator" class="spotify-creator"></span>
			<span class="spotify-listen">Open in Spotify</span>
		</span>
	</a>
	<ol id="spotify-top-tracks" class="spotify-top-tracks" hidden></ol>
</section>

<script>
	async function updateSpotifyStatus() {
		const status = document.getElementById("spotify-status");
		const current = document.getElementById("spotify-current");
		const artwork = document.getElementById("spotify-artwork");
		const state = document.getElementById("spotify-state");
		const title = document.getElementById("spotify-title");
		const creator = document.getElementById("spotify-creator");
		const topTracks = document.getElementById("spotify-top-tracks");

		try {
			const response = await fetch("/.netlify/functions/spotify-now");
			const data = await response.json();

			if (!response.ok || data.error) {
				status.textContent = data.error || "Spotify listening status is unavailable.";
				current.hidden = true;
				topTracks.hidden = true;
				return;
			}

			if (data.empty) {
				status.textContent = "Nothing has been played recently.";
				current.hidden = true;
				topTracks.hidden = true;
				return;
			}

			if (data.topTracks) {
				status.textContent = "Your top tracks this month";
				current.hidden = true;
				topTracks.replaceChildren(...data.topTracks.map((track, index) => {
					const item = document.createElement("li");
					const link = document.createElement("a");
					const image = document.createElement("img");
					const text = document.createElement("span");
					const rank = document.createElement("span");
					rank.className = "spotify-rank";
					rank.textContent = `${index + 1}`;
					image.src = track.imageUrl;
					image.alt = "";
					text.className = "spotify-track-text";
					text.textContent = `${track.title} - ${track.creator}`;
					link.href = track.spotifyUrl;
					link.target = "_blank";
					link.rel = "noopener noreferrer";
					link.append(rank, image, text);
					item.appendChild(link);
					return item;
				}));
				topTracks.hidden = false;
				return;
			}

			status.textContent = "";
			current.href = data.spotifyUrl;
			artwork.src = data.imageUrl;
			artwork.alt = `${data.title} artwork`;
			state.textContent = data.isPlaying ? "Listening now" : "Last listened";
			title.textContent = data.title;
			creator.textContent = data.creator;
			current.hidden = false;
			topTracks.hidden = true;
		} catch (error) {
			status.textContent = "Spotify listening status is unavailable.";
			current.hidden = true;
			topTracks.hidden = true;
		}
	}

	updateSpotifyStatus();
	setInterval(updateSpotifyStatus, 60000);
</script>
