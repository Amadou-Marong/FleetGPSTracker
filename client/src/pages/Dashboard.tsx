
import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import {
  Navigation,
  Users,
  AlertTriangle,
  TrendingUp,
  Gauge,
} from "lucide-react";

import { useFleetStore } from "@/stores/fleetStore";
import { ROUTE_PRESETS } from "@/lib/routes";
import { MOCK_DRIVERS } from "@/lib/data";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

// ----------------------------------
// Types
// ----------------------------------
type ChartPoint = {
  time: string;
  avgSpeed: number;
  totalDistance: number;
  overspeedAlerts: number;
};

type VehicleSparkHistory = Record<
  string,
  Array<{ time: string; speed: number }>
>;

// ----------------------------------
// Main Dashboard
// ----------------------------------
export default function Dashboard() {
  const liveVehicles = useFleetStore((s) => s.liveVehicles);

  // ---------------- Filters ----------------
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // ---------------- Filtered vehicles ----------------
  const filteredVehicles = useMemo(() => {
    return Object.values(liveVehicles).filter((v) => {
      const driverMatch = selectedDriverId ? v.driverId === selectedDriverId : true;
      const routeMatch = selectedRouteId ? v.routeId === selectedRouteId : true;
      const statusMatch = selectedStatus ? v.status === selectedStatus : true;
      return driverMatch && routeMatch && statusMatch;
    });
  }, [liveVehicles, selectedDriverId, selectedRouteId, selectedStatus]);

  // ---------------- Stats ----------------
  const activeTrips = filteredVehicles.length;
  const totalDrivers = Object.keys(MOCK_DRIVERS ?? {}).length;
  const overspeedAlerts = filteredVehicles.reduce(
    (sum, v) => sum + (v.overspeedAlerts ?? 0),
    0
  );
  const totalDistance = filteredVehicles.reduce(
    (sum, v) => sum + (v.mileageKm ?? 0),
    0
  );
  const avgSpeed =
    filteredVehicles.length > 0
      ? filteredVehicles.reduce((sum, v) => sum + (v.speed ?? 0), 0) /
        filteredVehicles.length
      : 0;

  // ----------------------------------
  // LIVE TIME-SERIES CHART DATA
  // ----------------------------------
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [vehicleSparkHistory, setVehicleSparkHistory] =
    useState<VehicleSparkHistory>({});

  // Keep last known distance to simulate cumulative movement cleanly
  const lastDistanceRef = useRef<number>(0);

  useEffect(() => {
    // initialize immediately
    appendChartPoint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      appendChartPoint();
    }, 3000); // update every 3 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredVehicles]);

  function appendChartPoint() {
    const now = new Date();
    const timeLabel = format(now, "HH:mm:ss");

    const currentAvgSpeed =
      filteredVehicles.length > 0
        ? filteredVehicles.reduce((sum, v) => sum + (v.speed ?? 0), 0) /
          filteredVehicles.length
        : 0;

    const currentDistance = filteredVehicles.reduce(
      (sum, v) => sum + (v.mileageKm ?? 0),
      0
    );

    const currentOverspeed = filteredVehicles.reduce(
      (sum, v) => sum + (v.overspeedAlerts ?? 0),
      0
    );

    // Smooth distance behavior:
    // If liveVehicles reset or filter changes drastically, avoid weird backward jumps.
    const safeDistance =
      currentDistance >= lastDistanceRef.current
        ? currentDistance
        : currentDistance;

    lastDistanceRef.current = safeDistance;

    setChartData((prev) => {
      const next = [
        ...prev,
        {
          time: timeLabel,
          avgSpeed: Number(currentAvgSpeed.toFixed(1)),
          totalDistance: Number(safeDistance.toFixed(2)),
          overspeedAlerts: currentOverspeed,
        },
      ];

      // keep last 20 points (~1 minute if 3 sec interval)
      return next.slice(-20);
    });

    // Per-vehicle sparkline history
    setVehicleSparkHistory((prev) => {
      const next: VehicleSparkHistory = { ...prev };

      filteredVehicles.forEach((v) => {
        const existing = next[v.driverId] ?? [];
        next[v.driverId] = [
          ...existing,
          {
            time: timeLabel,
            speed: Number((v.speed ?? 0).toFixed(1)),
          },
        ].slice(-12);
      });

      return next;
    });
  }

  return (
    <div className="p-6 space-y-6">
      {/* ---------------- Header ---------------- */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-green-600">
              Live Monitoring
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Fleet Control Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time speed, distance, route activity, and driver monitoring
          </p>
        </div>
      </div>

      {/* ---------------- Filters ---------------- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SelectFilter
          label="Driver"
          value={selectedDriverId}
          onChange={setSelectedDriverId}
          options={Object.values(MOCK_DRIVERS ?? {}).map((d) => ({
            id: d.id,
            name: d.name,
          }))}
          placeholder="All drivers"
        />

        <SelectFilter
          label="Route"
          value={selectedRouteId}
          onChange={setSelectedRouteId}
          options={ROUTE_PRESETS.map((r) => ({
            id: r.id,
            name: r.name,
          }))}
          placeholder="All routes"
        />

        <SelectFilter
          label="Trip Status"
          value={selectedStatus}
          onChange={setSelectedStatus}
          options={[
            { id: "moving", name: "Moving" },
            { id: "idle", name: "Idle" },
            { id: "overspeed", name: "Overspeed" },
            { id: "stopped", name: "Stopped" },
          ]}
          placeholder="All statuses"
        />
      </div>

      {/* ---------------- Stats ---------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Active Trips"
          value={activeTrips}
          icon={Navigation}
          iconColor="text-blue-600"
        />
        <StatCard
          label="Total Drivers"
          value={totalDrivers}
          icon={Users}
          iconColor="text-violet-600"
        />
        <StatCard
          label="Overspeed Alerts"
          value={overspeedAlerts}
          icon={AlertTriangle}
          iconColor="text-amber-600"
        />
        <StatCard
          label="Fleet Distance"
          value={`${totalDistance.toFixed(1)} km`}
          icon={TrendingUp}
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Avg Speed"
          value={`${avgSpeed.toFixed(1)} km/h`}
          icon={Gauge}
          iconColor="text-rose-600"
        />
      </div>

      {/* ---------------- Combined Speed + Distance vs Time ---------------- */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader>
          <CardTitle>Fleet Speed & Distance vs Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" minTickGap={20} />
                <YAxis
                  yAxisId="left"
                  label={{ value: "Speed (km/h)", angle: -90, position: "insideLeft" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  label={{
                    value: "Distance (km)",
                    angle: 90,
                    position: "insideRight",
                  }}
                />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="avgSpeed"
                  name="Avg Speed"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive
                  animationDuration={500}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="totalDistance"
                  name="Total Distance"
                  stroke="#16a34a"
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive
                  animationDuration={500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ---------------- Secondary Live Charts ---------------- */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Speed vs Time */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader>
            <CardTitle>Average Speed vs Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" minTickGap={20} />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="avgSpeed"
                    name="Avg Speed (km/h)"
                    stroke="#3b82f6"
                    fill="#93c5fd"
                    strokeWidth={2.5}
                    isAnimationActive
                    animationDuration={500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distance vs Time */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader>
            <CardTitle>Total Distance vs Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" minTickGap={20} />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="totalDistance"
                    name="Distance (km)"
                    stroke="#16a34a"
                    fill="#86efac"
                    strokeWidth={2.5}
                    isAnimationActive
                    animationDuration={500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---------------- Overspeed Alerts vs Time ---------------- */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader>
          <CardTitle>Overspeed Alerts vs Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" minTickGap={20} />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="overspeedAlerts"
                  name="Overspeed Alerts"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive
                  animationDuration={500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ---------------- Active Vehicles ---------------- */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">Active Vehicles</h2>
          <p className="text-sm text-muted-foreground">
            Live vehicle telemetry with per-vehicle speed trends
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          {filteredVehicles.length === 0 ? (
            <Card className="xl:col-span-3">
              <CardContent className="py-10 text-center text-muted-foreground">
                No active trips found for the selected filters.
              </CardContent>
            </Card>
          ) : (
            filteredVehicles.map((v) => {
              const sparkData = vehicleSparkHistory[v.driverId] ?? [];

              return (
                <Card
                  key={v.driverId}
                  className="rounded-2xl border shadow-sm transition hover:shadow-md"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span>{v.driverName}</span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          v.status === "overspeed"
                            ? "bg-amber-100 text-amber-700"
                            : v.status === "moving"
                            ? "bg-green-100 text-green-700"
                            : v.status === "idle"
                            ? "bg-slate-100 text-slate-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {String(v.status).toUpperCase()}
                      </span>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Info label="Vehicle" value={v.vehicleModel} />
                      <Info label="Plate" value={v.vehiclePlate} />
                      <Info label="Current Speed" value={`${(v.speed ?? 0).toFixed(1)} km/h`} />
                      <Info label="Mileage" value={`${(v.mileageKm ?? 0).toFixed(2)} km`} />
                      <Info
                        label="Overspeed Alerts"
                        value={v.overspeedAlerts ?? 0}
                      />
                      <Info
                        label="Route"
                        value={`${v.startLocationName} → ${v.endLocationName}`}
                      />
                    </div>

                    {/* Mini sparkline */}
                    <div className="rounded-xl border p-3">
                      <div className="mb-2 text-xs font-medium text-muted-foreground">
                        Live Speed Trend
                      </div>
                      <div className="h-[110px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={sparkData}>
                            <XAxis dataKey="time" hide />
                            <YAxis hide domain={["auto", "auto"]} />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="speed"
                              stroke="#2563eb"
                              strokeWidth={2.5}
                              dot={false}
                              isAnimationActive
                              animationDuration={400}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------
// Info Block
// ----------------------------------
function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border p-3 bg-background">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium text-sm">{value}</div>
    </div>
  );
}

// ----------------------------------
// Stat Card
// ----------------------------------
function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = "text-primary",
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
}) {
  return (
    <Card className="rounded-2xl border shadow-sm">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
        </div>
        <div className={`rounded-xl bg-muted p-3 ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

// ----------------------------------
// Radix-safe Select Filter
// ----------------------------------
interface SelectFilterProps {
  label: string;
  value: string | null;
  onChange: (val: string | null) => void;
  options: { id: string; name: string }[];
  placeholder?: string;
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
  placeholder,
}: SelectFilterProps) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <Select
        value={value ?? "__all"}
        onValueChange={(val) => onChange(val === "__all" ? null : val)}
      >
        <SelectTrigger className="mt-1 w-full rounded-md">
          <SelectValue placeholder={placeholder ?? "Select"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all">{placeholder ?? "All"}</SelectItem>
          {options
            .filter((opt) => opt.id && opt.id.trim() !== "")
            .map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}