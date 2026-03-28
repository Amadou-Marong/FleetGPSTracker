import { useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFleetStore } from "@/stores/fleetStore";


const truckIcon = new L.DivIcon({
  html: `
    <div style="
      width: 18px;
      height: 18px;
      background: #2563eb;  /* moving = blue */
      border: 3px solid white;
      border-radius: 9999px;
      box-shadow: 0 0 0 2px rgba(37,99,235,0.35);
    "></div>
  `,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const selectedTruckIcon = new L.DivIcon({
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background: #dc2626;  /* overspeed / selected = red */
      border: 3px solid white;
      border-radius: 9999px;
      box-shadow: 0 0 0 3px rgba(220,38,38,0.25);
    "></div>
  `,
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// NEW: Idle / stopped vehicle icon
const idleTruckIcon = new L.DivIcon({
  html: `
    <div style="
      width: 18px;
      height: 18px;
      background: #facc15;  /* yellow for idle/stopped */
      border: 3px solid white;
      border-radius: 9999px;
      box-shadow: 0 0 0 2px rgba(250,204,21,0.35);
    "></div>
  `,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function LiveTracking() {
  const liveVehicles = useFleetStore((s) => s.liveVehicles);
  // const vehicles = useMemo(() => Object.values(liveVehicles), [liveVehicles]);

  // const vehicles = useMemo(
  //   () =>
  //     Object.values(liveVehicles).filter(
  //       (v) => v.status === "moving" || v.status === "overspeed"
  //     ),
  //   [liveVehicles]
  // );

  const vehicles = useMemo(
    () =>
      Object.values(liveVehicles).filter(
        (v) => v.route && v.route.length > 0 && v.status !== "completed"
      ),
    [liveVehicles]
  );

  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  const selectedVehicle =
    vehicles.find((v) => v.driverId === selectedDriverId) ?? vehicles[0] ?? null;

  const mapCenter: [number, number] = selectedVehicle
    ? [selectedVehicle.lat, selectedVehicle.lng]
    : [13.4433, -16.6660]; // KMC / Kanifing area fallback

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Live Tracking</h1>
        <p className="text-sm text-muted-foreground">
          Monitor active driver routes, overspeeding, and mileage in real time.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* MAP */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden rounded-2xl">
            <CardHeader>
              <CardTitle>Fleet Map</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[620px] w-full overflow-hidden rounded-xl border">
                <MapContainer
                  center={mapCenter}
                  zoom={11}
                  scrollWheelZoom
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  />

                  {vehicles.map((vehicle) => {
                    const completedPath = vehicle.route.slice(0, vehicle.routeIndex + 1);
                    const fullPath = vehicle.route;

                    return (
                      <div key={vehicle.driverId}>
                        {/* Full planned route */}
                        <Polyline
                          positions={fullPath.map((p) => [p.lat, p.lng] as [number, number])}
                          pathOptions={{
                            color: "#94a3b8",
                            weight: 4,
                            opacity: 0.6,
                          }}
                        />

                        {/* Completed trail */}
                        {/* <Polyline
                          positions={completedPath.map((p) => [p.lat, p.lng] as [number, number])}
                          pathOptions={{
                            color:
                              vehicle.status === "overspeed"
                                ? "#dc2626"
                                : vehicle.status === "completed"
                                ? "#16a34a"
                                : "#2563eb",
                            weight: 6,
                            opacity: 0.95,
                          }}
                        /> */}

                        <Polyline
                          positions={completedPath.map((p) => [p.lat, p.lng] as [number, number])}
                          pathOptions={{
                            color:
                              vehicle.status === "overspeed"
                                ? "#dc2626" // red for overspeed
                                : vehicle.status === "moving"
                                ? "#2563eb" // blue for normal moving
                                : "#facc15", // yellow for idle/stopped in-progress trips
                            weight: 6,
                            opacity: 0.95,
                          }}
                        />

                        {/* Live marker */}
                        {/* <Marker
                          position={[vehicle.lat, vehicle.lng]}
                          icon={
                            selectedVehicle?.driverId === vehicle.driverId
                              ? selectedTruckIcon
                              : truckIcon
                          }
                          eventHandlers={{
                            click: () => setSelectedDriverId(vehicle.driverId),
                          }}
                        >
                          <Popup>
                            <div className="space-y-1 text-sm">
                              <div className="font-semibold">{vehicle.driverName}</div>
                              <div>{vehicle.vehiclePlate}</div>
                              <div>
                                {vehicle.startLocationName} → {vehicle.endLocationName}
                              </div>
                              <div>Speed: {vehicle.speed} km/h</div>
                              <div>Mileage: {vehicle.mileageKm.toFixed(2)} km</div>
                              <div>Overspeed Alerts: {vehicle.overspeedAlerts}</div>
                              <div>Status: {vehicle.status}</div>
                            </div>
                          </Popup>
                        </Marker> */}

                        <Marker
                          position={[vehicle.lat, vehicle.lng]}
                          icon={
                            selectedVehicle?.driverId === vehicle.driverId
                              ? selectedTruckIcon
                              : vehicle.status === "overspeed"
                              ? selectedTruckIcon
                              : vehicle.status === "moving"
                              ? truckIcon
                              : idleTruckIcon
                          }
                          eventHandlers={{
                            click: () => setSelectedDriverId(vehicle.driverId),
                          }}
                        >
                          <Popup>
                            <div className="space-y-1 text-sm">
                              <div className="font-semibold">{vehicle.driverName}</div>
                              <div>{vehicle.vehiclePlate}</div>
                              <div>
                                {vehicle.startLocationName} → {vehicle.endLocationName}
                              </div>
                              <div>Speed: {vehicle.speed} km/h</div>
                              <div>Mileage: {vehicle.mileageKm.toFixed(2)} km</div>
                              <div>Overspeed Alerts: {vehicle.overspeedAlerts}</div>
                              <div>Status: {vehicle.status}</div>
                            </div>
                          </Popup>
                        </Marker>
                      </div>
                    );
                  })}
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Active Vehicles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {vehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No live trips yet. Start a trip from the Driver App.
                </p>
              ) : (
                vehicles.map((vehicle) => {
                  const isSelected = selectedVehicle?.driverId === vehicle.driverId;

                  return (
                    <button
                      key={vehicle.driverId}
                      onClick={() => setSelectedDriverId(vehicle.driverId)}
                      className={`w-full rounded-xl border p-4 text-left transition hover:bg-muted/50 ${
                        isSelected ? "border-primary bg-muted/40" : "border-border"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="font-medium">{vehicle.driverName}</div>
                        {/* <Badge
                          variant={
                            vehicle.status === "overspeed"
                              ? "destructive"
                              : vehicle.status === "completed"
                              ? "secondary"
                              : "default"
                          }
                        >
                          {vehicle.status}
                        </Badge> */}

                        <Badge
                          variant={
                            vehicle.status === "overspeed"
                              ? "destructive"
                              : vehicle.status === "moving"
                              ? "default"
                              : "secondary" // idle/stopped trips
                          }
                        >
                          {vehicle.status}
                        </Badge>
                        
                      </div>

                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div>Plate: {vehicle.vehiclePlate}</div>
                        <div>
                          Route: {vehicle.startLocationName} → {vehicle.endLocationName}
                        </div>
                        <div>Speed: {vehicle.speed} km/h</div>
                        <div>Mileage: {vehicle.mileageKm.toFixed(2)} km</div>
                        <div>Overspeed Alerts: {vehicle.overspeedAlerts}</div>
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          {selectedVehicle && (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Selected Vehicle Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <Info label="Driver" value={selectedVehicle.driverName} />
                  <Info label="Plate" value={selectedVehicle.vehiclePlate} />
                  <Info label="Vehicle" value={selectedVehicle.vehicleModel} />
                  <Info label="Speed Limit" value={`${selectedVehicle.speedLimit} km/h`} />
                  <Info label="Current Speed" value={`${selectedVehicle.speed} km/h`} />
                  <Info label="Distance" value={`${selectedVehicle.distanceKm.toFixed(2)} km`} />
                  <Info label="Mileage" value={`${selectedVehicle.mileageKm.toFixed(2)} km`} />
                  <Info
                    label="Overspeed Alerts"
                    value={String(selectedVehicle.overspeedAlerts)}
                  />
                </div>

                <div className="rounded-xl border p-3">
                  <div className="mb-1 text-xs text-muted-foreground">Trip Route</div>
                  <div className="font-medium">
                    {selectedVehicle.startLocationName} → {selectedVehicle.endLocationName}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Route: {selectedVehicle.routeName}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}