# TargetTrack — Law Enforcement Intelligence & Travel History Tracking Dashboard

> **CLASSIFICATION**: `CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE`  
> **DISCLAIMER**: All data within this application is purely fictional. Names, organizations, routes, and incidents are mock generated for demonstration and testing purposes.

---

## 🛰️ Overview

**TargetTrack** is a high-performance, command-center intelligence dashboard built with **Angular 22** (Angular 19+ standalone architecture and Signals), **Angular Material (M3)**, direct **Leaflet** geospatial integration, and **Apache ECharts**. Designed for intelligence analysts, field investigators, and command staff, it provides real-time situational awareness, target transit reconstruction, multi-target convergence detection, geofence tripwires, and encrypted dossier exports.

---

## ⚡ Tech Stack & Architecture

- **Framework**: Angular 22 (Angular 19+ features), 100% Standalone Components, Angular Signals (`signal`, `computed`, `effect`), new control flow syntax (`@if`, `@for`, `@switch`), strict TypeScript (`noImplicitAny`, strict null checks).
- **UI & Layout**: Angular Material + CDK (M3 theming, dark command center theme with light mode toggle, tables, sorting, paginators, dialogs, sidenav, toolbars, badges, chips, sliders, date range pickers).
- **Geospatial Engine**: **Leaflet directly** (no wrapper overhead) + `@types/leaflet`.
  - `leaflet-polylinedecorator`: Directional flow vectors along target transit corridors.
  - `leaflet.markercluster`: High-performance spatial clustering for dense urban sightings.
  - `leaflet.heat`: Real-time density heatmaps of criminal operational hubs.
  - `leaflet-draw`: Administrative zone drafting for polygonal & radial geofences.
  - `leaflet-ant-path`: Animated SVG flux path indicating direction of travel.
- **Charts & Graphs**: `ngx-echarts` + `echarts` (Donut, Multi-stack Bar, Temporal Sightings Line, Spatial Hotspots Horizontal Bar, and Force-Directed Association Network Graph).
- **State Management**: Reactive Signal-based Services (`TargetService`, `MapService`, `GeofenceService`, `AlertService`, `AuthService`, `AuditService`, `ThemeService`, `ExportService`).
- **Reports & Exporting**: `jspdf` + `jspdf-autotable` (PDF Dossiers), native Blob for CSV logs and RFC-7946 GeoJSON FeatureCollections.
- **Responsive Layout**: Mobile-first responsive styling optimized across phones (320px–480px), tablets (768px–1024px), and desktop displays.

---

## 📋 Comprehensive Feature Catalog

### A. Authentication, Clearance & Role-Based Access Control
1. **Classified Terminal Login (`/login`)**:
   - Law-enforcement security overlay (`CLASSIFIED // RESTRICTED // CONFIDENTIAL`).
   - One-click demo credentials for **Admin**, **Officer**, and **Viewer**.
   - Reactive login form with password visibility toggle and error handling.
2. **Role-Based Access Control (RBAC)**:
   - Functional route guards (`authGuard` and `roleGuard`).
   - **Viewer**: Read-only clearance (inspect dashboard, view targets, browse maps and analytics).
   - **Officer**: Case notes authoring, evidence metadata attachments, PDF/CSV/GeoJSON dossier exports.
   - **Admin**: Full command clearance including Geofence zone drafting, zone deletion, and immutable Audit Log access.
3. **Session Persistence & Inactivity Watchdog**:
   - Session storage in `localStorage` with automatic recovery upon refresh.
   - Automated 10-minute inactivity session expiration.
   - SnackBar warning prompt at 9 minutes with a *"Stay Active"* reset option.

---

### B. Command Center Dashboard (`/dashboard`)
4. **Animated Stat Counters**:
   - Total Monitored Targets.
   - Active Under Surveillance.
   - Critical Threat Tier (with animated red pulsing glow).
   - Captured Operatives.
   - Lost Contact Status.
5. **Interactive Data Visualizations (ECharts)**:
   - **Syndicate Categories**: Donut chart displaying breakdown across Terror Org, Organized Crime, Fugitive, Smuggler, and Cyber Crime.
   - **Threat Distribution**: Color-coded bar chart comparing Critical, High, Medium, and Low tiers.
   - **Temporal Sightings**: Smooth area line chart tracking daily sightings across the last 14 days.
   - **Operational Hotspots**: Horizontal bar chart mapping top transit cities across India.
