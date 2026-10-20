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
