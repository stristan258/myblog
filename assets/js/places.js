(() => {
  const mapElement = document.getElementById("places-map");
  const dataElement = document.getElementById("places-map-data");
  const grid = document.getElementById("places-grid");
  const chips = document.querySelectorAll(".places-chip");

  if (!mapElement || !dataElement || !grid || !window.L) {
    return;
  }

  const places = JSON.parse(dataElement.textContent || "[]");
  const markersByRegion = new Map();
  const markerBounds = [];
  const map = L.map(mapElement, { scrollWheelZoom: false });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  places.forEach((place) => {
    const icon = L.divIcon({
      className: "places-map-marker",
      html: '<span aria-hidden="true"></span>',
      iconSize: [20, 26],
      iconAnchor: [10, 25],
    });
    const marker = L.marker([place.lat, place.lon], { icon }).addTo(map);
    const countLabel = place.count === 1 ? "photo" : "photos";
    marker.bindPopup(
      `<strong>${escapeHTML(place.name)}</strong><br>` +
        `${place.count} ${countLabel}<br>` +
        `<a href="${escapeHTML(place.url)}">View photos</a>`,
    );
    const regionMarkers = markersByRegion.get(place.region) || [];
    regionMarkers.push(marker);
    markersByRegion.set(place.region, regionMarkers);
    markerBounds.push([place.lat, place.lon]);
  });

  if (markerBounds.length > 0) {
    map.fitBounds(markerBounds, { padding: [24, 24], maxZoom: 10 });
  } else {
    map.setView([20, 0], 2);
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", (event) => {
      event.preventDefault();
      const selectedRegion = chip.dataset.region;

      chips.forEach((item) => {
        const active = item === chip;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-current", String(active));
      });

      grid.querySelectorAll(".place-card").forEach((card) => {
        card.hidden = selectedRegion !== "all" && card.dataset.region !== selectedRegion;
      });

      const visibleBounds = [];
      markersByRegion.forEach((markers, region) => {
        markers.forEach((marker) => {
          const visible = selectedRegion === "all" || region === selectedRegion;
          if (visible) {
            marker.addTo(map);
            visibleBounds.push(marker.getLatLng());
          } else {
            map.removeLayer(marker);
          }
        });
      });

      if (visibleBounds.length > 0) {
        map.fitBounds(visibleBounds, { padding: [24, 24], maxZoom: 10 });
      } else {
        map.setView([20, 0], 2);
      }
    });
  });

  mapElement.querySelector(".places-map-fallback")?.remove();

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return entities[character];
    });
  }
})();
