import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROUTE_PRESETS } from "@/lib/routes";
import { useFleetStore } from "@/stores/fleetStore";

export default function DriverApp() {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const driversMap = useFleetStore((s) => s.drivers);
  const vehiclesMap = useFleetStore((s) => s.vehicles);
  const liveVehicles = useFleetStore((s) => s.liveVehicles);

  const startTrip = useFleetStore((s) => s.startTrip);
  const stopTrip = useFleetStore((s) => s.stopTrip);
  const clearTrip = useFleetStore((s) => s.clearTrip);

  const driverOptions = useMemo(
    () =>
      Object.values(driversMap)
        .filter((d) => (d.status ?? "active") === "active")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [driversMap]
  );

  const assignedVehicle = useMemo(() => {
    if (!selectedDriverId) return undefined;
    return Object.values(vehiclesMap).find((v) => v.assignedDriverId === selectedDriverId);
  }, [vehiclesMap, selectedDriverId]);

  const vehicle = selectedDriverId ? liveVehicles[selectedDriverId] : undefined;
  const isTripActive = !!vehicle && vehicle.status !== "idle";

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Driver App</h1>
        <p className="text-sm text-muted-foreground">
          Start and monitor driver trips in real-time.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Start a Trip</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* DRIVER SELECT */}
              <div>
                <label className="text-sm font-medium">Select Driver</label>
                <Select
                  value={selectedDriverId ?? ""}
                  onValueChange={(val) => setSelectedDriverId(val || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {driverOptions.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                        {d.employeeId ? ` (${d.employeeId})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ASSIGNED VEHICLE PREVIEW */}
              <div>
                <label className="text-sm font-medium">Assigned Vehicle</label>
                <div className="mt-2 rounded-xl border p-3 text-sm">
                  {assignedVehicle ? (
                    <div className="space-y-1">
                      <div className="font-medium">
                        {assignedVehicle.plate} · {assignedVehicle.model} {assignedVehicle.year}
                      </div>
                      <div className="text-muted-foreground">
                        Speed limit: {assignedVehicle.speedLimit} km/h
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      No vehicle assigned to this driver
                    </div>
                  )}
                </div>
              </div>

              {/* ROUTE SELECT */}
              <div>
                <label className="text-sm font-medium">Select Route</label>
                <Select
                  value={selectedRouteId ?? ""}
                  onValueChange={(val) => setSelectedRouteId(val || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose route" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROUTE_PRESETS.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={
                    !selectedDriverId ||
                    !selectedRouteId ||
                    !assignedVehicle ||
                    isTripActive
                  }
                  onClick={() => {
                    if (selectedDriverId && selectedRouteId) {
                      startTrip(selectedDriverId, selectedRouteId);
                    }
                  }}
                >
                  Start Trip
                </Button>

                <Button
                  variant="destructive"
                  disabled={!selectedDriverId || !isTripActive}
                  onClick={() => {
                    if (selectedDriverId) stopTrip(selectedDriverId);
                  }}
                >
                  Stop Trip
                </Button>

                <Button
                  variant="outline"
                  disabled={!selectedDriverId || isTripActive}
                  onClick={() => {
                    if (selectedDriverId) clearTrip(selectedDriverId);
                  }}
                >
                  Clear Trip
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* LIVE VEHICLE INFO */}
          {/* {vehicle && (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Live Trip Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Info label="Driver" value={vehicle.driverName} />
                <Info label="Vehicle" value={vehicle.vehicleModel} />
                <Info label="Plate" value={vehicle.vehiclePlate} />
                <Info
                  label="Route"
                  value={`${vehicle.startLocationName} → ${vehicle.endLocationName}`}
                />
                <Info label="Speed Limit" value={`${vehicle.speedLimit} km/h`} />
                <Info label="Current Speed" value={`${vehicle.speed} km/h`} />
                <Info label="Distance" value={`${vehicle.distanceKm.toFixed(2)} km`} />
                <Info label="Mileage" value={`${vehicle.mileageKm.toFixed(2)} km`} />
                <Info label="Overspeed Alerts" value={`${vehicle.overspeedAlerts}`} />
                <Info label="Status" value={vehicle.status} />
              </CardContent>
            </Card>
          )} */}

          {vehicle && (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Live Trip Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[
                  { label: "Driver", value: vehicle.driverName },
                  { label: "Vehicle", value: vehicle.vehicleModel },
                  { label: "Plate", value: vehicle.vehiclePlate },
                  { label: "Route", value: `${vehicle.startLocationName} → ${vehicle.endLocationName}` },
                  { label: "Speed Limit", value: `${vehicle.speedLimit} km/h` },
                  { label: "Current Speed", value: `${vehicle.speed} km/h` },
                  { label: "Distance", value: `${vehicle.distanceKm.toFixed(2)} km` },
                  { label: "Mileage", value: `${vehicle.mileageKm.toFixed(2)} km` },
                  { label: "Overspeed Alerts", value: `${vehicle.overspeedAlerts}` },
                  { label: "Status", value: vehicle.status },
                ].map((info) => (
                  <Info key={info.label} label={info.label} value={info.value} />
                ))}
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