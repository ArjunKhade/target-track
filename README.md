# TargetTrack — Law Enforcement Intelligence & Travel History Tracking Dashboard

> **CLASSIFICATION**: `CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE`  
> **DISCLAIMER**: All data within this application is purely fictional. Names, organizations, routes, and incidents are mock generated for demonstration and testing purposes.

---

## 🛰️ Overview

**TargetTrack** is a high-performance, command-center intelligence dashboard built with **Angular 22** (Angular 19+ standalone architecture and Signals), **Angular Material (M3)**, direct **Leaflet** geospatial integration, and **Apache ECharts**. Designed for intelligence analysts, field investigators, and command staff, it provides real-time situational awareness, target transit reconstruction, multi-target convergence detection, geofence tripwires, reactive target dossier management, network association mapping, and encrypted dossier exports.

---

## ⚡ Tech Stack & Architecture

- **Framework**: Angular 22 (Angular 19+ features), 100% Standalone Components, Angular Signals (`signal`, `computed`, `effect`), new control flow syntax (`@if`, `@for`, `@let`, `@switch`), strict TypeScript (`noImplicitAny`, strict null checks).
- **Forms**: Angular Reactive Forms (`FormGroup`, `FormControl`, `Validators`) for target creation, profile updates, sighting telemetry, case notes, and network association linking.
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
   - **Officer**: Case notes authoring, evidence metadata attachments, PDF/CSV/GeoJSON dossier exports, target profile editing, next location sighting logging, and network associate linking.
   - **Admin**: Full command clearance including **Registering New Targets**, Geofence zone drafting, zone deletion, and immutable Audit Log access.
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
8. **MatTable Data Grid (Desktop)**:
   - Multi-column sorting, pagination, and real-time global search (`/` keyboard shortcut).
   - Dynamic **Column Visibility Toggle** menu with persistent checkboxes in `localStorage`.
   - Threat Level Indicators: Color-coded badges for all 4 threat levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) with animated radar pulse indicator for `CRITICAL` targets.
   - Deterministic initials avatar badges with unique color hashing.
9. **Two-Row Organized Filter Chips**:
   - Clean, non-crowded layout with Category and Threat on Row 1, and Status on Row 2.
   - Multi-select filter pills with one-click *"Clear Filters"* button.
10. **Responsive Mobile Target Cards**:
    - Automatic transformation from desktop MatTable into high-density mobile cards (`target-card`).
    - **Compact Operations Bar**: Tight 24px–26px action buttons with zero touch-target overflow saving 80px+ horizontal space.
    - **Single-Line Name & Alias**: Safeguarded with `white-space: nowrap` and `text-overflow: ellipsis` so multi-word codenames (e.g. `MON DON`) and legal identities remain completely visible without vertical wrapping.
    - **Hidden Mobile Paginator**: Hides standard desktop paginator on mobile screens for seamless vertical card browsing.
11. **One-Click Row & Card Operations**:
    - **Track on Map** (`map`): Focuses target route on tactical map.
    - **Log Next Location** (`add_location_alt`): Opens sighting modal to record new surveillance coordinates.
    - **Manage Network / Link Associate** (`hub`): Opens network association dialog directly from the roster.
    - **Edit Target Dossier** (`edit`): Opens reactive profile modification dialog.
    - **Open Full Dossier** (`badge`): Navigates to dedicated target dossier view (`/targets/:id`).
12. **Batch Selection & Map Comparison**:
    - Row-level multi-select checkboxes.
    - Header *"Compare on Tactical Map"* button loading selected targets into the multi-target map engine with automated convergence calculation.

---

### D. Target Registration, Lifecycle & Dossier CRUD
13. **Role-Guarded Target Registration**:
    - Prominent `+ Register Target` action button strictly visible and operable by authenticated users with the **Admin** role.
    - Warning banner displayed if unauthorized users attempt access.
14. **Reactive Target Form Dialog (`TargetFormDialogComponent`)**:
    - Dual Create / Edit mode standalone component using Angular `FormGroup`.
    - Strict validation: Required fields, length bounds, coordinate limits, and confidence range.
    - **Primary Identification**: Codename / Alias (auto-uppercase), Legal Identity, Threat Category, Threat Tier, Surveillance Status, Syndicate / Organization, and Intelligence Tags.
    - **Initial Surveillance Sighting**: City, State, GPS Latitude (-90 to 90), Longitude (-180 to 180), Intel Source, Observed Activity, and Confidence percentage.
    - **Known Associates & Network Multi-Select**: Direct multi-selection of existing registered targets to establish network links upon registration or during profile edits.
    - **Classified Dossier Notes**: Add briefing remarks, operational priorities, and surveillance case history.
