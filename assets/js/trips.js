(() => {
  const chips = document.querySelectorAll(".trips-chip");
  const cards = document.querySelectorAll(".trip-card");

  chips.forEach((chip) => {
    chip.addEventListener("click", (event) => {
      event.preventDefault();
      const type = chip.dataset.filterType;
      const value = chip.dataset.filterValue;

      chips.forEach((item) => {
        const active = item === chip;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-current", String(active));
      });

      cards.forEach((card) => {
        const cardTags = (card.dataset.tags || "").split("|");
        const visible =
          type === "all" ||
          (type === "year" && card.dataset.year === value) ||
          (type === "tag" && cardTags.includes(value));
        card.hidden = !visible;
      });
    });
  });

  const mapElement = document.getElementById("trip-route-map");
  const routeDataElement = document.getElementById("trip-route-data");
  if (!mapElement || !routeDataElement) {
    return;
  }

  if (!window.L) {
    showRouteError("The map library did not load.");
    return;
  }

  const route = JSON.parse(routeDataElement.textContent);
  const fallback = mapElement.querySelector(".trip-route-fallback");
  if (fallback) {
    fallback.textContent = "Loading route map…";
  }
  const map = L.map(mapElement, { scrollWheelZoom: false });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  fetch(route.url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Route request failed (${response.status}).`);
      }
      return response.text();
    })
    .then((content) => {
      const layer =
        route.type === "gpx"
          ? addGPXRoute(content, map)
          : L.geoJSON(JSON.parse(content)).addTo(map);
      const bounds = layer.getBounds();
      if (!bounds.isValid()) {
        throw new Error("The route file contains no mappable coordinates.");
      }
      map.fitBounds(bounds, { padding: [24, 24] });
      mapElement.querySelector(".trip-route-fallback")?.remove();
    })
    .catch((error) => {
      console.error("Unable to display trip route:", error);
      showRouteError(`Unable to display the route: ${error.message}`);
    });

  function addGPXRoute(content, mapInstance) {
    const document = new DOMParser().parseFromString(content, "application/xml");
    if (document.querySelector("parsererror")) {
      throw new Error("The GPX file is not valid XML.");
    }
    const points = Array.from(document.querySelectorAll("trkpt, rtept, wpt"))
      .map((point) => [
        Number(point.getAttribute("lat")),
        Number(point.getAttribute("lon")),
      ])
      .filter(([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon));
    if (points.length === 0) {
      throw new Error("The GPX file contains no valid coordinates.");
    }
    return L.polyline(points, { color: getComputedStyle(mapElement).getPropertyValue("--trips-accent") || "#d9632b" })
      .addTo(mapInstance);
  }

  function showRouteError(message) {
    const fallback = mapElement.querySelector(".trip-route-fallback");
    if (fallback) {
      fallback.textContent = message;
      fallback.setAttribute("role", "status");
    }
  }
})();
