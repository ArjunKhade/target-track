import { Target, LocationPoint } from '../models/target.model';

// Helper: generate ISO timestamp relative to now
function daysAgo(days: number, hours = 0, minutes = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  d.setMinutes(d.getMinutes() - minutes);
  return d.toISOString();
}

export const MOCK_TARGETS: Target[] = [
  // ─── TARGET 1: Mumbai → Lonavala → Pune → Kolhapur → Goa ───────────────────
  {
    id: 'TGT-001',
    alias: 'PHANTOM',
    fullName: 'Rajan Mehta',
    photoUrl: '',
    category: 'Organized Crime',
    organization: 'Mehta Syndicate',
    threatLevel: 'CRITICAL',
    status: 'Active',
    lastSeen: daysAgo(0, 6),
    knownAssociates: ['TGT-002', 'TGT-004'],
    notes: ['Primary financier of Mehta Syndicate', 'Known to use encrypted communications'],
    tags: ['financier', 'encrypted-comms', 'high-value'],
    history: [
      {
        lat: 19.0760, lng: 72.8777, city: 'Mumbai', state: 'Maharashtra',
        timestamp: daysAgo(14), activity: 'Meeting at warehouse district',
        source: 'Informant', confidence: 87
      },
      {
        lat: 18.7571, lng: 73.4059, city: 'Lonavala', state: 'Maharashtra',
        timestamp: daysAgo(12), activity: 'Checked into resort under alias',
        source: 'Hotel Record', confidence: 94
      },
      {
        lat: 18.5204, lng: 73.8567, city: 'Pune', state: 'Maharashtra',
        timestamp: daysAgo(10), activity: 'Spotted at city bus terminal',
        source: 'CCTV', confidence: 79
      },
      {
        lat: 18.5204, lng: 73.8567, city: 'Pune', state: 'Maharashtra',
        timestamp: daysAgo(10, 4), activity: 'Phone call traced to local tower',
        source: 'Phone Tower', confidence: 82
      },
      {
        lat: 16.7050, lng: 74.2433, city: 'Kolhapur', state: 'Maharashtra',
        timestamp: daysAgo(8), activity: 'Paid toll on NH48',
        source: 'Toll', confidence: 91
      },
      {
        lat: 15.4909, lng: 73.8278, city: 'Panaji', state: 'Goa',
        timestamp: daysAgo(6), activity: 'Sighted at casino complex',
        source: 'CCTV', confidence: 88
      },
      {
        lat: 15.2993, lng: 74.1240, city: 'Margao', state: 'Goa',
        timestamp: daysAgo(5), activity: 'Vehicle registered at hotel',
        source: 'Hotel Record', confidence: 95
      },
      {
        lat: 15.4909, lng: 73.8278, city: 'Panaji', state: 'Goa',
        timestamp: daysAgo(4), activity: 'Boarding speedboat at Mandovi',
        source: 'Informant', confidence: 76
      },
    ]
  },

  // ─── TARGET 2: Delhi → Jaipur → Ahmedabad ─────────────────────────────────
  {
    id: 'TGT-002',
    alias: 'VIPER',
    fullName: 'Sunita Khatri',
    photoUrl: '',
    category: 'Smuggler',
    organization: 'Khatri Network',
    threatLevel: 'HIGH',
    status: 'Under Surveillance',
    lastSeen: daysAgo(1, 3),
    knownAssociates: ['TGT-001', 'TGT-005'],
    notes: ['Specializes in contraband electronics', 'Has contacts in border customs'],
    tags: ['electronics-smuggling', 'customs-contact', 'mobile'],
    history: [
      {
        lat: 28.7041, lng: 77.1025, city: 'New Delhi', state: 'Delhi',
        timestamp: daysAgo(13), activity: 'Departed ISBT bus terminal',
        source: 'CCTV', confidence: 91
      },
      {
        lat: 28.3949, lng: 76.7804, city: 'Gurugram', state: 'Haryana',
        timestamp: daysAgo(13, 2), activity: 'Vehicle passed NH48 toll',
        source: 'Toll', confidence: 98
      },
      {
        lat: 26.9124, lng: 75.7873, city: 'Jaipur', state: 'Rajasthan',
        timestamp: daysAgo(11), activity: 'Meeting at old city market',
        source: 'Informant', confidence: 83
      },
      {
        lat: 26.9124, lng: 75.7873, city: 'Jaipur', state: 'Rajasthan',
        timestamp: daysAgo(10, 20), activity: 'Phone traced near Hawa Mahal tower',
        source: 'Phone Tower', confidence: 88
      },
      {
        lat: 25.3176, lng: 74.6313, city: 'Chittorgarh', state: 'Rajasthan',
        timestamp: daysAgo(9), activity: 'Brief stop at dhaba',
        source: 'Informant', confidence: 62
      },
      {
        lat: 23.0225, lng: 72.5714, city: 'Ahmedabad', state: 'Gujarat',
        timestamp: daysAgo(7), activity: 'Stayed at budget lodge',
        source: 'Hotel Record', confidence: 93
      },
      {
        lat: 23.0225, lng: 72.5714, city: 'Ahmedabad', state: 'Gujarat',
        timestamp: daysAgo(6, 5), activity: 'Transaction at wholesale market',
        source: 'Informant', confidence: 77
      },
      {
        lat: 22.3072, lng: 73.1812, city: 'Vadodara', state: 'Gujarat',
        timestamp: daysAgo(5), activity: 'Train ticket purchased',
        source: 'CCTV', confidence: 85
      },
      {
        lat: 21.1702, lng: 72.8311, city: 'Surat', state: 'Gujarat',
        timestamp: daysAgo(3), activity: 'Meeting with port contacts',
        source: 'Informant', confidence: 71
      },
      {
        lat: 19.0760, lng: 72.8777, city: 'Mumbai', state: 'Maharashtra',
        timestamp: daysAgo(1, 3), activity: 'Arrived at Chhatrapati Shivaji station',
        source: 'CCTV', confidence: 90
      },
    ]
  },

  // ─── TARGET 3: Kolkata → Siliguri (+ Guwahati detour) ─────────────────────
  {
    id: 'TGT-003',
    alias: 'WRAITH',
    fullName: 'Debashish Bora',
    photoUrl: '',
    category: 'Terror Org',
    organization: 'North-East Liberation Front (fictional)',
    threatLevel: 'CRITICAL',
    status: 'Active',
    lastSeen: daysAgo(2, 8),
    knownAssociates: ['TGT-007'],
    notes: ['Suspected bomb-making expertise', 'Uses multiple identity documents'],
    tags: ['explosives', 'multi-identity', 'northeast'],
    history: [
      {
        lat: 22.5726, lng: 88.3639, city: 'Kolkata', state: 'West Bengal',
        timestamp: daysAgo(14), activity: 'Photographed leaving safe house',
        source: 'Informant', confidence: 89
      },
      {
        lat: 23.1793, lng: 88.4505, city: 'Krishnanagar', state: 'West Bengal',
        timestamp: daysAgo(13), activity: 'Toll record on NH12',
        source: 'Toll', confidence: 97
      },
      {
        lat: 24.8333, lng: 87.8636, city: 'Malda', state: 'West Bengal',
        timestamp: daysAgo(12), activity: 'Purchased supplies at market',
        source: 'CCTV', confidence: 74
      },
      {
        lat: 26.7271, lng: 88.3953, city: 'Siliguri', state: 'West Bengal',
        timestamp: daysAgo(10), activity: 'Contact with courier at bus stand',
        source: 'Informant', confidence: 81
      },
      {
        lat: 26.7271, lng: 88.3953, city: 'Siliguri', state: 'West Bengal',
        timestamp: daysAgo(9, 18), activity: 'Registered at transit hotel',
        source: 'Hotel Record', confidence: 96
      },
      {
        lat: 26.1445, lng: 91.7362, city: 'Guwahati', state: 'Assam',
        timestamp: daysAgo(7), activity: 'Crossed state line; phone ping',
        source: 'Phone Tower', confidence: 79
      },
      {
        lat: 26.1445, lng: 91.7362, city: 'Guwahati', state: 'Assam',
        timestamp: daysAgo(6), activity: 'Meeting near Kamakhya temple area',
        source: 'CCTV', confidence: 68
      },
      {
        lat: 26.7271, lng: 88.3953, city: 'Siliguri', state: 'West Bengal',
        timestamp: daysAgo(4), activity: 'Return to Siliguri; new vehicle observed',
        source: 'Informant', confidence: 83
      },
      {
        lat: 27.0360, lng: 88.2627, city: 'Darjeeling', state: 'West Bengal',
        timestamp: daysAgo(2, 8), activity: 'Last sighting near hill station',
        source: 'CCTV', confidence: 72
      },
    ]
  },

  // ─── TARGET 4: Hyderabad → Bengaluru → Chennai ────────────────────────────
  {
    id: 'TGT-004',
    alias: 'SPECTRE',
    fullName: 'Arjun Pillai',
    photoUrl: '',
    category: 'Cyber Crime',
    organization: 'DarkNet Collective',
    threatLevel: 'HIGH',
    status: 'Under Surveillance',
    lastSeen: daysAgo(0, 12),
    knownAssociates: ['TGT-001', 'TGT-008'],
    notes: ['Primary hacker in DarkNet Collective', 'Operates ransomware campaigns against banking sector'],
    tags: ['ransomware', 'banking', 'cyber'],
    history: [
      {
        lat: 17.3850, lng: 78.4867, city: 'Hyderabad', state: 'Telangana',
        timestamp: daysAgo(14), activity: 'Operating from cyber café cluster',
        source: 'Informant', confidence: 84
      },
      {
        lat: 17.3850, lng: 78.4867, city: 'Hyderabad', state: 'Telangana',
        timestamp: daysAgo(12, 6), activity: 'Phone ping near Hitech City',
        source: 'Phone Tower', confidence: 90
      },
      {
        lat: 15.3173, lng: 76.4600, city: 'Hospet', state: 'Karnataka',
        timestamp: daysAgo(10), activity: 'Toll record NH167',
        source: 'Toll', confidence: 95
      },
      {
        lat: 12.9716, lng: 77.5946, city: 'Bengaluru', state: 'Karnataka',
        timestamp: daysAgo(8), activity: 'Spotted at coworking space, Electronic City',
        source: 'CCTV', confidence: 88
      },
      {
        lat: 12.9716, lng: 77.5946, city: 'Bengaluru', state: 'Karnataka',
        timestamp: daysAgo(7, 16), activity: 'Hotel check-in under false name',
        source: 'Hotel Record', confidence: 92
      },
      {
        lat: 12.9716, lng: 77.5946, city: 'Bengaluru', state: 'Karnataka',
        timestamp: daysAgo(6), activity: 'Meeting with unknown associate near MG Road',
        source: 'Informant', confidence: 76
      },
      {
        lat: 13.0827, lng: 80.2707, city: 'Chennai', state: 'Tamil Nadu',
        timestamp: daysAgo(4), activity: 'Arrived by train; spotted at Central station',
        source: 'CCTV', confidence: 91
      },
      {
        lat: 13.0827, lng: 80.2707, city: 'Chennai', state: 'Tamil Nadu',
        timestamp: daysAgo(3), activity: 'Internet café session traced',
        source: 'Informant', confidence: 79
      },
      {
        lat: 13.0827, lng: 80.2707, city: 'Chennai', state: 'Tamil Nadu',
        timestamp: daysAgo(2), activity: 'CCTV sighting near Marina Beach',
        source: 'CCTV', confidence: 85
      },
      {
        lat: 13.0827, lng: 80.2707, city: 'Chennai', state: 'Tamil Nadu',
        timestamp: daysAgo(0, 12), activity: 'Phone tower ping; still in Chennai',
        source: 'Phone Tower', confidence: 88
      },
    ]
  },

  // ─── TARGET 5: Pune → Nashik → Aurangabad (intersects with TGT-001 in Pune)
  {
    id: 'TGT-005',
    alias: 'JACKAL',
    fullName: 'Priya Deshmukh',
    photoUrl: '',
    category: 'Smuggler',
    organization: 'Deccan Contraband Ring',
    threatLevel: 'MEDIUM',
    status: 'Active',
    lastSeen: daysAgo(1),
    knownAssociates: ['TGT-002'],
    notes: ['Drug mule with established route through Maharashtra', 'Uses legitimate spice business as cover'],
    tags: ['drug-mule', 'spice-cover', 'repeat-offender'],
    history: [
      {
        lat: 18.5204, lng: 73.8567, city: 'Pune', state: 'Maharashtra',
        timestamp: daysAgo(10, 2), activity: 'Package pickup from courier (same time as TGT-001)',
        source: 'Informant', confidence: 85
      },
      {
        lat: 18.5204, lng: 73.8567, city: 'Pune', state: 'Maharashtra',
        timestamp: daysAgo(10, 5), activity: 'CCTV sighting at Shivaji market',
        source: 'CCTV', confidence: 91
      },
      {
        lat: 19.9975, lng: 73.7898, city: 'Nashik', state: 'Maharashtra',
        timestamp: daysAgo(8), activity: 'Meeting with winery owner',
        source: 'Informant', confidence: 78
      },
      {
        lat: 19.9975, lng: 73.7898, city: 'Nashik', state: 'Maharashtra',
        timestamp: daysAgo(7, 10), activity: 'Hotel check-in central Nashik',
        source: 'Hotel Record', confidence: 96
      },
      {
        lat: 19.8762, lng: 75.3433, city: 'Aurangabad', state: 'Maharashtra',
        timestamp: daysAgo(5), activity: 'Toll on NH52',
        source: 'Toll', confidence: 99
      },
      {
        lat: 19.8762, lng: 75.3433, city: 'Aurangabad', state: 'Maharashtra',
        timestamp: daysAgo(4), activity: 'Spotted near Bibi Ka Maqbara',
        source: 'CCTV', confidence: 81
      },
      {
        lat: 18.5204, lng: 73.8567, city: 'Pune', state: 'Maharashtra',
        timestamp: daysAgo(2), activity: 'Returned to Pune',
        source: 'Phone Tower', confidence: 82
      },
      {
        lat: 18.5204, lng: 73.8567, city: 'Pune', state: 'Maharashtra',
        timestamp: daysAgo(1), activity: 'Meeting at Koregaon Park café',
        source: 'Informant', confidence: 73
      },
    ]
  },

  // ─── TARGET 6: Bengaluru → Mysuru → Mangaluru (intersects TGT-004 in Bengaluru)
  {
    id: 'TGT-006',
    alias: 'COBRA',
    fullName: 'Vikram Shetty',
    photoUrl: '',
    category: 'Organized Crime',
    organization: 'Coastal Narco Network',
    threatLevel: 'CRITICAL',
    status: 'Active',
    lastSeen: daysAgo(1, 4),
    knownAssociates: ['TGT-010'],
    notes: ['Controls drug route from Mangaluru to Bengaluru', 'Known to carry weapons'],
    tags: ['narco', 'weapons', 'coastal'],
    history: [
      {
        lat: 12.9716, lng: 77.5946, city: 'Bengaluru', state: 'Karnataka',
        timestamp: daysAgo(13), activity: 'Arrived at Kempegowda airport',
        source: 'CCTV', confidence: 92
      },
      {
        lat: 12.9716, lng: 77.5946, city: 'Bengaluru', state: 'Karnataka',
        timestamp: daysAgo(12), activity: 'Meeting near Ulsoor Lake (same area as TGT-004)',
        source: 'Informant', confidence: 80
      },
      {
        lat: 12.2958, lng: 76.6394, city: 'Mysuru', state: 'Karnataka',
        timestamp: daysAgo(10), activity: 'Toll on Mysore highway',
        source: 'Toll', confidence: 100
      },
      {
        lat: 12.2958, lng: 76.6394, city: 'Mysuru', state: 'Karnataka',
        timestamp: daysAgo(9), activity: 'Spotted in Mysore city market',
        source: 'CCTV', confidence: 86
      },
      {
        lat: 12.9141, lng: 74.8560, city: 'Mangaluru', state: 'Karnataka',
        timestamp: daysAgo(7), activity: 'Meeting at harbor with boat operator',
        source: 'Informant', confidence: 88
      },
      {
        lat: 12.9141, lng: 74.8560, city: 'Mangaluru', state: 'Karnataka',
        timestamp: daysAgo(6), activity: 'Phone ping near Tannirbhavi Beach',
        source: 'Phone Tower', confidence: 84
      },
      {
        lat: 12.2958, lng: 76.6394, city: 'Mysuru', state: 'Karnataka',
        timestamp: daysAgo(3), activity: 'Return journey; hotel check-in',
        source: 'Hotel Record', confidence: 95
      },
      {
        lat: 12.9716, lng: 77.5946, city: 'Bengaluru', state: 'Karnataka',
        timestamp: daysAgo(1, 4), activity: 'Last seen at bus terminal',
        source: 'CCTV', confidence: 87
      },
    ]
  },

  // ─── TARGET 7: Delhi → Chandigarh → Amritsar ─────────────────────────────
  {
    id: 'TGT-007',
    alias: 'SHADOW',
    fullName: 'Harpreet Gill',
    photoUrl: '',
    category: 'Terror Org',
    organization: 'Punjab Liberation Army (fictional)',
    threatLevel: 'CRITICAL',
    status: 'Active',
    lastSeen: daysAgo(0, 3),
    knownAssociates: ['TGT-003'],
    notes: ['Expert in cross-border infiltration routes', 'Known to use drones for surveillance'],
    tags: ['infiltration', 'drones', 'border'],
    history: [
      {
        lat: 28.7041, lng: 77.1025, city: 'New Delhi', state: 'Delhi',
        timestamp: daysAgo(14), activity: 'Contact with foreign national at embassy area',
        source: 'Informant', confidence: 79
      },
      {
        lat: 28.7041, lng: 77.1025, city: 'New Delhi', state: 'Delhi',
        timestamp: daysAgo(13, 14), activity: 'Phone ping Connaught Place',
        source: 'Phone Tower', confidence: 85
      },
      {
        lat: 30.7333, lng: 76.7794, city: 'Chandigarh', state: 'Punjab',
        timestamp: daysAgo(11), activity: 'Toll record NH44',
        source: 'Toll', confidence: 98
      },
      {
        lat: 30.7333, lng: 76.7794, city: 'Chandigarh', state: 'Punjab',
        timestamp: daysAgo(10), activity: 'Meeting at Sector 17 market',
        source: 'CCTV', confidence: 83
      },
      {
        lat: 31.6340, lng: 74.8723, city: 'Amritsar', state: 'Punjab',
        timestamp: daysAgo(8), activity: 'Spotted near Golden Temple',
        source: 'CCTV', confidence: 77
      },
      {
        lat: 31.6340, lng: 74.8723, city: 'Amritsar', state: 'Punjab',
        timestamp: daysAgo(7), activity: 'Hotel stay under assumed identity',
        source: 'Hotel Record', confidence: 93
      },
      {
        lat: 31.6340, lng: 74.8723, city: 'Amritsar', state: 'Punjab',
        timestamp: daysAgo(5), activity: 'Meeting near Wagah border area',
        source: 'Informant', confidence: 88
      },
      {
        lat: 30.7333, lng: 76.7794, city: 'Chandigarh', state: 'Punjab',
        timestamp: daysAgo(2), activity: 'Return to Chandigarh',
        source: 'Phone Tower', confidence: 81
      },
      {
        lat: 28.7041, lng: 77.1025, city: 'New Delhi', state: 'Delhi',
        timestamp: daysAgo(0, 3), activity: 'Arrived Delhi; boarding denied at IGI',
        source: 'CCTV', confidence: 90
      },
    ]
  },

  // ─── TARGET 8: Kolkata → Bhubaneswar → Visakhapatnam ─────────────────────
  {
    id: 'TGT-008',
    alias: 'GHOST',
    fullName: 'Tanmay Rath',
    photoUrl: '',
    category: 'Cyber Crime',
    organization: 'DarkNet Collective',
    threatLevel: 'HIGH',
    status: 'Under Surveillance',
    lastSeen: daysAgo(2),
    knownAssociates: ['TGT-004'],
    notes: ['Specializes in social engineering attacks', 'Former IT professional'],
    tags: ['social-engineering', 'it-background', 'east-coast'],
    history: [
      {
        lat: 22.5726, lng: 88.3639, city: 'Kolkata', state: 'West Bengal',
        timestamp: daysAgo(13), activity: 'Cyber café session: initiated phishing campaign',
        source: 'Informant', confidence: 86
      },
      {
        lat: 22.5726, lng: 88.3639, city: 'Kolkata', state: 'West Bengal',
        timestamp: daysAgo(12, 8), activity: 'Toll record Bypass Road',
        source: 'Toll', confidence: 100
      },
      {
        lat: 20.2961, lng: 85.8245, city: 'Bhubaneswar', state: 'Odisha',
        timestamp: daysAgo(10), activity: 'Hotel check-in',
        source: 'Hotel Record', confidence: 94
      },
      {
        lat: 20.2961, lng: 85.8245, city: 'Bhubaneswar', state: 'Odisha',
        timestamp: daysAgo(9), activity: 'Meeting with local contact at old town',
        source: 'Informant', confidence: 72
      },
      {
        lat: 19.8135, lng: 85.8312, city: 'Puri', state: 'Odisha',
        timestamp: daysAgo(8), activity: 'Brief stop near Jagannath temple precinct',
        source: 'CCTV', confidence: 65
      },
      {
        lat: 17.6868, lng: 83.2185, city: 'Visakhapatnam', state: 'Andhra Pradesh',
        timestamp: daysAgo(6), activity: 'Port authority CCTV sighting',
        source: 'CCTV', confidence: 89
      },
      {
        lat: 17.6868, lng: 83.2185, city: 'Visakhapatnam', state: 'Andhra Pradesh',
        timestamp: daysAgo(5), activity: 'Phone ping near naval base area',
        source: 'Phone Tower', confidence: 83
      },
      {
        lat: 17.6868, lng: 83.2185, city: 'Visakhapatnam', state: 'Andhra Pradesh',
        timestamp: daysAgo(4), activity: 'Meeting with shipping broker',
        source: 'Informant', confidence: 78
      },
      {
        lat: 20.2961, lng: 85.8245, city: 'Bhubaneswar', state: 'Odisha',
        timestamp: daysAgo(2), activity: 'Return; airport departure lounge CCTV',
        source: 'CCTV', confidence: 91
      },
    ]
  },

  // ─── TARGET 9: Jaipur → Jodhpur → Bikaner ────────────────────────────────
  {
    id: 'TGT-009',
    alias: 'MIRAGE',
    fullName: 'Fatima Qureshi',
    photoUrl: '',
    category: 'Fugitive',
    organization: 'None (Individual)',
    threatLevel: 'MEDIUM',
    status: 'Lost Contact',
    lastSeen: daysAgo(6),
    knownAssociates: [],
    notes: ['Wanted for witness tampering in state murder case', 'Former paralegal'],
    tags: ['fugitive', 'witness-tampering', 'legal-background'],
    history: [
      {
        lat: 26.9124, lng: 75.7873, city: 'Jaipur', state: 'Rajasthan',
        timestamp: daysAgo(14), activity: 'Boarded sleeper bus to Jodhpur',
        source: 'CCTV', confidence: 90
      },
      {
        lat: 26.9124, lng: 75.7873, city: 'Jaipur', state: 'Rajasthan',
        timestamp: daysAgo(13, 10), activity: 'Phone ping near Amber Fort',
        source: 'Phone Tower', confidence: 88
      },
      {
        lat: 26.2389, lng: 73.0243, city: 'Jodhpur', state: 'Rajasthan',
        timestamp: daysAgo(12), activity: 'Checked into small guesthouse',
        source: 'Hotel Record', confidence: 95
      },
      {
        lat: 26.2389, lng: 73.0243, city: 'Jodhpur', state: 'Rajasthan',
        timestamp: daysAgo(11), activity: 'Toll record on way out of city',
        source: 'Toll', confidence: 100
      },
      {
        lat: 26.2389, lng: 73.0243, city: 'Jodhpur', state: 'Rajasthan',
        timestamp: daysAgo(10), activity: 'Last known phone call made',
        source: 'Phone Tower', confidence: 79
      },
      {
        lat: 28.0229, lng: 73.3119, city: 'Bikaner', state: 'Rajasthan',
        timestamp: daysAgo(8), activity: 'Vehicle spotted by informant at bus depot',
        source: 'Informant', confidence: 60
      },
      {
        lat: 28.0229, lng: 73.3119, city: 'Bikaner', state: 'Rajasthan',
        timestamp: daysAgo(6), activity: 'Last confirmed sighting; trail lost',
        source: 'Informant', confidence: 58
      },
    ]
  },

  // ─── TARGET 10: Mumbai → Nagpur → Raipur ─────────────────────────────────
  {
    id: 'TGT-010',
    alias: 'MANTIS',
    fullName: 'Suresh Kamble',
    photoUrl: '',
    category: 'Organized Crime',
    organization: 'Coastal Narco Network',
    threatLevel: 'HIGH',
    status: 'Captured',
    lastSeen: daysAgo(3, 16),
    knownAssociates: ['TGT-006'],
    notes: ['Captured in Nagpur; awaiting trial', 'Key operative in Coastal Narco Network logistics'],
    tags: ['captured', 'narco-logistics', 'awaiting-trial'],
    history: [
      {
        lat: 19.0760, lng: 72.8777, city: 'Mumbai', state: 'Maharashtra',
        timestamp: daysAgo(14), activity: 'Departure from Mumbai port area',
        source: 'Informant', confidence: 91
      },
      {
        lat: 19.0760, lng: 72.8777, city: 'Mumbai', state: 'Maharashtra',
        timestamp: daysAgo(13), activity: 'Toll record Eastern Express Highway',
        source: 'Toll', confidence: 100
      },
      {
        lat: 20.9374, lng: 77.7796, city: 'Amravati', state: 'Maharashtra',
        timestamp: daysAgo(11), activity: 'CCTV at highway dhaba',
        source: 'CCTV', confidence: 81
      },
      {
        lat: 21.1458, lng: 79.0882, city: 'Nagpur', state: 'Maharashtra',
        timestamp: daysAgo(9), activity: 'Hotel check-in; under surveillance',
        source: 'Hotel Record', confidence: 97
      },
      {
        lat: 21.1458, lng: 79.0882, city: 'Nagpur', state: 'Maharashtra',
        timestamp: daysAgo(8), activity: 'Meeting with local gang contact',
        source: 'Informant', confidence: 88
      },
      {
        lat: 21.1458, lng: 79.0882, city: 'Nagpur', state: 'Maharashtra',
        timestamp: daysAgo(7), activity: 'Under 24h physical surveillance',
        source: 'Informant', confidence: 99
      },
      {
        lat: 21.2514, lng: 81.6296, city: 'Raipur', state: 'Chhattisgarh',
        timestamp: daysAgo(5), activity: 'Attempted route to Raipur; intercepted',
        source: 'CCTV', confidence: 94
      },
      {
        lat: 21.1458, lng: 79.0882, city: 'Nagpur', state: 'Maharashtra',
        timestamp: daysAgo(3, 16), activity: 'Arrested at Nagpur ring road checkpoint',
        source: 'CCTV', confidence: 100
      },
    ]
  },
];

