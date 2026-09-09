import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { normalizeAddress, shortAddress } from "@/lib/admin";
import type { AppUser, UserRole, UserStatus } from "@/lib/types";
import { Pencil, Plus, Trash2 } from "lucide-react";

interface AdminUsersProps {
  users: AppUser[];
  onChanged: () => Promise<void> | void;
}

const EMPTY_FORM = {
  wallet_address: "",
  display_name: "",
  role: "user" as UserRole,
  status: "active" as UserStatus,
  notes: "",
};

const AdminUsers = ({ users, onChanged }: AdminUsersProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleting, setDeleting] = useState<AppUser | null>(null);
  const [busy, setBusy] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (user: AppUser) => {
    setEditing(user);
    setForm({
      wallet_address: user.wallet_address,
      display_name: user.display_name || "",
      role: user.role,
      status: user.status,
      notes: user.notes || "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    const wallet_address = normalizeAddress(form.wallet_address);
    if (!wallet_address || !wallet_address.startsWith("0x") || wallet_address.length < 10) {
      toast({
        title: "Invalid wallet",
        description: "Enter a full Ethereum address starting with 0x.",
        variant: "destructive",
      });
      return;
    }

    setBusy(true);
    try {
      const payload = {
        wallet_address,
        display_name: form.display_name.trim() || shortAddress(wallet_address),
        role: form.role,
        status: form.status,
        notes: form.notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = editing
        ? await supabase.from("app_users").update(payload).eq("id", editing.id)
        : await supabase.from("app_users").insert(payload);

      if (error) throw error;
      toast({ title: editing ? "User updated" : "User added" });
      setOpen(false);
      await onChanged();
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: err?.message || "Could not write to app_users.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("app_users").delete().eq("id", deleting.id);
      if (error) throw error;
      toast({ title: "User removed" });
      setDeleting(null);
      await onChanged();
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err?.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>User management</CardTitle>
            <CardDescription>
              Create, edit, suspend, or remove wallets and their roles
            </CardDescription>
          </div>
          <Button onClick={openCreate} className="bg-green-700 hover:bg-green-800">
            <Plus className="mr-2 h-4 w-4" />
            Add user
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last seen</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-gray-500">
                    No users yet. They appear when a wallet connects, or add one here.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.display_name || "—"}</div>
                      {user.notes && (
                        <div className="max-w-[200px] truncate text-xs text-gray-500">
                          {user.notes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {shortAddress(user.wallet_address)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          user.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-200 text-gray-700"
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {user.last_seen_at
                        ? new Date(user.last_seen_at).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="space-x-2 whitespace-nowrap">
                      <Button size="icon" variant="outline" onClick={() => openEdit(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setDeleting(user)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit user" : "Add user"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Wallet address</Label>
              <Input
                className="mt-1 font-mono"
                value={form.wallet_address}
                disabled={Boolean(editing)}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, wallet_address: e.target.value }))
                }
                placeholder="0x..."
              />
            </div>
            <div>
              <Label>Display name</Label>
              <Input
                className="mt-1"
                value={form.display_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, display_name: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(value: UserRole) =>
                    setForm((prev) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="tracker">Tracker</SelectItem>
                    <SelectItem value="logistics">Logistics</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value: UserStatus) =>
                    setForm((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                className="mt-1"
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button className="bg-green-700 hover:bg-green-800" onClick={handleSave} disabled={busy}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this user?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting
                ? `${deleting.display_name || shortAddress(deleting.wallet_address)} will be deleted from the admin directory. Waste submissions stay in the database.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={busy}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminUsers;
