import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Recycle, Shield, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { fetchAppUsers } from "@/lib/users";
import type { AppUser, UserWallet, WasteSubmission } from "@/lib/types";
import { shortAddress } from "@/lib/admin";
import { isMissingRelationError } from "@/lib/adminSetup";
import { useToast } from "@/hooks/use-toast";
import AdminOverview from "./AdminOverview";
import AdminSubmissions from "./AdminSubmissions";
import AdminUsers from "./AdminUsers";
import AdminWallets from "./AdminWallets";
import AdminSetupBanner from "./AdminSetupBanner";

interface AdminDashboardProps {
  account: string;
  onDisconnect: () => void;
}

const AdminDashboard = ({ account, onDisconnect }: AdminDashboardProps) => {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<WasteSubmission[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [wasteRes, usersData, walletRes, usersProbe] = await Promise.all([
      supabase.from("waste_table").select("*").order("created_at", { ascending: false }),
      fetchAppUsers().catch(() => [] as AppUser[]),
      supabase.from("user_wallet").select("*"),
      supabase.from("app_users").select("id").limit(1),
    ]);

    setNeedsSetup(isMissingRelationError(usersProbe.error));

    if (wasteRes.error) {
      toast({
        title: "Could not load submissions",
        description: wasteRes.error.message,
        variant: "destructive",
      });
    } else {
      setSubmissions((wasteRes.data || []) as WasteSubmission[]);
    }

    setUsers(usersData);

    if (!walletRes.error) {
      setWallets((walletRes.data || []) as UserWallet[]);
    }

    setLoading(false);
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/40 to-emerald-50">
      <header className="sticky top-0 z-40 border-b border-green-200 bg-white/90 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-700 to-emerald-600 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Admin Hub</h1>
              <p className="text-xs text-gray-500">CleanChain Core Operator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden font-mono text-xs text-gray-600 sm:inline">
              {shortAddress(account)}
            </span>
            <Button variant="outline" size="sm" asChild>
              <Link to="/">
                <Recycle className="mr-2 h-4 w-4" />
                Site
              </Link>
            </Button>
            <Button variant="destructive" size="sm" onClick={onDisconnect}>
              Disconnect
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {needsSetup && <AdminSetupBanner onRetry={load} />}
        {loading ? (
          <p className="py-20 text-center text-gray-500">Loading admin data…</p>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-white md:grid-cols-4">
              <TabsTrigger value="overview">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="queue">Verification</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="wallets">
                <Wallet className="mr-2 h-4 w-4" />
                Wallets
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <AdminOverview submissions={submissions} users={users} />
            </TabsContent>
            <TabsContent value="queue">
              <AdminSubmissions
                submissions={submissions}
                adminWallet={account}
                onChanged={load}
              />
            </TabsContent>
            <TabsContent value="users">
              <AdminUsers users={users} onChanged={load} />
            </TabsContent>
            <TabsContent value="wallets">
              <AdminWallets
                users={users}
                submissions={submissions}
                wallets={wallets}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
