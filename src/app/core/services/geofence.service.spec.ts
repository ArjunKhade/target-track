import { TestBed } from '@angular/core/testing';
import { GeofenceService } from './geofence.service';
import { Target } from '../models/target.model';

describe('GeofenceService', () => {
  let service: GeofenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GeofenceService],
    });
    service = TestBed.inject(GeofenceService);
  });

  it('should initialize with default geofence zones', () => {
    expect(service.zones().length).toBeGreaterThan(0);
  });

  it('should detect violations when target history enters a circular zone', () => {
    const mockTarget: Target = {
      id: 'TEST-001',
      alias: 'TEST_PHANTOM',
      fullName: 'Test Phantom',
      photoUrl: '',
      category: 'Organized Crime',
      organization: 'Test Org',
      threatLevel: 'HIGH',
      status: 'Active',
      lastSeen: new Date().toISOString(),
      knownAssociates: [],
      notes: [],
      tags: [],
      history: [
        // Point right inside Mumbai Port Exclusion Zone (18.9220, 72.8347)
        {
          lat: 18.9225,
          lng: 72.835,
          city: 'Mumbai',
          state: 'Maharashtra',
          timestamp: new Date().toISOString(),
          activity: 'Vessel meeting',
          source: 'CCTV',
          confidence: 90,
        },
      ],
    };

    const violations = service.checkViolations(mockTarget);
    expect(violations.length).toBeGreaterThanOrEqual(1);
    expect(violations[0].zone.name).toContain('Mumbai Port');
  });

  it('should add, update, and delete zones', () => {
    const initialCount = service.zones().length;
    service.addZone({
      name: 'Test Secure Area',
      shape: 'circle',
      color: '#ff0000',
      center: [20.0, 75.0],
      radius: 5000,
      active: true,
      createdBy: 'Tester',
    });

    expect(service.zones().length).toBe(initialCount + 1);

    const added = service.zones().find(z => z.name === 'Test Secure Area');
    expect(added).toBeDefined();

    if (added) {
      service.updateZone(added.id, { name: 'Updated Secure Area' });
      const updated = service.zones().find(z => z.id === added.id);
      expect(updated?.name).toBe('Updated Secure Area');

      service.deleteZone(added.id);
      expect(service.zones().find(z => z.id === added.id)).toBeUndefined();
    }
  });
});

