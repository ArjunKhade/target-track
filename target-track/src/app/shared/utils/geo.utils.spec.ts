import {
  haversineKm,
  bearing,
  interpolatePosition,
  predictNextLocation,
  pathDistanceKm,
  pointInPolygon,
  pointInCircle,
} from './geo.utils';

describe('GeoUtils Pure Math Helpers', () => {
  it('haversineKm should calculate known distance between Mumbai and Pune accurately (~120km)', () => {
    // Mumbai ~ 19.0760, 72.8777; Pune ~ 18.5204, 73.8567
    const dist = haversineKm(19.076, 72.8777, 18.5204, 73.8567);
    expect(dist).toBeGreaterThan(115);
    expect(dist).toBeLessThan(130);
  });

  it('haversineKm should return 0 for identical points', () => {
    const dist = haversineKm(28.7041, 77.1025, 28.7041, 77.1025);
    expect(dist).toBeCloseTo(0, 5);
  });

  it('bearing should calculate accurate heading in degrees (0 to 360)', () => {
    // Due North
    const northHeading = bearing(0, 0, 10, 0);
    expect(northHeading).toBeCloseTo(0, 1);

    // Due East
    const eastHeading = bearing(0, 0, 0, 10);
    expect(eastHeading).toBeCloseTo(90, 1);
  });

  it('interpolatePosition should return start at t=0 and end at t=1', () => {
    const route: [number, number][] = [
      [19.076, 72.8777],
      [18.7571, 73.4059],
      [18.5204, 73.8567],
    ];

    const start = interpolatePosition(route, 0);
    expect(start[0]).toBeCloseTo(19.076, 3);
    expect(start[1]).toBeCloseTo(72.8777, 3);

    const end = interpolatePosition(route, 1);
    expect(end[0]).toBeCloseTo(18.5204, 3);
    expect(end[1]).toBeCloseTo(73.8567, 3);

    const mid = interpolatePosition(route, 0.5);
    expect(mid[0]).toBeGreaterThan(18.5);
    expect(mid[0]).toBeLessThan(19.1);
  });

  it('pathDistanceKm should sum multiple segments correctly', () => {
    const route: [number, number][] = [
      [19.076, 72.8777],
      [18.7571, 73.4059],
      [18.5204, 73.8567],
    ];
    const total = pathDistanceKm(route);
    const seg1 = haversineKm(route[0][0], route[0][1], route[1][0], route[1][1]);
    const seg2 = haversineKm(route[1][0], route[1][1], route[2][0], route[2][1]);
    expect(total).toBeCloseTo(seg1 + seg2, 4);
  });

  it('predictNextLocation should project point along bearing', () => {
    // Projecting north by 100km from equator
    const [predLat, predLng] = predictNextLocation(0, 0, 1, 0, 100);
    expect(predLat).toBeGreaterThan(1);
    expect(predLng).toBeCloseTo(0, 1);
  });

  it('pointInCircle should detect points within and outside radius', () => {
    const centerLat = 19.076;
    const centerLng = 72.8777;
    const radiusKm = 10;

    // Point ~1km away
    expect(pointInCircle(19.08, 72.88, centerLat, centerLng, radiusKm)).toBe(true);

    // Point in Pune (~120km away)
    expect(pointInCircle(18.5204, 73.8567, centerLat, centerLng, radiusKm)).toBe(false);
  });

  it('pointInPolygon should correctly identify interior and exterior points via ray-casting', () => {
    // Square around [10, 10] to [20, 20]
    const square: [number, number][] = [
      [10, 10],
      [10, 20],
      [20, 20],
      [20, 10],
    ];

    expect(pointInPolygon(15, 15, square)).toBe(true);
    expect(pointInPolygon(5, 5, square)).toBe(false);
    expect(pointInPolygon(25, 25, square)).toBe(false);
  });
});
