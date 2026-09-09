import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Recycle, Shield } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { checkIsAdmin } from "@/lib/admin";
import { upsertConnectedUser } from "@/lib/users";
import AdminDashboard from "@/components/admin/AdminDashboard";

const Admin = () => {
  const { connect, disconnect, account } = useWallet();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [connecting, setConnecting] = useState(false);

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

  const handleConnect = async () => {
    try {
      setConnecting(true);
      await connect();
    } finally {
      setConnecting(false);
    }
  };

  if (account && allowed) {
    return <AdminDashboard account={account} onDisconnect={disconnect} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-green-950 to-slate-900 px-4">
      <Card className="w-full max-w-md border-green-800/40 bg-white/95">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-700 to-emerald-600 text-white">
            <Shield className="h-6 w-6" />
          </div>
          <CardTitle>Admin Hub</CardTitle>
          <CardDescription>
            Connect an authorized wallet to review submissions, grant PPEN, and
            manage users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!account && (
            <Button
              className="w-full bg-green-700 hover:bg-green-800"
              onClick={handleConnect}
              disabled={connecting}
            >
              {connecting ? "Connecting..." : "Connect MetaMask"}
            </Button>
          )}

          {account && allowed === null && (
            <p className="text-center text-sm text-gray-500">Checking access…</p>
          )}

          {account && allowed === false && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="mb-2 font-medium">This wallet is not an admin.</p>
              <p className="break-all font-mono text-xs">{account}</p>
              <p className="mt-2">
                Ask an existing admin to set your role to Admin under Users, or
                add this address to <code className="font-mono">VITE_ADMIN_WALLETS</code>{" "}
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
