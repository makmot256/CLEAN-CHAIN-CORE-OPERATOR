export type UserRole = "user" | "tracker" | "logistics" | "admin";
export type UserStatus = "active" | "suspended";
export type WasteStatus = "submitted" | "accepted" | "approved" | "rejected";

export interface WasteSubmission {
  id: number;
  waste_type: string;
  weight: number;
  description: string | null;
  latitude: string | null;
  longitude: string | null;
  submitted_by: string;
  status: string;
  image_url: string | null;
  created_at: string;
  updated_at?: string | null;
  tokens_awarded?: boolean | null;
  tokens_amount?: number | null;
  verified_by?: string | null;
  verified_at?: string | null;
  rejection_reason?: string | null;
  is_duplicate?: boolean | null;
  is_prominent_location?: boolean | null;
  tx_hash?: string | null;
}

export interface AppUser {
  id: string;
  /** Blink Lightning wallet username (no "@domain" suffix) used as the login identity. */
  blink_username: string;
  display_name: string | null;
  role: UserRole;
  status: UserStatus;
  notes: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface UserWallet {
  account: string;
  token_balance: number;
  updated_at?: string | null;
}