6. **Live Tactical Alerts Feed**:
   - Automated RxJS interval emitting operational alerts every 15–30 seconds.
   - Real-time unread alert count badge in the top toolbar.
   - Interactive alerts dropdown and dashboard feed with direct *"View on Map"* routing.
   - Ability to mark individual alerts or clear all alerts simultaneously.
7. **Mini Clustered Overview Map**:
   - Embedded Leaflet overview map displaying last-known locations of all targets with spatial clustering.

---

### C. Target Registry & Roster (`/targets`)
8. **MatTable Data Grid**:
   - Multi-column sorting, pagination, and real-time global search (`/` keyboard shortcut).
   - Dynamic **Column Visibility Toggle** menu with persistent checkboxes.
   - Multi-select filter pills for Threat Level, Status, and Category.
   - One-click *"Clear Filters"* button.
9. **Threat Level Indicators**:
   - Color-coded badges for all 4 threat levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
   - Animated radar pulse indicator for `CRITICAL` targets.
   - Deterministic initials avatar badges with unique color hashing.
10. **Batch Selection & Map Comparison**:
    - Row-level multi-select checkboxes.
    - Header *"Compare on Map"* button loading selected targets into the multi-target map engine.

---

### D. Tactical Map & Dossier Replay Engine (`/map`)
11. **Responsive Dual-Panel Command Layout**:
    - **Left Panel**: Target profile card, summary stats strip, date filters, and multi-tab dossier (Timeline, Notes, Network, Evidence).
    - **Right Panel**: Full-height Leaflet interactive map with tactical toolbar, layer controls, and playback scrubber.
    - Automatically stacks vertically on tablets and mobile screens (`flex-direction: column-reverse`).
12. **Complete Travel Path & Numbered Waypoints**:
    - Polyline path rendering historical sightings across realistic Indian transit routes.
    - Custom numbered `DivIcon` markers: Start = Green, End = Red, Last Known = Animated pulsing radar marker.
    - Interactive popups showing City, State, Activity, Source (`CCTV`, `Informant`, `Toll`, `Phone Tower`, `Hotel Record`), Timestamp, and Confidence score.
13. **Directional Flow Vectors**:
    - `leaflet-polylinedecorator` directional arrows indicating transit heading along the route.
14. **Animated Ant-Path Flux**:
    - `leaflet-ant-path` animated SVG pulses indicating active vector of movement.
15. **Synchronized Timeline Panel**:
    - Vertical timeline list synced two-ways with Leaflet map markers.
    - Hovering timeline entries highlights the corresponding marker; clicking flies camera to coordinates and opens popup.
16. **Smooth Travel History Playback & Scrubber**:
    - Play, Pause, and Stop controls (`Spacebar` shortcut).
    - Speed multipliers: `1x`, `2x`, `5x`, `10x`.
    - Interactive `mat-slider` time scrubber.
    - Satellite beacon marker interpolates smoothly between waypoints.
    - Real-time readout of active city and timestamp synchronized with the timeline step.
17. **Temporal Date Range Filters**:
    - Quick preset buttons: `24h`, `7d`, `14d`.
    - Custom date range picker (`mat-date-range-picker`).
    - Dynamically recalculates path, statistics, and timeline based on filter window.
18. **Multi-Base Layer Switcher & Overlay Toggles**:
    - Base Layers: `Dark` (CartoDB Dark Matter), `Street` (OpenStreetMap), `Satellite` (Esri World Imagery), `Terrain` (OpenTopoMap).
    - Overlays: Travel Route, Numbered Waypoints, Heatmap, Marker Clustering, Geofences, Predicted Next Vector.
19. **Spatial Density Heatmap**:
    - `leaflet.heat` density layer rendering transit frequency hotspots.
20. **Marker Clustering**:
    - `leaflet.markercluster` automatically grouping dense urban sightings with expandable cluster rings.
21. **Predictive Next Vector Extrapolation**:
    - Mathematical extrapolation algorithm computing bearing and average transit velocity from final sightings.
    - Forward dashed trajectory vector ending with a translucent ±40 km confidence buffer circle.
