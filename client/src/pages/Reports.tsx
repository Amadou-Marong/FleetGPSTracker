
import { useMemo, useState, useEffect } from "react";
import { useFleetStore } from "@/stores/fleetStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function Reports() {
  const drivers = useFleetStore((s) => s.drivers);
  const vehicles = useFleetStore((s) => s.vehicles);
  const tripHistory = useFleetStore((s) => s.tripHistory);
  const clearTripHistory = useFleetStore((s) => s.clearTripHistory);

  // ---------- Default date range: last 7 days ----------
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState<string>(formatDate(sevenDaysAgo));
  const [endDate, setEndDate] = useState<string>(formatDate(today));

  const [selectedDriverId, setSelectedDriverId] = useState<string>("all");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const [filteredTrips, setFilteredTrips] = useState(tripHistory);

  // Generate report based on filters
  const generateReport = () => {
    let trips = tripHistory;

    if (startDate) {
      trips = trips.filter((t) => new Date(t.startedAt) >= new Date(startDate));
    }
    if (endDate) {
      trips = trips.filter((t) => new Date(t.startedAt) <= new Date(endDate));
    }
    if (selectedDriverId !== "all") {
      trips = trips.filter((t) => t.driverId === selectedDriverId);
    }
    if (selectedVehicleId !== "all") {
      trips = trips.filter((t) => t.vehicleId === selectedVehicleId);
    }
    if (selectedStatus !== "all") {
      trips = trips.filter((t) => t.status === selectedStatus);
    }

    setFilteredTrips(trips);
  };

  // Stats
  const stats = useMemo(() => {
    const totalTrips = filteredTrips.length;
    const totalDistance = filteredTrips.reduce((sum, t) => sum + t.distanceKm, 0);
    const totalMileage = filteredTrips.reduce((sum, t) => sum + t.mileageKm, 0);
    const totalOverspeed = filteredTrips.reduce((sum, t) => sum + t.overspeedAlerts, 0);
    const avgDistance = totalTrips ? totalDistance / totalTrips : 0;

    return {
      totalTrips,
      totalDistance: totalDistance.toFixed(2),
      totalMileage: totalMileage.toFixed(2),
      totalOverspeed,
      avgDistance: avgDistance.toFixed(2),
    };
  }, [filteredTrips]);

  // Run initial filter on mount
  useEffect(() => {
    generateReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripHistory]);

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="mt-1 text-muted-foreground">
            Generate and filter trip history and fleet analytics
          </p>
        </div>

        <Button
          variant="outline"
          onClick={clearTripHistory}
          disabled={!tripHistory.length}
        >
          Clear History
        </Button>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Filter Trips</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5 items-end">
          {/* Start Date */}
          <div>
            <label className="text-sm font-medium">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-md border p-2 text-sm"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="text-sm font-medium">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-md border p-2 text-sm"
            />
          </div>

          {/* Driver Select */}
          <div>
            <label className="text-sm font-medium">Driver</label>
            <Select
              value={selectedDriverId}
              onValueChange={(val) => setSelectedDriverId(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Drivers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drivers</SelectItem>
                {Object.values(drivers)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} {d.employeeId ? `(${d.employeeId})` : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vehicle Select */}
          <div>
            <label className="text-sm font-medium">Vehicle</label>
            <Select
              value={selectedVehicleId}
              onValueChange={(val) => setSelectedVehicleId(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Vehicles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                {Object.values(vehicles)
                  .sort((a, b) => a.plate.localeCompare(b.plate))
                  .map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.plate} · {v.model}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trip Status */}
          <div>
            <label className="text-sm font-medium">Trip Status</label>
            <Select
              value={selectedStatus}
              onValueChange={(val) => setSelectedStatus(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="stopped">Stopped</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Generate Button */}
          <div>
            <Button onClick={generateReport} className="w-full">
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Trips" value={String(stats.totalTrips)} />
        <StatCard title="Total Distance" value={`${stats.totalDistance} km`} />
        <StatCard title="Total Mileage" value={`${stats.totalMileage} km`} />
        <StatCard title="Overspeed Alerts" value={String(stats.totalOverspeed)} />
        <StatCard title="Avg Trip Distance" value={`${stats.avgDistance} km`} />
      </div>

      {/* Trip Table */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Trip History</CardTitle>
        </CardHeader>
        <CardContent>
          {!filteredTrips.length ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              No trips found for the selected filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-3 pr-4">Driver</th>
                    <th className="py-3 pr-4">Vehicle</th>
                    <th className="py-3 pr-4">Route</th>
                    <th className="py-3 pr-4">Distance</th>
                    <th className="py-3 pr-4">Mileage</th>
                    <th className="py-3 pr-4">Avg Speed</th>
                    <th className="py-3 pr-4">Max Speed</th>
                    <th className="py-3 pr-4">Overspeed</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Started</th>
                    <th className="py-3 pr-4">Ended</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrips.map((trip) => (
                    <tr key={trip.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">{trip.driverName}</td>
                      <td className="py-3 pr-4">
                        {trip.vehiclePlate} · {trip.vehicleModel}
                      </td>
                      <td className="py-3 pr-4">
                        {trip.startLocationName} → {trip.endLocationName}
                      </td>
                      <td className="py-3 pr-4">{trip.distanceKm.toFixed(2)} km</td>
                      <td className="py-3 pr-4">{trip.mileageKm.toFixed(2)} km</td>
                      <td className="py-3 pr-4">{trip.averageSpeed.toFixed(2)} km/h</td>
                      <td className="py-3 pr-4">{trip.maxSpeed} km/h</td>
                      <td className="py-3 pr-4">{trip.overspeedAlerts}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            trip.status === "completed"
                              ? "bg-primary/10 text-primary"
                              : "bg-warning/10 text-warning"
                          }`}
                        >
                          {trip.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {new Date(trip.startedAt).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4">
                        {trip.endedAt ? new Date(trip.endedAt).toLocaleString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-5">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className="mt-2 text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}