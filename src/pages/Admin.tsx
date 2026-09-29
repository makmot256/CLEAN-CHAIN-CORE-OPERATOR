import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import { Recycle, Shield, Moon, Sun } from "lucide-react";
import { useBlinkAuth } from "@/hooks/useBlinkAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { checkIsAdmin } from "@/lib/admin";
import { upsertConnectedUser } from "@/lib/users";
import AdminDashboard from "@/components/admin/AdminDashboard";

const Admin = () => {
  const { account, login, logout, isLoggingIn } = useBlinkAuth();
  const { theme, toggleTheme } = useTheme();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (!account) {
      setAllowed(null);
      return;
    }

    let cancelled = false;
    (async () => {
      await upsertConnectedUser(account).catch(() => undefined);
      const ok = await checkIsAdmin(account);
      if (!cancelled) setAllowed(ok);
    })();

    return () => {
      cancelled = true;
    };
  }, [account]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const result = await login(usernameInput);
    if (!result.ok) {
      setLoginError(result.error || "Could not verify that Blink username.");
    } else {
      setUsernameInput("");
    }
  };

  if (account && allowed) {
    return <AdminDashboard account={account} onDisconnect={logout} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-green-950 to-slate-900 px-4">
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full text-white hover:bg-white/10"
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>
      </div>
      <Card className="w-full max-w-md border-green-800/40 bg-white/95 dark:bg-gray-900/95 dark:border-gray-800">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-700 to-emerald-600 text-white">
            <Shield className="h-6 w-6" />
          </div>
          <CardTitle className="dark:text-gray-100">Admin Hub</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Log in with an authorized Blink username to review submissions,
            award sats, and manage users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!account && (
            <form onSubmit={handleLogin} className="space-y-2">
              <Label htmlFor="admin-blink-username">
                Blink username or Lightning Address
              </Label>
              <Input
                id="admin-blink-username"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="jane_doe or jane_doe@blink.sv"
                autoCapitalize="none"
                autoCorrect="off"
              />
              {loginError && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {loginError}
                </p>
              )}
              <Button
                type="submit"
                className="w-full bg-green-700 hover:bg-green-800"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "Checking…" : "Log in with Blink"}
              </Button>
            </form>
          )}

          {account && allowed === null && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Checking access…
            </p>
          )}

          {account && allowed === false && (
            <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-400">
              <p className="mb-2 font-medium">
                This Blink account is not an admin.
              </p>
              <p className="break-all font-mono text-xs">@{account}</p>
              <p className="mt-2">
                Ask an existing admin to set your role to Admin under Users, or
                add this username to{" "}
                <code className="font-mono">VITE_ADMIN_BLINK_USERNAMES</code>{" "}
                and restart the app.
              </p>
            </div>
          )}

          <Button variant="outline" className="w-full" asChild>
            <Link to="/">
              <Recycle className="mr-2 h-4 w-4" />
              Back to site
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