22. **Automated Stop & Dwell Detection**:
    - Automated detection flagging waypoints where target stayed > 2 hours with an amber hourglass dwell duration badge.
23. **Real-Time Distance & Velocity Analytics**:
    - Total route kilometers calculated using the Haversine spherical formula.
    - Average transit speed (km/h), unique cities visited, and operational timeframe span.
24. **Map Tools & Controls**:
    - *"Fit to Route"* auto-framing button.
    - *"Locate Last Seen"* camera jump button.
    - Fullscreen toggle button (`F` keyboard shortcut).

---

### E. Multi-Target Convergence & Intersection Analysis
26. **Multi-Target Comparison**:
    - Select and render up to 5 target routes simultaneously on the map.
    - Distinctive high-contrast palette assigned per target with a dynamic legend and individual route toggles.
27. **Spatial-Temporal Intersection Algorithm**:
    - Evaluates all pairs of targets for sightings within 15 km (Haversine formula) and within an 8-hour temporal window.
    - Generates amber meeting point markers on the map with convergence details.
    - *"Intersections"* dialog listing date, city, coordinates, distance, and time delta between operatives.
28. **Syndicate Association Network Graph (`/analytics`)**:
    - Force-directed network diagram in ECharts visualizing target linkages, syndicates, and shared operatives.

---

### F. Geofencing & Perimeter Monitoring (`/geofences`)
29. **Restricted Zone Management**:
    - Pre-configured radial and polygon exclusion perimeters (e.g. Mumbai Maritime Port, Delhi NCR Transit, Wagah Border Corridor).
    - Administrative zone creator with shape selection, color picker, risk category, and armed toggle.
30. **Tripwire Breach Detection**:
    - Point-in-polygon ray-casting algorithm and point-in-circle radial checks across all target histories.
    - Targets with violations display a warning badge (`ZONE BREACH`) across the map, profile, and list.
    - Automatic alerts dispatched to the operational alerts feed.

---

### G. Case Management & Intelligence Dossier
32. **Case Notes Tab**:
    - Add, edit, and delete classified intelligence notes with author attribution and timestamp (Officer & Admin clearance).
33. **Evidence Vault Tab**:
    - Attach simulated intelligence evidence metadata (CCTV frames, wiretaps, drone reconnaissance, forensic reports, satellite imagery).
    - File upload simulation with file size, MIME type, and classified file tags.
34. **Status & Tag Adjustments**:
    - Real-time status change selector (`Active`, `Under Surveillance`, `Captured`, `Lost Contact`) that automatically logs an audit entry.

---

### H. Dossier Export & Reporting
35. **Multi-Format Intelligence Export**:
    - **PDF Dossier**: Complete intelligence briefing generated using `jspdf` and `jspdf-autotable`, including classified header/watermark, target profile, route statistics, and chronological sighting register.
    - **CSV Travel Log**: Raw chronological tabular data of coordinates, cities, sources, and activities.
    - **RFC-7946 GeoJSON**: FeatureCollection of Point sightings and LineString transit vectors for import into professional GIS tools (QGIS, ArcGIS).
36. **Print-Friendly Styling**:
    - Dedicated print media stylesheets for clean dossier output.

---

### I. Security & Compliance Touches
37. **Immutable Audit Register (`/audit-log`)**:
    - Comprehensive security register tracking user logins, target inspections, dossier exports, note authoring, and geofence updates.
    - Filter by action type, user, date range, and search query.
    - CSV audit log download.
38. **Inactivity Session Watchdog**:
    - 10-minute automated session termination with SnackBar warning at 9 minutes.
39. **Classification Watermarks**:
    - Confidential watermarks (`CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE`) rendered across the map and dossier exports.

---

### J. UX Polish & Accessibility
40. **Tactical Command Center Dark / Light Theme**:
    - Instant theme toggle persisted to `localStorage` with system preference fallback (`prefers-color-scheme`).
    - High-contrast M3 palettes with clean light mode styling for all menus, overlays, tables, and sidenavs.
41. **Empty States & Feedback**:
    - Empty states for zero sightings, empty notes, and no-results search.
    - Visual toast notifications (SnackBar) for all operational events.
42. **Keyboard Shortcuts**:
    - `/` : Focus global search input.
    - `Spacebar` : Toggle playback play / pause.
    - `F` : Toggle map fullscreen mode.
