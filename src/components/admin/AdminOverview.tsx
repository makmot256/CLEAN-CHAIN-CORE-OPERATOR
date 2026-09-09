import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, Clock, Coins, Users, XCircle } from "lucide-react";
import type { AppUser, WasteSubmission } from "@/lib/types";
import { rewardForWeight } from "@/lib/admin";

const COLORS = ["#16a34a", "#0d9488", "#2563eb", "#ca8a04", "#dc2626", "#7c3aed"];

interface AdminOverviewProps {
  submissions: WasteSubmission[];
  users: AppUser[];
}

const AdminOverview = ({ submissions, users }: AdminOverviewProps) => {
  const pending = submissions.filter(
    (s) =>
      !s.tokens_awarded &&
      s.status !== "approved" &&
      s.status !== "rejected",
  );
  const approved = submissions.filter((s) => s.status === "approved");
  const rejected = submissions.filter((s) => s.status === "rejected");
  const tokensGranted = submissions
    .filter((s) => s.tokens_awarded)
    .reduce((sum, s) => sum + Number(s.tokens_amount || rewardForWeight(s.weight)), 0);
  const uniqueWallets = new Set(
    submissions.map((s) => s.submitted_by?.toLowerCase()).filter(Boolean),
  ).size;

  const byType = Object.entries(
    submissions.reduce<Record<string, number>>((acc, s) => {
      const key = s.waste_type || "Unknown";
      acc[key] = (acc[key] || 0) + Number(s.weight || 0);
      return acc;
    }, {}),
  ).map(([name, kg]) => ({ name, kg: Number(kg.toFixed(1)) }));

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - i));
    const key = date.toISOString().slice(0, 10);
    return {
      day: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count: submissions.filter((s) => s.created_at?.startsWith(key)).length,
    };
  });

  const statusPie = [
    { name: "Pending", value: pending.length },
    { name: "Approved", value: approved.length },
    { name: "Rejected", value: rejected.length },
  ].filter((d) => d.value > 0);

  const stats = [
    {
      label: "Pending review",
      value: pending.length,
      icon: Clock,
      className: "border-amber-200 bg-amber-50 text-amber-800",
    },
    {
      label: "Approved",
      value: approved.length,
      icon: CheckCircle2,
      className: "border-green-200 bg-green-50 text-green-800",
    },
    {
      label: "Rejected",
      value: rejected.length,
      icon: XCircle,
      className: "border-red-200 bg-red-50 text-red-800",
    },
    {
      label: "PPEN granted",
      value: tokensGranted.toFixed(2),
      icon: Coins,
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    },
    {
      label: "Connected wallets",
      value: users.length || uniqueWallets,
      icon: Users,
      className: "border-teal-200 bg-teal-50 text-teal-800",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className={`border ${stat.className}`}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm opacity-80">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                </div>
                <Icon className="h-8 w-8 opacity-70" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Submissions (14 days)</CardTitle>
            <CardDescription>How many waste reports arrived each day</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#16a34a"
                  fill="#86efac"
                  name="Submissions"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Verification mix</CardTitle>
            <CardDescription>Approved vs pending vs rejected</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {statusPie.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-gray-500">
                No submissions yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPie}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {statusPie.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Waste collected by type (kg)</CardTitle>
          <CardDescription>Total reported weight across all submissions</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          {byType.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-gray-500">
              No waste data yet
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="kg" fill="#0d9488" radius={[6, 6, 0, 0]} name="kg" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;
