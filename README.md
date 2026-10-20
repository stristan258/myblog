# Places

For new photo posts, have your iOS Shortcut put the place name, GPS coordinates,
and region directly in the generated Markdown front matter:

```yaml
places: ["Oxwich Bay"]
lat: 51.56
lon: -4.11
region: Wales
```

Use the same place name for photos taken in the same area. The Places map
averages the coordinates of posts with that tag. Have the Shortcut round GPS
coordinates to two decimal places before writing them: front matter is stored
in the Git repository, so exact GPS coordinates there could reveal the photo's
precise location. No separate location file or build-time geocoding is needed
for new places.

Coordinates are decimal degrees. `region` sets the Places filter group (for
example, a country or a region such as Wales). If it is missing, the site uses
the existing `data/places.yaml` entry or the text after a comma in the place
name. Existing posts can continue using `data/places.yaml` as a fallback; new
posts do not need an entry there. If a photo has no GPS metadata, omit `lat` and
`lon` rather than leaving them blank. Posts without GPS still appear in the list
but do not add a map pin, and Hugo reports a warning to make the missing
metadata visible during a build. Map pins are averaged per place and rounded to
two decimal places before they are published.
