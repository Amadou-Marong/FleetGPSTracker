
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  Users,
  Car,
  Route,
  FileText,
  Navigation,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/live-tracking", label: "Live Tracking", icon: MapPin },
  { to: "/vehicles", label: "Vehicles", icon: Car },
  { to: "/drivers", label: "Drivers", icon: Users },
  { to: "/trips", label: "Trips", icon: Route },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/driver-app", label: "Driver App", icon: Navigation },
];

export default function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="w-56 min-h-screen bg-sidebar flex flex-col border-r border-sidebar-border shrink-0">
      {/* Logo */}
      <div className="p-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
          <Navigation className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-bold text-foreground text-sm">FleetTrack</h1>
          <p className="text-xs text-muted-foreground">GPS Monitor</p>
        </div>
      </div>

      {/* User */}
      <div className="px-4 pb-3">
        <div className="rounded-xl border border-sidebar-border bg-background/40 p-3">
          <p className="text-sm font-semibold text-foreground truncate">
            {user?.name || "User"}
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            {user?.role || "Unknown"} access
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;

          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="live-dot" />
          System Online
        </div>

        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}