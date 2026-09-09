import { BrowserProvider, Contract, parseUnits } from "ethers";
import { supabase } from "@/lib/supabaseClient";
import {
  ADMIN_WALLETS,
  CONTRACTS,
  DUPLICATE_RADIUS_METERS,
  TOKEN_CONFIG,
} from "@/lib/config";
import { PlasticPennyABI } from "@/lib/abi/PlasticPenny";
import type { WasteSubmission } from "@/lib/types";

export const normalizeAddress = (address: string) => address.trim().toLowerCase();

export const shortAddress = (address?: string | null) => {
  if (!address) return "—";
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const getConfiguredAdminWallets = (): string[] => {
  const fromEnv = (import.meta.env.VITE_ADMIN_WALLETS as string | undefined) || "";
  return [...ADMIN_WALLETS, ...fromEnv.split(",")]
    .map((value) => normalizeAddress(value))
    .filter(Boolean);
};

export const isConfiguredAdmin = (account?: string | null) => {
  if (!account) return false;
  return getConfiguredAdminWallets().includes(normalizeAddress(account));
};

const promoteToAdmin = async (address: string) => {
  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from("app_users")
    .select("id")
    .eq("wallet_address", address)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("app_users")
      .update({ role: "admin", status: "active", last_seen_at: now })
      .eq("id", existing.id);
    return;
  }

  await supabase.from("app_users").insert({
    wallet_address: address,
    display_name: shortAddress(address),
    role: "admin",
    status: "active",
    last_seen_at: now,
  });
};

export const checkIsAdmin = async (account?: string | null): Promise<boolean> => {
  if (!account) return false;
  const address = normalizeAddress(account);
  if (isConfiguredAdmin(address)) return true;

  const { data } = await supabase
    .from("app_users")
    .select("role, status")
    .eq("wallet_address", address)
    .maybeSingle();

  if (data?.role === "admin" && data?.status === "active") return true;

  // First-run: if no admin wallets are configured and none exist in the DB,
  // the wallet opening /admin becomes the operator.
  const envAdmins = getConfiguredAdminWallets();
  const { data: admins, error: adminLookupError } = await supabase
    .from("app_users")
    .select("id")
    .eq("role", "admin")
    .eq("status", "active")
    .limit(1);

  const noAdminsYet = Boolean(adminLookupError) || !admins?.length;
  if (envAdmins.length === 0 && noAdminsYet) {
    await promoteToAdmin(address).catch(() => undefined);
    return true;
  }

  return false;
};

export const rewardForWeight = (weight: number) =>
  Number((weight * TOKEN_CONFIG.REWARD_RATE_PER_KG).toFixed(4));

const toRad = (value: number) => (value * Math.PI) / 180;

export const distanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const parseCoords = (submission: WasteSubmission) => {
  const lat = parseFloat(submission.latitude ?? "");
  const lng = parseFloat(submission.longitude ?? "");
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
};

export const findPossibleDuplicates = (
  submission: WasteSubmission,
  all: WasteSubmission[],
) => {
  const origin = parseCoords(submission);
  return all.filter((other) => {
    if (other.id === submission.id) return false;
    if (other.status === "rejected") return false;

    const sameWallet =
      normalizeAddress(other.submitted_by) ===
      normalizeAddress(submission.submitted_by);
    const sameType =
      (other.waste_type || "").toLowerCase() ===
      (submission.waste_type || "").toLowerCase();

    const otherCoords = parseCoords(other);
    const nearby =
      origin && otherCoords
        ? distanceMeters(origin.lat, origin.lng, otherCoords.lat, otherCoords.lng) <=
          DUPLICATE_RADIUS_METERS
        : false;

    return nearby && (sameWallet || sameType);
  });
};

export const canGrantTokens = (opts: {
  isDuplicate: boolean;
  isProminentLocation: boolean;
}) => !opts.isDuplicate && opts.isProminentLocation;

export const grantPpenTokens = async (recipient: string, amount: number) => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not available");
  }

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new Contract(
    CONTRACTS.PLASTIC_PENNY,
    PlasticPennyABI,
    signer,
  );
  const parsed = parseUnits(amount.toString(), TOKEN_CONFIG.DECIMALS);

  try {
    const tx = await contract.mint(recipient, parsed);
    await tx.wait();
    return tx.hash as string;
  } catch {
    const tx = await contract.transfer(recipient, parsed);
    await tx.wait();
    return tx.hash as string;
  }
};

export const imageUrls = (value?: string | null) =>
  (value || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
