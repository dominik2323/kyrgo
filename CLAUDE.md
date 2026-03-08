# Claude Code Instructions

## Pre-Commit: Sync Map Data

Before creating any commit that modifies roadmap content, **always run `/sync-map-data`** to ensure `data/locations.json` stays in sync with the markdown files.

### When to sync:
- Adding/modifying locations in `roadmap/**/index.md`
- Adding new GPX files to `roadmap/**/assets/`
- Changing coordinates or descriptions

### Workflow:
1. Make changes to roadmap markdown files
2. Run `/sync-map-data`
3. Review the changes to `data/locations.json`
4. Commit all changes together

## Project Structure

```
/
├── index.html              # Web map (GitHub Pages)
├── css/style.css           # Map styling
├── js/map.js               # Map logic
├── data/locations.json     # Auto-generated from roadmap (use /sync-map-data)
└── roadmap/
    ├── index.md            # Main roadmap overview
    ├── 01-biskek-sonkul/
    │   ├── index.md        # Part 1 locations
    │   └── assets/*.gpx    # GPX tracks
    ├── 02-sonkul-issykul/
    │   ├── index.md        # Part 2 locations
    │   └── assets/*.gpx    # GPX tracks
    └── 03-bishkek/
        ├── index.md        # Part 3 locations
        └── assets/         # GPX tracks
```

## Available Skills

- `/kyrgyzstan-hiking-guide` - Adventure planning assistant
- `/sync-map-data` - Sync roadmap data to locations.json before commits
