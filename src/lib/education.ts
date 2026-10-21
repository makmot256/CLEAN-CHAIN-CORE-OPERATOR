// Paid educational videos, sold for sats over Lightning via the
// blink-education-invoice Edge Function. Prices here are display-only — the
// function holds the authoritative prices and the video URLs.
import { supabase } from "@/lib/supabaseClient";

export interface EducationCourse {
  id: string;
  title: string;
  duration: string;
  priceSats: number;
}

export const EDUCATION_COURSES: EducationCourse[] = [
  {
    id: "upcycling-plastic",
    title: "Upcycling Plastic into Marketable Products",
    duration: "10 min",
    priceSats: 200,
  },
  {
    id: "waste-tokens",
    title: "Tracking & Trading Waste Tokens",
    duration: "8 min",
    priceSats: 300,
  },
  {
    id: "sell-to-president",
    title: "How To Sell to the President Waste",
    duration: "15 min",
    priceSats: 50,
  },
  {
    id: "community-cleanup",
    title: "How to Earn with Community Clean-Up Drives",
    duration: "20 min",
    priceSats: 100,
  },
];

export type InvoiceStatus = "PENDING" | "PAID" | "EXPIRED";

const invoke = async <T>(body: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.functions.invoke(
    "blink-education-invoice",
    { body },
  );
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as T;
};

export const createEducationInvoice = (username: string, courseId: string) =>
  invoke<{ paymentRequest: string; paymentHash: string; amountSats: number }>(
    { action: "create", username, courseId },
  );

export const checkEducationInvoice = (username: string, paymentHash: string) =>
  invoke<{ status: InvoiceStatus; courseId: string; url?: string }>({
    action: "check",
    username,
    paymentHash,
  });

export const listEducationPurchases = async (username: string) => {
  const { purchases } = await invoke<{
    purchases: { courseId: string; url: string }[];
  }>({ action: "list", username });
  return Object.fromEntries(purchases.map((p) => [p.courseId, p.url]));
};
