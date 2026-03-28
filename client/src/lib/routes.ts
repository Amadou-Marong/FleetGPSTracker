import type { LatLngPoint } from "./data";

export interface RoutePreset {
  id: string;
  name: string;
  startLocationName: string;
  endLocationName: string;
  points: LatLngPoint[];
}

/**
 * Realistic route presets around Greater Banjul Area / West Coast Region, The Gambia
 *
 * NOTE:
 * These are simulated road-like checkpoint routes (not exact turn-by-turn map routing).
 * They are designed to look believable on the map and support smooth movement.
 */

export const ROUTE_PRESETS: RoutePreset[] = [
  {
    id: "route-banjul-westfield",
    name: "Banjul Ferry Terminal → Westfield Junction",
    startLocationName: "Banjul Ferry Terminal",
    endLocationName: "Westfield Junction",
    points: [
      { lat: 13.4549, lng: -16.5775 }, // Banjul Ferry Terminal
      { lat: 13.4547, lng: -16.5900 },
      { lat: 13.4545, lng: -16.6035 },
      { lat: 13.4543, lng: -16.6175 },
      { lat: 13.4541, lng: -16.6310 },
      { lat: 13.4539, lng: -16.6450 },
      { lat: 13.4538, lng: -16.6580 },
      { lat: 13.4537, lng: -16.6690 },
      { lat: 13.4537, lng: -16.6794 }, // Westfield Junction
    ],
  },

  {
    id: "route-brikama-serekunda",
    name: "Brikama Garage → Serekunda Market",
    startLocationName: "Brikama Garage",
    endLocationName: "Serekunda Market",
    points: [
      { lat: 13.2715, lng: -16.6498 }, // Brikama
      { lat: 13.2950, lng: -16.6540 },
      { lat: 13.3200, lng: -16.6590 },
      { lat: 13.3450, lng: -16.6640 },
      { lat: 13.3700, lng: -16.6690 },
      { lat: 13.3920, lng: -16.6730 },
      { lat: 13.4120, lng: -16.6760 },
      { lat: 13.4280, lng: -16.6778 },
      { lat: 13.4382, lng: -16.6786 }, // Serekunda Market
    ],
  },

  {
    id: "route-kmc-airport",
    name: "Kanifing Municipal Council → Banjul International Airport",
    startLocationName: "Kanifing Municipal Council",
    endLocationName: "Banjul International Airport",
    points: [
      { lat: 13.4433, lng: -16.6660 }, // KMC
      { lat: 13.4300, lng: -16.6650 },
      { lat: 13.4160, lng: -16.6635 },
      { lat: 13.4010, lng: -16.6615 },
      { lat: 13.3860, lng: -16.6595 },
      { lat: 13.3710, lng: -16.6570 },
      { lat: 13.3560, lng: -16.6548 },
      { lat: 13.3450, lng: -16.6535 },
      { lat: 13.3380, lng: -16.6522 }, // Airport
    ],
  },

  {
    id: "route-bakau-banjul",
    name: "Bakau Cape Point → Banjul Albert Market",
    startLocationName: "Bakau Cape Point",
    endLocationName: "Albert Market, Banjul",
    points: [
      { lat: 13.4740, lng: -16.6690 }, // Bakau / Cape Point area
      { lat: 13.4700, lng: -16.6640 },
      { lat: 13.4660, lng: -16.6570 },
      { lat: 13.4610, lng: -16.6480 },
      { lat: 13.4580, lng: -16.6380 },
      { lat: 13.4560, lng: -16.6250 },
      { lat: 13.4552, lng: -16.6100 },
      { lat: 13.4548, lng: -16.5950 },
      { lat: 13.4545, lng: -16.5830 },
      { lat: 13.4542, lng: -16.5755 }, // Albert Market area
    ],
  },

  {
    id: "route-kotu-airport",
    name: "Kotu Traffic Lights → Banjul International Airport",
    startLocationName: "Kotu Traffic Lights",
    endLocationName: "Banjul International Airport",
    points: [
      { lat: 13.4568, lng: -16.7132 }, // Kotu
      { lat: 13.4450, lng: -16.7050 },
      { lat: 13.4320, lng: -16.6950 },
      { lat: 13.4180, lng: -16.6850 },
      { lat: 13.4040, lng: -16.6750 },
      { lat: 13.3890, lng: -16.6660 },
      { lat: 13.3740, lng: -16.6595 },
      { lat: 13.3580, lng: -16.6555 },
      { lat: 13.3450, lng: -16.6535 },
      { lat: 13.3380, lng: -16.6522 }, // Airport
    ],
  },

  {
    id: "route-tallinding-latrikunda",
    name: "Tallinding Buffer Zone → Latrikunda Sabiji",
    startLocationName: "Tallinding Buffer Zone",
    endLocationName: "Latrikunda Sabiji",
    points: [
      { lat: 13.4415, lng: -16.6135 }, // Tallinding
      { lat: 13.4430, lng: -16.6260 },
      { lat: 13.4440, lng: -16.6390 },
      { lat: 13.4445, lng: -16.6510 },
      { lat: 13.4450, lng: -16.6630 },
      { lat: 13.4452, lng: -16.6740 },
      { lat: 13.4455, lng: -16.6850 },
      { lat: 13.4460, lng: -16.6950 },
      { lat: 13.4465, lng: -16.7045 }, // Latrikunda / Sabiji direction
    ],
  },

  {
    id: "route-serrekunda-bakau",
    name: "Serekunda Market → Bakau Newtown",
    startLocationName: "Serekunda Market",
    endLocationName: "Bakau Newtown",
    points: [
      { lat: 13.4382, lng: -16.6786 }, // Serekunda Market
      { lat: 13.4440, lng: -16.6765 },
      { lat: 13.4490, lng: -16.6740 },
      { lat: 13.4540, lng: -16.6715 },
      { lat: 13.4590, lng: -16.6695 },
      { lat: 13.4635, lng: -16.6685 },
      { lat: 13.4675, lng: -16.6680 },
      { lat: 13.4705, lng: -16.6678 }, // Bakau Newtown direction
    ],
  },

  {
    id: "route-airport-brusubi",
    name: "Banjul International Airport → Brusubi Turntable",
    startLocationName: "Banjul International Airport",
    endLocationName: "Brusubi Turntable",
    points: [
      { lat: 13.3380, lng: -16.6522 }, // Airport
      { lat: 13.3520, lng: -16.6560 },
      { lat: 13.3670, lng: -16.6610 },
      { lat: 13.3820, lng: -16.6670 },
      { lat: 13.3970, lng: -16.6740 },
      { lat: 13.4120, lng: -16.6820 },
      { lat: 13.4260, lng: -16.6905 },
      { lat: 13.4385, lng: -16.6995 },
      { lat: 13.4470, lng: -16.7060 }, // Brusubi / Turntable area
    ],
  },

  {
    id: "route-gnpc-ports",
    name: "GNPC Office, Brusubi Turntable → The Gambia Ports Authority",
    startLocationName: "GNPC Office, Brusubi Turntable",
    endLocationName: "The Gambia Ports Authority",
    points: [
      { lat: 13.4470, lng: -16.7060 },
      { lat: 13.4460, lng: -16.6950 },
      { lat: 13.4452, lng: -16.6840 },
      { lat: 13.4445, lng: -16.6720 },
      { lat: 13.4440, lng: -16.6600 },
      { lat: 13.4438, lng: -16.6470 },
      { lat: 13.4436, lng: -16.6330 },
      { lat: 13.4434, lng: -16.6180 },
      { lat: 13.4432, lng: -16.6020 },
      { lat: 13.4431, lng: -16.5880 },
      { lat: 13.443119, lng: -16.5741276 },
    ],
  },

  {
    id: "route-ports-gnpc",
    name: "The Gambia Ports Authority → GNPC Office, Brusubi Turntable",
    startLocationName: "The Gambia Ports Authority",
    endLocationName: "GNPC Office, Brusubi Turntable",
    points: [
      { lat: 13.443119, lng: -16.5741276 },
      { lat: 13.4431, lng: -16.5880 },
      { lat: 13.4432, lng: -16.6020 },
      { lat: 13.4434, lng: -16.6180 },
      { lat: 13.4436, lng: -16.6330 },
      { lat: 13.4438, lng: -16.6470 },
      { lat: 13.4440, lng: -16.6600 },
      { lat: 13.4445, lng: -16.6720 },
      { lat: 13.4452, lng: -16.6840 },
      { lat: 13.4460, lng: -16.6950 },
      { lat: 13.4470, lng: -16.7060 },
    ],
  },

];

/* -------------------------------------------------------------------------- */
/*                               HELPER FUNCTIONS                              */
/* -------------------------------------------------------------------------- */

/**
 * Get a route preset by ID
 */
export function getRoute(routeId: string) {
  return ROUTE_PRESETS.find((route) => route.id === routeId);
}

/**
 * Return all unique start locations from route presets
 * Useful if later you want separate "Start" dropdown
 */
export function getUniqueStartLocations() {
  return Array.from(
    new Set(ROUTE_PRESETS.map((route) => route.startLocationName))
  );
}

/**
 * Return all unique end locations from route presets
 * Useful if later you want separate "End" dropdown
 */
export function getUniqueEndLocations() {
  return Array.from(
    new Set(ROUTE_PRESETS.map((route) => route.endLocationName))
  );
}

/**
 * Find routes that match selected start + end
 * Useful if later you want the driver to select start and end independently
 */
export function getRoutesByStartEnd(startLocationName: string, endLocationName: string) {
  return ROUTE_PRESETS.filter(
    (route) =>
      route.startLocationName === startLocationName &&
      route.endLocationName === endLocationName
  );
}