43. **Full Device Mobile Responsiveness**:
    - Adaptive layouts optimized across mobile phones (320px–480px), tablets (768px–1024px), and large desktop displays.
    - Touch-friendly horizontal swiping for tables and tactical toolbars.
44. **i18n Ready Architecture**:
    - Centralized application strings in `src/app/shared/constants/app.constants.ts`.
45. **WCAG Accessibility**:
    - High-contrast threat colors, aria labels, focus indicators, and semantic HTML structure.

---

## 📦 Project Structure

```
target-track/
├── public/
│   └── assets/
│       └── leaflet/                  # Leaflet 2x marker icons, retina & shadows
├── src/
│   ├── index.html                    # Fonts (Roboto, JetBrains Mono, Material Icons)
│   ├── styles.scss                   # Tactical dark/light themes, pulse animations, Leaflet styles
│   ├── main.ts                       # Angular bootstrap
│   └── app/
│       ├── app.ts                    # Root app component (Theme initialization)
│       ├── app.html                  # Router outlet
│       ├── app.config.ts             # Providers (Router, AnimationsAsync, HttpClient, ECharts)
│       ├── app.routes.ts             # Lazy-loaded routes with authGuard & roleGuard
│       │
│       ├── core/
│       │   ├── guards/
│       │   │   ├── auth.guard.ts     # Route protection (redirect to /login)
│       │   │   └── role.guard.ts     # Role hierarchy check (Admin > Officer > Viewer)
│       │   ├── interceptors/
│       │   │   ├── api.interceptor.ts   # X-Request-ID, Bearer token injection, request auditing
│       │   │   └── auth.interceptor.ts  # 401 response handling and auto logout
│       │   ├── mock/
│       │   │   ├── targets.mock.ts   # 10 fictional targets across realistic Indian transit routes
│       │   │   ├── users.mock.ts     # Admin, Officer, Viewer credentials
│       │   │   ├── alerts.mock.ts    # Initial situational alerts
│       │   │   ├── geofences.mock.ts # Radial & polygonal restricted perimeters
│       │   │   ├── case-notes.mock.ts# Intelligence logs & case records
│       │   │   ├── evidence.mock.ts  # Attachments (CCTV frames, drone footage, wiretaps)
│       │   │   └── audit-log.mock.ts # Immutable security audit trail
│       │   ├── models/
│       │   │   ├── target.model.ts   # Target, LocationPoint, Category, ThreatLevel, Status
│       │   │   ├── alert.model.ts    # Alert, AlertSeverity, AlertType
│       │   │   ├── geofence.model.ts # GeofenceZone, GeofenceShape
│       │   │   ├── user.model.ts     # User, UserRole, AuthSession
│       │   │   ├── audit.model.ts    # AuditEntry, AuditAction
│       │   │   ├── case-note.model.ts# CaseNote
│       │   │   └── evidence.model.ts # Evidence, EvidenceType
│       │   └── services/
│       │       ├── target.service.ts # Reactive target state, signal counters, mock API delay
│       │       ├── map.service.ts    # Multi-target selection, layer states, date range
│       │       ├── geofence.service.ts# Zone CRUD, localStorage sync, violation detection
│       │       ├── alert.service.ts  # Live alert generation interval (15-30s), unread count
│       │       ├── auth.service.ts   # Session persistence, role verification
│       │       ├── audit.service.ts  # Security event recording and export
│       │       ├── export.service.ts # PDF, CSV, GeoJSON export generators
│       │       └── theme.service.ts  # Dark Command Center vs. Light mode toggle
│       │
│       ├── layout/
│       │   └── shell/
│       │       ├── shell.component.ts   # Sidenav, Live Clock, Notifications, User Menu
│       │       ├── shell.component.html # Material layout wrapper
│       │       └── shell.component.scss # Command center sidebar styling
│       │
│       ├── features/
│       │   ├── login/                # Classified terminal login + 1-click test role access
│       │   ├── dashboard/            # Stat counters, 4 ECharts, mini overview map, live alerts
│       │   ├── targets/
│       │   │   ├── list/             # MatTable, sorting, pagination, multi-select, column toggles
│       │   │   └── detail/           # Hosts MapView pre-selected for target
│       │   ├── map/
│       │   │   ├── map-view.component.ts        # Flagship Leaflet tracking & playback engine
│       │   │   ├── case-notes.component.ts      # Target intelligence notes CRUD
│       │   │   ├── evidence.component.ts        # Vault file metadata attachment simulation
│       │   │   └── intersection-dialog.component.ts # Meeting convergence detection details
│       │   ├── analytics/            # Syndicate association graph & convergence matrix
│       │   ├── geofences/            # Perimeter deployment, violation counter, armed toggle
│       │   └── audit-log/            # Chronological security register & CSV download
│       │
│       └── shared/
│           ├── components/
│           │   ├── avatar/           # Initials badge with deterministic color hash
│           │   ├── status-badge/     # Status chip (Active, Under Surveillance, Captured, Lost)
│           │   ├── threat-chip/      # Threat badge with pulse animation for CRITICAL
│           │   ├── empty-state/      # Centered empty state feedback
│           │   └── confirm-dialog/   # Reusable MatDialog for deletion confirmations
│           ├── pipes/
│           │   ├── time-ago.pipe.ts  # Relative timestamp ("2 hours ago")
│           │   ├── format-km.pipe.ts # Distance formatting ("1,245.8 km")
│           │   └── confidence.pipe.ts# Percent formatter ("85%")
│           ├── constants/
│           │   └── app.constants.ts  # WCAG-safe threat palettes, route colors, timeouts
│           └── utils/
│               ├── geo.utils.ts      # Haversine, bearing, route interpolation, next-point projection, ray-casting
│               └── geo.utils.spec.ts # Mathematical unit test suite
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20+ or v24+
- **NPM**: v10+ or v11+
- **Angular CLI**: v19+ or v22+

### Installation & Run

1. Navigate into the application folder:
   ```powershell
   cd "d:\Target Tracking System\target-track"
   ```

2. Start the development server:
   ```powershell
   ng serve --open
   ```
   Open `http://localhost:4200/` in your browser.

