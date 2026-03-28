import { useMemo, useState } from "react";
import { Search, Navigation, Filter, Route, Gauge, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

import { useFleetStore } from "@/stores/fleetStore";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

type TripStatusFilter = "all" | "in_progress" | "completed" | "stopped";

type TripRow = {
  id: string;
  type: "live" | "history";
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  routeName: string;
  startLocationName: string;
  endLocationName: string;
  distanceKm: number;
  mileageKm: number;
  maxSpeed: number;
  avgSpeed: number;
  overspeedAlerts: number;
  status: "in_progress" | "completed" | "stopped";
  startedAt: string;
  endedAt?: string;
};

export default function Trips() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TripStatusFilter>("all");

  const liveVehicles = useFleetStore((s) => s.liveVehicles);
  const tripHistory = useFleetStore((s) => s.tripHistory);

  const trips = useMemo<TripRow[]>(() => {
    const liveRows: TripRow[] = Object.values(liveVehicles)
      .filter((v) => v.status === "moving" || v.status === "overspeed")
      .map((v) => {
        const startedAt = v.startedAt || new Date().toISOString();
        const elapsedHours = Math.max(
          1 / 3600,
          (Date.now() - new Date(startedAt).getTime()) / (1000 * 60 * 60)
        );

        return {
          id: `live-${v.driverId}`,
          type: "live",
          driverId: v.driverId,
          driverName: v.driverName,
          vehicleId: v.vehicleId,
          vehiclePlate: v.vehiclePlate,
          vehicleModel: v.vehicleModel,
          routeName: v.routeName,
          startLocationName: v.startLocationName,
          endLocationName: v.endLocationName,
          distanceKm: v.distanceKm,
          mileageKm: v.mileageKm,
          maxSpeed: v.speed,
          avgSpeed: Number((v.distanceKm / elapsedHours).toFixed(2)),
          overspeedAlerts: v.overspeedAlerts,
          status: "in_progress",
          startedAt,
          endedAt: undefined,
        };
      });

    const historyRows: TripRow[] = tripHistory.map((trip) => ({
      id: trip.id,
      type: "history",
      driverId: trip.driverId,
      driverName: trip.driverName,
      vehicleId: trip.vehicleId,
      vehiclePlate: trip.vehiclePlate,
      vehicleModel: trip.vehicleModel,
      routeName: trip.routeName,
      startLocationName: trip.startLocationName,
      endLocationName: trip.endLocationName,
      distanceKm: trip.distanceKm,
      mileageKm: trip.mileageKm,
      maxSpeed: trip.maxSpeed,
      avgSpeed: trip.averageSpeed,
      overspeedAlerts: trip.overspeedAlerts,
      status: trip.status, // completed | stopped
      startedAt: trip.startedAt,
      endedAt: trip.endedAt,
    }));

    return [...liveRows, ...historyRows].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }, [liveVehicles, tripHistory]);

  const filtered = useMemo(() => {
    return trips
      .filter((t) => statusFilter === "all" || t.status === statusFilter)
      .filter((t) => {
        const q = search.toLowerCase().trim();
        if (!q) return true;

        return (
          t.driverName.toLowerCase().includes(q) ||
          t.vehiclePlate.toLowerCase().includes(q) ||
          t.routeName.toLowerCase().includes(q) ||
          t.startLocationName.toLowerCase().includes(q) ||
          t.endLocationName.toLowerCase().includes(q)
        );
      });
  }, [trips, search, statusFilter]);

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Trips</h1>
        <p className="mt-1 text-muted-foreground">
          Live trips and historical trip records from the fleet store
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search driver, plate, route, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as TripStatusFilter)}
        >
          <SelectTrigger className="w-full md:w-48">
            <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="stopped">Stopped</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <MiniStat
          label="All Trips"
          value={String(trips.length)}
          icon={<Navigation className="h-4 w-4" />}
        />
        <MiniStat
          label="Live Now"
          value={String(trips.filter((t) => t.status === "in_progress").length)}
          icon={<Route className="h-4 w-4" />}
        />
        <MiniStat
          label="Completed"
          value={String(trips.filter((t) => t.status === "completed").length)}
          icon={<Gauge className="h-4 w-4" />}
        />
        <MiniStat
          label="Overspeed Alerts"
          value={String(trips.reduce((sum, t) => sum + t.overspeedAlerts, 0))}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      {/* Trip List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-10 text-center text-muted-foreground">
              No trips match your current filters.
            </CardContent>
          </Card>
        ) : (
          filtered.map((trip) => (
            <Card
              key={trip.id}
              className="rounded-2xl border transition-colors hover:border-primary/30"
            >
              <CardContent className="flex flex-col gap-4 p-5 xl:flex-row xl:items-center xl:justify-between">
                {/* Left section */}
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Navigation className="h-5 w-5 text-primary" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{trip.driverName}</p>
                      <StatusBadge status={trip.status} />
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {trip.vehiclePlate} · {trip.vehicleModel}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {trip.startLocationName} → {trip.endLocationName}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Started: {format(new Date(trip.startedAt), "MMM d, yyyy h:mm a")}
                      {trip.endedAt
                        ? ` · Ended: ${format(new Date(trip.endedAt), "MMM d, yyyy h:mm a")}`
                        : ""}
                    </p>
                  </div>
                </div>

                {/* Right metrics */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:w-auto">
                  <Metric label="Distance" value={`${trip.distanceKm.toFixed(2)} km`} />
                  <Metric label="Mileage" value={`${trip.mileageKm.toFixed(2)} km`} />
                  <Metric label="Max Speed" value={`${trip.maxSpeed} km/h`} highlight />
                  <Metric label="Avg Speed" value={`${trip.avgSpeed.toFixed(2)} km/h`} />
                  <Metric
                    label="Overspeed"
                    value={String(trip.overspeedAlerts)}
                    danger={trip.overspeedAlerts > 0}
                  />
                  <Metric label="Route" value={trip.routeName} />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <div className="rounded-xl bg-muted p-2 text-muted-foreground">{icon}</div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  highlight = false,
  danger = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl border p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-sm font-semibold ${
          danger
            ? "text-destructive"
            : highlight
            ? "text-warning"
            : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "in_progress" | "completed" | "stopped";
}) {
  const classes =
    status === "completed"
      ? "bg-primary/10 text-primary border border-primary/20"
      : status === "stopped"
      ? "bg-destructive/10 text-destructive border border-destructive/20"
      : "bg-warning/10 text-warning border border-warning/20";

  const label =
    status === "in_progress"
      ? "in progress"
      : status === "stopped"
      ? "stopped"
      : "completed";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}