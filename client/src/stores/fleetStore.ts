import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MOCK_DRIVERS, MOCK_VEHICLES, type LatLngPoint } from "@/lib/data";
import { getRoute } from "@/lib/routes";

export type VehicleStatus = "available" | "assigned" | "maintenance";
export type DriverStatus = "active" | "inactive";
export type VehicleLiveStatus = "idle" | "moving" | "overspeed";

export interface Driver {
  id: string;
  name: string;
  employeeId?: string;
  phone?: string;
  status?: DriverStatus;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  year: number;
  speedLimit: number;
  status?: VehicleStatus;
  assignedDriverId?: string;
}

export interface LiveVehicle {
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;

  routeId: string;
  routeName: string;
  startLocationName: string;
  endLocationName: string;
  route: LatLngPoint[];
  routeIndex: number;

  lat: number;
  lng: number;
  heading: number;

  speed: number;
  speedLimit: number;
  distanceKm: number;
  mileageKm: number;
  overspeedAlerts: number;
  maxSpeed: number;

  status: VehicleLiveStatus;
  startedAt?: string;
  endedAt?: string;

  // realism state
  stopTicksRemaining?: number;
  lastBehavior?: "normal" | "traffic" | "stop" | "overspeed" | "recovery";
}

export interface TripRecord {
  id: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  routeId: string;
  routeName: string;
  startLocationName: string;
  endLocationName: string;
  distanceKm: number;
  mileageKm: number;
  overspeedAlerts: number;
  maxSpeed: number;
  averageSpeed: number;
  startedAt: string;
  endedAt?: string;
  status: "completed" | "stopped";
}

type ActiveIntervals = Record<string, ReturnType<typeof setInterval> | undefined>;

interface FleetStore {
  drivers: Record<string, Driver>;
  vehicles: Record<string, Vehicle>;
  liveVehicles: Record<string, LiveVehicle>;
  tripHistory: TripRecord[];
  activeIntervals: ActiveIntervals;

  addDriver: (driver: Driver) => void;
  updateDriver: (driverId: string, updates: Partial<Driver>) => void;
  removeDriver: (driverId: string) => void;

  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (vehicleId: string, updates: Partial<Vehicle>) => void;
  removeVehicle: (vehicleId: string) => void;

  assignDriverToVehicle: (vehicleId: string, driverId: string) => void;
  unassignDriverFromVehicle: (vehicleId: string) => void;
  getAssignedVehicleForDriver: (driverId: string) => Vehicle | undefined;

  startTrip: (driverId: string, routeId: string) => Promise<boolean>;
  stopTrip: (driverId: string) => void;
  clearTrip: (driverId: string) => void;
  tickVehicle: (driverId: string) => void;
  getVehicle: (driverId: string) => LiveVehicle | undefined;

  clearTripHistory: () => void;
  resumeActiveTrips: () => void;
  resetForLogout: () => void;
}

// ==========================
// Helpers
// ==========================
function calculateHeading(from: LatLngPoint, to: LatLngPoint) {
  const dy = to.lat - from.lat;
  const dx = to.lng - from.lng;
  const angle = Math.atan2(dx, dy) * (180 / Math.PI);
  return (angle + 360) % 360;
}

function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Realistic driving behavior:
 * - normal cruising most of the time
 * - traffic jam sometimes
 * - brief stop sometimes
 * - slight overspeed occasionally
 * - recovery after overspeed
 */
