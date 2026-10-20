# Places

Add a post to a place by including the place name in its front matter:

```yaml
places: ["Oxwich Bay"]
```

Add the same exact name to `data/places.yaml` to show its country or region and
position it on the map:

```yaml
Oxwich Bay:
  country: Wales
  lat: 51.557
  lon: -4.113
```

Coordinates are decimal degrees. Choose a representative point for the place;
the map uses OpenStreetMap tiles. Place names without coordinates still appear
in the list but are omitted from the map. Region labels also group the filters.
