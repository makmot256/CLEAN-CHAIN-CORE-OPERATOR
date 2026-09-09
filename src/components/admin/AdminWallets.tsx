import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { normalizeAddress, rewardForWeight, shortAddress } from "@/lib/admin";
import type { AppUser, UserWallet, WasteSubmission } from "@/lib/types";

interface AdminWalletsProps {
  users: AppUser[];
  submissions: WasteSubmission[];
  wallets: UserWallet[];
}

const AdminWallets = ({ users, submissions, wallets }: AdminWalletsProps) => {
  const byWallet = new Map<
    string,
    {
      address: string;
      name: string;
      role: string;
      status: string;
      lastSeen: string | null;
      reports: number;
      approved: number;
      kg: number;
      tokens: number;
    }
  >();

  const ensure = (address: string) => {
    const key = normalizeAddress(address);
    if (!byWallet.has(key)) {
      byWallet.set(key, {
        address: key,
        name: shortAddress(key),
        role: "unknown",
        status: "seen",
        lastSeen: null,
        reports: 0,
        approved: 0,
        kg: 0,
        tokens: 0,
      });
    }
    return byWallet.get(key)!;
  };

  users.forEach((user) => {
    const row = ensure(user.wallet_address);
    row.name = user.display_name || shortAddress(user.wallet_address);
    row.role = user.role;
    row.status = user.status;
    row.lastSeen = user.last_seen_at;
  });

  submissions.forEach((s) => {
    if (!s.submitted_by) return;
    const row = ensure(s.submitted_by);
    row.reports += 1;
    row.kg += Number(s.weight || 0);
    if (s.status === "approved") row.approved += 1;
    if (s.tokens_awarded) {
      row.tokens += Number(s.tokens_amount || rewardForWeight(s.weight));
    }
    if (!row.lastSeen && s.created_at) row.lastSeen = s.created_at;
  });

  wallets.forEach((wallet) => {
    const row = ensure(wallet.account);
    if (!row.tokens) row.tokens = Number(wallet.token_balance || 0);
  });

  const rows = Array.from(byWallet.values()).sort((a, b) => b.reports - a.reports);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected wallets</CardTitle>
        <CardDescription>
          Every wallet that has connected or submitted waste, with activity and PPEN granted
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Wallet</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Reports</TableHead>
              <TableHead>Approved</TableHead>
              <TableHead>kg reported</TableHead>
              <TableHead>PPEN granted</TableHead>
              <TableHead>Last activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-gray-500">
                  No wallets recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.address}>
                  <TableCell>
                    <div className="font-medium">{row.name}</div>
                    <div className="font-mono text-xs text-gray-500">
                      {shortAddress(row.address)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {row.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.reports}</TableCell>
                  <TableCell>{row.approved}</TableCell>
                  <TableCell>{row.kg.toFixed(1)}</TableCell>
                  <TableCell className="font-medium text-green-700">
                    {row.tokens.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">
                    {row.lastSeen ? new Date(row.lastSeen).toLocaleString() : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AdminWallets;