function getRealisticDrivingState(live: LiveVehicle) {
  const speedLimit = live.speedLimit;
  const roll = Math.random();

  // If vehicle is currently in a stop state, continue stopping
  if ((live.stopTicksRemaining ?? 0) > 0) {
    return {
      speed: 0,
      behavior: "stop" as const,
      stopTicksRemaining: (live.stopTicksRemaining ?? 1) - 1,
    };
  }

  // After overspeed, driver tries to recover
  if (live.lastBehavior === "overspeed" && roll < 0.55) {
    return {
      speed: clamp(
        Math.round(speedLimit * (0.72 + Math.random() * 0.12)),
        20,
        speedLimit - 2
      ),
      behavior: "recovery" as const,
      stopTicksRemaining: 0,
    };
  }

  // Rare brief stop (e.g. traffic light / pickup / congestion)
  if (roll < 0.08) {
    return {
      speed: 0,
      behavior: "stop" as const,
      stopTicksRemaining: Math.floor(Math.random() * 2) + 1, // 1–2 more ticks after this
    };
  }

  // Traffic jam / slow section
  if (roll < 0.28) {
    return {
      speed: clamp(
        Math.round(8 + Math.random() * 18), // 8–26 km/h
        5,
        Math.max(12, speedLimit - 30)
      ),
      behavior: "traffic" as const,
      stopTicksRemaining: 0,
    };
  }

  // Occasional slight overspeed (not too frequent)
  if (roll < 0.38) {
    return {
      speed: clamp(
        Math.round(speedLimit + 3 + Math.random() * 8), // +3 to +11
        speedLimit + 1,
        speedLimit + 12
      ),
      behavior: "overspeed" as const,
      stopTicksRemaining: 0,
    };
  }

  // Normal cruising
  return {
    speed: clamp(
      Math.round(speedLimit * (0.72 + Math.random() * 0.22)), // ~72%–94%
      20,
      speedLimit - 1
    ),
    behavior: "normal" as const,
    stopTicksRemaining: 0,
  };
}

function buildTripRecord(
  live: LiveVehicle,
  status: "completed" | "stopped"
): TripRecord {
  const endedAt = live.endedAt ?? new Date().toISOString();

  const durationHours =
    live.startedAt
      ? Math.max(
          1 / 3600,
          (new Date(endedAt).getTime() - new Date(live.startedAt).getTime()) /
            (1000 * 60 * 60)
        )
      : 1 / 3600;

  const avgSpeed = live.distanceKm / durationHours;

  return {
    id: crypto.randomUUID(),
    driverId: live.driverId,
    driverName: live.driverName,
    vehicleId: live.vehicleId,
    vehiclePlate: live.vehiclePlate,
    vehicleModel: live.vehicleModel,
    routeId: live.routeId,
    routeName: live.routeName,
    startLocationName: live.startLocationName,
    endLocationName: live.endLocationName,
    distanceKm: Number(live.distanceKm.toFixed(2)),
    mileageKm: Number(live.mileageKm.toFixed(2)),
    overspeedAlerts: live.overspeedAlerts,
    maxSpeed: live.maxSpeed,
    averageSpeed: Number(avgSpeed.toFixed(2)),
    startedAt: live.startedAt || new Date().toISOString(),
    endedAt,
    status,
  };
}

function buildInitialDrivers(): Record<string, Driver> {
  return Object.fromEntries(
    MOCK_DRIVERS.map((d) => [
      d.id,
      {
        id: d.id,
        name: d.name,
        employeeId: d.employeeId,
        phone: d.phone,
        status: d.status ?? "active",
      },
    ])
  );
}

function buildInitialVehicles(): Record<string, Vehicle> {
  return Object.fromEntries(
    MOCK_VEHICLES.map((v) => [
      v.id,
      {
        id: v.id,
        plate: v.plate,
        model: v.model,
        year: v.year,
        speedLimit: v.speedLimit,
        status: v.status ?? (v.assignedDriverId ? "assigned" : "available"),
        assignedDriverId: v.assignedDriverId,
      },
    ])
  );
}