15. **Sequential Tactical ID Assignment**:
    - Automatically assigns sequential IDs (`TGT-001`, `TGT-007`, `TGT-008`, etc.) ensuring no collisions.
16. **Adaptive Light/Dark Theming**:
    - Form fields, dropdowns, and buttons adapt dynamically to Light and Dark themes via semantic CSS variables (`var(--bg-surface)`, `var(--bg-app)`, `var(--text-primary)`, `var(--border-color)`), avoiding invisible text or low-contrast inputs.

---

### E. Dedicated Target Dossier Page (`/targets/:id`)
17. **Classified Identity Profile**:
    - Target avatar, tactical codename, ID, threat level badge, status badge, syndicate name, category, and active tags.
    - Header controls: Back to Roster, Log Next Location, Track on Map, and Edit Dossier.
18. **Interactive Leaflet Mini-Map**:
    - Visualizes chronological movement corridors and numbered breadcrumb waypoints.
    - Custom colored markers: Latest sighting in red, previous sightings in cyan with animated dash-array polyline.
    - Interactive popups displaying City, State, Source, and Activity.
19. **Chronological Surveillance Timeline**:
    - Vertical timeline listing all sightings with source badges, relative timestamps (`timeAgo`), GPS coordinates, observed activity, and confidence score pill.
20. **Quick Operational Status Selector**:
    - Dropdown allowing command officers to immediately update subject status (`Active`, `Under Surveillance`, `Captured`, `Lost Contact`).
    - Dispatches instant reactive signal update and records audit log entry.
21. **Case Notes & Intelligence Log**:
    - Historical case notes list with author attribution.
    - Inline reactive case note creation form with instant dossier append and audit logging.

---

### F. Surveillance Sighting & Next Location Updates
22. **Dedicated Reactive Location Dialog (`LocationDialogComponent`)**:
    - Reactive form with full validation for logging newly intercepted or observed target coordinates.
    - **Fields**: Sighting City, State / Region, GPS Latitude (-90 to 90), GPS Longitude (-180 to 180), Intel Source (`CCTV`, `Informant`, `Toll`, `Phone Tower`, `Hotel Record`), Observed Activity Description, and Verification Confidence (0–100%).
    - **Smart Pre-fill**: Suggests previous region and coordinates based on target's most recent sighting history.
23. **Real-Time Telemetry Update**:
    - Prepends new sighting to the head of `target.history`.
    - Automatically updates `lastSeen` timestamp, timeline list, mini-map polyline, and tactical map markers.
    - Generates `TARGET_LOCATION_UPDATE` audit log.

---

### G. Known Associates & Network Management
24. **Reactive Associate Linking Dialog (`AssociateDialogComponent`)**:
    - **Tactical Registry Selector**: Filtered dropdown of all registered targets (excluding current target and already-linked associates) showing codename, ID, full name, category, and threat level chip.
    - **External / Unclassified Entity Mode**: Text input to link external, foreign, or cell identifiers (e.g. `EXT-AL-QAEDA-LEAD`, `COURIER-09`).
    - **Operational Roles**: Predefined roles including `Lieutenant / Deputy`, `Financier / Money Launderer`, `Arms Courier`, `Cell Member / Operative`, `Cyber Specialist`, `Safehouse Host / Fixer`, `Family / Kin`, `Informant / Asset`, and `Associate / Operative`.
    - **Link Classification Level**: `CONFIRMED` (Direct Sighting/Wiretap), `PROBABLE` (Repeated Cell Association), and `SUSPECTED` (Single Sighting/Informant).
    - **Intelligence Brief**: Free-text notes capturing reason for association or intercepted communications.
    - **Bi-Directional Network Linking**: Option (checked by default) to automatically add reciprocal connection to the associate's dossier.
25. **Dossier Network Card**:
    - Dynamic count badge and `+ Add Associate` button.
    - Rich associate item cards displaying avatar, codename, tactical ID, full legal name, threat level badge, and category.
    - Quick navigation: Click associate card or chevron to jump directly to their dossier.
    - Unlink button (`link_off`): One-click removal of associate connection with audit logging.
26. **Global Network Graph Integration**:
    - Dynamically feeds into the ECharts force-directed syndicate association graph (`/analytics`) and the Map View associates popup.

---

### H. Tactical Map & Dossier Replay Engine (`/map`)
27. **Responsive Dual-Panel Command Layout**:
    - **Left Panel**: Target profile card, summary stats strip, date filters, and multi-tab dossier (Timeline, Notes, Network, Evidence).
    - **Right Panel**: Full-height Leaflet interactive map with tactical toolbar, layer controls, and playback scrubber.
    - Automatically stacks vertically on tablets and mobile screens (`flex-direction: column-reverse`).
