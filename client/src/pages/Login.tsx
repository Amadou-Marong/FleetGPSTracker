
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Navigation, ArrowRight, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useToast } from "@/hooks/use-toast";
import { useAuthStore, DEMO_ACCOUNTS } from "@/stores/authStore";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login, isAuthenticated, isLoading } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasCredentials = useMemo(
    () => email.trim().length > 0 && password.length > 0,
    [email, password]
  );

  const from =
    (location.state as { from?: { pathname?: string } })?.from?.pathname || "/";

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    if (!hasCredentials || isSubmitting || isLoading) return;

    setIsSubmitting(true);

    const result = await login(email, password);

    if (!result.success) {
      toast({
        title: "Login failed",
        description: result.message || "Invalid credentials.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    toast({
      title: "Access granted",
      description: `Welcome back, ${result.user?.name || result.user?.role}.`,
    });

    if (remember) {
      // optional future remember-me logic
    }

    navigate(from, { replace: true });
  };

  const fillDemo = (account: (typeof DEMO_ACCOUNTS)[0]) => {
    if (isSubmitting || isLoading) return;
    setEmail(account.email);
    setPassword(account.password);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Brand */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Navigation className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">FleetTrack</h1>
            <p className="text-sm text-muted-foreground">
              GPS Monitoring System
            </p>
          </div>

          {/* Login Card */}
          <Card className="rounded-2xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Sign in</CardTitle>
              <p className="text-sm text-muted-foreground">
                Access your fleet dashboard and live tracking tools.
              </p>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11"
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={remember}
                      onCheckedChange={(checked) => setRemember(!!checked)}
                    />
                    <Label
                      htmlFor="remember"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Remember me
                    </Label>
                  </div>

                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  onClick={handleLogin}
                  disabled={!hasCredentials || isSubmitting || isLoading}
                  className="w-full h-11 gap-2"
                >
                  {isSubmitting || isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              {/* Demo Accounts */}
              <div className="space-y-3 border-t pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Demo Accounts
                </p>

                <div className="space-y-2">
                  {DEMO_ACCOUNTS.map((account) => (
                    <button
                      key={`${account.user.role}-${account.email}`}
                      type="button"
                      onClick={() => fillDemo(account)}
                      className="w-full rounded-xl border p-3 text-left transition hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{account.user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {account.email}
                          </p>
                        </div>

                        <code className="shrink-0 rounded-md border bg-muted px-2 py-1 text-xs">
                          {account.password}
                        </code>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            Secure access for fleet administrators, managers, and dispatchers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;