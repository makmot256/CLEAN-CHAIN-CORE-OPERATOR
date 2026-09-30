import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  Moon,
  Recycle,
  ShieldCheck,
  Shield,
  Sun,
  Wallet,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { fetchAppUsers } from "@/lib/users";
import type { AppUser, UserWallet, WasteSubmission } from "@/lib/types";
import { shortAddress } from "@/lib/admin";
import { isMissingRelationError } from "@/lib/adminSetup";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { useAppRole } from "@/hooks/useAppRole";
import AdminOverview from "./AdminOverview";
import AdminSubmissions from "./AdminSubmissions";
import AdminUsers from "./AdminUsers";
import AdminWallets from "./AdminWallets";
import AdminSetupBanner from "./AdminSetupBanner";
import AdminRoleMatrix from "./AdminRoleMatrix";

interface AdminDashboardProps {
  account: string;
  onDisconnect: () => void;
}

const AdminDashboard = ({ account, onDisconnect }: AdminDashboardProps) => {
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { can, refresh: refreshRole } = useAppRole(account);
  const [submissions, setSubmissions] = useState<WasteSubmission[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      const [wasteRes, usersData, walletRes, usersProbe] = await Promise.all([
        supabase
          .from("waste_table")
          .select("*")
          .order("created_at", { ascending: false }),
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
    },
    [toast],
  );

  useEffect(() => {
    load();
  }, [load]);

  const tabTriggerClass =
    "rounded-lg text-gray-600 transition-colors data-[state=active]:bg-green-700 data-[state=active]:text-white data-[state=active]:shadow-sm dark:text-gray-300 dark:data-[state=active]:bg-green-600";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/40 to-emerald-50 dark:from-gray-950 dark:via-green-950/10 dark:to-gray-900">
      <header className="sticky top-0 z-40 border-b border-green-200 bg-white/90 backdrop-blur dark:border-green-900/40 dark:bg-gray-950/90">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-700 to-emerald-600 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Admin Hub
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                CleanChain Core Operator
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden font-mono text-xs text-gray-600 dark:text-gray-400 sm:inline">
              {shortAddress(account)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-gray-600 hover:bg-green-50 dark:text-gray-300 dark:hover:bg-white/10"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
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
          <p className="py-20 text-center text-gray-500 dark:text-gray-400">
            Loading admin data…
          </p>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 gap-1 rounded-xl border border-green-100 bg-white p-1 shadow-sm dark:border-green-900/30 dark:bg-gray-900 md:grid-cols-5">
              <TabsTrigger value="overview" className={tabTriggerClass}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="queue" className={tabTriggerClass}>
                Verification
              </TabsTrigger>
              <TabsTrigger value="users" className={tabTriggerClass}>
                Users
              </TabsTrigger>
              <TabsTrigger value="wallets" className={tabTriggerClass}>
                <Wallet className="mr-2 h-4 w-4" />
                Wallets
              </TabsTrigger>
              <TabsTrigger value="roles" className={tabTriggerClass}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Roles
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <AdminOverview submissions={submissions} users={users} />
            </TabsContent>
            <TabsContent value="queue">
              <AdminSubmissions
                submissions={submissions}
                adminWallet={account}
                can={can}
                onChanged={() => load({ silent: true })}
              />
            </TabsContent>
            <TabsContent value="users">
              <AdminUsers
                users={users}
                can={can}
                onChanged={() => {
                  load({ silent: true });
                  refreshRole();
                }}
              />
            </TabsContent>
            <TabsContent value="wallets">
              <AdminWallets
                users={users}
                submissions={submissions}
                wallets={wallets}
              />
            </TabsContent>
            <TabsContent value="roles">
              <AdminRoleMatrix />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
