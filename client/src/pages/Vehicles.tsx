
import { useMemo, useState } from "react";
import { Search, Plus, Car, Gauge, User, Wrench, X } from "lucide-react";
import { useFleetStore, type Vehicle } from "@/stores/fleetStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function Vehicles() {
  const vehiclesMap = useFleetStore((s) => s.vehicles);
  const driversMap = useFleetStore((s) => s.drivers);
  const addVehicle = useFleetStore((s) => s.addVehicle);
  const assignDriverToVehicle = useFleetStore((s) => s.assignDriverToVehicle);
  const unassignDriverFromVehicle = useFleetStore((s) => s.unassignDriverFromVehicle);

  const vehicles = useMemo(() => Object.values(vehiclesMap), [vehiclesMap]);
  const drivers = useMemo(() => Object.values(driversMap), [driversMap]);

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    plate: "",
    model: "",
    year: new Date().getFullYear(),
    speedLimit: 80,
    status: "available" as Vehicle["status"],
    assignedDriverId: "",
  });

  const filtered = vehicles.filter(
    (v) =>
      v.plate.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase())
  );

  const unassignedDrivers = drivers.filter(
    (d) =>
      (d.status ?? "active") === "active" &&
      !vehicles.some((v) => v.assignedDriverId === d.id)
  );

  const handleCreate = () => {
    const vehicleId = crypto.randomUUID();

    addVehicle({
      id: vehicleId,
      plate: form.plate,
      model: form.model,
      year: form.year,
      speedLimit: form.speedLimit,
      status: form.assignedDriverId ? "assigned" : "available",
      assignedDriverId: undefined, // let assignment method handle consistency
    });

    if (form.assignedDriverId) {
      assignDriverToVehicle(vehicleId, form.assignedDriverId);
    }

    setOpen(false);
    setForm({
      plate: "",
      model: "",
      year: new Date().getFullYear(),
      speedLimit: 80,
      status: "available",
      assignedDriverId: "",
    });
  };

  const getDriverName = (driverId?: string) => {
    if (!driverId) return null;
    return driversMap[driverId]?.name ?? null;
  };

  const statusStyles: Record<NonNullable<Vehicle["status"]>, string> = {
    available: "bg-primary/10 text-primary",
    assigned: "bg-info/10 text-info",
    maintenance: "bg-warning/10 text-warning",
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vehicles</h1>
          <p className="mt-1 text-muted-foreground">
            Manage fleet vehicles and driver assignments
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Add Vehicle
            </Button>
          </DialogTrigger>

          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add New Vehicle</DialogTitle>
            </DialogHeader>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground">Plate Number *</Label>
                <Input
                  placeholder="ABC-123-DE"
                  value={form.plate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, plate: e.target.value }))
                  }
                  className="bg-secondary border-border text-foreground"
                />
              </div>

              <div>
                <Label className="text-foreground">Model *</Label>
                <Input
                  placeholder="Toyota Corolla"
                  value={form.model}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, model: e.target.value }))
                  }
                  className="bg-secondary border-border text-foreground"
                />
              </div>

              <div>
                <Label className="text-foreground">Year</Label>
                <Input
                  type="number"
                  value={form.year}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, year: Number(e.target.value) }))
                  }
                  className="bg-secondary border-border text-foreground"
                />
              </div>

              <div>
                <Label className="text-foreground">Speed Limit (km/h)</Label>
                <Input
                  type="number"
                  value={form.speedLimit}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      speedLimit: Number(e.target.value),
                    }))
                  }
                  className="bg-secondary border-border text-foreground"
                />
              </div>

              <div className="col-span-2">
                <Label className="text-foreground">Assign Driver (optional)</Label>
                <Select
                  value={form.assignedDriverId || "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      assignedDriverId: v === "none" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="No driver assigned" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none">No driver</SelectItem>
                    {unassignedDrivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name} {d.employeeId ? `(${d.employeeId})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-border text-foreground"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleCreate}
                disabled={!form.plate || !form.model}
              >
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search plates or models..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-border bg-secondary pl-10 text-foreground"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((vehicle) => (
          <div
            key={vehicle.id}
            className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Car className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{vehicle.plate}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      statusStyles[vehicle.status ?? "available"]
                    }`}
                  >
                    {vehicle.status ?? "available"}
                  </span>
                </div>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  {vehicle.model} · {vehicle.year}
                </p>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Gauge className="h-3 w-3" />
                    Limit: {vehicle.speedLimit} km/h
                  </span>

                  {vehicle.assignedDriverId ? (
                    <span className="flex items-center gap-2 text-info">
                      <User className="h-3 w-3" />
                      {getDriverName(vehicle.assignedDriverId)}
                      <button
                        onClick={() => unassignDriverFromVehicle(vehicle.id)}
                        className="rounded p-0.5 hover:bg-muted"
                        title="Unassign driver"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ) : vehicle.status === "maintenance" ? (
                    <span className="flex items-center gap-1 text-warning">
                      <Wrench className="h-3 w-3" />
                      In maintenance
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <Select
                        onValueChange={(v) => assignDriverToVehicle(vehicle.id, v)}
                      >
                        <SelectTrigger className="h-6 border-dashed border-muted-foreground/30 bg-transparent px-2 py-0 text-xs">
                          <SelectValue placeholder="Assign driver..." />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {unassignedDrivers.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}