---
name: sync-map-data
description: Syncs GPS coordinates and GPX track metadata from roadmap markdown files to data/locations.json before commits. Run this skill before committing changes to ensure the web map stays in sync with roadmap content.
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Sync Map Data Skill

This skill parses all GPS coordinates and GPX file references from the roadmap markdown files and updates `data/locations.json` to keep the web map in sync.

## When to Run

Run this skill (`/sync-map-data`) before committing changes to ensure the map data is up to date. This is especially important after:
- Adding new locations to roadmap markdown files
- Adding new GPX files
- Modifying existing location coordinates or descriptions

## What This Skill Does

1. **Scan all roadmap markdown files** in `roadmap/` directory
2. **Extract locations** with GPS coordinates from Google Maps links (format: `https://www.google.com/maps?q=LAT,LON`)
3. **Parse location metadata** including name, description, and category (urbex, monument, hike, food, worth_a_stop, future)
4. **Scan for GPX files** in `roadmap/*/assets/` directories
5. **Extract GPX track metadata** from the markdown tables (name, distance, time, type)
6. **Update `data/locations.json`** with the collected data
7. **Report changes** showing what was added, updated, or removed

## Parsing Rules

### Location Categories
Determine category based on the markdown section header:
- `### Urbexes` or `### Urbex` → category: "urbex"
- `### Soviet Stuff & Monuments` or `### Monuments` → category: "monument"
- `### Hikes` or `## Hikes` → category: "hike"
- `### Food` → category: "food"
- `### Worth a Stop` → category: "worth_a_stop"
- `## Beyond This Trip` → category: "future"
- `## Bishkek` → category: "worth_a_stop"
- Default (if in `## Places` with no subsection) → category: "worth_a_stop"

### Coordinate Extraction
Extract coordinates from Google Maps links:
- Pattern: `https://www.google.com/maps?q=LAT,LON` or `[LAT, LON](https://www.google.com/maps?q=LAT,LON)`
- Store as `[LAT, LON]` array (latitude first, then longitude)

### GPX Track Metadata
For each GPX file found:
- Match to the corresponding row in the Hikes table by filename pattern
- Extract: name, distance, time, type (Out and back, Loop, etc.)
- Determine routeType based on filename or table context:
  - Files with `00-` prefix or containing "to" in name (e.g., `00-bishkek-to-sonkol.gpx`) → routeType: "car"
  - All other GPX files → routeType: "hike"
- Assign colors:
  - Car routes: #34495e (dark gray)
  - Hiking trails: cycle through #e74c3c, #e67e22, #f1c40f, #2ecc71, #3498db, #9b59b6, #1abc9c, #e91e63

### Description Extraction
- For table-based entries: use the "Description" column
- For paragraph-based entries (like Min-Kush): use the first paragraph after the name

## Output Format

The `data/locations.json` file should follow this structure:

```json
{
  "gpxTracks": [
    {
      "id": "kebab-case-name",
      "name": "Human Readable Name",
      "file": "roadmap/XX-section/assets/filename.gpx",
      "distance": "X km",
      "time": "Xh or X days",
      "type": "Out and back",
      "routeType": "hike|car",
      "color": "#hexcolor"
    }
  ],
  "locations": [
    {
      "name": "Location Name",
      "category": "urbex|monument|hike|food|worth_a_stop|future",
      "coordinates": [LAT, LON],
      "description": "Brief description of the location",
      "link": "https://www.google.com/maps?q=LAT,LON"
    }
  ]
}
```

## Execution Steps

1. Read all markdown files matching `roadmap/**/index.md`
2. Parse each file section by section, tracking the current category
3. Extract all locations with their coordinates and metadata
4. Find all GPX files using glob pattern `roadmap/**/assets/*.gpx`
5. Match GPX files to their table entries for metadata
6. Read the current `data/locations.json`
7. Generate the updated JSON
8. Compare old vs new to identify changes
9. Write the updated `data/locations.json`
10. Report: "Updated locations.json: X locations, Y GPX tracks"

## Important Notes

- Preserve existing data that cannot be auto-extracted (manually added descriptions, etc.)
- If a location already exists (same coordinates), update its metadata but keep manual enhancements
- Sort locations by category, then alphabetically by name
- Sort GPX tracks by their file path
- Use 4-decimal precision for coordinates
- Deduplicate locations with identical coordinates (keep the one with more complete metadata)
