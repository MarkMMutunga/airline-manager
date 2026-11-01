# Skyline Ops

Skyline Ops is a browser-based airline operations dashboard for managing flights, aircraft, crew, routes, and bookings from one workspace.

## Features

- Dashboard KPIs for flights, aircraft, crew, bookings, revenue, and on-time performance
- Interactive world map with airports, routes, and flight progress based on departure time and route distance
- Live OpenSky airspace count with a graceful fallback when the public endpoint is unavailable
- Live airport weather from Open-Meteo with operational weather alerts
- Clickable flight details with aircraft, route, booking, progress, and estimated arrival information
- Notifications for delayed or cancelled flights, aircraft maintenance, crew coverage, and duty-hour reviews
- Flight search and status filtering
- Aircraft utilization and maintenance attention indicators
- Aircraft availability and overlapping schedule validation when creating flights
- Crew-to-flight assignment and reassignment with overlap conflict protection
- Route performance metrics for flights, bookings, revenue, load factor, and full-flight revenue forecast
- Revenue analytics by cabin class
- Booking load-factor summaries and overbooking protection
- Light and dark themes with saved preference
- JSON backup, Flights CSV, and Bookings CSV exports
- Optional Supabase email authentication with sign-in, account creation, session restoration, and sign-out
- Branded SVG favicon for browser tabs and bookmarks
- Responsive layout for desktop and mobile screens

## Run Locally

This is a static browser application. No build step or package installation is required.

1. Open `index.html` directly in a modern browser, or serve the folder with any static web server.
2. Use the navigation buttons to switch between Dashboard, Flights, Aircraft, Crew, Routes, and Bookings.
3. The first launch seeds demo data automatically.

For a simple local server with Python:

```text
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Project Structure

```text
index.html          Application markup and view templates
css/styles.css      Layout, responsive styling, light/dark themes
js/app.js           State, rendering, interactions, APIs, authentication, and exports
js/supabase-config.js
					Supabase project URL and browser-safe publishable key
favicon.svg         Skyline Ops browser favicon
```

## Data Storage

Application data is stored in the browser's `localStorage` under the key `airline-ops-data-v2`. This includes flights, aircraft, crew, routes, bookings, and activity history.

The selected theme is stored separately so it persists between visits. Clearing browser site data resets the application and demo data.

## External Services

- Leaflet provides the interactive map.
- OpenStreetMap provides map tiles and attribution.
- Open-Meteo provides current airport weather.
- Google Fonts provides Space Grotesk and DM Mono.
- OpenSky Network provides the optional live airspace aircraft count.
- Supabase provides optional browser authentication using the publishable key in `js/supabase-config.js`.

An internet connection is needed for external map tiles, weather, and fonts. The core tables and local data continue to work if those services are unavailable.

## Exports

Use the download button in the header to export:

- A complete JSON backup of the current application state
- A Flights CSV report
- A Bookings CSV report

## Development Notes

The application uses plain HTML, CSS, and JavaScript with no bundler. Keep state changes inside `js/app.js`, preserve the existing template-based view structure, and run editor diagnostics after modifying the application.

The current schedule checks use route distance and an estimated cruise speed of 850 km/h to calculate flight windows. This supports local validation and visual progress; it is not a substitute for certified dispatch or aviation scheduling software.

## Supabase Authentication

The app is configured for the Supabase project URL and publishable key in `js/supabase-config.js`. The publishable key is safe for browser use when Supabase Row Level Security is configured correctly. Never place a service-role or secret key in this file.

Email confirmation behavior is controlled in the Supabase dashboard under Authentication settings. The current operational records remain in local browser storage; authentication is connected and ready for the next database-sync step.
