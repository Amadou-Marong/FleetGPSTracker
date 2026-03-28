
import { useMemo, useState } from "react";
import { Search, Plus, Phone, Car } from "lucide-react";
import { useFleetStore, type Driver } from "@/stores/fleetStore";
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

export default function Drivers() {
  const driversMap = useFleetStore((s) => s.drivers);
  const vehiclesMap = useFleetStore((s) => s.vehicles);
  const addDriver = useFleetStore((s) => s.addDriver);

  // const drivers = useMemo(() => Object.values(driversMap), [driversMap]);
  // const vehicles = useMemo(() => Object.values(vehiclesMap), [vehiclesMap]);

  const drivers = useMemo(
    () => Object.values(driversMap).sort((a, b) => a.name.localeCompare(b.name)),
    [driversMap]
  );

  const vehicles = useMemo(
    () => Object.values(vehiclesMap).sort((a, b) => a.plate.localeCompare(b.plate)),
    [vehiclesMap]
  );

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    employeeId: "",
    phone: "",
    status: "active" as "active" | "inactive",
  });

  const filtered = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.employeeId ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    const newDriver: Driver = {
      id: crypto.randomUUID(),
      name: form.name,
      employeeId: form.employeeId,
      phone: form.phone,
      status: form.status,
    };

    addDriver(newDriver);

    setOpen(false);
    setForm({
      name: "",
      employeeId: "",
      phone: "",
      status: "active",
    });
  };

  const getAssignedVehicle = (driverId: string) => {
    return vehicles.find((v) => v.assignedDriverId === driverId);
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Drivers</h1>
          <p className="mt-1 text-muted-foreground">Manage driver profiles</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Add Driver
            </Button>
          </DialogTrigger>

          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add New Driver</DialogTitle>
            </DialogHeader>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground">Full Name *</Label>
                <Input
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="bg-secondary border-border text-foreground"
                />
              </div>

              <div>
                <Label className="text-foreground">Employee ID *</Label>
                <Input
                  placeholder="EMP001"
                  value={form.employeeId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, employeeId: e.target.value }))
                  }
                  className="bg-secondary border-border text-foreground"
                />
              </div>

              <div>
                <Label className="text-foreground">Phone</Label>
                <Input
                  placeholder="+220..."
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className="bg-secondary border-border text-foreground"
                />
              </div>

              <div>
                <Label className="text-foreground">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v: "active" | "inactive") =>
                    setForm((f) => ({ ...f, status: v }))
                  }
                >
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
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
                disabled={!form.name || !form.employeeId}
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
          placeholder="Search drivers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-border bg-secondary pl-10 text-foreground"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((driver) => {
          const vehicle = getAssignedVehicle(driver.id);

          return (
            <div
              key={driver.id}
              className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                  {driver.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{driver.name}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        (driver.status ?? "active") === "active"
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {driver.status ?? "active"}
                    </span>
                  </div>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {driver.employeeId}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {driver.phone || "No phone"}
                    </span>

                    {vehicle ? (
                      <span className="flex items-center gap-1 text-info">
                        <Car className="h-3 w-3" />
                        {vehicle.plate} · {vehicle.model} {vehicle.year}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-muted-foreground/50">
                        <Car className="h-3 w-3" />
                        No vehicle assigned
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}