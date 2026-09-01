import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/temp-ui/components/ui/button";
import { Input } from "@/temp-ui/components/ui/input";
import { Label } from "@/temp-ui/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/temp-ui/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@/Black Logo.svg";
import { ApiError, authApi } from "@/utils/api";
import { clearTransientResumeData, setStoredAuthUser } from "@/utils/auth";

type AuthMode = "signin" | "register";

export const SignIn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    authApi.me()
      .then((user) => {
        if (cancelled) return;
        setStoredAuthUser({
          ...user,
          signedInAt: user.signedInAt || new Date().toISOString(),
        });
        navigate("/builder", { replace: true });
      })
      .catch(() => {
        // Stay on sign-in until the user authenticates.
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const user = mode === "register"
        ? await authApi.register({ name, email, password })
        : await authApi.login({ email, password });

      if (mode === "register") {
        clearTransientResumeData();
      }

      setStoredAuthUser({
        ...user,
        signedInAt: user.signedInAt || new Date().toISOString(),
      });
      toast({
        title: mode === "register" ? "Account created" : "Signed in",
        description: mode === "register"
          ? "Welcome. You can start building your resume."
          : `Signed in as ${user.email}.`,
      });
      navigate("/builder", { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img
              src={logoImage}
              alt="Indexnine Logo"
              className="h-12"
              style={{ maxHeight: "48px" }}
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome</h1>
            <p className="text-muted-foreground mt-2">
              Sign in to start building your professional resume
            </p>
          </div>
        </div>

        <Tabs value={mode} onValueChange={(value) => { setMode(value as AuthMode); setError(""); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="register">Create account</TabsTrigger>
          </TabsList>

          <TabsContent value={mode} className="mt-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    name="name"
                    autoComplete="name"
                    placeholder="Ada Lovelace"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </div>

              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    minLength={8}
                    required
                  />
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive" role="alert">{error}</p>
              )}

              <Button type="submit" className="w-full h-12 text-base" size="lg" disabled={submitting}>
                {submitting
                  ? "Please wait..."
                  : mode === "register"
                    ? "Create account"
                    : "Sign in"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="text-center text-xs text-muted-foreground">
          <p>By continuing, you agree to our terms of service</p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