// ==========================
// Store
// ==========================
export const useFleetStore = create<FleetStore>()(
  persist(
    (set, get) => {
      const clearDriverInterval = (driverId: string) => {
        const timer = get().activeIntervals[driverId];
        if (timer) clearInterval(timer);
      };

      const finalizeTrip = (
        driverId: string,
        status: "completed" | "stopped"
      ) => {
        const live = get().liveVehicles[driverId];
        if (!live) return;

        clearDriverInterval(driverId);

        const finalized: LiveVehicle = {
          ...live,
          speed: 0,
          status: "idle",
          endedAt: new Date().toISOString(),
        };

        const record = buildTripRecord(finalized, status);

        set((state) => {
          const nextLiveVehicles = { ...state.liveVehicles };
          delete nextLiveVehicles[driverId];

          const nextActiveIntervals = { ...state.activeIntervals };
          delete nextActiveIntervals[driverId];

          return {
            liveVehicles: nextLiveVehicles,
            tripHistory: [record, ...state.tripHistory],
            activeIntervals: nextActiveIntervals,
          };
        });
      };

      return {
        drivers: buildInitialDrivers(),
        vehicles: buildInitialVehicles(),
        liveVehicles: {},
        tripHistory: [],
        activeIntervals: {},

        // ---------------- Drivers ----------------
        addDriver: (driver) =>
          set((state) => ({
            drivers: {
              ...state.drivers,
              [driver.id]: {
                ...driver,
                status: driver.status ?? "active",
              },
            },
          })),

        updateDriver: (driverId, updates) =>
          set((state) => {
            if (!state.drivers[driverId]) return state;

            return {
              drivers: {
                ...state.drivers,
                [driverId]: {
                  ...state.drivers[driverId],
                  ...updates,
                },
              },
            };
          }),

        removeDriver: (driverId) =>
          set((state) => {
            clearDriverInterval(driverId);

            const nextDrivers = { ...state.drivers };
            delete nextDrivers[driverId];

            const nextVehicles = Object.fromEntries(
              Object.entries(state.vehicles).map(([id, vehicle]) => [
                id,
                vehicle.assignedDriverId === driverId
                  ? {
                      ...vehicle,
                      assignedDriverId: undefined,
                      status:
                        vehicle.status === "maintenance"
                          ? "maintenance"
                          : "available",
                    }
                  : vehicle,
              ])
            );

            const nextLiveVehicles = { ...state.liveVehicles };
            delete nextLiveVehicles[driverId];

            const nextActiveIntervals = { ...state.activeIntervals };
            delete nextActiveIntervals[driverId];

            return {
              drivers: nextDrivers,
              vehicles: nextVehicles,
              liveVehicles: nextLiveVehicles,
              activeIntervals: nextActiveIntervals,
            };
          }),

        // ---------------- Vehicles ----------------
        addVehicle: (vehicle) =>
          set((state) => ({
            vehicles: {
              ...state.vehicles,
              [vehicle.id]: {
                ...vehicle,
                status:
                  vehicle.status ??
                  (vehicle.assignedDriverId ? "assigned" : "available"),
              },
            },
          })),

        updateVehicle: (vehicleId, updates) =>
          set((state) => {
            if (!state.vehicles[vehicleId]) return state;

            return {
              vehicles: {
                ...state.vehicles,
                [vehicleId]: {
                  ...state.vehicles[vehicleId],
                  ...updates,
                },
              },
            };
          }),

        removeVehicle: (vehicleId) =>
          set((state) => {
            const nextVehicles = { ...state.vehicles };
            delete nextVehicles[vehicleId];

            const nextLiveVehicles = { ...state.liveVehicles };
            const nextActiveIntervals = { ...state.activeIntervals };

            Object.entries(state.liveVehicles).forEach(([driverId, live]) => {
              if (live.vehicleId === vehicleId) {
                const timer = state.activeIntervals[driverId];
                if (timer) clearInterval(timer);

                delete nextLiveVehicles[driverId];
                delete nextActiveIntervals[driverId];
              }
            });

            return {
              vehicles: nextVehicles,
              liveVehicles: nextLiveVehicles,
              activeIntervals: nextActiveIntervals,
            };
          }),

        // ---------------- Assignment ----------------
        assignDriverToVehicle: (vehicleId, driverId) =>
          set((state) => {
            const driver = state.drivers[driverId];
            const vehicle = state.vehicles[vehicleId];

            if (!driver || !vehicle) return state;
            if ((driver.status ?? "active") !== "active") return state;

            const nextVehicles: Record<string, Vehicle> = { ...state.vehicles };

            Object.values(nextVehicles).forEach((v) => {
              if (v.assignedDriverId === driverId && v.id !== vehicleId) {
                nextVehicles[v.id] = {
                  ...v,
                  assignedDriverId: undefined,
                  status:
                    v.status === "maintenance" ? "maintenance" : "available",
                };
              }
            });

            nextVehicles[vehicleId] = {
              ...vehicle,
              assignedDriverId: driverId,
              status:
                vehicle.status === "maintenance" ? "maintenance" : "assigned",
            };

            return { vehicles: nextVehicles };
          }),

        unassignDriverFromVehicle: (vehicleId) =>
          set((state) => {
            const vehicle = state.vehicles[vehicleId];
            if (!vehicle) return state;

            const hasLiveTrip = Object.values(state.liveVehicles).some(
              (live) => live.vehicleId === vehicleId
            );

            if (hasLiveTrip) return state;

            return {
              vehicles: {
                ...state.vehicles,
                [vehicleId]: {
                  ...vehicle,
                  assignedDriverId: undefined,
                  status:
                    vehicle.status === "maintenance"
                      ? "maintenance"
                      : "available",
                },
              },
            };
          }),

        getAssignedVehicleForDriver: (driverId) => {
          return Object.values(get().vehicles).find(
            (v) => v.assignedDriverId === driverId
          );
        },

        // ---------------- Trips ----------------
        getVehicle: (driverId) => get().liveVehicles[driverId],

        startTrip: async (driverId, routeId) => {
          const existingTimer = get().activeIntervals[driverId];
          if (existingTimer) clearInterval(existingTimer);

          const driver = get().drivers[driverId];
          const vehicle = get().getAssignedVehicleForDriver(driverId);

          if (!driver || !vehicle) {
            console.warn("Driver or assigned vehicle not found");
            return false;
          }

          if ((driver.status ?? "active") !== "active") {
            console.warn("Inactive driver cannot start trip");
            return false;
          }

          if (vehicle.status === "maintenance") {
            console.warn("Vehicle in maintenance cannot start trip");
            return false;
          }

          const existingLive = get().liveVehicles[driverId];
          if (existingLive) {
            console.warn("Driver already has an active trip");
            return false;
          }

          const vehicleAlreadyInUse = Object.values(get().liveVehicles).some(
            (live) => live.vehicleId === vehicle.id && live.driverId !== driverId
          );

          if (vehicleAlreadyInUse) {
            console.warn("Assigned vehicle is already in use");
            return false;
          }

          const selectedRoute = getRoute(routeId);
          if (!selectedRoute || selectedRoute.points.length < 2) {
            console.warn("Invalid route");
            return false;
          }

          const start = selectedRoute.points[0];
          const end = selectedRoute.points[selectedRoute.points.length - 1];

          const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

          try {
            const res = await fetch(osrmUrl);

            if (!res.ok) {
              console.error("OSRM request failed", res.status);
              return false;
            }

            const data = await res.json();

            if (!data.routes || !data.routes[0]) {
              console.warn("No OSRM route found");
              return false;
            }

            const roadRoute: LatLngPoint[] = data.routes[0].geometry.coordinates.map(
              ([lng, lat]: [number, number]) => ({ lat, lng })
            );

            if (roadRoute.length < 2) {
              console.warn("Route too short");
              return false;
            }

            const initial: LiveVehicle = {
              driverId,
              driverName: driver.name,
              vehicleId: vehicle.id,
              vehiclePlate: vehicle.plate,
              vehicleModel: `${vehicle.model} ${vehicle.year}`,

              routeId: selectedRoute.id,
              routeName: selectedRoute.name,
              startLocationName: selectedRoute.startLocationName,
              endLocationName: selectedRoute.endLocationName,
              route: roadRoute,
              routeIndex: 0,

              lat: roadRoute[0].lat,
              lng: roadRoute[0].lng,
              heading: calculateHeading(roadRoute[0], roadRoute[1]),

              speed: 0,
              speedLimit: vehicle.speedLimit,
              distanceKm: 0,
              mileageKm: 0,
              overspeedAlerts: 0,
              maxSpeed: 0,

              status: "moving",
              startedAt: new Date().toISOString(),
              endedAt: undefined,

              stopTicksRemaining: 0,
              lastBehavior: "normal",
            };

            const interval = setInterval(() => get().tickVehicle(driverId), 2000);

            set((state) => ({
              liveVehicles: {
                ...state.liveVehicles,
                [driverId]: initial,
              },
              activeIntervals: {
                ...state.activeIntervals,
                [driverId]: interval,
              },
            }));

            return true;
          } catch (err) {
            console.error("Error fetching road route from OSRM", err);
            return false;
          }
        },

        tickVehicle: (driverId) => {
          const live = get().liveVehicles[driverId];
          if (!live) return;

          const { route, routeIndex } = live;

          if (routeIndex >= route.length - 1) {
            finalizeTrip(driverId, "completed");
            return;
          }

          const drivingState = getRealisticDrivingState(live);
          const newSpeed = drivingState.speed;
          const isOverspeed = newSpeed > live.speedLimit;

          // If stopped, don't move the marker — avoids jitter and looks realistic
          if (newSpeed === 0) {
            const updatedStopped: LiveVehicle = {
              ...live,
              speed: 0,
              status: "idle",
              stopTicksRemaining: drivingState.stopTicksRemaining,
              lastBehavior: drivingState.behavior,
            };

            set((state) => ({
              liveVehicles: {
                ...state.liveVehicles,
                [driverId]: updatedStopped,
              },
            }));

            return;
          }

          // Determine how many route points to advance based on speed
          // Higher speed = move more points, but still capped for stability
          const stepSize =
            newSpeed < 20 ? 1 :
            newSpeed < 40 ? 2 :
            newSpeed < 70 ? 3 :
            newSpeed < 95 ? 4 : 5;

          const nextIndex = Math.min(routeIndex + stepSize, route.length - 1);

          const current = route[routeIndex];
          const next = route[nextIndex];

          // Sum distance across stepped segments for more realistic total
          let segmentDistance = 0;
          for (let i = routeIndex; i < nextIndex; i++) {
            const a = route[i];
            const b = route[i + 1];
            segmentDistance += haversineDistanceKm(a.lat, a.lng, b.lat, b.lng);
          }

          const heading =
            nextIndex < route.length
              ? calculateHeading(current, next)
              : live.heading;

          const updated: LiveVehicle = {
            ...live,
            lat: next.lat,
            lng: next.lng,
            heading,
            routeIndex: nextIndex,
            speed: newSpeed,
            distanceKm: +(live.distanceKm + segmentDistance).toFixed(2),
            mileageKm: +(live.mileageKm + segmentDistance).toFixed(2),
            overspeedAlerts: live.overspeedAlerts + (isOverspeed ? 1 : 0),
            maxSpeed: Math.max(live.maxSpeed, newSpeed),
            status: isOverspeed ? "overspeed" : "moving",
            stopTicksRemaining: drivingState.stopTicksRemaining,
            lastBehavior: drivingState.behavior,
          };

          if (nextIndex >= route.length - 1) {
            set((state) => ({
              liveVehicles: {
                ...state.liveVehicles,
                [driverId]: {
                  ...updated,
                  speed: 0,
                  status: "idle",
                },
              },
            }));

            finalizeTrip(driverId, "completed");
            return;
          }

          set((state) => ({
            liveVehicles: {
              ...state.liveVehicles,
              [driverId]: updated,
            },
          }));
        },

        stopTrip: (driverId) => {
          finalizeTrip(driverId, "stopped");
        },

        clearTrip: (driverId) => {
          clearDriverInterval(driverId);

          set((state) => {
            const nextLiveVehicles = { ...state.liveVehicles };
            delete nextLiveVehicles[driverId];

            const nextActiveIntervals = { ...state.activeIntervals };
            delete nextActiveIntervals[driverId];

            return {
              liveVehicles: nextLiveVehicles,
              activeIntervals: nextActiveIntervals,
            };
          });
        },

        // ---------------- Reports ----------------
        clearTripHistory: () => set({ tripHistory: [] }),

        // ---------------- Rehydrate intervals ----------------
        resumeActiveTrips: () => {
          const state = get();

          Object.entries(state.liveVehicles).forEach(([driverId, live]) => {
            const hasTimer = state.activeIntervals[driverId];
            const isActive =
              live.status === "moving" ||
              live.status === "overspeed" ||
              live.status === "idle";

            if (isActive && !hasTimer && live.routeIndex < live.route.length - 1) {
              const interval = setInterval(() => get().tickVehicle(driverId), 2000);

              set((current) => ({
                activeIntervals: {
                  ...current.activeIntervals,
                  [driverId]: interval,
                },
              }));
            }
          });
        },

        // ---------------- Logout cleanup ----------------
        resetForLogout: () => {
          const state = get();

          Object.values(state.activeIntervals).forEach((timer) => {
            if (timer) clearInterval(timer);
          });

          set({
            drivers: buildInitialDrivers(),
            vehicles: buildInitialVehicles(),
            liveVehicles: {},
            tripHistory: [],
            activeIntervals: {},
          });
        },
      };
    },
    {
      name: "fleet-store-v3",
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        drivers: state.drivers,
        vehicles: state.vehicles,
        liveVehicles: state.liveVehicles,
        tripHistory: state.tripHistory,
      }),

      onRehydrateStorage: () => (state) => {
        state?.resumeActiveTrips();
      },
    }
  )
);