28. **Complete Travel Path & Numbered Waypoints**:
    - Polyline path rendering historical sightings across realistic Indian transit routes.
    - Custom numbered `DivIcon` markers: Start = Green, End = Red, Last Known = Animated pulsing radar marker.
    - Interactive popups showing City, State, Activity, Source, Timestamp, and Confidence score.
29. **Directional Flow Vectors**:
    - `leaflet-polylinedecorator` directional arrows indicating transit heading along the route.
30. **Animated Ant-Path Flux**:
    - `leaflet-ant-path` animated SVG pulses indicating active vector of movement.
31. **Synchronized Timeline Panel**:
    - Vertical timeline list synced two-ways with Leaflet map markers.
    - Hovering timeline entries highlights the corresponding marker; clicking flies camera to coordinates and opens popup.
32. **Smooth Travel History Playback & Scrubber**:
    - Play, Pause, and Stop controls (`Spacebar` shortcut).
    - Speed multipliers: `1x`, `2x`, `5x`, `10x`.
    - Interactive `mat-slider` time scrubber.
    - Satellite beacon marker interpolates smoothly between waypoints.
    - Real-time readout of active city and timestamp synchronized with the timeline step.
33. **Temporal Date Range Filters**:
    - Quick preset buttons: `24h`, `7d`, `14d`.
    - Custom date range picker (`mat-date-range-picker`).
    - Dynamically recalculates path, statistics, and timeline based on filter window.
34. **Multi-Base Layer Switcher & Overlay Toggles**:
    - Base Layers: `Dark` (CartoDB Dark Matter), `Street` (OpenStreetMap), `Satellite` (Esri World Imagery), `Terrain` (OpenTopoMap).
    - Overlays: Travel Route, Numbered Waypoints, Heatmap, Marker Clustering, Geofences, Predicted Next Vector.
35. **Spatial Density Heatmap**:
    - `leaflet.heat` density layer rendering transit frequency hotspots.
36. **Marker Clustering**:
    - `leaflet.markercluster` automatically grouping dense urban sightings with expandable cluster rings.
37. **Predictive Next Vector Extrapolation**:
    - Mathematical extrapolation algorithm computing bearing and average transit velocity from final sightings.
    - Forward dashed trajectory vector ending with a translucent ±40 km confidence buffer circle.
38. **Automated Stop & Dwell Detection**:
    - Automated detection flagging waypoints where target stayed > 2 hours with an amber hourglass dwell duration badge.
39. **Real-Time Distance & Velocity Analytics**:
    - Total route kilometers calculated using the Haversine spherical formula.
    - Average transit speed (km/h), unique cities visited, and operational timeframe span.
40. **Map Tools & Controls**:
    - *"Fit to Route"* auto-framing button.
    - *"Locate Last Seen"* camera jump button.
    - Fullscreen toggle button (`F` keyboard shortcut).

---

### I. Multi-Target Convergence & Intersection Analysis
41. **Multi-Target Comparison**:
    - Select and render up to 5 target routes simultaneously on the map.
    - Distinctive high-contrast palette assigned per target with a dynamic legend and individual route toggles.
42. **Spatial-Temporal Intersection Algorithm**:
    - Evaluates all pairs of targets for sightings within 15 km (Haversine formula) and within an 8-hour temporal window.
    - Generates amber meeting point markers on the map with convergence details.
    - *"Intersections"* dialog listing date, city, coordinates, distance, and time delta between operatives.
43. **Syndicate Association Network Graph (`/analytics`)**:
    - Force-directed network diagram in ECharts visualizing target linkages, syndicates, and shared operatives.

---

### J. Geofencing & Perimeter Monitoring (`/geofences`)
44. **Restricted Zone Management**:
    - Pre-configured radial and polygon exclusion perimeters (e.g. Mumbai Maritime Port, Delhi NCR Transit, Wagah Border Corridor).
    - Administrative zone creator with shape selection, color picker, risk category, and armed toggle.
45. **Tripwire Breach Detection**:
    - Point-in-polygon ray-casting algorithm and point-in-circle radial checks across all target histories.
    - Targets with violations display a warning badge (`ZONE BREACH`) across the map, profile, and list.
    - Automatic alerts dispatched to the operational alerts feed.

---

### K. Case Management & Intelligence Vault
46. **Case Notes Tab**:
    - Add, edit, and delete classified intelligence notes with author attribution and timestamp (Officer & Admin clearance).
47. **Evidence Vault Tab**:
    - Attach simulated intelligence evidence metadata (CCTV frames, wiretaps, drone reconnaissance, forensic reports, satellite imagery).
    - File upload simulation with file size, MIME type, and classified file tags.

