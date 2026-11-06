# TargetTrack Project Documentation

## Overview

TargetTrack is an Angular single-page application for viewing and managing a
demonstration roster of targets. Its main areas are the dashboard, target
roster, interactive map, analytics, geofence management, and audit log.

> **Demo-data notice:** Target and location records, authentication, alerts, and
> audit entries are implemented with mock or in-memory data. This application
> is not a production surveillance, tracking, identity-verification, or
> security system.

## Getting Started

Install dependencies and start the Angular development server:

```bash
npm install
npm start
```

Create a production build:

```bash
npm run build
```

Run the test suite:

```bash
npm test
```

## Main Features

### Theme

`ThemeService` keeps the current `light` or `dark` theme in an Angular signal.
It applies a `theme-light` or `theme-dark` class to the document body, allowing
the stylesheets to change page and Angular Material colors. The selected theme
is saved in browser `localStorage`; on first use, the system color preference
is checked, with dark mode as a fallback.

### Sign-in and Access

The login form uses `AuthService` and a list of mock users. A matching username
creates a mock session with a placeholder token and an eight-hour expiry; the
password is not verified. The session is stored in browser `localStorage`.
Route guards require a session for protected pages, and role guards restrict
some pages and actions to admins.

This is demo authentication only. Client-side checks and placeholder tokens do
not provide production security.

### Dashboard

The dashboard summarizes target counts and displays charts for target
categories, threat levels, recorded sightings, and cities. It also provides a
mini-map and an alerts feed. Counts and visualizations are based on the
application's current target and alert data; alerts are simulated.

### Targets

The Targets page provides a searchable, sortable, filterable roster. Users can
filter by category, threat level, and status; choose visible columns; open a
target dossier; and use actions to view a target on the map, log a location,
link an associate, or edit the record. Admin users can register targets.

Registration requires an alias, full name, category, threat level, status, and
an initial sighting with city, state, latitude, and longitude. Other fields,
such as organization, tags, associates, source, activity, confidence, and
notes, are optional. Target updates are held in memory and are not saved to a
server.

### Map and Target Routes

The map uses Leaflet. Selecting a target passes its ID to the map route (for
example, `?targetId=TGT-001`); the map looks up that target and uses its
recorded location history to draw numbered markers and a route line. A
multi-target comparison can pass IDs with `targetIds`. The map also includes
controls and overlays such as clustering, heatmaps, route playback, and
geofences.

Map routes connect recorded points in history order. They are not continuous
GPS tracking.

### Intelligence and Convergence Analytics

The analytics page visualizes known-associate links, threat counts by category,
and recorded sightings by hour. Its convergence list compares location
histories for pairs of targets. Sightings within 15 km and eight hours are
listed as potential convergences; this proximity test does not establish that
a meeting occurred.

### Geofences

Geofences are circle or polygon areas that can be displayed on the map.
Recorded target locations are checked against active zones, and the Geofences
page displays matching point counts. Admin users can create, edit status, and
delete zones. Geofence definitions are saved in browser `localStorage` (with
mock zones as the initial fallback); the checks use recorded data, not live
location monitoring.

### Audit Log

The audit log presents entries with the user, action, timestamp, details, and
related target when available. The app records selected actions such as target
views or changes and geofence operations. Entries are currently in-memory and
initialized from mock records; they are not a durable or tamper-resistant
production audit trail.

## Main Libraries

| Library | Purpose |
| --- | --- |
| Angular (`@angular/*`) | Application framework, routing, forms, and browser UI. |
| Angular Material (`@angular/material`) | UI controls such as cards, tables, dialogs, and buttons. |
| Angular CDK (`@angular/cdk`) | UI utilities, including responsive breakpoint observation. |
| Leaflet (`leaflet`) | Interactive maps, markers, and polylines. |
| Leaflet plugins | Marker clustering, heatmaps, map drawing, route arrows, and animated paths. |
| Apache ECharts (`echarts`, `ngx-echarts`) | Dashboard and analytics charts and graphs. |
| RxJS (`rxjs`) | Asynchronous streams, event handling, and subscriptions. |
| jsPDF (`jspdf`, `jspdf-autotable`) | PDF report generation and tables. |
| html2canvas | Capturing rendered page content for reports. |
| TypeScript helpers (`tslib`) | Runtime helpers for compiled TypeScript. |

Development dependencies include the Angular CLI/build/compiler packages,
TypeScript, Vitest, jsdom, and Prettier.

## Key Source Locations

- `src/app/core/services/` — authentication, theme, target, alert, audit, and
  geofence services.
- `src/app/features/dashboard/` — dashboard.
- `src/app/features/targets/` — target roster, dossier, and registration form.
- `src/app/features/map/` — map, route display, and related map tools.
- `src/app/features/analytics/` — intelligence and convergence charts.
- `src/app/features/geofences/` — geofence management page.
- `src/app/features/audit-log/` — audit log page.
- `src/styles.scss` — global styles and theme definitions.
