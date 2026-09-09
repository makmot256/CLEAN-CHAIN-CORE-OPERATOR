import { useMemo, useState, type MouseEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import {
  canGrantTokens,
  findPossibleDuplicates,
  grantPpenTokens,
  imageUrls,
  parseCoords,
  rewardForWeight,
  shortAddress,
} from "@/lib/admin";
import type { WasteSubmission } from "@/lib/types";
import { AlertTriangle, CheckCircle2, ExternalLink, MapPin, XCircle } from "lucide-react";

interface AdminSubmissionsProps {
  submissions: WasteSubmission[];
  adminWallet: string;
  onChanged: () => Promise<void> | void;
}

type Filter = "pending" | "approved" | "rejected" | "all";

const isPending = (s: WasteSubmission) =>
  !s.tokens_awarded && s.status !== "approved" && s.status !== "rejected";

const AdminSubmissions = ({
  submissions,
  adminWallet,
  onChanged,
}: AdminSubmissionsProps) => {
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>("pending");
  const [selected, setSelected] = useState<WasteSubmission | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isProminent, setIsProminent] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [busy, setBusy] = useState(false);

  const duplicates = useMemo(
    () => (selected ? findPossibleDuplicates(selected, submissions) : []),
    [selected, submissions],
  );

  const rows = submissions.filter((s) => {
    if (filter === "pending") return isPending(s);
    if (filter === "approved") return s.status === "approved";
    if (filter === "rejected") return s.status === "rejected";
    return true;
  });

  const openReview = (row: WasteSubmission) => {
    setSelected(row);
    setIsDuplicate(Boolean(row.is_duplicate));
    setIsProminent(Boolean(row.is_prominent_location));
    setRejectionReason(row.rejection_reason || "");
  };

  const updateWalletBalance = async (account: string, amount: number) => {
    const { data: wallet } = await supabase
      .from("user_wallet")
      .select("token_balance")
      .eq("account", account)
      .maybeSingle();

    if (wallet) {
      await supabase
        .from("user_wallet")
        .update({
          token_balance: Number(wallet.token_balance || 0) + amount,
          updated_at: new Date().toISOString(),
        })
        .eq("account", account);
    } else {
      await supabase.from("user_wallet").insert({
        account,
        token_balance: amount,
      });
    }
  };

  const saveDecision = async (
    id: number,
    payload: Record<string, unknown>,
    fallback: Record<string, unknown>,
  ) => {
    const full = await supabase.from("waste_table").update(payload).eq("id", id);
    if (!full.error) return;
    const basic = await supabase.from("waste_table").update(fallback).eq("id", id);
    if (basic.error) throw basic.error;
  };

  const handleApprove = async (event?: MouseEvent) => {
    event?.preventDefault();
    event?.stopPropagation();
    if (!selected) return;

    const shouldGrant = canGrantTokens({
      isDuplicate,
      isProminentLocation: isProminent,
    });
    const amount = rewardForWeight(selected.weight);
    setBusy(true);

    try {
      let txHash: string | null = null;
      if (shouldGrant) {
        try {
          txHash = await grantPpenTokens(selected.submitted_by, amount);
          await updateWalletBalance(selected.submitted_by, amount);
        } catch (chainErr: any) {
          toast({
            title: "Accepted, but token transfer failed",
            description:
              chainErr?.shortMessage ||
              chainErr?.message ||
              "The report was accepted. Send PPEN from an owner wallet that holds tokens, then try again if needed.",
            variant: "destructive",
          });
        }
      }

      await saveDecision(
        selected.id,
        {
          status: "approved",
          tokens_awarded: Boolean(txHash),
          tokens_amount: txHash ? amount : 0,
          verified_by: adminWallet,
          verified_at: new Date().toISOString(),
          is_duplicate: isDuplicate,
          is_prominent_location: isProminent,
          rejection_reason: null,
          tx_hash: txHash,
        },
        { status: "approved" },
      );

      toast({
        title: shouldGrant && txHash ? "Accepted — tokens granted" : "Submission accepted",
        description: shouldGrant && txHash
          ? `${amount} PPEN sent to ${shortAddress(selected.submitted_by)}`
          : shouldGrant
            ? "Saved as accepted. Token transfer did not complete."
            : "Saved as accepted. No tokens granted because duplicate or location checks did not pass.",
      });
      setSelected(null);
      await onChanged();
    } catch (err: any) {
      toast({
        title: "Could not accept",
        description:
          err?.message ||
          "Database update failed. Run supabase/admin-setup.sql if columns are missing.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (event?: MouseEvent) => {
    event?.preventDefault();
    event?.stopPropagation();
    if (!selected) return;
    setBusy(true);
    try {
      await saveDecision(
        selected.id,
        {
          status: "rejected",
          tokens_awarded: false,
          tokens_amount: 0,
          verified_by: adminWallet,
          verified_at: new Date().toISOString(),
          is_duplicate: isDuplicate,
          is_prominent_location: isProminent,
          rejection_reason:
            rejectionReason.trim() ||
            (isDuplicate
              ? "Repeated / duplicate submission"
              : "Location is not a prominent waste-disposal site"),
        },
        { status: "rejected" },
      );
      toast({
        title: "Submission rejected",
        description: "No tokens were granted for this report.",
      });
      setSelected(null);
      await onChanged();
    } catch (err: any) {
      toast({
        title: "Could not reject",
        description:
          err?.message ||
          "Database update failed. Run supabase/admin-setup.sql if columns are missing.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const coords = selected ? parseCoords(selected) : null;
  const grantAllowed = canGrantTokens({
    isDuplicate,
    isProminentLocation: isProminent,
  });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Verification queue</CardTitle>
            <CardDescription>
              Grant PPEN only if the report is unique and at a prominent disposal site
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["pending", "approved", "rejected", "all"] as Filter[]).map((key) => (
              <Button
                key={key}
                size="sm"
                variant={filter === key ? "default" : "outline"}
                className={filter === key ? "bg-green-700 hover:bg-green-800" : ""}
                onClick={() => setFilter(key)}
              >
                {key[0].toUpperCase() + key.slice(1)}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Type / kg</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-gray-500">
                    Nothing in this view yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const flagged = findPossibleDuplicates(row, submissions).length > 0;
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap text-xs text-gray-600">
                        {row.created_at
                          ? new Date(row.created_at).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {shortAddress(row.submitted_by)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{row.waste_type}</div>
                        <div className="text-xs text-gray-500">{row.weight} kg</div>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-xs">
                        {row.latitude && row.longitude
                          ? `${row.latitude}, ${row.longitude}`
                          : "No GPS"}
                      </TableCell>
                      <TableCell>
                        {flagged ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" /> Possible duplicate
                          </Badge>
                        ) : (
                          <Badge variant="outline">Clear</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            row.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : row.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                          }
                        >
                          {row.status || "submitted"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => openReview(row)}>
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Verify waste submission</DialogTitle>
            <DialogDescription>
              Tokens are granted only when both checks pass: not repeated, and a prominent
              disposal location.
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-5">
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-gray-500">Wallet</p>
                  <p className="font-mono break-all">{selected.submitted_by}</p>
                </div>
                <div>
                  <p className="text-gray-500">Potential reward</p>
                  <p className="font-semibold text-green-700">
                    {rewardForWeight(selected.weight)} PPEN
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Type / weight</p>
                  <p>
                    {selected.waste_type} · {selected.weight} kg
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Submitted</p>
                  <p>
                    {selected.created_at
                      ? new Date(selected.created_at).toLocaleString()
                      : "—"}
                  </p>
                </div>
              </div>

              {selected.description && (
                <p className="rounded-lg bg-gray-50 p-3 text-sm">{selected.description}</p>
              )}

              {coords && (
                <a
                  href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-green-700 hover:underline"
                >
                  <MapPin className="h-4 w-4" />
                  Open GPS on map
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}

              {imageUrls(selected.image_url).length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {imageUrls(selected.image_url).map((url) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt="Waste evidence"
                        className="h-32 w-full rounded-lg object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}

              {duplicates.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="mb-2 flex items-center gap-2 font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    {duplicates.length} nearby report(s) look similar
                  </p>
                  <ul className="space-y-1">
                    {duplicates.slice(0, 4).map((dup) => (
                      <li key={dup.id}>
                        #{dup.id} · {dup.waste_type} · {dup.weight}kg ·{" "}
                        {shortAddress(dup.submitted_by)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-sm font-medium text-gray-800">
                  Tick these before Accept if you want to grant PPEN
                </p>
                <label className="flex items-start gap-3 text-sm">
                  <Checkbox
                    checked={!isDuplicate}
                    onCheckedChange={(value) => setIsDuplicate(!Boolean(value))}
                  />
                  <span>
                    <span className="font-medium">Not a repeated / duplicate report</span>
                    <span className="block text-gray-500">
                      Unique submission, not a copy of an existing report
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-3 text-sm">
                  <Checkbox
                    checked={isProminent}
                    onCheckedChange={(value) => setIsProminent(Boolean(value))}
                  />
                  <span>
                    <span className="font-medium">Prominent waste-disposal location</span>
                    <span className="block text-gray-500">
                      Known dump, collection point, or clearly visible plastic accumulation
                    </span>
                  </span>
                </label>
                <p className="text-xs text-gray-500">
                  {grantAllowed
                    ? "Accept will grant PPEN for this report."
                    : "Accept and Reject still work. PPEN is granted only when both boxes above are ticked."}
                </p>
              </div>

              <div>
                <Label htmlFor="reject-reason">Rejection note (if declining)</Label>
                <Textarea
                  id="reject-reason"
                  className="mt-1"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Optional reason shown on the record"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setSelected(null)} disabled={busy}>
              Close
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleReject}
              disabled={busy}
            >
              <XCircle className="mr-2 h-4 w-4" />
              {busy ? "Saving..." : "Reject"}
            </Button>
            <Button
              type="button"
              className="bg-green-700 hover:bg-green-800"
              onClick={handleApprove}
              disabled={busy}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {busy ? "Saving..." : grantAllowed ? "Accept & grant PPEN" : "Accept"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminSubmissions;
