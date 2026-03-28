export type DriverStatus = "active" | "inactive";

export interface Driver {
  id: string;
  name: string;
  employeeId: string;
  phone: string;
  status: DriverStatus;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  year: number;
  speedLimit: number;
  assignedDriverId?: string;
}

export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface SpeedSample {
  pointIndex: number;
  speed: number;
  timestamp: string;
  overspeed: boolean;
}

export type TripStatus = "completed" | "in_progress" | "cancelled";

export interface Trip {
  id: string;

  driverId: string;
  driverName: string;

  vehicleId: string;
  vehiclePlate: string;

  startTime: string;
  endTime?: string;

  status: TripStatus;

  startLocationName: string;
  endLocationName: string;

  startPoint: LatLngPoint;
  endPoint: LatLngPoint;

  /**
   * Full route polyline points used for realistic movement
   */
  route: LatLngPoint[];

  /**
   * Current index in the route array
   * - 0 = trip just started
   * - route.length - 1 = destination reached
   */
  currentRouteIndex: number;

  /**
   * Every recorded speed checkpoint
   * Used for overspeed markers and reporting
   */
  speedSamples: SpeedSample[];

  /**
   * Distance already covered by the driver (km)
   */
  distance: number;

  /**
   * Total route distance (km)
   */
  totalDistance: number;

  /**
   * Highest speed recorded during trip
   */
  maxSpeed: number;

  /**
   * Average speed for trip
   */
  avgSpeed: number;

  /**
   * Number of overspeed incidents
   */
  overspeedAlerts: number;

  /**
   * Current live speed (km/h)
   */
  currentSpeed: number;

  /**
   * Current live map position
   */
  latitude: number;
  longitude: number;
}

/* -------------------------------------------------------------------------- */
/*                                  DRIVERS                                    */
/* -------------------------------------------------------------------------- */

export const MOCK_DRIVERS: Driver[] = [
  {
    id: "drv-1",
    name: "Lamin Jallow",
    employeeId: "EMP-001",
    phone: "+220 301 1101",
    status: "active",
  },
  {
    id: "drv-2",
    name: "Fatou Camara",
    employeeId: "EMP-002",
    phone: "+220 301 1102",
    status: "active",
  },
  {
    id: "drv-3",
    name: "Musa Ceesay",
    employeeId: "EMP-003",
    phone: "+220 301 1103",
    status: "active",
  },
  {
    id: "drv-4",
    name: "Awa Bah",
    employeeId: "EMP-004",
    phone: "+220 301 1104",
    status: "inactive",
  },
];

/* -------------------------------------------------------------------------- */
/*                                  VEHICLES                                   */
/* -------------------------------------------------------------------------- */

export const MOCK_VEHICLES: Vehicle[] = [
  {
    id: "veh-1",
    plate: "BJL-1024",
    model: "Toyota Hilux",
    year: 2021,
    speedLimit: 60,
    assignedDriverId: "drv-1",
  },
  {
    id: "veh-2",
    plate: "KMC-4588",
    model: "Toyota Corolla",
    year: 2020,
    speedLimit: 50,
    assignedDriverId: "drv-2",
  },
  {
    id: "veh-3",
    plate: "SER-3307",
    model: "Nissan Navara",
    year: 2022,
    speedLimit: 70,
    assignedDriverId: "drv-3",
  },
  {
    id: "veh-4",
    plate: "BJL-9012",
    model: "Mitsubishi L200",
    year: 2019,
    speedLimit: 65,
  },
];

/* -------------------------------------------------------------------------- */
/*                               HELPER FUNCTIONS                              */
/* -------------------------------------------------------------------------- */

export function getDriverVehicle(driverId: string) {
  return MOCK_VEHICLES.find((vehicle) => vehicle.assignedDriverId === driverId);
}

/* -------------------------------------------------------------------------- */
/*                               STARTER MOCK TRIPS                            */
/* -------------------------------------------------------------------------- */
/**
 * NOTE:
 * These are only initial demo trips so the dashboard/reports
 * don't look empty on first load.
 *
 * Your Driver App + Live Tracking will create and update new trips in store.ts
 * using realistic route presets from routes.ts.
 */

