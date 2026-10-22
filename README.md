# Site structure and content

This site uses Hugo with the PaperMod theme. Keep authored pages, trips, and
photo posts as Markdown files with front matter; an HTML shortcode inside a
Markdown page is for an interactive component, not a separate content format.
For example, `content/live-track.md` uses the `strava-activity` and
`spotify-status` shortcodes, whose templates live in `layouts/shortcodes/`.

PaperMod still provides shared site features such as the profile homepage,
navigation, post rendering, and theme toggle. Site-specific pages and styling
belong in this repository's `layouts/` and `assets/` directories; do not edit
files under `themes/PaperMod/`.

As the site grows, extend these site-level templates and partials incrementally
instead of replacing the theme or converting ordinary content to HTML. Revisit
whether to replace PaperMod if its assumptions repeatedly require workarounds,
or if most shared site behavior has become custom and you are ready to maintain
it yourself.

# Places and photo-post front matter

Your iOS Shortcut can create a photo post with the location metadata in its
front matter. New posts do not need a separate entry in `data/places.yaml`.

## Fields for a photo post

```yaml
places: ["Oxwich Bay"]
lat: 51.56
lon: -4.11
region: Wales
```

- `places` is a YAML list of specific place names. Keep the square brackets
  even for one place, and quote names: `places: ["Benasque - Cerler"]`. Use
  `places: []` if the post has no specific place. A post can list more than one
  place, for example `places: ["Oxwich Bay", "Three Cliffs Bay"]`.
- `lat` and `lon` are decimal GPS coordinates. Round them to two decimal places
  in the Shortcut before saving the Markdown file. Posts are committed to the
  Git repository, so avoid putting exact private coordinates there.
- `region` is the country or region used to group the place filters, such as
  `Wales` or `Spain`. It is separate from `places`: use `places: ["Benasque"]`
  and `region: Spain`, not `places: ["Benasque, Spain"]`.

Use the same place name for posts from the same area so they share one place
page and map pin. When several posts have coordinates for a place, the map uses
their average, rounded to two decimal places. If a post has no GPS data, leave
`lat` and `lon` blank as in the archetype, or omit them. That post still appears
on its place page but does not contribute to the map pin. Hugo warns when a
place has no usable coordinates.

## Existing posts and location data

Existing entries in `data/places.yaml` remain as a fallback for older posts
that do not yet have `region`, `lat`, or `lon` in their front matter. New posts
can use the fields above directly and need no YAML update. When a post provides
its own location fields, those values take precedence over the fallback.

To preview the site locally, run `hugo server` from the repository root.

## Trips

Each trip is a folder under `content/trips/`. Its `_index.md` describes the
trip; Markdown files beside it are the trip's photo posts. You can do this
entirely in Working Copy on your phone.

### Create the trip

1. In `content/trips/`, create a folder with a short URL-friendly name, such
   as `coast-path-2027`.
2. In that folder, create `_index.md`.
3. Add the front matter below. Keep `title` and `start` when known; omit
   optional fields you do not have. Replace the example values with your own.

```yaml
---
title: "Coast Path 2027"
start: "2027-06-12"
end: "2027-06-15"
location: "Wales"
route: "Example start to finish"
cover:
  image: "https://images.trisphoto.com/your-trip-cover.jpeg"
distance_km: 40
camps: 2
tags: ["Coastal"]
years: ["2027"]
days:
  - title: "Day 1"
    note: "A short note about the day"
---
```

4. Save the file. The trip appears on `/trips/`; its detail page is at
   `/trips/<folder-name>/`.

`start` and `end` must be real trip dates in `YYYY-MM-DD` format—not the date
you wrote a post or uploaded an image. `title` and `start` are the only
required fields. If the start date is unknown, omit it; optional trip details
will be hidden when they are not provided.

### Add photos to the trip

Create each photo post as a `.md` file in the same trip folder, using the
usual photo-post front matter and your iOS Shortcut. For example:

```yaml
---
title: "Evening light on the coast"
date: 2027-06-12
places: ["Oxwich Bay"]
lat: 51.56
lon: -4.11
region: Wales
cover:
  image: "https://images.trisphoto.com/your-photo.jpeg"
draft: false
---
```

The post's date, title, and `cover.image` appear in the trip's Photos grid.
The number of posts in the folder is used for the photo count. Add more posts
the same way as you upload them; no trip-level photo list needs maintaining.
Round `lat` and `lon` to two decimal places before committing for location
privacy. Keep `places` as a list and use `region` for the country or region.

### Optional trip details

- `location`, `route`, `distance_km`, and `camps` appear on the trip card or
  detail page when provided. Only enter values you know.
- `cover.image` is optional. It uses PaperMod's cover format and accepts an
  R2 URL or a site image path. Without it, the trip card shows a placeholder.
- Add a short `tags` list, such as `["Coastal"]` or `["Mountains"]`, to make
  the trip available in the tag filters.
- Set `years` to a list containing the year of `start`, such as `["2027"]`.
  This supplies the year filter's link when JavaScript is unavailable.
- `days` is optional. Add one `title` and optional `note` per day to show the
  Day by day timeline.
- To include a route map, put a `.gpx` or `.geojson` file beside `_index.md`.
  The page uses Leaflet and OpenStreetMap. With no route file, the map panel
  is omitted.

Before publishing, check that dates and optional statistics are accurate,
photo posts are in the trip folder, and each post has the right cover URL.
Preview with `hugo server` when convenient; then commit and push the trip
folder using Working Copy to publish it.
