import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trophy, LogIn, FlaskConical } from "lucide-react";
import { DEV_EMAIL, isDevLoginEnabled } from "@/auth/dev-login";

export default function Login() {
  const { login, loginDev } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]         = useState(isDevLoginEnabled() ? DEV_EMAIL : "");
  const [password, setPassword]   = useState("");
  
  const [errors, setErrors]       = useState<string[]>([]);
  const [loading, setLoading]     = useState(false);

  // Whether the current email qualifies for the dev bypass
  const isDevEmail =
    isDevLoginEnabled() &&
    email.trim().toLowerCase() === DEV_EMAIL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    try {
      // ── Dev bypass (Vite dev mode + feature flag + dev email) ────────────
      if (isDevEmail) {
        loginDev(email.trim().toLowerCase());
        navigate("/", { replace: true });
        return;
      }

      // ── Normal authentication ─────────────────────────────────────────────
      await login({ email, password });
      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.getValidationErrors());
      } else {
        setErrors(["Invalid email or password."]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-athletic-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Trophy className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl text-gradient">Welcome Back</CardTitle>
            <CardDescription className="mt-1">
              Sign in to AURA Sport Academy
            </CardDescription>
          </div>

          {/* Dev-mode badge — tree-shaken in production */}
          {isDevLoginEnabled() && (
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-warning/40 bg-warning/10 text-warning text-xs font-medium">
                <FlaskConical className="h-3 w-3" />
                Development Mode
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <ul className="list-disc pl-4 space-y-1">
                    {errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password — hidden when dev email is entered */}
            {!isDevEmail && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            )}

            {/* Dev bypass hint when dev email is detected */}
            {isDevEmail && (
              <Alert className="border-warning/40 bg-warning/10 text-warning [&>svg]:text-warning">
                <FlaskConical className="h-4 w-4" />
                <AlertDescription className="text-warning/90">
                  Dev bypass active — no password required. No backend call will
                  be made.
                </AlertDescription>
              </Alert>
            )}


            <Button
              type="submit"
              className="w-full"
              variant={isDevEmail ? "outline" : "hero"}
              disabled={loading}
            >
              {isDevEmail ? (
                <>
                  <FlaskConical className="h-4 w-4" />
                  {loading ? "Entering…" : "Enter as Developer"}
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  {loading ? "Signing in…" : "Sign In"}
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-primary font-medium hover:underline"
              >
                Create one
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
