import type { UserRole } from "./types";

// Every gated action in the app maps to one of these keys. Add a new key here
// whenever a new guarded feature is introduced, then list it under the roles
// that should be allowed to use it in ROLE_PERMISSIONS below.
export type Permission =
  | "dashboard:user"
  | "dashboard:tracker"
  | "dashboard:logistics"
  | "dashboard:admin"
  | "admin:view_overview"
  | "admin:review_submissions"
  | "admin:delete_submission"
  | "admin:manage_users"
  | "admin:view_wallets";

export const ROLES: UserRole[] = ["user", "tracker", "logistics", "admin"];

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "User",
  tracker: "Waste Tracker",
  logistics: "Logistics Org",
  admin: "Admin",
};

// Metadata used to render the visual permissions matrix in the Admin Hub.
export const PERMISSION_ACTIONS: {
  key: Permission;
  label: string;
  description: string;
}[] = [
  {
    key: "dashboard:user",
    label: "User dashboard",
    description: "Submit waste reports and track personal rewards",
  },
  {
    key: "dashboard:tracker",
    label: "Tracker dashboard",
    description: "View the GPS map and accept collection jobs",
  },
  {
    key: "dashboard:logistics",
    label: "Logistics dashboard",
    description: "List marketplace products and view analytics",
  },
  {
    key: "dashboard:admin",
    label: "Admin Hub",
    description: "Open the Admin Hub at all",
  },
  {
    key: "admin:view_overview",
    label: "View analytics",
    description: "See the Admin Hub analytics tab",
  },
  {
    key: "admin:review_submissions",
    label: "Review submissions",
    description: "Approve or reject waste submissions",
  },
  {
    key: "admin:delete_submission",
    label: "Delete submissions",
    description: "Permanently remove a submission record",
  },
  {
    key: "admin:manage_users",
    label: "Manage users",
    description: "Add, edit, suspend, or delete app users and roles",
  },
  {
    key: "admin:view_wallets",
    label: "View wallets",
    description: "See connected Blink wallets and lifetime sats",
  },
];

const ADMIN_ALL_PERMISSIONS: Permission[] = PERMISSION_ACTIONS.map(
  (action) => action.key,
);

// The roles x actions matrix. Admin is treated as a superuser with every
// permission; the other three roles are limited to their own dashboard.
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: ["dashboard:user"],
  tracker: ["dashboard:tracker"],
  logistics: ["dashboard:logistics"],
  admin: ADMIN_ALL_PERMISSIONS,
};

export const hasPermission = (
  role: UserRole | null | undefined,
  permission: Permission,
): boolean => {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};
