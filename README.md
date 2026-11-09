# Skyline Ops

Skyline Ops is a browser-based airline operations dashboard for managing flights, aircraft, crew, routes, and bookings from a single workspace. It is built as a static web application with plain HTML, CSS, and JavaScript, with optional Supabase authentication and cloud synchronization.

## Overview

The application provides an operational view of a small airline demo environment. On first launch it seeds local demo data into the browser so the dashboard, tables, and map are immediately usable. Users can review flight status, monitor route and aircraft utilization, assign crew, create bookings, inspect airport weather, and export operational reports.

## Features

- **Operations dashboard**: KPIs for flights, aircraft, crew, bookings, revenue, and on-time performance.
- **Interactive world map**: Airports, routes, and in-progress flight visualization based on departure time and route distance.
- **Live airspace context**: OpenSky airspace count and sampled aircraft markers, with graceful fallback when the public endpoint is unavailable.
- **Airport weather**: Current weather from Open-Meteo and operational weather alerts.
- **Flight management**: Clickable flight details, status filtering, search, estimated arrival, progress, aircraft availability checks, and overlapping schedule validation.
- **Crew management**: Flight assignment/reassignment with overlap conflict protection and duty-hour review indicators.
- **Aircraft management**: Utilization and maintenance attention indicators.
- **Route analytics**: Flights, bookings, revenue, load factor, and full-flight revenue forecast by route.
- **Booking controls**: Cabin-class revenue analytics, load-factor summaries, and overbooking protection.
- **Authentication (optional)**: Supabase email sign-in, account creation, session restoration, and sign-out.
- **Cloud sync (optional)**: User-scoped Supabase persistence after schema installation, with localStorage fallback.
- **Exports**: Complete JSON backup, Flights CSV, and Bookings CSV.
- **UI**: Light/dark themes with saved preference, responsive layout, and branded SVG favicon.

## Technology Stack

- **Frontend**: HTML, CSS, vanilla JavaScript (no bundler/build step)
- **Mapping**: Leaflet + OpenStreetMap tiles
- **Weather**: Open-Meteo
- **Live aircraft data**: OpenSky Network public endpoint
- **Authentication/data sync**: Supabase (`@supabase/supabase-js` browser client pattern/config)
- **Testing**: Node.js built-in test runner (`node --test`)
- **Deployment**: GitHub Actions workflow for GitHub Pages

## Project Structure

```text
.
├── index.html                 Application markup and view templates
├── favicon.svg                Browser tab/bookmark icon
├── css/
│   └── styles.css             Layout, responsive styling, light/dark themes
├── js/
│   ├── app.js                 State, rendering, interactions, APIs, auth, exports, sync
│   └── supabase-config.js     Supabase project URL and browser-safe publishable key
├── tests/
│   └── operations.test.js     Scheduling and load-factor rule tests
├── supabase-schema.sql        Supabase tables and Row Level Security policies
├── package.json               Test script metadata
└── .github/workflows/
    └── deploy.yml             GitHub Pages deployment workflow
```

## Getting Started

### Prerequisites

- A modern web browser.
- Optional: Python 3 (or any static file server) for local serving.
- Optional: Node.js 18+ to run tests.
- Optional: A Supabase project for authentication/cloud sync.

### Run Locally

This is a static browser application. No package installation is required for normal use.

1. Clone the repository.
2. Open `index.html` directly in a browser, or serve the repository root with a static server.
3. Use the navigation controls to switch between Dashboard, Flights, Aircraft, Crew, Routes, and Bookings.
4. Demo data is seeded automatically on first launch.

Example local server with Python:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Data Storage and Persistence

- **Local storage**: Operational data is stored in `localStorage` under the key `airline-ops-data-v2` (flights, aircraft, crew, routes, bookings, activity history).
- **Theme preference**: Stored separately so it persists between visits.
- **Reset behavior**: Clearing browser site data resets local application state and demo data.

### Supabase Cloud Sync

Cloud persistence is optional and requires the database schema to be installed:

1. Open the Supabase project SQL Editor.
2. Run the contents of `supabase-schema.sql`.
3. Keep Row Level Security enabled on every table.
4. Sign in to Skyline Ops with a configured Supabase user.

Behavior after setup:

- If a signed-in user has no cloud records, the app can migrate current local data to Supabase.
- If cloud records exist, they are loaded into the dashboard.
- Subsequent local changes are synchronized for that signed-in user.
- The app falls back to local storage when the schema or network is unavailable.

## Authentication

The app reads Supabase configuration from `js/supabase-config.js`.

- The **publishable (anon) key** is intended for browser use.
- **Never** place a service-role key, secret API key, or privileged credential in client-side files.
- Email confirmation and related auth behavior are controlled in the Supabase dashboard under Authentication settings.

## External Services

| Service | Purpose | Notes |
|---|---|---|
| Leaflet | Interactive map rendering | Loaded by the app |
| OpenStreetMap | Map tiles/attribution | Requires internet access |
| Open-Meteo | Airport weather | Requires internet access |
| OpenSky Network | Live airspace aircraft count/markers | Public endpoint may be rate-limited/unavailable; app falls back gracefully |
| Google Fonts | Space Grotesk / DM Mono | Requires internet access |
| Supabase | Auth and optional cloud sync | Requires valid project config and schema |

Core local tables and locally stored data continue to function if external services are unavailable, though map/weather/live-airspace features may degrade.

## Exports

Use the download/export control in the header to generate:

- **JSON backup** of the current application state
- **Flights CSV** report
- **Bookings CSV** report

## Testing

The repository includes dependency-free Node.js tests for core operational rules (scheduling and load-factor behavior).

Run tests:

```bash
npm test
```

## Deployment

A GitHub Actions workflow is provided at `.github/workflows/deploy.yml`.

- Trigger: push to `main` (and manual dispatch).
- Target: GitHub Pages.
- Setup: after the first workflow run, enable GitHub Pages in repository settings with **GitHub Actions** as the source.

## Development Notes

- Keep state changes centralized in `js/app.js` and preserve the existing template-based view structure.
- This project has no bundler; edit source files directly.
- Schedule checks use route distance and an estimated cruise speed of **850 km/h** to calculate flight windows. This supports local validation and visualization and is **not** a substitute for certified dispatch or aviation scheduling software.
- When changing behavior, run `npm test` and verify affected UI flows manually in a browser.

## Security Notes

- Treat `js/supabase-config.js` as public client configuration only.
- Rely on Supabase Row Level Security for data protection; do not weaken RLS policies.
- Do not commit secrets, service-role keys, or private tokens.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.