---

### L. Dossier Export & Reporting
48. **Multi-Format Intelligence Export**:
    - **PDF Dossier**: Complete intelligence briefing generated using `jspdf` and `jspdf-autotable`, including classified header/watermark, target profile, route statistics, and chronological sighting register.
    - **CSV Travel Log**: Raw chronological tabular data of coordinates, cities, sources, and activities.
    - **RFC-7946 GeoJSON**: FeatureCollection of Point sightings and LineString transit vectors for import into professional GIS tools (QGIS, ArcGIS).
49. **Print-Friendly Styling**:
    - Dedicated print media stylesheets for clean dossier output.

---

### M. Security, Compliance & Audit Trail
50. **Immutable Audit Register (`/audit-log`)**:
    - Comprehensive security register tracking user logins, target inspections, dossier updates, and security events.
    - Tracked Actions: `LOGIN`, `LOGOUT`, `TARGET_VIEW`, `TARGET_CREATE`, `TARGET_UPDATE`, `TARGET_LOCATION_UPDATE`, `TARGET_STATUS_CHANGE`, `ASSOCIATE_ADD`, `ASSOCIATE_REMOVE`, `NOTE_ADD`, `NOTE_EDIT`, `NOTE_DELETE`, `EXPORT_CSV`, `EXPORT_GEOJSON`, `EXPORT_PDF`, `GEOFENCE_CREATE`, `GEOFENCE_EDIT`, `GEOFENCE_DELETE`, `EVIDENCE_UPLOAD`.
    - Filter by action type, user, date range, and search query with CSV audit log download.
51. **Inactivity Session Watchdog**:
    - 10-minute automated session termination with SnackBar warning at 9 minutes.
52. **Classification Watermarks**:
    - Confidential watermarks (`CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE`) rendered across the map and dossier exports.

---

### N. UX Polish, Theming & Mobile Sizing
53. **Tactical Command Center Dark / Light Theme**:
    - Instant theme toggle persisted to `localStorage` with system preference fallback (`prefers-color-scheme`).
    - High-contrast M3 palettes with clean light mode styling for all menus, overlays, dialogs, tables, and sidenavs.
54. **Empty States & Feedback**:
    - Specialized empty states for zero sightings, empty notes, empty associates, and no-results search.
    - Visual toast notifications (SnackBar) for all operational events.
55. **Keyboard Shortcuts**:
    - `/` : Focus global search input.
    - `Spacebar` : Toggle playback play / pause.
    - `F` : Toggle map fullscreen mode.
56. **Full Mobile Optimization**:
    - Optimized across mobile phones (320px–480px), tablets (768px–1024px), and large desktop displays.
    - Compact 24px–26px mobile operation icons preserving single-line name visibility.

---

## 📦 Project Structure

```
Target Tracking System/
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
│       │       ├── target.service.ts # Reactive target state, signals, CRUD, sighting & associate APIs
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
│       │   │   ├── list/             # MatTable, sorting, pagination, mobile cards, 2-row filter chips
│       │   │   ├── detail/           # Dedicated dossier view: profile card, mini-map, timeline, notes
│       │   │   ├── form-dialog/      # Reactive Target Registration & Update dialog (Admin role-guarded)
│       │   │   ├── location-dialog/  # Reactive Sighting & Next Location logging dialog
│       │   │   └── associate-dialog/ # Reactive Known Associates & Network linking dialog
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
- **Node.js**: v20+ or v22+
- **NPM**: v10+ or v11+
- **Angular CLI**: v19+ or v22+

### Installation & Run

1. Navigate into the application root:
   ```powershell
   cd "d:\Target Tracking System"
   ```

2. Start the development server:
   ```powershell
   npx ng serve --open
   ```
   Open `http://localhost:4200/` in your browser.

3. Run production build:
   ```powershell
   npx ng build
   ```

4. Run unit test suite:
   ```powershell
   npx ng test --watch=false
   ```

---

## 🔑 Authentication & Test Roles

The login screen provides one-click quick-fill access for all three security tiers:

| Role | Username | Password | Privileges |
|---|---|---|---|
| **Admin** | `admin` | Any | Full clearance: **Register New Targets**, Geofence drafting, Evidence deletion, Audit Log inspection. |
| **Officer** | `officer` | Any | Case Note authoring & editing, Evidence uploads, Dossier updates, Location sightings, Associate linking, Dossier PDF/CSV exports. |
| **Viewer** | `viewer` | Any | Read-only access: View dashboard, inspect targets, browse maps and analytics. |

---

## 🛡️ License & Compliance

Internal law-enforcement testing software. Confidential and proprietary.