3. Run production build:
   ```powershell
   ng build
   ```

4. Run unit test suite:
   ```powershell
   ng test --watch=false
   ```

---

## 🔑 Authentication & Test Roles

The login screen provides one-click quick-fill access for all three security tiers:

| Role | Username | Password | Privileges |
|---|---|---|---|
| **Admin** | `admin` | Any | Full clearance: Geofence drafting, Evidence deletion, Audit Log inspection. |
| **Officer** | `officer` | Any | Case Note authoring & editing, Evidence uploads, Dossier PDF/CSV exports. |
| **Viewer** | `viewer` | Any | Read-only access: View dashboard, inspect targets, analyze map routes. |

---

## 🔄 Swapping Mock Services for a Real REST/WebSocket API

1. **Update `src/app/core/services/target.service.ts`**:
   Replace `of(MOCK_TARGETS).pipe(delay(400))` with real HTTP calls:
   ```typescript
   private http = inject(HttpClient);
   private readonly API_URL = environment.apiUrl;

   getTargets(): Observable<Target[]> {
     return this.http.get<Target[]>(`${this.API_URL}/targets`);
   }
   ```
2. **Real-time Alert WebSocket**:
   In `src/app/core/services/alert.service.ts`, replace the RxJS `interval()` with a WebSocket Subject:
   ```typescript
   import { webSocket } from 'rxjs/webSocket';
   private socket$ = webSocket<Alert>(environment.wsAlertsUrl);

   startLiveAlerts(): Observable<Alert> {
     return this.socket$.asObservable();
   }
   ```
3. **HTTP Interceptor**:
   `src/app/core/interceptors/api.interceptor.ts` already generates unique `X-Request-ID` headers and injects `Authorization: Bearer <token>` from the active session.

---

## ⚠️ Known Limitations

1. **Mock Backend Latency**: Network latency is simulated via RxJS `delay()`; changes persist in-memory and in `localStorage`, but reset on clearing browser storage.
2. **Offline Tile Caching**: Leaflet tile layers require an active internet connection to download tile images from CartoDB, OSM, and Esri tile servers.
3. **Map Screenshot in PDF**: PDF export currently produces vector and tabular intelligence summaries. Generating client-side map canvas screenshots requires configuring CORS-enabled tile servers if `html2canvas` is used.

---

## 🛡️ License & Compliance

Internal law-enforcement testing software. Confidential and proprietary.