export const MOCK_TRIPS: Trip[] = [
  {
    id: "trip-1",
    driverId: "drv-1",
    driverName: "Lamin Jallow",
    vehicleId: "veh-1",
    vehiclePlate: "BJL-1024",
    startTime: "2026-03-25T08:10:00Z",
    endTime: "2026-03-25T08:42:00Z",
    status: "completed",

    startLocationName: "Banjul Ferry Terminal",
    endLocationName: "Westfield Junction",

    startPoint: { lat: 13.4549, lng: -16.5775 },
    endPoint: { lat: 13.4537, lng: -16.6794 },

    route: [
      { lat: 13.4549, lng: -16.5775 },
      { lat: 13.4545, lng: -16.6020 },
      { lat: 13.4540, lng: -16.6285 },
      { lat: 13.4539, lng: -16.6530 },
      { lat: 13.4537, lng: -16.6794 },
    ],

    currentRouteIndex: 4,
    speedSamples: [
      {
        pointIndex: 1,
        speed: 38,
        timestamp: "2026-03-25T08:16:00Z",
        overspeed: false,
      },
      {
        pointIndex: 2,
        speed: 52,
        timestamp: "2026-03-25T08:22:00Z",
        overspeed: false,
      },
      {
        pointIndex: 3,
        speed: 64,
        timestamp: "2026-03-25T08:31:00Z",
        overspeed: true,
      },
      {
        pointIndex: 4,
        speed: 34,
        timestamp: "2026-03-25T08:41:00Z",
        overspeed: false,
      },
    ],

    distance: 11.4,
    totalDistance: 11.4,
    maxSpeed: 64,
    avgSpeed: 47,
    overspeedAlerts: 1,
    currentSpeed: 0,
    latitude: 13.4537,
    longitude: -16.6794,
  },

  {
    id: "trip-2",
    driverId: "drv-2",
    driverName: "Fatou Camara",
    vehicleId: "veh-2",
    vehiclePlate: "KMC-4588",
    startTime: "2026-03-25T09:05:00Z",
    status: "in_progress",

    startLocationName: "Brikama Garage",
    endLocationName: "Serekunda Market",

    startPoint: { lat: 13.2715, lng: -16.6498 },
    endPoint: { lat: 13.4382, lng: -16.6786 },

    route: [
      { lat: 13.2715, lng: -16.6498 },
      { lat: 13.3200, lng: -16.6600 },
      { lat: 13.3700, lng: -16.6705 },
      { lat: 13.4100, lng: -16.6750 },
      { lat: 13.4382, lng: -16.6786 },
    ],

    currentRouteIndex: 2,
    speedSamples: [
      {
        pointIndex: 1,
        speed: 42,
        timestamp: "2026-03-25T09:18:00Z",
        overspeed: false,
      },
      {
        pointIndex: 2,
        speed: 57,
        timestamp: "2026-03-25T09:29:00Z",
        overspeed: true,
      },
    ],

    distance: 11.2,
    totalDistance: 19.1,
    maxSpeed: 57,
    avgSpeed: 50,
    overspeedAlerts: 1,
    currentSpeed: 49,
    latitude: 13.3700,
    longitude: -16.6705,
  },

  {
    id: "trip-3",
    driverId: "drv-3",
    driverName: "Musa Ceesay",
    vehicleId: "veh-3",
    vehiclePlate: "SER-3307",
    startTime: "2026-03-24T14:00:00Z",
    endTime: "2026-03-24T15:12:00Z",
    status: "completed",

    startLocationName: "Kanifing Municipal Council",
    endLocationName: "Banjul International Airport",

    startPoint: { lat: 13.4433, lng: -16.6660 },
    endPoint: { lat: 13.3380, lng: -16.6522 },

    route: [
      { lat: 13.4433, lng: -16.6660 },
      { lat: 13.4200, lng: -16.6645 },
      { lat: 13.3900, lng: -16.6610 },
      { lat: 13.3600, lng: -16.6565 },
      { lat: 13.3380, lng: -16.6522 },
    ],

    currentRouteIndex: 4,
    speedSamples: [
      {
        pointIndex: 1,
        speed: 44,
        timestamp: "2026-03-24T14:18:00Z",
        overspeed: false,
      },
      {
        pointIndex: 2,
        speed: 61,
        timestamp: "2026-03-24T14:35:00Z",
        overspeed: false,
      },
      {
        pointIndex: 3,
        speed: 73,
        timestamp: "2026-03-24T14:51:00Z",
        overspeed: true,
      },
      {
        pointIndex: 4,
        speed: 39,
        timestamp: "2026-03-24T15:08:00Z",
        overspeed: false,
      },
    ],

    distance: 12.3,
    totalDistance: 12.3,
    maxSpeed: 73,
    avgSpeed: 54,
    overspeedAlerts: 1,
    currentSpeed: 0,
    latitude: 13.3380,
    longitude: -16.6522,
  },
];