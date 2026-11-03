/**
 * Haversine formula: distance in km between two lat/lng points
 */
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Bearing in degrees from point A to point B (0=North, 90=East)
 */
export function bearing(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/**
 * Interpolate a position along a path by fraction t ∈ [0, 1]
 */
export function interpolatePosition(
  points: [number, number][],
  t: number
): [number, number] {
  if (points.length === 0) return [0, 0];
  if (t <= 0) return points[0];
  if (t >= 1) return points[points.length - 1];

  // Compute total distance
  const segments: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const d = haversineKm(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
    segments.push(d);
    total += d;
  }

  let target = t * total;
  for (let i = 0; i < segments.length; i++) {
    if (target <= segments[i]) {
      const frac = target / segments[i];
      const lat = points[i][0] + frac * (points[i + 1][0] - points[i][0]);
      const lng = points[i][1] + frac * (points[i + 1][1] - points[i][1]);
      return [lat, lng];
    }
    target -= segments[i];
  }
  return points[points.length - 1];
}

/**
 * Predict next location by extending the last segment by `distanceKm`
 */
export function predictNextLocation(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
  distanceKm: number
): [number, number] {
  const b = toRad(bearing(lat1, lng1, lat2, lng2));
  const R = 6371;
  const d = distanceKm / R;
  const φ1 = toRad(lat2);
  const λ1 = toRad(lng2);
  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(d) + Math.cos(φ1) * Math.sin(d) * Math.cos(b)
  );
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(b) * Math.sin(d) * Math.cos(φ1),
      Math.cos(d) - Math.sin(φ1) * Math.sin(φ2)
    );
  return [toDeg(φ2), toDeg(λ2)];
}

/**
 * Total distance of a path in km
 */
export function pathDistanceKm(points: [number, number][]): number {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += haversineKm(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
  }
  return total;
}

/**
 * Check if a point is inside a polygon (ray-casting)
 */
export function pointInPolygon(
  lat: number, lng: number,
  polygon: [number, number][]
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect =
      yi > lng !== yj > lng &&
      lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Check if a point is inside a circle
 */
export function pointInCircle(
  lat: number, lng: number,
  centerLat: number, centerLng: number,
  radiusKm: number
): boolean {
  return haversineKm(lat, lng, centerLat, centerLng) <= radiusKm;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

